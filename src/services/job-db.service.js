const { pgPool } = require("../config/database");
const { JOB_STATUS } = require("../config/jobs.config");

class JobDBService {
  // Create job record in database
  static async createJob(jobData) {
    const client = await pgPool.connect();
    try {
      const { jobId, userId, projectId, type, payload, priority, maxRetries } =
        jobData;

      const result = await client.query(
        `INSERT INTO jobs (job_id, user_id, project_id, type, payload, priority, max_retries, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          jobId,
          userId,
          projectId,
          type,
          JSON.stringify(payload),
          priority,
          maxRetries,
          JOB_STATUS.PENDING,
        ]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Update job status
  static async updateJobStatus(jobId, status, updates = {}) {
    const client = await pgPool.connect();
    try {
      const fields = ["status = $2", "updated_at = CURRENT_TIMESTAMP"];
      const values = [jobId, status];
      let paramCount = 3;

      if (updates.result !== undefined) {
        fields.push(`result = $${paramCount++}`);
        values.push(JSON.stringify(updates.result));
      }

      if (updates.errorMessage !== undefined) {
        fields.push(`error_message = $${paramCount++}`);
        values.push(updates.errorMessage);
      }

      if (updates.retryCount !== undefined) {
        fields.push(`retry_count = $${paramCount++}`);
        values.push(updates.retryCount);
      }

      if (status === JOB_STATUS.PROCESSING && !updates.startedAt) {
        fields.push(`started_at = CURRENT_TIMESTAMP`);
      }

      if (status === JOB_STATUS.COMPLETED) {
        fields.push(`completed_at = CURRENT_TIMESTAMP`);
      }

      if (status === JOB_STATUS.FAILED) {
        fields.push(`failed_at = CURRENT_TIMESTAMP`);
      }

      const query = `
        UPDATE jobs
        SET ${fields.join(", ")}
        WHERE job_id = $1
        RETURNING *
      `;

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Get job by ID
  static async getJob(jobId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM jobs WHERE job_id = $1",
        [jobId]
      );

      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Get user's jobs
  static async getUserJobs(userId, filters = {}) {
    const client = await pgPool.connect();
    try {
      let query = "SELECT * FROM jobs WHERE user_id = $1";
      const values = [userId];
      let paramCount = 2;

      if (filters.status) {
        query += ` AND status = $${paramCount++}`;
        values.push(filters.status);
      }

      if (filters.type) {
        query += ` AND type = $${paramCount++}`;
        values.push(filters.type);
      }

      if (filters.projectId) {
        query += ` AND project_id = $${paramCount++}`;
        values.push(filters.projectId);
      }

      query += " ORDER BY created_at DESC LIMIT $" + paramCount++;
      values.push(filters.limit || 50);

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get project jobs
  static async getProjectJobs(projectId, limit = 50) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM jobs 
         WHERE project_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [projectId, limit]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Delete old jobs
  static async deleteOldJobs(daysOld = 30) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `DELETE FROM jobs 
         WHERE created_at < NOW() - INTERVAL '${daysOld} days'
         AND status IN ('completed', 'failed')
         RETURNING id`
      );

      return result.rowCount;
    } finally {
      client.release();
    }
  }
}

module.exports = JobDBService;
