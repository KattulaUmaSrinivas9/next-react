This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Chat demo setup

Set `CHAT_DEMO_PASSWORD`, `CHAT_SESSION_SECRET`, `CHAT_QUEUE_REGION`, `NEXT_CHAT_CALLBACK_SECRET`, `NEXT_API_BASE_URL`, and `REDIS_URL` in `.env.local` as applicable and in the shared Vercel Production environment. `NEXT_API_BASE_URL` must be the deployed app URL without a trailing slash; both app and worker use the same project settings. The login form accepts any username with the shared demo password; usernames are normalized to lowercase and used as the queue `userId`. This is demo authentication, not separate per-user identity.

After login, the Next.js Socket.IO backend publishes messages to the Vercel Queues topic `chat-messages`. The Python daemon in `python-worker/` consumes them and posts its response to `/api/chat/results`; Next pushes the response to the user's Socket.IO room. Both are deployed from this repository as one Vercel project, so the producer and worker share the same Vercel Queues project scope. Local development can emit directly through the single Node server. Vercel needs `REDIS_URL` so the callback function can reach the Function instance holding the socket. The Python worker currently returns demo text/chart/table data. The AI and SQL service call is a placeholder for later implementation.

For local queue publishing and consumption, use the Python Queue devserver as a shared broker; local work then needs no expiring Vercel token or Redis. Follow the local setup in [the Python worker README](python-worker/README.md). Set `VERCEL_QUEUE_BASE_URL=http://127.0.0.1:8111` and `VERCEL_QUEUE_TOKEN=local-token` in both local env files. In Vercel deployments, leave those two variables unset so both apps use the hosted queue and platform credentials. Set `REDIS_URL` in this Vercel project for cross-instance Socket.IO delivery.

Queued input messages use Vercel Queues retention; this project does not store chat history.

## Follow a message in production logs

Search Vercel logs by the chat message's `messageId`. The expected server-side sequence is `chat.socket.message_received` -> `chat.queue.publish_succeeded` -> Python `chat.queue.message_received` -> `chat.callback.response_received` -> Next `chat.callback.validated` -> `chat.redis.publish_completed` -> `chat.redis.response_received` -> `chat.socket.response_emitted`. The daemon also logs `chat.worker.started` with its Vercel project and deployment IDs, then a `chat.queue.polling_heartbeat` every 30 seconds. The daemon and Next producer should show the same project and deployment IDs; the worker polls that deployment partition. The browser logs `chat.client.ack_received` and `chat.client.response_received` in its developer console; browser logs do not appear in Vercel.

If the trace stops at a stage, investigate that boundary first. In particular, if the Python heartbeat is present but `chat.queue.message_received` is missing, compare the daemon's `projectId` with the Next.js Vercel project and check the same project's Queues metrics. Logs include message IDs and status, but never chat text or credentials.

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

