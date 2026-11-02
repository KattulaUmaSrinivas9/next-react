import asyncio
import json
import logging
import os
from urllib.parse import urlsplit

import httpx
from vercel.queue import ALL_DEPLOYMENTS, QueueClient, subscribe

from app.response_builder import build_demo_response
from app.sql_execution import execute_read_query, resolve_sql_query

logger = logging.getLogger(__name__)


def _log_event(event: str, **fields: object) -> None:
    logger.info(json.dumps({"event": event, **fields}, separators=(",", ":"), default=str))


@subscribe(topic="chat-messages", consumer_group="chat-python-worker")
async def handle_chat_message(message: dict[str, object]) -> None:
    user_id = message.get("userId")
    conversation_id = message.get("conversationId")
    message_id = message.get("messageId")
    text = message.get("text")

    if not all(
        isinstance(value, str) and value
        for value in (user_id, conversation_id, message_id, text)
    ):
        _log_event(
            "chat.queue.message_rejected",
            reason="missing_required_fields",
            messageId=message_id if isinstance(message_id, str) else None,
        )
        raise ValueError("Queue message must include userId, conversationId, messageId, and text.")

    _log_event(
        "chat.queue.message_received",
        messageId=message_id,
        conversationId=conversation_id,
    )

    callback_secret = os.getenv("NEXT_CHAT_CALLBACK_SECRET", "")
    if not callback_secret:
        _log_event("chat.callback.config_error", messageId=message_id, reason="missing_secret")
        raise RuntimeError("NEXT_CHAT_CALLBACK_SECRET is not configured.")

    base_url = os.getenv("NEXT_API_BASE_URL", "http://localhost:3000").rstrip("/")
    callback_host = urlsplit(base_url).hostname
    query = resolve_sql_query(text)
    if query is not None:
        _log_event("chat.sql.query_detected", messageId=message_id)
        try:
            chat_response = await execute_read_query(query)
            _log_event(
                "chat.sql.query_completed",
                messageId=message_id,
                responseType=chat_response.get("type"),
                rowCount=(
                    len(chat_response.get("rows", []))
                    if isinstance(chat_response.get("rows"), list)
                    else None
                ),
            )
        except ValueError as exc:
            chat_response = {"type": "text", "content": str(exc)}
            _log_event("chat.sql.query_rejected", messageId=message_id)
        except Exception:
            logger.exception(json.dumps({"event": "chat.sql.query_failed", "messageId": message_id}))
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

    # A failed callback raises, leaving the queue message available for retry.
    _log_event(
        "chat.callback.request_started",
        messageId=message_id,
        conversationId=conversation_id,
        callbackHost=callback_host,
        path="/api/chat/results",
    )
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{base_url}/api/chat/results",
                json=result,
                headers={"Authorization": f"Bearer {callback_secret}"},
            )
            _log_event(
                "chat.callback.response_received",
                messageId=message_id,
                status=response.status_code,
            )
            response.raise_for_status()
    except Exception:
        logger.exception(
            json.dumps({"event": "chat.callback.request_failed", "messageId": message_id})
        )
        raise

    _log_event("chat.queue.handler_completed", messageId=message_id)


async def _poll_heartbeat(region: str, deployment_scope: str) -> None:
    while True:
        await asyncio.sleep(30)
        _log_event(
            "chat.queue.polling_heartbeat",
            region=region,
            topic="chat-messages",
            consumerGroup="chat-python-worker",
            deploymentScope=deployment_scope,
            projectId=os.getenv("VERCEL_PROJECT_ID"),
            deploymentId=os.getenv("VERCEL_DEPLOYMENT_ID"),
        )


async def poll_chat_messages() -> None:
    """Poll Vercel Queues until the FastAPI app shuts down."""
    region = os.getenv("CHAT_QUEUE_REGION", "iad1")
    os.environ["VERCEL_REGION"] = region
    has_queue_auth = any(
        os.getenv(name)
        for name in ("VERCEL_QUEUE_TOKEN", "VERCEL_OIDC_TOKEN", "VERCEL_OIDC_TOKEN_FILE")
    )
    if not has_queue_auth:
        _log_event(
            "chat.worker.startup_failed",
            reason="missing_queue_auth",
            projectId=os.getenv("VERCEL_PROJECT_ID"),
        )
        raise RuntimeError(
            "Provide VERCEL_QUEUE_TOKEN or make a Vercel OIDC token or token file available."
        )

    # Vercel Queues publish into the current deployment's partition by default.
    # In this monorepo, the app and daemon share VERCEL_DEPLOYMENT_ID, so poll
    # that same partition. Local runs without a deployment ID poll all partitions.
    deployment = (
        os.getenv("CHAT_QUEUE_DEPLOYMENT_ID")
        or os.getenv("VERCEL_DEPLOYMENT_ID")
        or ALL_DEPLOYMENTS
    )
    deployment_scope = deployment if isinstance(deployment, str) else "all deployments"
    _log_event(
        "chat.worker.started",
        region=region,
        topic="chat-messages",
        consumerGroup="chat-python-worker",
        deploymentScope=deployment_scope,
        projectId=os.getenv("VERCEL_PROJECT_ID"),
        deploymentId=os.getenv("VERCEL_DEPLOYMENT_ID"),
    )
    client = QueueClient(region=region, deployment=deployment)
    heartbeat = asyncio.create_task(_poll_heartbeat(region, deployment_scope))
    try:
        while True:
            try:
                await client.poll_and_handle(handle_chat_message, interval=1.0)
                _log_event("chat.queue.poll_loop_returned", region=region)
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception(
                    json.dumps({
                        "event": "chat.queue.poll_failed",
                        "region": region,
                        "topic": "chat-messages",
                        "consumerGroup": "chat-python-worker",
                    })
                )
                await asyncio.sleep(5)
    finally:
        heartbeat.cancel()
        await asyncio.gather(heartbeat, return_exceptions=True)

