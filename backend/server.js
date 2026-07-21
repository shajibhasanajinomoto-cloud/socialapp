require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const socketHandler = require("./sockets/socketHandler");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const messageRoutes = require("./routes/messageRoutes");
const friendRoutes = require("./routes/friendRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const storyRoutes = require("./routes/storyRoutes");
const groupRoutes = require("./routes/groupRoutes");
const searchRoutes = require("./routes/searchRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/search", searchRoutes);

app.get("/", (req, res) => res.json({ status: "ok", message: "Social App API running" }));

// Global error handler (e.g. Multer file-size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

// Socket.io
socketHandler(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
