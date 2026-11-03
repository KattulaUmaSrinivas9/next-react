<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project spec: chat and deployment

- This monorepo contains the Next.js UI, authenticated Socket.IO endpoint, RabbitMQ request publisher, and `python-worker/` daemon. The standalone Python repository is a second checkout of the same worker.
- Inbound path: browser emits `chat:message` -> `lib/chat-socket.ts` validates it -> `lib/chat-queue.ts` publishes persistent JSON to durable queue `CHAT_REQUEST_QUEUE` (default `chat.requests`). `chat:ack accepted: true` means RabbitMQ confirmed enqueue, not that Python finished processing.
- Python consumes the durable request queue with manual acknowledgment, then publishes persistent responses to fanout exchange `CHAT_RESPONSE_EXCHANGE` (default `chat.responses.fanout`).
- Each active Next.js Socket.IO instance has one temporary auto-delete response queue, not one queue per chat. The exchange copies each reply to active instances; each instance emits only to its local room scoped by user ID and conversation ID.
- Response delivery is live-only. If no Next.js instance is subscribed, a reply is not retained. This matches the prior Redis Pub/Sub response behavior; the durable request queue still buffers inbound work.
- `RABBITMQ_URL` is required by Next.js and Python. Vercel Queues, Redis Pub/Sub, callback HTTP route/secrets, and their env vars are not part of the chat transport.
- Preserve `userId`, `conversationId`, and `messageId` through request, response, and client event. Keep message text and credentials out of logs.
- Queue delivery is at-least-once; processing must tolerate retries. There is no chat-history database. The monorepo Python worker supports read-only SQL; the standalone Python repository is currently the demo worker.

### Diagnose missing messages or responses

1. Check the browser's `chat:ack`: rejected means inspect RabbitMQ publish errors in Next logs; accepted means the broker confirmed the enqueue.
2. Check Python logs for `chat.worker.started` and `chat.queue.message_received`; verify `RABBITMQ_URL`, request queue name, broker reachability, and consumer health.
3. Trace one message by `messageId` and `conversationId`: Next `chat.socket.message_received` → `chat.queue.publish_succeeded` → Python `chat.queue.delivery_received` / `chat.queue.message_received` → `chat.processing.completed` → `chat.queue.response_published` / `chat.queue.request_acknowledged` → Next `chat.rabbitmq.response_received` → `chat.socket.response_emitted` → `chat.socket.response_delivery_confirmed` → `chat.rabbitmq.response_acknowledged`. The last event confirms the browser acknowledged receipt. If no active Next queue receives a copy, check Socket.IO subscriber lifecycle logs.
5. `/health` only confirms FastAPI serves HTTP; it does not confirm queue polling is authenticated or healthy.
6. Never paste, print, commit, or document secret values. Keep `.env*` files untracked; use `.env.example` for variable names only.
7. Trace production requests with the structured `chat.*` log events and `messageId`. Never log chat text, callback secrets, queue tokens, cookies, or Redis URLs.


### Local broker setup

- Run RabbitMQ locally or use a hosted broker. Put the same `RABBITMQ_URL` in the Next.js `.env.local` and Python worker `.env`; use the queue/exchange names from `.env.example` in both processes.
- Keep credentials in ignored local env files and Vercel environment settings; never commit them.
