import asyncio
import json
import logging
import os
import re
import time
import traceback
from datetime import datetime, timezone
from urllib.parse import urlsplit

import aio_pika
from aio_pika import DeliveryMode, ExchangeType, Message

from app.response_builder import build_demo_response
from app.sql_execution import execute_read_query, resolve_sql_query

logger = logging.getLogger(__name__)


def _log_event(event: str, **fields: object) -> None:
    logger.info(json.dumps({
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "event": event,
        **fields,
    }, separators=(",", ":"), default=str))


def _log_exception(event: str, error: Exception, **fields: object) -> None:
    redact_urls = lambda value: re.sub(r"(?i)(?:amqps?|postgres(?:ql)?)://\S+", "[connection-url-redacted]", value)
    _log_event(
        event,
        **fields,
        errorType=type(error).__name__,
        errorMessage=redact_urls(str(error)),
        traceback=redact_urls(traceback.format_exc()),
    )


async def process_chat_message(message: dict[str, object]) -> dict[str, object]:
    user_id = message.get("userId")
    conversation_id = message.get("conversationId")
    message_id = message.get("messageId")
    text = message.get("text")
    if not all(isinstance(value, str) and value for value in (user_id, conversation_id, message_id, text)):
        raise ValueError("RabbitMQ message must include userId, conversationId, messageId, and text.")

    _log_event("chat.queue.message_received", messageId=message_id, conversationId=conversation_id)
    started_at = time.monotonic()
    _log_event("chat.processing.started", messageId=message_id, conversationId=conversation_id)
    query = resolve_sql_query(text)
    if query is not None:
        _log_event("chat.sql.query_detected", messageId=message_id, conversationId=conversation_id)
        try:
            chat_response = await execute_read_query(query)
            _log_event(
                "chat.sql.query_completed",
                messageId=message_id,
                conversationId=conversation_id,
                responseType=chat_response.get("type"),
                rowCount=len(chat_response.get("rows", [])) if isinstance(chat_response.get("rows"), list) else None,
            )
        except ValueError as exc:
            chat_response = {"type": "text", "content": str(exc)}
            _log_event("chat.sql.query_rejected", messageId=message_id, conversationId=conversation_id)
        except Exception as exc:
            _log_exception(
                "chat.sql.query_failed",
                exc,
                messageId=message_id,
                conversationId=conversation_id,
            )
            chat_response = {
                "type": "text",
                "content": "The SQL query failed unexpectedly. Check the Python worker logs and try again.",
            }
    else:
        chat_response = build_demo_response(text)

    result = {
        "userId": user_id,
        "conversationId": conversation_id,
        "messageId": message_id,
        "response": chat_response,
    }
    _log_event(
        "chat.processing.completed",
        messageId=message_id,
        conversationId=conversation_id,
        responseType=chat_response.get("type") if isinstance(chat_response, dict) else "unknown",
        durationMs=round((time.monotonic() - started_at) * 1000),
    )
    return result


async def _poll_heartbeat(request_queue: str) -> None:
    while True:
        await asyncio.sleep(30)
        _log_event("chat.queue.polling_heartbeat", queue=request_queue)


async def poll_chat_messages() -> None:
    """Consume durable RabbitMQ requests and publish durable conversation replies."""
    rabbit_url = os.getenv("RABBITMQ_URL", "")
    if not rabbit_url:
        _log_event("chat.worker.startup_failed", reason="missing_rabbitmq_url")
        raise RuntimeError("RABBITMQ_URL is required.")

    request_queue = os.getenv("CHAT_REQUEST_QUEUE", "chat.requests")
    response_exchange_name = os.getenv("CHAT_RESPONSE_EXCHANGE", "chat.responses.fanout")
    broker = urlsplit(rabbit_url)
    broker_host = f"{broker.hostname}:{broker.port}" if broker.port else broker.hostname
    _log_event(
        "chat.worker.starting",
        brokerHost=broker_host,
        requestQueue=request_queue,
        responseExchange=response_exchange_name,
    )
    while True:
        heartbeat: asyncio.Task[None] | None = None
        message_id: str | None = None
        conversation_id: str | None = None
        stage = "connect"
        try:
            connection = await aio_pika.connect_robust(rabbit_url)
            async with connection:
                channel = await connection.channel(publisher_confirms=True, on_return_raises=True)
                await channel.set_qos(prefetch_count=int(os.getenv("CHAT_WORKER_PREFETCH", "1")))
                queue = await channel.declare_queue(request_queue, durable=True)
                exchange = await channel.declare_exchange(
                response_exchange_name, ExchangeType.FANOUT, durable=True
                )
                heartbeat = asyncio.create_task(_poll_heartbeat(request_queue))
                _log_event(
                    "chat.worker.started",
                    brokerHost=broker_host,
                    requestQueue=request_queue,
                    responseExchange=response_exchange_name,
                )
                _log_event("chat.queue.consumer_starting", queue=request_queue)
                async with queue.iterator() as messages:
                    _log_event("chat.queue.consumer_ready", queue=request_queue)
                    async for incoming in messages:
                        message_id = incoming.message_id
                        conversation_id = None
                        stage = "decode_request"
                        _log_event(
                            "chat.queue.delivery_received",
                            messageId=message_id,
                            redelivered=incoming.redelivered,
                            deliveryTag=incoming.delivery_tag,
                        )
                        async with incoming.process(requeue=True):
                            payload = json.loads(incoming.body)
                            if not isinstance(payload, dict):
                                raise ValueError("RabbitMQ request body must be a JSON object.")
                            message_id = payload.get("messageId") if isinstance(payload.get("messageId"), str) else message_id
                            conversation_id = payload.get("conversationId") if isinstance(payload.get("conversationId"), str) else None
                            stage = "process_request"
                            result = await process_chat_message(payload)
                            response = Message(
                                body=json.dumps(result, separators=(",", ":")).encode(),
                                content_type="application/json",
                                delivery_mode=DeliveryMode.PERSISTENT,
                                message_id=str(result["messageId"]),
                            )
                            stage = "publish_response"
                            await exchange.publish(
                                response,
                                routing_key="",
                                mandatory=True,
                            )
                            _log_event(
                                "chat.queue.response_published",
                                messageId=result["messageId"],
                                conversationId=result["conversationId"],
                                exchange=response_exchange_name,
                                routing="fanout_to_active_next_instances",
                                confirmation="broker_confirmed_and_routed",
                            )
                        _log_event(
                            "chat.queue.request_acknowledged",
                            messageId=message_id,
                            conversationId=conversation_id,
                            deliveryTag=incoming.delivery_tag,
                        )
                        stage = "consume"
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            _log_event(
                "chat.queue.message_failed",
                messageId=message_id,
                conversationId=conversation_id,
                stage=stage,
                errorType=type(exc).__name__,
            )
            _log_exception(
                "chat.queue.consume_failed",
                exc,
                queue=request_queue,
                messageId=message_id,
                conversationId=conversation_id,
                stage=stage,
            )
            await asyncio.sleep(5)
        finally:
            if heartbeat:
                heartbeat.cancel()
                await asyncio.gather(heartbeat, return_exceptions=True)
