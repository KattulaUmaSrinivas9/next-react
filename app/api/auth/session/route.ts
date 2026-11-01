import { getChatSessionUserId, sessionCookie } from "../../../../lib/chat-session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getChatSessionUserId(request.headers.get("cookie"));
  return Response.json({ authenticated: Boolean(userId), userId });
}

export async function DELETE() {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": sessionCookie("", 0) },
  });
}
