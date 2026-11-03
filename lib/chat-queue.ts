import amqp, { type ConfirmChannel, type Connection } from "amqplib";
import { URL } from "node:url";
import { logChatError, logChatInfo } from "./chat-log.js";

export type QueuedChatMessage = {
  conversationId: string;
  messageId: string;
  userId: string;
  text: string;
  createdAt: string;
};

const requestQueue = process.env.CHAT_REQUEST_QUEUE ?? "chat.requests";
let connectionPromise: Promise<Connection> | undefined;
let channelPromise: Promise<ConfirmChannel> | undefined;

async function getChannel() {
  if (!channelPromise) {
    const url = process.env.RABBITMQ_URL;
    if (!url) throw new Error("RABBITMQ_URL is required for chat message delivery.");
    logChatInfo("chat.rabbitmq.connecting", { host: new URL(url).host, purpose: "request_publisher" });
    connectionPromise ??= amqp.connect(url);
    channelPromise = connectionPromise.then(async (connection) => {
      connection.on("error", (error) => logChatError("chat.rabbitmq.connection_error", error));
      connection.on("close", () => {
        connectionPromise = undefined;
        channelPromise = undefined;
        logChatInfo("chat.rabbitmq.connection_closed");
      });
      const channel = await connection.createConfirmChannel();
      const queueState = await channel.assertQueue(requestQueue, { durable: true });
      logChatInfo("chat.rabbitmq.connected", { host: new URL(url).host, purpose: "request_publisher" });
      logChatInfo("chat.rabbitmq.request_queue_ready", {
        queue: requestQueue,
        queuedMessageCount: queueState.messageCount,
        activeConsumerCount: queueState.consumerCount,
      });
      return channel;
    }).catch((error) => {
      connectionPromise = undefined;
      channelPromise = undefined;
      throw error;
    });
  }
  return channelPromise;
}

export async function enqueueChatMessage(message: Omit<QueuedChatMessage, "createdAt">) {
  const payload: QueuedChatMessage = { ...message, createdAt: new Date().toISOString() };
  const queue = requestQueue;
  logChatInfo("chat.queue.publish_started", {
    messageId: message.messageId,
    conversationId: message.conversationId,
    queue,
  });
  try {
    const channel = await getChannel();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: "application/json",
      messageId: message.messageId,
      timestamp: Date.now(),
    });
    await channel.waitForConfirms();
    logChatInfo("chat.queue.publish_succeeded", {
      messageId: message.messageId,
      conversationId: message.conversationId,
      queue,
      confirmation: "broker_acknowledged",
    });
  } catch (error) {
    logChatError("chat.queue.publish_failed", error, {
      messageId: message.messageId,
      conversationId: message.conversationId,
      queue,
    });
    throw error;
  }
}
