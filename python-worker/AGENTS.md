# Python worker spec

- This package runs as a Vercel Daemon in production and a FastAPI lifespan consumer locally.
- It consumes durable RabbitMQ queue `CHAT_REQUEST_QUEUE` (default `chat.requests`) and publishes persistent responses to fanout exchange `CHAT_RESPONSE_EXCHANGE` (default `chat.responses.fanout`).
- Requests contain `userId`, `conversationId`, `messageId`, `text`, and `createdAt`; responses preserve user, conversation, and message IDs.
- A request is acknowledged only after the response publish is confirmed. RabbitMQ may redeliver work, so processing should tolerate duplicates.
- Set `RABBITMQ_URL` in both Next.js and Python. Queue/exchange values must match. Keep credentials in ignored `.env` or Vercel environment variables; never commit them.
- Next.js creates one temporary auto-delete response queue per active Socket.IO instance, not one per conversation. Replies are live-only and are not retained when no instance is subscribed.
- Vercel Queues, Redis, HTTP callbacks, and callback secrets are not used for chat messaging.
- The monorepo worker executes read-only SQL; the standalone worker currently returns demo responses. Preserve SQL safety if copying changes between them.
- `/health` checks only the local FastAPI process. For production, inspect logs: `chat.worker.started`, `chat.queue.message_received`, and `chat.queue.response_published`.
