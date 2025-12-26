const JWTUtil = require("../utils/jwt.util");
const ResponseUtil = require("../utils/response.util");
const { pgPool } = require("../config/database");

class AuthMiddleware {
  // Verify JWT token and attach user to request
  static async authenticate(req, res, next) {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return ResponseUtil.unauthorized(res, "No token provided");
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const decoded = JWTUtil.verifyAccessToken(token);

      // Get user from database
      const client = await pgPool.connect();
      try {
        const result = await client.query(
          "SELECT id, email, name, created_at FROM users WHERE id = $1",
          [decoded.userId]
        );

        if (result.rows.length === 0) {
          return ResponseUtil.unauthorized(res, "User not found");
        }

        // Attach user to request
        req.user = {
          id: result.rows[0].id,
          email: result.rows[0].email,
          name: result.rows[0].name,
          createdAt: result.rows[0].created_at,
        };

        next();
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Authentication error:", error);

      if (
        error.message.includes("Invalid") ||
        error.message.includes("expired")
      ) {
        return ResponseUtil.unauthorized(res, error.message);
      }

      return ResponseUtil.unauthorized(res, "Authentication failed");
    }
  }

  // Optional authentication (doesn't fail if no token)
  static async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
      }

      const token = authHeader.substring(7);
      const decoded = JWTUtil.verifyAccessToken(token);

      const client = await pgPool.connect();
      try {
        const result = await client.query(
          "SELECT id, email, name, created_at FROM users WHERE id = $1",
          [decoded.userId]
        );

        if (result.rows.length > 0) {
          req.user = {
            id: result.rows[0].id,
            email: result.rows[0].email,
            name: result.rows[0].name,
            createdAt: result.rows[0].created_at,
          };
        }
      } finally {
        client.release();
      }

      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  }
}

module.exports = AuthMiddleware;
