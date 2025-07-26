import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// Store mapping of userId → socket.id
const userSocketMap = {}; // { userId: socketId }

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


io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
 
 //  Fetch userId from query and store
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);
  }

  //  Broadcast online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));




  // ✅ JOIN MEETING ROOM (Corrected)
  socket.on("joinMeetingRoom", (meetingId) => {
    console.log(`Socket ${socket.id} joined meeting room ${meetingId}`);
    socket.join(meetingId);
  });

  // ✅ HANDLE MEETING MESSAGE
  socket.on("send-meeting-message", ({ meetingId, message, sender }) => {
    console.log(` Message in meeting ${meetingId} from ${sender}: ${message}`);
    io.to(meetingId).emit("receive-meeting-message", {
      sender,
      message,
      meetingId,
      timestamp: new Date(),
    });
  });


  
  // ✅ HANDLE DISCONNECT
  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
    if (userId) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
