This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Chat demo setup

Set `CHAT_DEMO_PASSWORD`, `CHAT_SESSION_SECRET`, `RABBITMQ_URL`, `CHAT_REQUEST_QUEUE`, `CHAT_RESPONSE_EXCHANGE`, and `CHAT_RESPONSE_ACK_TIMEOUT_MS` in `.env.local` and the shared Vercel Production environment. Set the same RabbitMQ URL and queue/exchange names for Python in `python-worker/.env`. Set `DATABASE_URL` only for the Python worker, locally and in Vercel, if using SQL. The login form accepts any username with the shared demo password; usernames are normalized to lowercase and used as `userId`. This is demo authentication, not separate per-user identity.

After login, Next.js publishes messages to the durable RabbitMQ request queue. Python processes them and publishes responses to a fanout exchange. Each active Next.js Socket.IO instance has one temporary response queue; it emits only to a matching authenticated user/conversation room. Replies are live-only and are not retained when no Socket.IO instance is subscribed, matching the previous Redis Pub/Sub behavior. The Python worker accepts direct read-only PostgreSQL queries and returns result tables; non-SQL messages use demo responses. Natural-language-to-SQL is planned, but no model provider is connected yet.

See the [chat architecture and technical design](docs/chat-architecture.html) for component responsibilities, architecture diagrams, message contracts, delivery guarantees, environment settings, failure handling, and the text-to-SQL roadmap.

For local development, run RabbitMQ and configure the same `RABBITMQ_URL` in both apps. Follow [the Python worker README](python-worker/README.md). For Vercel, configure a broker URL reachable from both the Next.js runtime and Python Daemon. Use `amqps://` with TLS for hosted brokers. Example files contain local placeholders only; never commit real credentials.

RabbitMQ retains durable requests. The temporary instance response queues exist only while Socket.IO instances have active chat connections, so responses are not retained while all instances are offline. This project does not store permanent chat history.

## Follow a message in production logs

Search Vercel logs by `messageId` and `conversationId`. The server trace is `chat.socket.message_received` -> `chat.queue.publish_succeeded` -> Python `chat.queue.delivery_received` / `chat.queue.message_received` -> `chat.processing.completed` -> `chat.queue.response_published` / `chat.queue.request_acknowledged` -> Next `chat.rabbitmq.response_received` -> `chat.socket.response_emitted` -> `chat.socket.response_delivery_confirmed` -> `chat.rabbitmq.response_acknowledged`. The final acknowledgment confirms the browser handled the response event. The Python worker also logs a heartbeat every 30 seconds. Browser console events (`chat.client.*`) help distinguish client-side issues.

If the trace stops at a stage, check broker reachability, matching queue/exchange configuration, and consumer logs. Logs include message IDs and status, but never chat text or credentials.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

