import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, "http://localhost:5173"] : true,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("Client connected to Socket.IO:", socket.id);

    socket.on("join", (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`Socket ${socket.id} joined room ${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn("Socket.io not initialized yet!");
  }
  return io;
};

export const notifyUser = (userId, event, data) => {
  const io = getIO();
  if (io && userId) {
    io.to(userId.toString()).emit(event, data);
  }
};
