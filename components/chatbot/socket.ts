import { io, type Socket } from "socket.io-client";
import type { ChatMessageRequest, ChatSocketEvent } from "./types";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
type Callbacks = {
  onStatusChange: (status: ConnectionStatus) => void;
  onEvent: (event: ChatSocketEvent) => void;
};

function isChatSocketEvent(value: unknown): value is ChatSocketEvent {
  if (typeof value !== "object" || value === null || !("type" in value)) return false;
  const event = value as Record<string, unknown>;
  if (event.type === "chat:ack") {
    return typeof event.messageId === "string" && typeof event.accepted === "boolean";
  }
  if (event.type === "chat:response" && typeof event.response === "object" && event.response !== null) {
    return typeof event.conversationId === "string"
      && typeof event.messageId === "string"
      && "type" in event.response;
  }
  return false;
}

export function connectChatSocket(conversationId: string, callbacks: Callbacks) {
  const socket: Socket = io({
    path: "/api/socket-io",
    addTrailingSlash: false,
    withCredentials: true,
    auth: { conversationId },
    // Vercel Functions support Socket.IO over WebSocket, not HTTP long-polling.
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });

  socket.on("connect", () => callbacks.onStatusChange("connected"));
  socket.on("disconnect", () => callbacks.onStatusChange("disconnected"));
  socket.on("connect_error", (error) => {
    const details = error as Error & { description?: unknown; context?: unknown };
    console.error("Chat socket connection failed:", {
      message: details.message,
      description: details.description,
      context: details.context,
    });
    callbacks.onStatusChange("disconnected");
  });
  socket.on("chat:ack", (payload: unknown) => {
    const event = { type: "chat:ack", ...payload as object };
    if (isChatSocketEvent(event) && event.type === "chat:ack") {
      console.info("chat.client.ack_received", {
        messageId: event.messageId,
        accepted: event.accepted,
      });
      callbacks.onEvent(event);
    }
  });
  socket.on("chat:response", (payload: unknown) => {
    const event = { type: "chat:response", ...payload as object };
    if (isChatSocketEvent(event) && event.type === "chat:response") {
      console.info("chat.client.response_received", { messageId: event.messageId });
      callbacks.onEvent(event);
    }
  });

  return {
    send(message: ChatMessageRequest) {
      if (!socket.connected) return false;
      socket.emit("chat:message", message);
      return true;
    },
    close() {
      socket.disconnect();
    },
  };
}
