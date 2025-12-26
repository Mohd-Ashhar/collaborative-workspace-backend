const { pgPool } = require("../config/database");
const PasswordUtil = require("../utils/password.util");
const JWTUtil = require("../utils/jwt.util");

class AuthService {
  // Register new user
  static async register(email, password, name) {
    const client = await pgPool.connect();
    try {
      // Check if user already exists
      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const passwordHash = await PasswordUtil.hash(password);

      // Insert user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, name) 
         VALUES ($1, $2, $3) 
         RETURNING id, email, name, created_at`,
        [email, passwordHash, name]
      );

      const user = result.rows[0];

      // Generate tokens
      const { accessToken, refreshToken, jti } = JWTUtil.generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      // Store refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await client.query(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.id, jti, expiresAt]
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } finally {
      client.release();
    }
  }

  // Login user
  static async login(email, password) {
    const client = await pgPool.connect();
    try {
      // Find user
      const result = await client.query(
        "SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error("Invalid email or password");
      }

      const user = result.rows[0];

      // Verify password
      const isPasswordValid = await PasswordUtil.compare(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      // Generate tokens
      const { accessToken, refreshToken, jti } = JWTUtil.generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      // Store refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await client.query(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.id, jti, expiresAt]
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } finally {
      client.release();
    }
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken) {
    const client = await pgPool.connect();
    try {
      // Verify refresh token
      const decoded = JWTUtil.verifyRefreshToken(refreshToken);

      // Check if token exists and not expired in database
      const tokenResult = await client.query(
        "SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1",
        [decoded.jti]
      );

      if (tokenResult.rows.length === 0) {
        throw new Error("Invalid refresh token");
      }

      const tokenData = tokenResult.rows[0];

      if (new Date() > new Date(tokenData.expires_at)) {
        // Clean up expired token
        await client.query("DELETE FROM refresh_tokens WHERE token = $1", [
          decoded.jti,
        ]);
        throw new Error("Refresh token expired");
      }

      // Get user data
      const userResult = await client.query(
        "SELECT id, email, name FROM users WHERE id = $1",
        [tokenData.user_id]
      );

      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      }

      const user = userResult.rows[0];

      // Token Rotation: Delete old refresh token
      await client.query("DELETE FROM refresh_tokens WHERE token = $1", [
        decoded.jti,
      ]);

      // Generate new token pair
      const {
        accessToken,
        refreshToken: newRefreshToken,
        jti,
      } = JWTUtil.generateTokenPair({
        userId: user.id,
        email: user.email,
      });

      // Store new refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await client.query(
        "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
        [user.id, jti, expiresAt]
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } finally {
      client.release();
    }
  }

  // Logout user (invalidate refresh token)
  static async logout(refreshToken) {
    const client = await pgPool.connect();
    try {
      const decoded = JWTUtil.verifyRefreshToken(refreshToken);

      // Delete refresh token
      await client.query("DELETE FROM refresh_tokens WHERE token = $1", [
        decoded.jti,
      ]);

      return true;
    } catch (error) {
      // Even if token is invalid, consider logout successful
      return true;
    } finally {
      client.release();
    }
  }
}

module.exports = AuthService;
