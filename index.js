require('dotenv').config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// DB Connect
const connectDB = require("./src/config/db");
connectDB();

// Models
const Message = require("./src/controllers/message");
const User = require("./src/models/user");

// Init express & server
const app = express();
app.set('trust proxy', 1);

// Session middleware
const sessionMiddleware = session({
  proxy: process.env.NODE_ENV === "production",
  secret: process.env.SESSION_SECRET || "default_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
});

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(sessionMiddleware);

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(['/login', '/register', '/forgot-password'], authLimiter);

// Routes
const routes = require("./src/routes/index");
app.use("/", routes);

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Share session with Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Socket.IO logic
io.on("connection", async (socket) => {
  const session = socket.request.session;
  if (!session?.userId) return;

  const userId = session.userId.toString();
  socket.join(userId);
  console.log(`User ${userId} connected`);

  // Set user online
  try {
    await User.findByIdAndUpdate(userId, {
      online: true,
      lastSeen: new Date()
    }).exec();

    io.emit('user-status-changed', {
      userId,
      online: true
    });
  } catch (err) {
    console.error('Error updating user status:', err);
  }

  // Handle message sending
  socket.on("send_message", async ({ sender, receiver, content }) => {
    try {
      if (!sender || !receiver || !content) {
        console.error("Missing sender, receiver, or content");
        return;
      }

      const message = await Message.create({
        sender,
        receiver,
        content,
        timestamp: new Date()
      });

      // Emit to both sender and receiver
      io.to(sender.toString()).to(receiver.toString()).emit("receive_message", message);
    } catch (error) {
      console.error("Socket message error:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    console.log(`User ${userId} disconnected`);

    try {
      await User.findByIdAndUpdate(userId, {
        online: false,
        lastSeen: new Date()
      }).exec();

      io.emit('user-status-changed', {
        userId,
        online: false
      });
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
