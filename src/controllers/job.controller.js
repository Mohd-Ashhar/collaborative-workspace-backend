const { v4: uuidv4 } = require("uuid");
const { getQueueService } = require("../services/queue.service");
const JobDBService = require("../services/job-db.service");
const { JOB_TYPES, JOB_PRIORITY } = require("../config/jobs.config");
const ResponseUtil = require("../utils/response.util");

class JobController {
  // Submit code execution job
  static async submitCodeExecution(req, res) {
    try {
      const userId = req.user.id;
      const { projectId, code, language } = req.body;

      // Generate unique job ID for idempotency
      const jobId = uuidv4();

      const payload = {
        jobId,
        userId,
        projectId,
        code,
        language,
      };

      // Add to queue
      const queueService = getQueueService();
      await queueService.addJob(JOB_TYPES.CODE_EXECUTION, payload, {
        jobId,
        priority: JOB_PRIORITY.NORMAL,
      });

      // Save to database
      await JobDBService.createJob({
        jobId,
        userId,
        projectId,
        type: JOB_TYPES.CODE_EXECUTION,
        payload,
        priority: JOB_PRIORITY.NORMAL,
        maxRetries: 3,
      });

      return ResponseUtil.created(
        res,
        {
          jobId,
          status: "pending",
          message: "Code execution job submitted successfully",
        },
        "Job submitted"
      );
    } catch (error) {
      console.error("Submit code execution error:", error);
      return ResponseUtil.error(res, "Failed to submit job");
    }
  }

  // Submit file processing job
  static async submitFileProcessing(req, res) {
    try {
      const userId = req.user.id;
      const { projectId, fileUrl, operation, targetFormat } = req.body;

      const jobId = uuidv4();

      const payload = {
        jobId,
        userId,
        projectId,
        fileUrl,
        operation,
        targetFormat,
      };

      const queueService = getQueueService();
      await queueService.addJob(JOB_TYPES.FILE_PROCESSING, payload, {
        jobId,
        priority: JOB_PRIORITY.NORMAL,
      });

      await JobDBService.createJob({
        jobId,
        userId,
        projectId,
        type: JOB_TYPES.FILE_PROCESSING,
        payload,
        priority: JOB_PRIORITY.NORMAL,
        maxRetries: 3,
      });

      return ResponseUtil.created(
        res,
        {
          jobId,
          status: "pending",
          message: "File processing job submitted successfully",
        },
        "Job submitted"
      );
    } catch (error) {
      console.error("Submit file processing error:", error);
      return ResponseUtil.error(res, "Failed to submit job");
    }
  }

  // Submit data export job
  static async submitDataExport(req, res) {
    try {
      const userId = req.user.id;
      const { projectId, exportType, format } = req.body;

      const jobId = uuidv4();

      const payload = {
        jobId,
        userId,
        projectId,
        exportType,
        format,
      };

      const queueService = getQueueService();
      await queueService.addJob(JOB_TYPES.DATA_EXPORT, payload, {
        jobId,
        priority: JOB_PRIORITY.HIGH,
      });

      await JobDBService.createJob({
        jobId,
        userId,
        projectId,
        type: JOB_TYPES.DATA_EXPORT,
        payload,
        priority: JOB_PRIORITY.HIGH,
        maxRetries: 3,
      });

      return ResponseUtil.created(
        res,
        {
          jobId,
          status: "pending",
          message: "Data export job submitted successfully",
        },
        "Job submitted"
      );
    } catch (error) {
      console.error("Submit data export error:", error);
      return ResponseUtil.error(res, "Failed to submit job");
    }
  }

