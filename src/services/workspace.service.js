const { pgPool } = require("../config/database");

class WorkspaceService {
  // Create workspace
  static async createWorkspace(projectId, name) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `INSERT INTO workspaces (name, project_id)
         VALUES ($1, $2)
         RETURNING id, name, project_id, created_at, updated_at`,
        [name, projectId]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Get all workspaces for a project
  static async getProjectWorkspaces(projectId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT id, name, project_id, created_at, updated_at
         FROM workspaces
         WHERE project_id = $1
         ORDER BY created_at DESC`,
        [projectId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get single workspace
  static async getWorkspaceById(workspaceId, projectId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT id, name, project_id, created_at, updated_at
         FROM workspaces
         WHERE id = $1 AND project_id = $2`,
        [workspaceId, projectId]
      );

      if (result.rows.length === 0) {
        throw new Error("Workspace not found");
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Update workspace
  static async updateWorkspace(workspaceId, projectId, name) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `UPDATE workspaces
         SET name = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND project_id = $3
         RETURNING id, name, project_id, created_at, updated_at`,
        [name, workspaceId, projectId]
      );

      if (result.rows.length === 0) {
        throw new Error("Workspace not found");
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Delete workspace
  static async deleteWorkspace(workspaceId, projectId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        "DELETE FROM workspaces WHERE id = $1 AND project_id = $2 RETURNING id",
        [workspaceId, projectId]
      );

      if (result.rows.length === 0) {
        throw new Error("Workspace not found");
      }

      return true;
    } finally {
      client.release();
    }
  }
}

module.exports = WorkspaceService;
