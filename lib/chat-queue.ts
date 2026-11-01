import { QueueClient } from "@vercel/queue";

export type QueuedChatMessage = {
  messageId: string;
  userId: string;
  text: string;
  createdAt: string;
};

const region = process.env.CHAT_QUEUE_REGION ?? process.env.VERCEL_REGION ?? "iad1";
// This app's consumer is a separate Python poller. Bypass the Vercel CLI's
// local push-mode broker so both local Next.js and Python use the same queue.
const queue = new QueueClient({
  region,
  resolveBaseUrl: (queueRegion) => new URL(`https://${queueRegion}.vercel-queue.com`),
});

export async function enqueueChatMessage(message: Omit<QueuedChatMessage, "createdAt">) {
  const payload: QueuedChatMessage = { ...message, createdAt: new Date().toISOString() };
  return queue.send("chat-messages", payload, { idempotencyKey: message.messageId });
}
