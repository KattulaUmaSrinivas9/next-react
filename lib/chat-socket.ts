import type { Server, Socket } from "socket.io";
import type { ChatMessageRequest } from "../components/chatbot/types";
import { getDemoResponse } from "../components/chatbot/utils/demo-response.js";

type ChatAck = { messageId: string; accepted: boolean; error?: string };

function isChatMessage(value: unknown): value is ChatMessageRequest {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return typeof message.messageId === "string" && typeof message.text === "string";
}

function handleChatMessage(socket: Socket, value: unknown) {
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

  const ack: ChatAck = { messageId: value.messageId, accepted: true };
  socket.emit("chat:ack", ack);
  socket.emit("chat:response", { response: getDemoResponse(text) });

  /*
  TODO: Call the Python agent service here when it is ready, then emit its
  typed response with socket.emit("chat:response", { response }).
  */
}

export function registerChatSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    socket.on("chat:message", (message: unknown) => handleChatMessage(socket, message));
  });
}
