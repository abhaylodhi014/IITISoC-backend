import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:  ["https://iiti-so-c-frontend.vercel.app"],
    methods: ["GET", "POST"],
     credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
} 

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
 
  // ✅ NEW: Join meeting room
  socket.on("joinMeetingRoom", (meetingId) => {
   const userId = socket.handshake.query.userId;
  console.log("New client connected:", socket.id, "with userId:", userId);

  if (userId) userSocketMap[userId] = socket.id;

    console.log(`User ${userId} joined meeting room ${meetingId}`);
    socket.join(meetingId);   // socket.io built-in
  });
  


  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});


 
export { io, app, server };
