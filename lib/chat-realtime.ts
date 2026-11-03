import amqp, { type Channel, type ChannelModel } from "amqplib";
import { URL } from "node:url";
import type { Server } from "socket.io";
import type { AssistantResponse } from "../components/chatbot/types";
import { logChatError, logChatInfo } from "./chat-log.js";
import { chatConversationRoom } from "./chat-room.js";

type ChatResponseEvent = {
  conversationId: string;
  userId: string;
  messageId: string;
  response: AssistantResponse;
};
type InstanceConsumer = { channel: Channel; consumerTag: string; refs: number; queue: string };

const responseExchange = process.env.CHAT_RESPONSE_EXCHANGE ?? "chat.responses.fanout";
const socketAckTimeoutMs = Number(process.env.CHAT_RESPONSE_ACK_TIMEOUT_MS ?? 5000);
const consumers = new Map<Server, Promise<InstanceConsumer>>();
let connectionPromise: Promise<ChannelModel> | undefined;

async function getConnection() {
  if (!connectionPromise) {
    const url = process.env.RABBITMQ_URL;
    if (!url) throw new Error("RABBITMQ_URL is required for chat response delivery.");
    logChatInfo("chat.rabbitmq.connecting", { host: new URL(url).host, purpose: "response_fanout" });
    connectionPromise = amqp.connect(url).then((connection) => {
      connection.on("error", (error) => logChatError("chat.rabbitmq.connection_error", error));
      connection.on("close", () => {
        connectionPromise = undefined;
        for (const [io, consumerPromise] of consumers) {
          consumers.delete(io);
          void consumerPromise.then((consumer) => consumer.channel.close()).catch(() => undefined);
          io.disconnectSockets(true);
        }
        logChatInfo("chat.rabbitmq.connection_closed_reconnecting_sockets");
      });
      logChatInfo("chat.rabbitmq.connected", { host: new URL(url).host, purpose: "response_fanout" });
      return connection;
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}

async function createInstanceConsumer(io: Server): Promise<InstanceConsumer> {
  const channel = await (await getConnection()).createChannel();
  await channel.prefetch(1);
  await channel.assertExchange(responseExchange, "fanout", { durable: true });
  const { queue } = await channel.assertQueue("", {
    durable: false,
    exclusive: true,
    autoDelete: true,
  });
  await channel.bindQueue(queue, responseExchange, "");
  logChatInfo("chat.rabbitmq.instance_queue_bound", { queue, exchange: responseExchange });

  const { consumerTag } = await channel.consume(queue, (message) => {
    if (!message) return;
    let event: ChatResponseEvent;
    try {
      event = JSON.parse(message.content.toString()) as ChatResponseEvent;
      if (typeof event.userId !== "string" || typeof event.conversationId !== "string"
        || typeof event.messageId !== "string" || typeof event.response !== "object"
        || event.response === null) {
        logChatInfo("chat.rabbitmq.response_rejected", {
          reason: "invalid_payload",
          messageId: message.properties.messageId,
        });
        channel.ack(message);
        return;
      }
    } catch (error) {
      logChatError("chat.rabbitmq.response_decode_failed", error, {
        messageId: message.properties.messageId,
      });
      channel.ack(message);
      return;
    }

    const room = chatConversationRoom(event.userId, event.conversationId);
    const localSocketCount = io.sockets.adapter.rooms.get(room)?.size ?? 0;
    logChatInfo("chat.rabbitmq.response_received", {
      messageId: event.messageId,
      conversationId: event.conversationId,
      redelivered: message.fields.redelivered,
      localSocketCount,
    });

    if (localSocketCount === 0) {
      // Other Socket.IO instances receive their own fanout copy and may own this room.
      channel.ack(message);
      logChatInfo("chat.rabbitmq.response_ignored_on_instance", {
        messageId: event.messageId,
        conversationId: event.conversationId,
        reason: "conversation_not_connected_here",
      });
      return;
    }

    logChatInfo("chat.socket.response_emit_started", {
      messageId: event.messageId,
      conversationId: event.conversationId,
    });
    io.to(room).timeout(socketAckTimeoutMs).emit("chat:response", {
      conversationId: event.conversationId,
      messageId: event.messageId,
      response: event.response,
    }, (error: Error, acknowledgements: unknown[]) => {
      const acknowledgementCount = Array.isArray(acknowledgements) ? acknowledgements.length : 0;
      if (error || acknowledgementCount === 0) {
        logChatError("chat.socket.response_delivery_unconfirmed", error ?? "No client acknowledgments received.", {
          messageId: event.messageId,
          conversationId: event.conversationId,
          timeoutMs: socketAckTimeoutMs,
          acknowledgementCount,
        });
        setTimeout(() => {
          try {
            channel.nack(message, false, true);
            logChatInfo("chat.rabbitmq.response_requeued", {
              messageId: event.messageId,
              conversationId: event.conversationId,
              reason: "client_ack_timeout",
            });
          } catch (nackError) {
            logChatError("chat.rabbitmq.response_requeue_failed", nackError, {
              messageId: event.messageId,
              conversationId: event.conversationId,
            });
          }
        }, 1000);
        return;
      }

      logChatInfo("chat.socket.response_delivery_confirmed", {
        messageId: event.messageId,
        conversationId: event.conversationId,
        acknowledgementCount,
      });
      try {
        channel.ack(message);
        logChatInfo("chat.rabbitmq.response_acknowledged", {
          messageId: event.messageId,
          conversationId: event.conversationId,
          reason: "client_acknowledged",
        });
      } catch (ackError) {
        logChatError("chat.rabbitmq.response_ack_failed", ackError, {
          messageId: event.messageId,
          conversationId: event.conversationId,
        });
      }
    });
    logChatInfo("chat.socket.response_emitted", {
      messageId: event.messageId,
      conversationId: event.conversationId,
    });
  }, { noAck: false });

  const consumer = { channel, consumerTag, refs: 0, queue };
  logChatInfo("chat.rabbitmq.instance_consumer_ready", { queue, exchange: responseExchange });
  return consumer;
}

export async function subscribeToChatResponses(io: Server) {
  let consumerPromise = consumers.get(io);
  if (!consumerPromise) {
    logChatInfo("chat.rabbitmq.instance_subscription_started", { exchange: responseExchange });
    consumerPromise = createInstanceConsumer(io);
    consumers.set(io, consumerPromise);
    void consumerPromise.catch(() => {
      if (consumers.get(io) === consumerPromise) consumers.delete(io);
    });
  }

  const consumer = await consumerPromise;
  consumer.refs += 1;
  let released = false;
  return async () => {
    if (released) return;
    released = true;
    consumer!.refs -= 1;
    if (consumer!.refs === 0) {
      if (consumers.get(io) === consumerPromise) consumers.delete(io);
      logChatInfo("chat.rabbitmq.instance_consumer_stopping", { queue: consumer!.queue });
      await consumer!.channel.cancel(consumer!.consumerTag).catch((error) => {
        logChatError("chat.rabbitmq.instance_consumer_cancel_failed", error, { queue: consumer!.queue });
      });
      await consumer!.channel.close().catch(() => undefined);
    }
  };
}
