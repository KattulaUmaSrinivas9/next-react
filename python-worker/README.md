# Chat queue worker

FastAPI serves a local health endpoint, while the production queue consumer runs as a Vercel Daemon. The worker polls Vercel Queue topic `chat-messages`, builds a demo response, and POSTs it to the Next.js callback. Next.js publishes the response through Redis Pub/Sub and delivers it to the browser over Socket.IO.

Redis is only used for the response path. It does not deliver incoming messages to Python. The inbound path is Vercel Queues.

The AI and SQL call is intentionally left as a TODO in `app/response_builder.py`.

## Vercel deployment

This worker is deployed as the `chat-python-worker` Vercel Daemon declared in the monorepo root `vercel.json`. It must deploy in the same Vercel project as the Next.js producer so both use the same Vercel Queues project scope. Deploy the monorepo to production; Daemons run on production deployments. The configured daemon runs one instance in `iad1`. Check the daemon logs in the shared Vercel project to confirm startup and `Received chat message ...` entries. Daemons do not expose HTTP endpoints, so `/health` is for local FastAPI development only.

Configure these variables in the monorepo's Vercel project Production environment (the same project used by the Next.js app):

- `CHAT_QUEUE_REGION`: the same fixed queue region as the Next.js producer (currently `iad1`).
- `NEXT_API_BASE_URL`: reachable URL of the Next.js deployment, with no trailing slash; do not use `localhost` in the deployed worker.
- `NEXT_CHAT_CALLBACK_SECRET`: same value used by the Next.js callback route.
- `CHAT_QUEUE_DEPLOYMENT_ID` (optional): override the deployment partition only when needed to drain or target a different deployment. In production the worker defaults to Vercel's automatic `VERCEL_DEPLOYMENT_ID`, which matches the Next.js producer because both run in this monorepo deployment. Local development without a Vercel deployment ID polls all partitions.

Leave `VERCEL_QUEUE_BASE_URL` and `VERCEL_QUEUE_TOKEN` unset in Vercel. `VERCEL_QUEUE_TOKEN` overrides OIDC, so never put a copied short-lived token there. The SDK resolves OIDC credentials at runtime and supports the rotating `VERCEL_OIDC_TOKEN_FILE` source. If the daemon logs `TokenResolutionError`, verify that OIDC is enabled and a runtime token source is available; do not reuse a token pulled for local development. The Python and Node SDKs should use hosted Vercel Queues and deployment credentials. Do not run multiple independent worker copies with the same `chat-python-worker` consumer group unless they should compete for messages.

## Local development

Copy `.env.example` to `.env`. Set the shared callback secret and `NEXT_API_BASE_URL=http://localhost:3000`.

The monorepo uses the Vercel Queue local devserver for local cross-process queueing, so local development does not need an expiring cloud token or Redis connection. From the `python-worker` directory, install the devserver extra and start it in its own terminal:

```cmd
py -m venv .venv
.venv\Scripts\activate
py -m pip install -e ".[local-queue]"
py -m vercel.queue.devserver --host 127.0.0.1 --port 8111
```

Both local env files should use the same `VERCEL_QUEUE_BASE_URL=http://127.0.0.1:8111` and `VERCEL_QUEUE_TOKEN=local-token`. The checked-in examples show these local values; do not copy them into Vercel project settings.

Run the Next.js app from the monorepo root with `npm run dev`. In another terminal, change to `python-worker`, activate its virtual environment, and start the Python API and poller:

```cmd
.venv\Scripts\activate
uvicorn app.main:app --env-file .env --host 0.0.0.0 --port 8000
```

Check `http://localhost:8000/health` for local HTTP process health. The FastAPI lifespan starts the same poller locally.

## Message and response flow

1. Next.js authenticates a Socket.IO client and enqueues `{ messageId, userId, text, createdAt }` to topic `chat-messages`.
2. This worker polls that topic with consumer group `chat-python-worker` and validates `userId`, `messageId`, and `text`.
3. The worker POSTs `{ userId, messageId, response }` to `<NEXT_API_BASE_URL>/api/chat/results` with `Authorization: Bearer <NEXT_CHAT_CALLBACK_SECRET>`.
4. Next.js verifies the callback, publishes on Redis channel `chat:responses` in deployment, and emits `chat:response` to the authenticated Socket.IO room named by `userId`. With local Redis unset, the custom Next.js server emits directly to its local Socket.IO instance.

A Next.js `chat:ack accepted: true` means only that enqueue succeeded. If Python has no receive logs, first confirm the local queue devserver is running and both env files point to the same URL. For missing responses, inspect the callback URL/secret and Next.js logs.

