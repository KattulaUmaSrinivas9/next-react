import { timingSafeEqual } from "node:crypto";
import { createChatSession, sessionCookie } from "../../../../lib/chat-session";

export const runtime = "nodejs";

function passwordsMatch(expected: string, actual: string) {
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  return expectedBytes.length === actualBytes.length && timingSafeEqual(expectedBytes, actualBytes);
}

export async function POST(request: Request) {
  const expectedPassword = process.env.CHAT_DEMO_PASSWORD;
  const sessionSecret = process.env.CHAT_SESSION_SECRET;
  if (!expectedPassword || !sessionSecret) {
    return Response.json({ error: "Set CHAT_DEMO_PASSWORD and CHAT_SESSION_SECRET on the server." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Username and password are required." }, { status: 400 });
  }
  const values = body as Record<string, unknown>;
  const username = typeof values.username === "string" ? values.username.trim() : "";
  const password = typeof values.password === "string" ? values.password : "";

  if (!username || username.length > 64 || !password) {
    return Response.json({ error: "Enter a username and password." }, { status: 400 });
  }
  if (!passwordsMatch(expectedPassword, password)) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const userId = username.toLowerCase();
  const token = createChatSession(userId);
  return Response.json(
    { userId },
    { headers: { "Set-Cookie": sessionCookie(token) } },
  );
}
