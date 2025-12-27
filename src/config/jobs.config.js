// Job types
const JOB_TYPES = {
  CODE_EXECUTION: "code_execution",
  FILE_PROCESSING: "file_processing",
  DATA_EXPORT: "data_export",
  EMAIL_NOTIFICATION: "email_notification",
  CLEANUP: "cleanup",
};

// Job status
const JOB_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  RETRYING: "retrying",
};

// Job priorities
const JOB_PRIORITY = {
  LOW: 10,
  NORMAL: 5,
  HIGH: 1,
  CRITICAL: 0,
};

// Job configuration
const JOB_CONFIG = {
  // Maximum retry attempts
  MAX_RETRIES: 3,

  // Backoff strategy for retries (exponential)
  BACKOFF: {
    type: "exponential",
    delay: 2000, // 2 seconds base delay
  },

  // Job removal on completion (keep for history)
  REMOVE_ON_COMPLETE: false,
  REMOVE_ON_FAIL: false,

  // Job timeout (30 seconds)
  JOB_TIMEOUT: 30000,
};

module.exports = {
  JOB_TYPES,
  JOB_STATUS,
  JOB_PRIORITY,
  JOB_CONFIG,
};
