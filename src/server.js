require('dotenv').config();
const app = require('./app');
const { connectMongoDB, testPgConnection, connectRedis } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to all databases
    await Promise.all([
      connectMongoDB(),
      testPgConnection(),
      connectRedis()
    ]);
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`📡 API Base: http://localhost:${PORT}/api/${process.env.API_VERSION}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
