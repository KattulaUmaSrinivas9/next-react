import type { Server, Socket } from "socket.io";
import { enqueueChatMessage } from "./chat-queue.js";
import { registerLocalChatSocketServer, subscribeToChatResponses } from "./chat-realtime.js";
import { getChatSessionUserId } from "./chat-session.js";
import type { ChatMessageRequest } from "../components/chatbot/types";

type ChatAck = { messageId: string; accepted: boolean; error?: string };

function isChatMessage(value: unknown): value is ChatMessageRequest {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return typeof message.messageId === "string"
    && message.messageId.length > 0
    && message.messageId.length <= 128
    && typeof message.text === "string"
    && message.text.length <= 10_000;
}

async function handleChatMessage(socket: Socket, value: unknown) {
  if (!isChatMessage(value)) return;

  const text = value.text.trim();
  if (!text) {
    const ack: ChatAck = {
      messageId: value.messageId,
      accepted: false,
      error: "Message text is required.",
    };
    socket.emit("chat:ack", ack);
    return;
  }

  const userId = socket.data.userId as string;
  try {
    await enqueueChatMessage({ messageId: value.messageId, userId, text });
    socket.emit("chat:ack", { messageId: value.messageId, accepted: true });
  } catch (error) {
    console.error("Failed to enqueue chat message:", error);
    socket.emit("chat:ack", {
      messageId: value.messageId,
      accepted: false,
      error: "Message could not be added to the queue. Please try again.",
    });
  }
}

export function registerChatSocketHandlers(io: Server) {
  registerLocalChatSocketServer(io);
  const realtimeReady = subscribeToChatResponses(io);
  io.use(async (socket, next) => {
    const userId = getChatSessionUserId(socket.handshake.headers.cookie);
    if (!userId) {
      next(new Error("Sign in before connecting to chat."));
      return;
    }
    try {
      await realtimeReady;
      socket.data.userId = userId;
      await socket.join(userId);
      next();
    } catch (error) {
      console.error("Chat realtime connection setup failed:", error);
      next(new Error("Chat realtime service is unavailable."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("chat:message", (message: unknown) => {
      void handleChatMessage(socket, message);
    });
  });
}
