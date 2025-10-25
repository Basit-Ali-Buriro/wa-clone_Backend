// backend/socket/index.js
import jwt from "jsonwebtoken";
import cookie from "cookie";
import User from "../models/User.js";
import registerMessageHandlers from "./messageHandlers.js";
import registerCallHandlers from "./callHandlers.js"; // NEW IMPORT

export default function setupSocket(io) {
  const onlineUsers = new Map();

  io.use(async (socket, next) => {
    try {
      let token;

      const cookies = socket.handshake.headers.cookie;
      if (cookies) {
        const parsed = cookie.parse(cookies);
        token = parsed?.token;
      }

      if (!token) token = socket.handshake.auth?.token;

      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.id) return next(new Error("Invalid token"));

      socket.userId = decoded.id;
      socket.userInfo = await User.findById(decoded.id).select(
        "name email avatarUrl",
      );

      next();
    } catch (err) {
      console.error("❌ Socket auth error:", err.message);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, userInfo } = socket;

    console.log(
      `🟢 User connected: ${userInfo?.name || "Unknown"} (${userInfo?.email || "No email"}) — Socket ID: ${socket.id}`,
    );

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    io.emit("update-online-users", Array.from(onlineUsers.keys()));

    // Register message handlers
    registerMessageHandlers(io, socket, onlineUsers);

    // Register call handlers (NEW)
    registerCallHandlers(io, socket, onlineUsers);

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }

      io.emit("update-online-users", Array.from(onlineUsers.keys()));
      console.log(
        `🔴 User disconnected: ${userInfo?.name || userId} — Socket ID: ${socket.id}`,
      );
    });
  });
}