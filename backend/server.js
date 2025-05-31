const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Enhanced CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
const PORT = process.env.PORT || 3000;

// Routes
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const messageRouter = require("./routes/message");

// Database Connection
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database connection established");
    } catch (err) {
        console.error("Database connection error:", err.message);
        process.exit(1);
    }
}

// Server endpoints
app.get("/", (req, res) => {
    res.json({
        status: "healthy",
        message: "Chat API Server",
        version: "1.0.0"
    });
});

// Route handlers
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error("Server Error:", err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
    });
});

// 404 Handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// Start Server
async function startServer() {
    await connectDB();
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Socket.IO Configuration
    const { Server } = require("socket.io");
    const io = new Server(server, {
        pingTimeout: 60000,
        transports: ["websocket"],
        cors: corsOptions
    });

    // Socket.IO Event Handlers
    io.on("connection", (socket) => {
        console.log("New socket connection:", socket.id);

        // Setup and Chat Events
        socket.on("setup", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} connected`);
            socket.emit("connected");
        });

        socket.on("join chat", (roomId) => {
            socket.join(roomId);
            console.log(`User joined chat room: ${roomId}`);
        });

        // Message Handling
        socket.on("new message", (newMessage) => {
            const chat = newMessage.chat;
            if (!chat?.users) return;

            chat.users.forEach(user => {
                if (user._id === newMessage.sender._id) return;
                socket.in(user._id).emit("message received", newMessage);
            });
        });

        // Typing Indicators
        socket.on("typing", (roomId) => socket.in(roomId).emit("typing"));
        socket.on("stop typing", (roomId) => socket.in(roomId).emit("stop typing"));

        // Cleanup
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            socket.removeAllListeners();
        });
    });
}

startServer().catch(err => {
    console.error("Server failed to start:", err);
    process.exit(1);
});
