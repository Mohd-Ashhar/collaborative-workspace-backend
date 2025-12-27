const { JOB_STATUS } = require("../config/jobs.config");
const JobDBService = require("../services/job-db.service");

class FileProcessingWorker {
  // Process file processing job
  static async process(job) {
    const { jobId, fileUrl, operation, userId, projectId } = job.data;

    try {
      console.log(`🔄 Processing file: ${jobId} - ${operation}`);

      await JobDBService.updateJobStatus(jobId, JOB_STATUS.PROCESSING);

      job.progress(20);

      let result;

      switch (operation) {
        case "parse":
          result = await this.parseFile(fileUrl, job);
          break;
        case "compress":
          result = await this.compressFile(fileUrl, job);
          break;
        case "convert":
          result = await this.convertFile(fileUrl, job.data.targetFormat, job);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      job.progress(90);

      await JobDBService.updateJobStatus(jobId, JOB_STATUS.COMPLETED, {
        result,
      });

      job.progress(100);

      console.log(`✅ File processing completed: ${jobId}`);

      return result;
    } catch (error) {
      console.error(`❌ File processing failed: ${jobId}`, error);

      await JobDBService.updateJobStatus(jobId, JOB_STATUS.FAILED, {
        errorMessage: error.message,
        retryCount: job.attemptsMade,
      });

      throw error;
    }
  }

  // Parse file
  static async parseFile(fileUrl, job) {
    await this.simulateProcessing(2000);
    job.progress(60);

    return {
      operation: "parse",
      fileUrl,
      linesCount: Math.floor(Math.random() * 1000) + 100,
      size: Math.floor(Math.random() * 5000) + 500,
      parsedAt: new Date().toISOString(),
    };
  }

  // Compress file
  static async compressFile(fileUrl, job) {
    await this.simulateProcessing(3000);
    job.progress(60);

    return {
      operation: "compress",
      originalUrl: fileUrl,
      compressedUrl: fileUrl.replace(/\.[^.]+$/, ".zip"),
      originalSize: Math.floor(Math.random() * 5000) + 1000,
      compressedSize: Math.floor(Math.random() * 2000) + 500,
      compressionRatio: "60%",
      compressedAt: new Date().toISOString(),
    };
  }

  // Convert file
  static async convertFile(fileUrl, targetFormat, job) {
    await this.simulateProcessing(2500);
    job.progress(60);

    return {
      operation: "convert",
      originalUrl: fileUrl,
      convertedUrl: fileUrl.replace(/\.[^.]+$/, `.${targetFormat}`),
      targetFormat,
      convertedAt: new Date().toISOString(),
    };
  }

  // Simulate processing delay
  static simulateProcessing(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

module.exports = FileProcessingWorker;
