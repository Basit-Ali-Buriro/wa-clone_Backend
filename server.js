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

// ✅ Get client URL from env or use default
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
app.use(express.json());
app.use(cookieParser());

// ✅ FIXED CORS CONFIGURATION
const corsOptions = {
  origin: CLIENT_URL, // ✅ Changed from "*" to specific origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Routes
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/users', userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.get('/', (req, res) => {
  res.send('API working');
});

const server = http.createServer(app);

// ✅ FIXED Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL, // ✅ Changed from "*" to specific origin
    credentials: true,  // ✅ Added credentials
    methods: ["GET", "POST"]
  }
});

setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ CORS enabled for: ${CLIENT_URL}`);
});