const JWTUtil = require("../utils/jwt.util");
const { pgPool } = require("../config/database");

class SocketMiddleware {
  // Authenticate socket connection
  static async authenticate(socket, next) {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = JWTUtil.verifyAccessToken(token);

      // Get user from database
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          "SELECT id, email, name FROM users WHERE id = $1",
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          return next(new Error("User not found"));
        }

        // Attach user to socket
        socket.user = {
          id: result.rows[0].id,
          email: result.rows[0].email,
          name: result.rows[0].name,
        };

        next();
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  }

  // Verify project access
  static async verifyProjectAccess(socket, projectId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT role FROM project_members 
         WHERE project_id = $1 AND user_id = $2`,
        [projectId, socket.user.id]
      );

      if (result.rows.length === 0) {
        return { hasAccess: false, role: null };
      }

      return { hasAccess: true, role: result.rows[0].role };
    } finally {
      client.release();
    }
  }
}

module.exports = SocketMiddleware;
