import { timingSafeEqual } from "node:crypto";
import { emitChatResponse } from "../../../../lib/chat-realtime";
import { logChatError, logChatInfo } from "../../../../lib/chat-log";
import type { AssistantResponse } from "../../../../components/chatbot/types";

export const runtime = "nodejs";

function isAssistantResponse(value: unknown): value is AssistantResponse {
  if (typeof value !== "object" || value === null || !("type" in value)) return false;
  const response = value as Record<string, unknown>;
  if (response.type === "text") return typeof response.content === "string";
  if (response.type === "chart") {
    return typeof response.title === "string"
      && (response.chartType === "bar" || response.chartType === "line" || response.chartType === "pie")
      && typeof response.xKey === "string"
      && Array.isArray(response.data)
      && Array.isArray(response.series);
  }
  if (response.type === "table") {
    return typeof response.title === "string" && Array.isArray(response.columns) && Array.isArray(response.rows);
  }
  if (response.type === "image") return typeof response.src === "string" && typeof response.alt === "string";
  if (response.type === "video") return typeof response.src === "string";
  return false;
}

function callbackAuthorized(authorization: string | null) {
  const secret = process.env.NEXT_CHAT_CALLBACK_SECRET;
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request: Request) {
  if (!callbackAuthorized(request.headers.get("authorization"))) {
    logChatInfo("chat.callback.rejected", { reason: "unauthorized", status: 401 });
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logChatInfo("chat.callback.rejected", { reason: "invalid_json", status: 400 });
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    logChatInfo("chat.callback.rejected", { reason: "invalid_body", status: 400 });
    return Response.json({ error: "Invalid result." }, { status: 400 });
  }
  const result = body as Record<string, unknown>;
  if (typeof result.userId !== "string" || !result.userId || typeof result.messageId !== "string" || !result.messageId || !isAssistantResponse(result.response)) {
    logChatInfo("chat.callback.rejected", {
      messageId: typeof result.messageId === "string" ? result.messageId : undefined,
      reason: "invalid_result_shape",
      status: 400,
    });
    return Response.json({ error: "Result must include userId, messageId, and a supported response." }, { status: 400 });
  }

  logChatInfo("chat.callback.validated", { messageId: result.messageId });
  try {
    await emitChatResponse({ userId: result.userId, messageId: result.messageId, response: result.response });
    logChatInfo("chat.callback.accepted", { messageId: result.messageId, status: 202 });
    return Response.json({ accepted: true }, { status: 202 });
  } catch (error) {
    logChatError("chat.callback.publish_failed", error, { messageId: result.messageId, status: 503 });
    return Response.json({ error: "Could not publish the chat result." }, { status: 503 });
  }
}
