import { createHmac, timingSafeEqual } from "node:crypto";

export const CHAT_SESSION_COOKIE = "chat_session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = { userId: string; expiresAt: number };

function sessionSecret() {
  return process.env.CHAT_SESSION_SECRET;
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createChatSession(userId: string) {
  const secret = sessionSecret();
  if (!secret) throw new Error("CHAT_SESSION_SECRET is not configured.");

  const payload: SessionPayload = {
    userId,
    expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signature(encodedPayload, secret)}`;
}

export function getChatSessionUserId(cookieHeader: string | null | undefined) {
  const secret = sessionSecret();
  if (!secret || !cookieHeader) return null;

  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${CHAT_SESSION_COOKIE}=`));
  const token = cookie?.slice(CHAT_SESSION_COOKIE.length + 1);
  if (!token) return null;

  const [encodedPayload, suppliedSignature] = token.split(".");
  if (!encodedPayload || !suppliedSignature) return null;

  const expectedSignature = signature(encodedPayload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.userId !== "string" || !payload.userId || payload.expiresAt <= Date.now()) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string, maxAge = SESSION_LIFETIME_SECONDS) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CHAT_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
