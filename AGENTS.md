<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project spec: chat and deployment

- This monorepo contains the Next.js UI, authenticated Socket.IO endpoint, Vercel Queue producer, result callback, and `python-worker/` consumer. The Python consumer runs in production as a Vercel Daemon in the same Vercel project, not as a request-driven FastAPI Function. `vercel.json` is the shared deployment config.
- Inbound path: browser emits `chat:message` -> `lib/chat-socket.ts` validates it and calls `lib/chat-queue.ts` -> Vercel Queue topic `chat-messages` receives `{ messageId, userId, text, createdAt }`. `chat:ack accepted: true` means only that enqueue succeeded; it does not mean Python processed the message.
- The producer uses `CHAT_QUEUE_REGION`, then `VERCEL_REGION`, then `iad1`; it explicitly targets `https://<region>.vercel-queue.com` to bypass the Vercel CLI local push-mode broker. Keep the consumer's `CHAT_QUEUE_REGION` aligned with the producer and the Vercel Queues resource. The producer and consumer must deploy under this same Vercel project to share its queue and OIDC scope.
- Outbound path: the Python daemon POSTs `{ userId, messageId, response }` to `/api/chat/results` with `Authorization: Bearer <NEXT_CHAT_CALLBACK_SECRET>`. The route validates the secret and payload, then publishes JSON on Redis channel `chat:responses`. Every live Next.js Socket.IO process subscribes and emits `chat:response` to room `userId`.
- Redis is only the response fan-out path; it does not deliver queued input to Python. `REDIS_URL` is required in deployed Next.js for response delivery. Local Next.js can emit directly when Redis is absent.
- Preserve the `userId` and `messageId` unchanged through queue, callback, Redis event, and client response. The Socket.IO room is the authenticated session's normalized user ID.
- Vercel Queues and Redis Pub/Sub are transient delivery mechanisms here; there is no durable chat history. The Python response builder currently returns demo text/chart/table data; AI/SQL integration is not implemented.

### Diagnose missing messages or responses

1. Check the browser's `chat:ack`: rejected means inspect enqueue errors in Next logs; accepted confirms only the queue send.
2. Check Python worker logs for startup and `Received chat message ...`. No receive points to queue configuration/consumer operation: verify the daemon is running in this same Vercel project, runtime OIDC is available, `CHAT_QUEUE_REGION` matches, and the topic is `chat-messages`. It polls all deployment partitions by default. Vercel automatically sets `VERCEL_DEPLOYMENT_ID` to the current deployment; the worker intentionally ignores it. Only use `CHAT_QUEUE_DEPLOYMENT_ID` to explicitly pin a partition.
3. If Python receives but no result appears, check `NEXT_API_BASE_URL`, callback reachability, and the shared `NEXT_CHAT_CALLBACK_SECRET` available to both daemon and route. A failed callback raises so the queue can retry.
4. Check Next logs for callback status, `REDIS_URL`, Redis publisher errors, and `Chat Socket.IO Redis subscriber ready.` A Redis publish with zero subscribers fails; ensure the deployed Socket.IO process is alive and subscribed.
5. `/health` only confirms FastAPI serves HTTP; it does not confirm queue polling is authenticated or healthy.
6. Never paste, print, commit, or document secret values. Keep `.env*` files untracked; use `.env.example` for variable names only.


### Local queue setup

- For local cross-process queueing, use the Python Queue devserver and set `VERCEL_QUEUE_BASE_URL` plus `VERCEL_QUEUE_TOKEN=local-token` in `.env.local` and `python-worker/.env`. The Python worker and this producer must use the same broker URL.
- Local Redis is optional because the custom Next.js server can emit responses directly to its own Socket.IO instance. Leave local broker variables unset in Vercel deployments so the SDK uses hosted Queues and platform-managed credentials.
