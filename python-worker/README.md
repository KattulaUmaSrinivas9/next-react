# Python chat worker

The worker consumes chat requests from RabbitMQ, runs the current SQL/demo response logic, and publishes results to a RabbitMQ fanout exchange. Each active Next.js Socket.IO instance has one temporary queue that receives response copies; it emits only replies for rooms connected to that instance.

## Environment

Configure these values in `python-worker/.env` locally and in the monorepo Vercel project's Production environment:

- `RABBITMQ_URL`: broker URL reachable from both Vercel and the Python process (`amqp://` locally or `amqps://` for hosted TLS brokers).
- `CHAT_REQUEST_QUEUE`: durable request queue; default `chat.requests`.
- `CHAT_RESPONSE_EXCHANGE`: durable fanout exchange; default `chat.responses.fanout`.
- `CHAT_WORKER_PREFETCH`: concurrent unacknowledged requests; default `1`.
- `DATABASE_URL`: optional Neon PostgreSQL URL for direct read-only SQL messages.

The Next.js app must use the same broker URL, request queue, and response exchange. Replies are live-only; they are not retained when no Socket.IO instance is subscribed. This matches the former Redis Pub/Sub behavior.

## Local development

Copy `.env.example` to `.env` and set `RABBITMQ_URL`. Run a local RabbitMQ broker (Docker example):

```powershell
docker run --rm --name chat-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

In one terminal, from the monorepo root:

```powershell
npm install
npm run dev
```

In another terminal, from `python-worker`:

```powershell
py -m venv .venv
.venv\Scripts\activate
py -m pip install -e .
uvicorn app.main:app --env-file .env --host 127.0.0.1 --port 8000
```

The FastAPI lifespan starts the RabbitMQ consumer. `/health` only confirms the HTTP process is up; check worker logs for `chat.worker.started` and `chat.queue.message_received`.

## Production

The worker runs as the `chat-python-worker` Vercel Daemon in the monorepo. Set `RABBITMQ_URL`, the matching queue/exchange names, and `DATABASE_URL` (if using SQL) in the Vercel Production environment. Vercel Queues, Redis, `NEXT_API_BASE_URL`, and callback secrets are no longer part of this flow.

## SQL messages

Send a single `SELECT` or `WITH ... SELECT` statement; Markdown SQL fences are accepted. Queries run in a read-only PostgreSQL transaction, have a 10-second statement timeout, and return at most 500 rows. A Neon role with read-only grants is still required. Other text uses the demo response builder until text-to-SQL is added.

## Message flow

1. Next.js publishes `{ userId, conversationId, messageId, text, createdAt }` to the durable request queue.
2. Python consumes, processes, and publishes `{ userId, conversationId, messageId, response }` to the fanout response exchange.
3. RabbitMQ copies the response to each active Next.js instance queue. Each instance emits only if it has the matching user/conversation room, then acknowledges its copy after a browser acknowledgment.

RabbitMQ request delivery is at least once. A retry can process a request more than once, so future side effects must be idempotent. The temporary response queues are removed when their Socket.IO instance stops consuming.