  // Get job status
  static async getJobStatus(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      // Get from database
      const dbJob = await JobDBService.getJob(jobId);

      if (!dbJob) {
        return ResponseUtil.notFound(res, "Job not found");
      }

      // Verify ownership
      if (dbJob.user_id !== userId) {
        return ResponseUtil.forbidden(res, "Access denied to this job");
      }

      // Get real-time status from queue
      const queueService = getQueueService();
      const queueJob = await queueService.getJobStatus(dbJob.type, jobId);

      const status = {
        jobId: dbJob.job_id,
        type: dbJob.type,
        status: queueJob?.status || dbJob.status,
        progress: queueJob?.progress || 0,
        result: dbJob.result,
        errorMessage: dbJob.error_message,
        retryCount: dbJob.retry_count,
        createdAt: dbJob.created_at,
        startedAt: dbJob.started_at,
        completedAt: dbJob.completed_at,
        failedAt: dbJob.failed_at,
      };

      return ResponseUtil.success(res, { job: status }, "Job status fetched");
    } catch (error) {
      console.error("Get job status error:", error);
      return ResponseUtil.error(res, "Failed to get job status");
    }
  }

  // Get user's jobs
  static async getUserJobs(req, res) {
    try {
      const userId = req.user.id;
      const { status, type, projectId, limit } = req.query;

      const jobs = await JobDBService.getUserJobs(userId, {
        status,
        type,
        projectId: projectId ? parseInt(projectId) : undefined,
        limit: limit ? parseInt(limit) : 50,
      });

      return ResponseUtil.success(
        res,
        { jobs, count: jobs.length },
        "Jobs fetched successfully"
      );
    } catch (error) {
      console.error("Get user jobs error:", error);
      return ResponseUtil.error(res, "Failed to fetch jobs");
    }
  }

  // Get project jobs
  static async getProjectJobs(req, res) {
    try {
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const jobs = await JobDBService.getProjectJobs(projectId, limit);

      return ResponseUtil.success(
        res,
        { jobs, count: jobs.length },
        "Project jobs fetched successfully"
      );
    } catch (error) {
      console.error("Get project jobs error:", error);
      return ResponseUtil.error(res, "Failed to fetch project jobs");
    }
  }

  // Retry failed job
  static async retryJob(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const job = await JobDBService.getJob(jobId);

      if (!job) {
        return ResponseUtil.notFound(res, "Job not found");
      }

      if (job.user_id !== userId) {
        return ResponseUtil.forbidden(res, "Access denied to this job");
      }

      if (job.status !== "failed") {
        return ResponseUtil.badRequest(res, "Only failed jobs can be retried");
      }

      // Retry in queue
      const queueService = getQueueService();
      await queueService.retryJob(job.type, jobId);

      return ResponseUtil.success(res, { jobId }, "Job retry initiated");
    } catch (error) {
      console.error("Retry job error:", error);
      return ResponseUtil.error(res, "Failed to retry job");
    }
  }

  // Cancel/delete job
  static async cancelJob(req, res) {
    try {
      const { jobId } = req.params;
      const userId = req.user.id;

      const job = await JobDBService.getJob(jobId);

      if (!job) {
        return ResponseUtil.notFound(res, "Job not found");
      }

      if (job.user_id !== userId) {
        return ResponseUtil.forbidden(res, "Access denied to this job");
      }

      // Remove from queue
      const queueService = getQueueService();
      await queueService.removeJob(job.type, jobId);

      // Update status in database
      await JobDBService.updateJobStatus(jobId, "cancelled");

      return ResponseUtil.success(res, null, "Job cancelled successfully");
    } catch (error) {
      console.error("Cancel job error:", error);
      return ResponseUtil.error(res, "Failed to cancel job");
    }
  }

  // Get queue statistics
  static async getQueueStats(req, res) {
    try {
      const queueService = getQueueService();
      const stats = {};

      for (const jobType of Object.values(JOB_TYPES)) {
        stats[jobType] = await queueService.getQueueStats(jobType);
      }

      return ResponseUtil.success(
        res,
        { stats },
        "Queue stats fetched successfully"
      );
    } catch (error) {
      console.error("Get queue stats error:", error);
      return ResponseUtil.error(res, "Failed to fetch queue stats");
    }
  }
}

module.exports = JobController;
