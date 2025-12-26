require("dotenv").config();
const http = require("http");
const app = require("./app");
const {
  connectMongoDB,
  testPgConnection,
  connectRedis,
} = require("./config/database");
const WebSocketService = require("./services/websocket.service");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to all databases
    await Promise.all([connectMongoDB(), testPgConnection(), connectRedis()]);

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket server
    const wsService = new WebSocketService(server);

    // Attach WebSocket service to app for potential use in routes
    app.set("wsService", wsService);

    // Start server
    server.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
      console.log(
        `📡 API Base: http://localhost:${PORT}/api/${process.env.API_VERSION}`
      );
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM received, shutting down gracefully");
      server.close(() => {
        console.log("Process terminated");
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
