const { pgPool } = require("../config/database");
const { ROLES } = require("../middleware/rbac.middleware");

class ProjectService {
  // Create new project
  static async createProject(userId, name, description = "") {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");

      // Create project
      const projectResult = await client.query(
        `INSERT INTO projects (name, description, owner_id) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, description, owner_id, created_at, updated_at`,
        [name, description, userId]
      );

      const project = projectResult.rows[0];

      // Add creator as owner in project_members
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role) 
         VALUES ($1, $2, $3)`,
        [project.id, userId, ROLES.OWNER]
      );

      await client.query("COMMIT");

      return project;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Get all projects for a user
  static async getUserProjects(userId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at,
                pm.role as user_role,
                u.name as owner_name, u.email as owner_email
         FROM projects p
         JOIN project_members pm ON p.id = pm.project_id
         JOIN users u ON p.owner_id = u.id
         WHERE pm.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get single project by ID
  static async getProjectById(projectId, userId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT p.id, p.name, p.description, p.owner_id, p.created_at, p.updated_at,
                pm.role as user_role,
                u.name as owner_name, u.email as owner_email
         FROM projects p
         JOIN project_members pm ON p.id = pm.project_id
         JOIN users u ON p.owner_id = u.id
         WHERE p.id = $1 AND pm.user_id = $2`,
        [projectId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Project not found or access denied");
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Update project
  static async updateProject(projectId, updates) {
    const client = await pgPool.connect();
    try {
      const { name, description } = updates;
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(name);
      }

      if (description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(description);
      }

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(projectId);

      const query = `
        UPDATE projects 
        SET ${fields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING id, name, description, owner_id, created_at, updated_at
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error("Project not found");
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Delete project
  static async deleteProject(projectId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        "DELETE FROM projects WHERE id = $1 RETURNING id",
        [projectId]
      );

      if (result.rows.length === 0) {
        throw new Error("Project not found");
      }

      return true;
    } finally {
      client.release();
    }
  }

  // Get project members
  static async getProjectMembers(projectId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT pm.id, pm.role, pm.created_at,
                u.id as user_id, u.name, u.email
         FROM project_members pm
         JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = $1
         ORDER BY pm.created_at ASC`,
        [projectId]
      );

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Invite member to project
  static async inviteMember(projectId, email, role) {
    const client = await pgPool.connect();
    try {
      // Find user by email
      const userResult = await client.query(
        "SELECT id, name, email FROM users WHERE email = $1",
        [email]
      );

      if (userResult.rows.length === 0) {
        throw new Error("User with this email does not exist");
      }

      const user = userResult.rows[0];

      // Check if user is already a member
      const memberCheck = await client.query(
        "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
        [projectId, user.id]
      );

      if (memberCheck.rows.length > 0) {
        throw new Error("User is already a member of this project");
      }

      // Add member
      const result = await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)
         RETURNING id, project_id, user_id, role, created_at`,
        [projectId, user.id, role]
      );

      return {
        ...result.rows[0],
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } finally {
      client.release();
    }
  }

  // Update member role
  static async updateMemberRole(projectId, memberId, newRole) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `UPDATE project_members 
         SET role = $1 
         WHERE id = $2 AND project_id = $3
         RETURNING id, project_id, user_id, role, created_at`,
        [newRole, memberId, projectId]
      );

      if (result.rows.length === 0) {
        throw new Error("Member not found in this project");
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Remove member from project
  static async removeMember(projectId, memberId) {
    const client = await pgPool.connect();
    try {
      // Don't allow removing the owner
      const memberCheck = await client.query(
        `SELECT pm.role, p.owner_id, pm.user_id
         FROM project_members pm
         JOIN projects p ON pm.project_id = p.id
         WHERE pm.id = $1 AND pm.project_id = $2`,
        [memberId, projectId]
      );

      if (memberCheck.rows.length === 0) {
        throw new Error("Member not found");
      }

      if (memberCheck.rows[0].role === ROLES.OWNER) {
        throw new Error("Cannot remove project owner");
      }

      const result = await client.query(
        "DELETE FROM project_members WHERE id = $1 AND project_id = $2 RETURNING id",
        [memberId, projectId]
      );

      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }
}

module.exports = ProjectService;
