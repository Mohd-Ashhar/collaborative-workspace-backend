const { pgPool } = require("../config/database");
const ResponseUtil = require("../utils/response.util");

// Role hierarchy: owner > collaborator > viewer
const ROLES = {
  OWNER: "owner",
  COLLABORATOR: "collaborator",
  VIEWER: "viewer",
};

// Permission levels
const PERMISSIONS = {
  [ROLES.OWNER]: ["read", "write", "delete", "manage_members"],
  [ROLES.COLLABORATOR]: ["read", "write"],
  [ROLES.VIEWER]: ["read"],
};

class RBACMiddleware {
  // Check if user has specific role in project
  static checkProjectRole(allowedRoles = []) {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const projectId = req.params.projectId || req.body.projectId;

        if (!projectId) {
          return ResponseUtil.badRequest(res, "Project ID is required");
        }

        const client = await pgPool.connect();
        try {
          // Check user's role in project
          const result = await client.query(
            `SELECT role FROM project_members 
             WHERE project_id = $1 AND user_id = $2`,
            [projectId, userId]
          );

          if (result.rows.length === 0) {
            return ResponseUtil.forbidden(
              res,
              "You do not have access to this project"
            );
          }

          const userRole = result.rows[0].role;

          // Check if user's role is in allowed roles
          if (!allowedRoles.includes(userRole)) {
            return ResponseUtil.forbidden(
              res,
              `This action requires one of these roles: ${allowedRoles.join(
                ", "
              )}`
            );
          }

          // Attach role to request for further use
          req.userRole = userRole;
          req.projectId = projectId;

          next();
        } finally {
          client.release();
        }
      } catch (error) {
        console.error("RBAC middleware error:", error);
        return ResponseUtil.error(res, "Authorization check failed");
      }
    };
  }

  // Check if user has specific permission
  static checkPermission(requiredPermission) {
    return async (req, res, next) => {
      try {
        const userId = req.user.id;
        const projectId = req.params.projectId || req.body.projectId;

        if (!projectId) {
          return ResponseUtil.badRequest(res, "Project ID is required");
        }

        const client = await pgPool.connect();
        try {
          const result = await client.query(
            `SELECT role FROM project_members 
             WHERE project_id = $1 AND user_id = $2`,
            [projectId, userId]
          );

          if (result.rows.length === 0) {
            return ResponseUtil.forbidden(
              res,
              "You do not have access to this project"
            );
          }

          const userRole = result.rows[0].role;
          const userPermissions = PERMISSIONS[userRole] || [];

          if (!userPermissions.includes(requiredPermission)) {
            return ResponseUtil.forbidden(
              res,
              `You do not have '${requiredPermission}' permission in this project`
            );
          }

          req.userRole = userRole;
          req.projectId = projectId;

          next();
        } finally {
          client.release();
        }
      } catch (error) {
        console.error("Permission check error:", error);
        return ResponseUtil.error(res, "Permission check failed");
      }
    };
  }

  // Check if user is project owner
  static isProjectOwner() {
    return this.checkProjectRole([ROLES.OWNER]);
  }

  // Check if user can write (owner or collaborator)
  static canWrite() {
    return this.checkProjectRole([ROLES.OWNER, ROLES.COLLABORATOR]);
  }

  // Check if user can read (any role)
  static canRead() {
    return this.checkProjectRole([
      ROLES.OWNER,
      ROLES.COLLABORATOR,
      ROLES.VIEWER,
    ]);
  }
}

module.exports = { RBACMiddleware, ROLES, PERMISSIONS };
