import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from './routes/messageRoutes.js';
import setupSocket from "./socket/index.js";
import aiRoutes from "./routes/aiRoutes.js";
import userRoutes from './routes/userRoutes.js';

dotenv.config();
connectDB();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const app = express();
app.use(express.json());
app.use(cookieParser());
// ✅ FIXED CORS CONFIGURATION
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173", // ✅ Specific origin, not wildcard
  credentials: true, // ✅ Allow credentials (cookies, authorization headers)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // ✅ Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // ✅ Allowed headers
  exposedHeaders: ["set-cookie"], // ✅ Expose cookies
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ Handle preflight requests
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.get('/', (req, res)=>{
  res.send(`Api working`);
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
