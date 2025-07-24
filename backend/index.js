import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import { WebSocketServer } from "ws";
import mediasoup from "mediasoup";
import connectDB from "./db/db.js";
import router from "./routes/routes.js";
import handleWebSocketConnection from "./sfu/wsHandler.js";
import {app , server} from "./libs/socket.js"
;
 


// Middlewares
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api", router);

// Connect DB 
connectDB();

// // Setup mediasoup worker and WebSocket SFU
const wss = new WebSocketServer({ noServer: true });  // yaha pe server nahi dena
let worker;

(async () => {
  worker = await mediasoup.createWorker();
  console.log("Mediasoup worker created");

  wss.on("connection", (ws) => {
    handleWebSocketConnection(ws, worker);
  });
})();

// Custom HTTP upgrade only for "/mediasoup"
server.on("upgrade", (request, socket, head) => {
  if (request.url === "/mediasoup") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();  // unknown route => destroy
  }
});  
 
// Start server
const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
