import { createClient, type RedisClientType } from "redis";
import type { Server } from "socket.io";
import type { AssistantResponse } from "../components/chatbot/types";
import { logChatError, logChatInfo } from "./chat-log.js";

type ChatResponseEvent = {
  userId: string;
  messageId: string;
  response: AssistantResponse;
};

const responseChannel = "chat:responses";
const subscribers = new WeakMap<Server, Promise<void>>();
let publisherReady: Promise<RedisClientType> | undefined;
type ChatSocketGlobal = typeof globalThis & { __chatSocketServer?: Server };

function isChatResponseEvent(value: unknown): value is ChatResponseEvent {
  if (typeof value !== "object" || value === null) return false;
  const event = value as Record<string, unknown>;
  return typeof event.userId === "string"
    && typeof event.messageId === "string"
    && typeof event.response === "object"
    && event.response !== null;
}

async function getPublisher(): Promise<RedisClientType> {
  if (publisherReady) return publisherReady;
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is required for socket response delivery on Vercel.");

  const pending = (async () => {
    const client = createClient({ url });
    client.on("error", (error) => logChatError("chat.redis.publisher_error", error));
    logChatInfo("chat.redis.publisher_connecting");
    await client.connect();
    logChatInfo("chat.redis.publisher_connected");
    return client;
  })();
  publisherReady = pending;

  try {
    return await pending;
  } catch (error) {
    publisherReady = undefined;
    throw error;
  }
}

export function subscribeToChatResponses(io: Server) {
  const existing = subscribers.get(io);
  if (existing) return existing;

  const url = process.env.REDIS_URL;
  if (!url) {
    if (process.env.VERCEL) {
      throw new Error("REDIS_URL is required for socket response delivery on Vercel.");
    }
    return Promise.resolve();
  }

  const setup = (async () => {
    const subscriber = createClient({ url });
    subscriber.on("error", (error) => logChatError("chat.redis.subscriber_error", error));
    logChatInfo("chat.redis.subscriber_connecting");
    await subscriber.connect();
    logChatInfo("chat.redis.subscriber_connected");
    await subscriber.subscribe(responseChannel, (payload) => {
      try {
        const event: unknown = JSON.parse(payload);
        if (!isChatResponseEvent(event)) {
          logChatInfo("chat.redis.event_rejected", { reason: "invalid_response_payload" });
          return;
        }
        logChatInfo("chat.redis.response_received", { messageId: event.messageId });
        io.to(event.userId).emit("chat:response", {
          messageId: event.messageId,
          response: event.response,
        });
        logChatInfo("chat.socket.response_emitted", {
          messageId: event.messageId,
          source: "redis_subscriber",
        });
      } catch (error) {
        logChatError("chat.redis.event_decode_failed", error);
      }
    });
    logChatInfo("chat.redis.subscribed", { channel: responseChannel });
    logChatInfo("chat.socket.redis_subscriber_ready");
  })();

  subscribers.set(io, setup);
  void setup.catch(() => subscribers.delete(io));
  return setup;
}

export async function emitChatResponse(event: ChatResponseEvent) {
  if (!process.env.REDIS_URL) {
    const io = (globalThis as ChatSocketGlobal).__chatSocketServer;
    if (!io) throw new Error("No local Socket.IO server is registered and REDIS_URL is not configured.");
    io.to(event.userId).emit("chat:response", {
      messageId: event.messageId,
      response: event.response,
    });
    logChatInfo("chat.socket.response_emitted", {
      messageId: event.messageId,
      source: "local_socket_server",
    });
    return;
  }

  const client = await getPublisher();
  logChatInfo("chat.redis.publish_started", {
    messageId: event.messageId,
    channel: responseChannel,
  });
  const subscriberCount = await client.publish(responseChannel, JSON.stringify(event));
  logChatInfo("chat.redis.publish_completed", {
    messageId: event.messageId,
    channel: responseChannel,
    subscriberCount,
  });
  if (subscriberCount === 0) {
    throw new Error("No Socket.IO Redis subscribers are connected. Restart the Next.js server and keep the chat connected.");
  }
  console.info(`Chat response delivered to ${subscriberCount} Socket.IO instance(s).`);
}

export function registerLocalChatSocketServer(io: Server) {
  (globalThis as ChatSocketGlobal).__chatSocketServer = io;
}
