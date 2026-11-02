import { QueueClient } from "@vercel/queue";
import { logChatError, logChatInfo } from "./chat-log.js";

export type QueuedChatMessage = {
  messageId: string;
  userId: string;
  text: string;
  createdAt: string;
};

const region = process.env.CHAT_QUEUE_REGION ?? process.env.VERCEL_REGION ?? "iad1";
const queueBaseUrl = process.env.VERCEL_QUEUE_BASE_URL;

// Local development can point the Node producer and Python poller at the same
// Vercel Queue devserver. Deployments leave this unset and use the hosted queue.
const queue = new QueueClient({
  region,
  resolveBaseUrl: (queueRegion) => queueBaseUrl
    ? new URL(queueBaseUrl.replace("{region}", queueRegion))
    : new URL(`https://${queueRegion}.vercel-queue.com`),
});

export async function enqueueChatMessage(message: Omit<QueuedChatMessage, "createdAt">) {
  const payload: QueuedChatMessage = { ...message, createdAt: new Date().toISOString() };
  logChatInfo("chat.queue.publish_started", {
    messageId: message.messageId,
    topic: "chat-messages",
    region,
  });

  try {
    const queueMessageId = await queue.send("chat-messages", payload, {
      idempotencyKey: message.messageId,
    });
    logChatInfo("chat.queue.publish_succeeded", {
      messageId: message.messageId,
      topic: "chat-messages",
      region,
    });
    return queueMessageId;
  } catch (error) {
    logChatError("chat.queue.publish_failed", error, {
      messageId: message.messageId,
      topic: "chat-messages",
      region,
    });
    throw error;
  }
}
