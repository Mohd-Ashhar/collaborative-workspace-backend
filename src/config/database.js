const { Pool } = require('pg');
const mongoose = require('mongoose');
const Redis = require('ioredis');

// PostgreSQL Connection
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pgPool.on('connect', () => console.log('✅ PostgreSQL connected'));
pgPool.on('error', (err) => console.error('❌ PostgreSQL error:', err.message));

// Test PostgreSQL connection
const testPgConnection = async () => {
  try {
    const client = await pgPool.connect();
    console.log('✅ PostgreSQL connection verified');
    client.release();
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
  }
};

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

// Redis Connection with better retry
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`⚠️ Redis reconnecting... attempt ${times}`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
});

redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('ready', () => console.log('✅ Redis ready'));
redisClient.on('error', (err) => console.error('❌ Redis error:', err.message));

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
  }
};

module.exports = { 
  pgPool, 
  connectMongoDB, 
  redisClient,
  testPgConnection,
  connectRedis
};
