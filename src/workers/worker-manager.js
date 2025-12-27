const { getQueueService } = require("../services/queue.service");
const { JOB_TYPES } = require("../config/jobs.config");
const CodeExecutionWorker = require("./code-execution.worker");
const FileProcessingWorker = require("./file-processing.worker");
const DataExportWorker = require("./data-export.worker");

class WorkerManager {
  constructor() {
    this.queueService = getQueueService();
    this.workers = new Map();
  }

  // Start all workers
  start() {
    console.log("🚀 Starting worker manager...");

    // Register workers
    this.registerWorker(
      JOB_TYPES.CODE_EXECUTION,
      CodeExecutionWorker.process.bind(CodeExecutionWorker)
    );
    this.registerWorker(
      JOB_TYPES.FILE_PROCESSING,
      FileProcessingWorker.process.bind(FileProcessingWorker)
    );
    this.registerWorker(
      JOB_TYPES.DATA_EXPORT,
      DataExportWorker.process.bind(DataExportWorker)
    );

    console.log("✅ All workers started");
  }

  // Register worker for specific job type
  registerWorker(jobType, processor) {
    const queue = this.queueService.getQueue(jobType);

    if (!queue) {
      console.error(`❌ Queue not found for job type: ${jobType}`);
      return;
    }

    // Process jobs with concurrency of 5
    queue.process(5, async (job) => {
      try {
        console.log(`🔄 Worker processing job ${job.id} (type: ${jobType})`);
        const result = await processor(job);
        return result;
      } catch (error) {
        console.error(`❌ Worker error for job ${job.id}:`, error);
        throw error;
      }
    });

    this.workers.set(jobType, queue);
    console.log(`✅ Worker registered: ${jobType}`);
  }

  // Stop all workers
  async stop() {
    console.log("🛑 Stopping all workers...");

    await this.queueService.close();

    console.log("✅ All workers stopped");
  }

  // Get worker stats
  async getStats() {
    const stats = {};

    for (const jobType of Object.values(JOB_TYPES)) {
      try {
        stats[jobType] = await this.queueService.getQueueStats(jobType);
      } catch (error) {
        console.error(`Error getting stats for ${jobType}:`, error);
      }
    }

    return stats;
  }
}

// Singleton instance
let workerManagerInstance = null;

function getWorkerManager() {
  if (!workerManagerInstance) {
    workerManagerInstance = new WorkerManager();
  }
  return workerManagerInstance;
}

module.exports = { WorkerManager, getWorkerManager };
