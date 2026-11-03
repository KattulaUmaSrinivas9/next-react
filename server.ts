import { createServer } from "node:http";
import { createRequire } from "node:module";
import next from "next";
import { Server } from "socket.io";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

const portArgumentIndex = process.argv.indexOf("--port");
const argumentPort = portArgumentIndex >= 0 ? process.argv[portArgumentIndex + 1] : undefined;
const port = Number(argumentPort ?? process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, hostname, port });
const handleNextRequest = app.getRequestHandler();

async function startServer() {
  // Load Next's env files before importing modules that read broker settings.
  loadEnvConfig(process.cwd(), dev);
  const { registerChatSocketHandlers } = await import("./lib/chat-socket.js");
  await app.prepare();

  const httpServer = createServer((request, response) => {
    void handleNextRequest(request, response);
  });
  const io = new Server(httpServer, {
    path: "/api/socket-io",
    addTrailingSlash: false,
  });

  registerChatSocketHandlers(io);
  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await new Promise<void>((resolve) => io.close(() => resolve()));
    await app.close();
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void shutdown().then(() => process.exit(0));
    });
  }
}

void startServer().catch((error: unknown) => {
  console.error("Failed to start Next.js and Socket.IO:", error);
  process.exitCode = 1;
});
