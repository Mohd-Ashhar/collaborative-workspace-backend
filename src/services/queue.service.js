const Bull = require("bull");
const { v4: uuidv4 } = require("uuid");
const {
  JOB_TYPES,
  JOB_CONFIG,
  JOB_PRIORITY,
} = require("../config/jobs.config");

class QueueService {
  constructor() {
    this.queues = {};

    // Redis configuration - handle both URL and individual params
    const redisConfig = process.env.REDIS_URL
      ? process.env.REDIS_URL
      : {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
        };

    Object.values(JOB_TYPES).forEach((jobType) => {
      this.queues[jobType] = new Bull(jobType, redisConfig, {
        defaultJobOptions: {
          attempts: JOB_CONFIG.MAX_RETRIES,
          backoff: JOB_CONFIG.BACKOFF,
          removeOnComplete: JOB_CONFIG.REMOVE_ON_COMPLETE,
          removeOnFail: JOB_CONFIG.REMOVE_ON_FAIL,
          timeout: JOB_CONFIG.JOB_TIMEOUT,
        },
      });

      console.log(`✅ Queue created: ${jobType}`);
    });

    this.setupGlobalEvents();
  }

  // Setup global queue events
  setupGlobalEvents() {
    Object.entries(this.queues).forEach(([queueName, queue]) => {
      queue.on("error", (error) => {
        console.error(`❌ Queue ${queueName} error:`, error.message);
      });

      queue.on("waiting", (jobId) => {
        console.log(`⏳ Job ${jobId} waiting in ${queueName}`);
      });

      queue.on("active", (job) => {
        console.log(`🔄 Job ${job.id} processing in ${queueName}`);
      });

      queue.on("completed", (job, result) => {
        console.log(`✅ Job ${job.id} completed in ${queueName}`);
      });

      queue.on("failed", (job, err) => {
        console.error(`❌ Job ${job.id} failed in ${queueName}:`, err.message);
      });

      queue.on("stalled", (job) => {
        console.warn(`⚠️  Job ${job.id} stalled in ${queueName}`);
      });
    });
  }

  // Add job to queue
  async addJob(jobType, payload, options = {}) {
    if (!this.queues[jobType]) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    // Generate unique job ID for idempotency
    const jobId = options.jobId || uuidv4();

    const jobOptions = {
      jobId, // Ensures idempotency - duplicate jobId won't be added
      priority: options.priority || JOB_PRIORITY.NORMAL,
      delay: options.delay || 0,
      attempts: options.attempts || JOB_CONFIG.MAX_RETRIES,
    };

    const job = await this.queues[jobType].add(payload, jobOptions);

    console.log(`📤 Job added: ${job.id} (type: ${jobType})`);

    return {
      jobId: job.id,
      type: jobType,
      status: "pending",
    };
  }

  // Get job status
  async getJobStatus(jobType, jobId) {
    if (!this.queues[jobType]) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    const job = await this.queues[jobType].getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();
    const failedReason = job.failedReason;

    return {
      jobId: job.id,
      type: jobType,
      status: state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      timestamp: job.timestamp,
    };
  }

  // Remove job
  async removeJob(jobType, jobId) {
    if (!this.queues[jobType]) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    const job = await this.queues[jobType].getJob(jobId);

    if (job) {
      await job.remove();
      console.log(`🗑️  Job removed: ${jobId}`);
      return true;
    }

    return false;
  }

  // Retry failed job
  async retryJob(jobType, jobId) {
    if (!this.queues[jobType]) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    const job = await this.queues[jobType].getJob(jobId);

    if (job) {
      await job.retry();
      console.log(`🔄 Job retried: ${jobId}`);
      return true;
    }

    return false;
  }

  // Get queue statistics
  async getQueueStats(jobType) {
    if (!this.queues[jobType]) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    const queue = this.queues[jobType];

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  // Clean old jobs
  async cleanQueue(jobType, grace = 24 * 3600 * 1000) {
    if (!this.queues[jobType]) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    const queue = this.queues[jobType];

    await queue.clean(grace, "completed");
    await queue.clean(grace, "failed");

    console.log(`🧹 Cleaned queue: ${jobType}`);
  }

  // Get specific queue
  getQueue(jobType) {
    return this.queues[jobType];
  }

  // Pause queue
  async pauseQueue(jobType) {
    if (!this.queues[jobType]) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    await this.queues[jobType].pause();
    console.log(`⏸️  Queue paused: ${jobType}`);
  }

  // Resume queue
  async resumeQueue(jobType) {
    if (!this.queues[jobType]) {
      throw new Error(`Invalid job type: ${jobType}`);
    }

    await this.queues[jobType].resume();
    console.log(`▶️  Queue resumed: ${jobType}`);
  }

  // Close all queues
  async close() {
    await Promise.all(Object.values(this.queues).map((queue) => queue.close()));
    console.log("🔌 All queues closed");
  }
}

// Singleton instance
let queueServiceInstance = null;

function getQueueService() {
  if (!queueServiceInstance) {
    queueServiceInstance = new QueueService();
  }
  return queueServiceInstance;
}

module.exports = { QueueService, getQueueService };
