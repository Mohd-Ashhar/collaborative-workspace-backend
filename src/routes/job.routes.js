const express = require("express");
const JobController = require("../controllers/job.controller");
const AuthMiddleware = require("../middleware/auth.middleware");
const { RBACMiddleware } = require("../middleware/rbac.middleware");
const {
  codeExecutionValidation,
  fileProcessingValidation,
  dataExportValidation,
  jobIdValidation,
  projectIdValidation,
  validate,
} = require("../middleware/validators/job.validator");

const router = express.Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

/**
 * @route   POST /api/v1/jobs/code-execution
 * @desc    Submit code execution job
 * @access  Private
 */
router.post(
  "/code-execution",
  codeExecutionValidation,
  validate,
  JobController.submitCodeExecution
);

/**
 * @route   POST /api/v1/jobs/file-processing
 * @desc    Submit file processing job
 * @access  Private
 */
router.post(
  "/file-processing",
  fileProcessingValidation,
  validate,
  JobController.submitFileProcessing
);

/**
 * @route   POST /api/v1/jobs/data-export
 * @desc    Submit data export job
 * @access  Private
 */
router.post(
  "/data-export",
  dataExportValidation,
  validate,
  JobController.submitDataExport
);

/**
 * @route   GET /api/v1/jobs
 * @desc    Get current user's jobs
 * @access  Private
 */
router.get("/", JobController.getUserJobs);

/**
 * @route   GET /api/v1/jobs/stats
 * @desc    Get queue statistics
 * @access  Private
 */
router.get("/stats", JobController.getQueueStats);

/**
 * @route   GET /api/v1/jobs/:jobId
 * @desc    Get job status by ID
 * @access  Private (job owner only)
 */
router.get("/:jobId", jobIdValidation, validate, JobController.getJobStatus);

/**
 * @route   POST /api/v1/jobs/:jobId/retry
 * @desc    Retry failed job
 * @access  Private (job owner only)
 */
router.post("/:jobId/retry", jobIdValidation, validate, JobController.retryJob);

/**
 * @route   DELETE /api/v1/jobs/:jobId
 * @desc    Cancel/delete job
 * @access  Private (job owner only)
 */
router.delete("/:jobId", jobIdValidation, validate, JobController.cancelJob);

/**
 * @route   GET /api/v1/projects/:projectId/jobs
 * @desc    Get all jobs for a project
 * @access  Private (project member)
 */
router.get(
  "/projects/:projectId",
  projectIdValidation,
  validate,
  // Note: projectId is in params, not body, so we need to manually check
  async (req, res, next) => {
    req.body.projectId = req.params.projectId;
    next();
  },
  RBACMiddleware.canRead(),
  JobController.getProjectJobs
);

module.exports = router;
