import type { Server, Socket } from "socket.io";
import { enqueueChatMessage } from "./chat-queue.js";
import { registerLocalChatSocketServer, subscribeToChatResponses } from "./chat-realtime.js";
import { getChatSessionUserId } from "./chat-session.js";
import { chatConversationRoom } from "./chat-room.js";
import { logChatError, logChatInfo } from "./chat-log.js";
import type { ChatMessageRequest } from "../components/chatbot/types";

type ChatAck = { messageId: string; accepted: boolean; error?: string };

function isChatMessage(value: unknown): value is ChatMessageRequest {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return typeof message.messageId === "string"
    && message.messageId.length > 0
    && message.messageId.length <= 128
    && typeof message.conversationId === "string"
    && message.conversationId.length <= 64
    && typeof message.text === "string"
    && message.text.length <= 10_000;
}

async function handleChatMessage(socket: Socket, value: unknown) {
  if (!isChatMessage(value)) {
    logChatInfo("chat.socket.message_rejected", { reason: "invalid_payload" });
    return;
  }

  if (value.conversationId !== socket.data.conversationId) {
    logChatInfo("chat.socket.message_rejected", { reason: "conversation_mismatch" });
    return;
  }

  logChatInfo("chat.socket.message_received", { messageId: value.messageId });

  const text = value.text.trim();
  if (!text) {
    const ack: ChatAck = {
      messageId: value.messageId,
      accepted: false,
      error: "Message text is required.",
    };
    logChatInfo("chat.socket.ack_sent", {
      messageId: value.messageId,
      accepted: false,
      reason: "empty_text",
    });
    socket.emit("chat:ack", ack);
    return;
  }

  const userId = socket.data.userId as string;
  try {
    await enqueueChatMessage({
      conversationId: value.conversationId,
      messageId: value.messageId,
      userId,
      text,
    });
    logChatInfo("chat.socket.ack_sent", { messageId: value.messageId, accepted: true });
    socket.emit("chat:ack", { messageId: value.messageId, accepted: true });
  } catch (error) {
    logChatError("chat.socket.enqueue_failed", error, { messageId: value.messageId });
    logChatInfo("chat.socket.ack_sent", {
      messageId: value.messageId,
      accepted: false,
      reason: "queue_publish_failed",
    });
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
    const conversationId = socket.handshake.auth?.conversationId;
    if (!userId) {
      logChatInfo("chat.socket.connection_rejected", { reason: "missing_session" });
      next(new Error("Sign in before connecting to chat."));
      return;
    }
    if (typeof conversationId !== "string"
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversationId)) {
      logChatInfo("chat.socket.connection_rejected", { reason: "invalid_conversation" });
      next(new Error("A valid chat conversation is required."));
      return;
    }
    try {
      await realtimeReady;
      socket.data.userId = userId;
      socket.data.conversationId = conversationId;
      await socket.join(chatConversationRoom(userId, conversationId));
      logChatInfo("chat.socket.connected", { socketId: socket.id, conversationId });
      next();
    } catch (error) {
      logChatError("chat.socket.connection_setup_failed", error, { socketId: socket.id });
      next(new Error("Chat realtime service is unavailable."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("chat:message", (message: unknown) => {
      void handleChatMessage(socket, message);
    });
  });
}
