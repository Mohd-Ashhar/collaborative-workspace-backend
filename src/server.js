require("dotenv").config();
const http = require("http");
const app = require("./app");
const {
  connectMongoDB,
  testPgConnection,
  connectRedis,
} = require("./config/database");
const WebSocketService = require("./services/websocket.service");
const { getWorkerManager } = require("./workers/worker-manager");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to all databases
    await Promise.all([connectMongoDB(), testPgConnection(), connectRedis()]);

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket server
    const wsService = new WebSocketService(server);

    // Attach WebSocket service to app
    app.set("wsService", wsService);

    // Start background workers
    const workerManager = getWorkerManager();
    workerManager.start();

    // Start server
    server.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
      console.log(
        `📡 API Base: http://localhost:${PORT}/api/${process.env.API_VERSION}`
      );
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`⚙️  Background workers: Active`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("SIGTERM received, shutting down gracefully");

      // Stop workers first
      await workerManager.stop();

      // Close server
      server.close(() => {
        console.log("Process terminated");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
