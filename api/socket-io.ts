import { createServer } from "node:http";
import { Server } from "socket.io";
import { registerChatSocketHandlers } from "../lib/chat-socket.js";

const httpServer = createServer();
const io = new Server(httpServer, {
  path: "/api/socket-io",
  addTrailingSlash: false,
});

registerChatSocketHandlers(io);

export default httpServer;
