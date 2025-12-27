require("dotenv").config();
const { Pool } = require("pg");
const mongoose = require("mongoose");
const redis = require("redis");

// PostgreSQL Configuration - Support both individual vars and DATABASE_URL
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

// Test PostgreSQL connection
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

// Redis Configuration - Support both individual vars and REDIS_URL
const redisConfig = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };

const redisClient = redis.createClient(
  typeof redisConfig === "string" ? { url: redisConfig } : redisConfig
);

const redisPublisher = redisClient.duplicate();
const redisSubscriber = redisClient.duplicate();

async function connectRedis() {
  try {
    await redisClient.connect();
    await redisPublisher.connect();
    await redisSubscriber.connect();
    console.log("✅ Redis connected");
  } catch (error) {
    console.error("❌ Redis connection error:", error.message);
    throw error;
  }
}

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

module.exports = {
  pgPool,
  testPgConnection,
  connectMongoDB,
  redisClient,
  redisPublisher,
  redisSubscriber,
  connectRedis,
};
