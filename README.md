This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Chat demo setup

Set `CHAT_DEMO_PASSWORD`, `CHAT_SESSION_SECRET`, `CHAT_QUEUE_REGION`, and `NEXT_CHAT_CALLBACK_SECRET` in `.env.local` and in the Vercel project environment settings. The login form accepts any username with the shared demo password; usernames are normalized to lowercase and used as the queue `userId`. This is demo authentication, not separate per-user identity.

After login, the Next.js Socket.IO backend publishes messages to the Vercel Queues topic `chat-messages`. The separate FastAPI worker consumes them and posts its response to `/api/chat/results`; Next pushes the response to the user's Socket.IO room. Local development can emit directly through the single Node server. Vercel needs `REDIS_URL` so the callback function can reach the Function instance holding the socket. The Python worker currently returns demo text/chart/table data. The AI and SQL service call is a placeholder for later implementation.

For local queue publishing and consumption, use a Vercel-linked project with queue credentials available in the local environment. The Next app and Python worker must use the same `CHAT_QUEUE_REGION` and `NEXT_CHAT_CALLBACK_SECRET`. Set `VERCEL_QUEUE_TOKEN` in the worker environment. Point `NEXT_API_BASE_URL` at the Next.js deployment (or local server). Configure Redis through the Vercel Marketplace and set `REDIS_URL` for the Next.js deployment to enable cross-instance socket delivery.

Queued input messages use Vercel Queues retention; this project does not store chat history.

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
