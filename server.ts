import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = 3000;

  // API health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Socket.io - Clean Core H2H Protocol
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-room", (roomId: string) => {
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room && room.size >= 2) {
        socket.emit("room-full");
        return;
      }
      socket.join(roomId);
      socket.data.roomId = roomId;
      console.log(`User ${socket.id} joined room ${roomId}`);

      // Notify other peer in room
      socket.to(roomId).emit("partner-connected");

      // If partner is already present, notify joining user
      if (room && room.size > 1) {
        socket.emit("partner-connected");
      }
    });

    socket.on("touch-update", (data) => {
      socket.to(data.roomId).volatile.emit("partner-touch", data);
    });

    socket.on("touch-end", (roomId: string) => {
      socket.to(roomId).emit("partner-end");
    });

    socket.on("ping", (callback) => {
      if (typeof callback === "function") {
        callback();
      }
    });

    socket.on("lite-touch-start", (roomId: string) => {
      socket.to(roomId).emit("partner-lite-touch-start");
    });

    socket.on("lite-touch-end", (roomId: string) => {
      socket.to(roomId).emit("partner-lite-touch-end");
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (roomId) {
        socket.to(roomId).emit("partner-disconnected");
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Door server running on http://localhost:${PORT}`);
  });
}

startServer();
