require("dotenv").config();
const { Pool } = require("pg");
const mongoose = require("mongoose");
const redis = require("redis");

// PostgreSQL Configuration
const pgConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    }
  : {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pgPool = new Pool(pgConfig);

async function testPgConnection() {
  try {
    const client = await pgPool.connect();
    await client.query("SELECT NOW()");
    client.release();
    console.log("✅ PostgreSQL connected");
  } catch (error) {
    console.error("❌ PostgreSQL connection error:", error.message);
    throw error;
  }
}

// MongoDB Configuration
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/workspace_db";

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
}

// Redis Configuration - FIX FOR RENDER
const getRedisConfig = () => {
  if (process.env.REDIS_URL) {
    // Render provides redis:// URL
    return { url: process.env.REDIS_URL };
  }
  // Local development
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  };
};

const redisConfig = getRedisConfig();

// Create three separate clients with same config
const redisClient = redis.createClient(redisConfig);
const redisPublisher = redis.createClient(redisConfig);
const redisSubscriber = redis.createClient(redisConfig);

async function connectRedis() {
  try {
    await Promise.all([
      redisClient.connect(),
      redisPublisher.connect(),
      redisSubscriber.connect(),
    ]);
    console.log("✅ Redis connected");
  } catch (error) {
    console.error("❌ Redis connection error:", error.message);
    throw error;
  }
}

// Error handlers
redisClient.on("error", (err) =>
  console.error("Redis Client Error:", err.message)
);
redisPublisher.on("error", (err) =>
  console.error("Redis Publisher Error:", err.message)
);
redisSubscriber.on("error", (err) =>
  console.error("Redis Subscriber Error:", err.message)
);

module.exports = {
  pgPool,
  testPgConnection,
  connectMongoDB,
  redisClient,
  redisPublisher,
  redisSubscriber,
  connectRedis,
};
