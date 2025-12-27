const Redis = require("ioredis");
const { REDIS_CHANNELS } = require("../utils/events.util");

class RedisPubSubService {
  constructor() {
    // Determine Redis configuration for Render or local development
    const redisOptions = {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: null, // Essential for avoiding 'MaxRetriesPerRequestError' on Render
    };

    // Prioritize REDIS_URL (Render) over individual parameters
    const redisTarget = process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };

    // Publisher client
    this.publisher = new Redis(redisTarget, redisOptions);

    // Subscriber client (separate connection required for Pub/Sub)
    this.subscriber = new Redis(redisTarget, redisOptions);

    this.handlers = new Map();

    this.publisher.on("connect", () =>
      console.log("✅ Redis Publisher connected")
    );
    this.subscriber.on("connect", () =>
      console.log("✅ Redis Subscriber connected")
    );

    this.publisher.on("error", (err) =>
      console.error("❌ Redis Publisher error:", err.message)
    );
    this.subscriber.on("error", (err) =>
      console.error("❌ Redis Subscriber error:", err.message)
    );

    // Set up message handler
    this.subscriber.on("message", (channel, message) => {
      this.handleMessage(channel, message);
    });
  }

  // Publish event to Redis channel
  async publish(channel, event) {
    try {
      const message = JSON.stringify(event);
      await this.publisher.publish(channel, message);
      console.log(`📤 Published to ${channel}:`, event.type);
    } catch (error) {
      console.error("Redis publish error:", error);
    }
  }

  // Subscribe to Redis channel
  async subscribe(channel, handler) {
    try {
      await this.subscriber.subscribe(channel);
      this.handlers.set(channel, handler);
      console.log(`📥 Subscribed to channel: ${channel}`);
    } catch (error) {
      console.error("Redis subscribe error:", error);
    }
  }

  // Unsubscribe from channel
  async unsubscribe(channel) {
    try {
      await this.subscriber.unsubscribe(channel);
      this.handlers.delete(channel);
      console.log(`📤 Unsubscribed from channel: ${channel}`);
    } catch (error) {
      console.error("Redis unsubscribe error:", error);
    }
  }

  // Handle incoming messages
  handleMessage(channel, message) {
    try {
      const event = JSON.parse(message);
      const handler = this.handlers.get(channel);

      if (handler) {
        handler(event);
      }
    } catch (error) {
      console.error("Redis message handling error:", error);
    }
  }

  // Broadcast project event
  async broadcastProjectEvent(projectId, event) {
    await this.publish(REDIS_CHANNELS.PROJECT_EVENTS, {
      projectId,
      ...event,
    });
  }

  // Broadcast user presence
  async broadcastUserPresence(projectId, userId, status) {
    await this.publish(REDIS_CHANNELS.USER_PRESENCE, {
      projectId,
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  // Close connections
  async close() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}

// Singleton instance
let redisPubSubInstance = null;

function getRedisPubSub() {
  if (!redisPubSubInstance) {
    redisPubSubInstance = new RedisPubSubService();
  }
  return redisPubSubInstance;
}

module.exports = { RedisPubSubService, getRedisPubSub };
