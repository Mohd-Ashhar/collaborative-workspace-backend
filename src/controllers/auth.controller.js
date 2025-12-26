const AuthService = require("../services/auth.service");
const ResponseUtil = require("../utils/response.util");

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { email, password, name } = req.body;

      const result = await AuthService.register(email, password, name);

      return ResponseUtil.created(res, result, "User registered successfully");
    } catch (error) {
      console.error("Register error:", error);

      if (error.message.includes("already exists")) {
        return ResponseUtil.badRequest(res, error.message);
      }

      return ResponseUtil.error(res, "Registration failed. Please try again.");
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);

      return ResponseUtil.success(res, result, "Login successful");
    } catch (error) {
      console.error("Login error:", error);

      if (error.message.includes("Invalid email or password")) {
        return ResponseUtil.unauthorized(res, "Invalid email or password");
      }

      return ResponseUtil.error(res, "Login failed. Please try again.");
    }
  }

  // Refresh access token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      const tokens = await AuthService.refreshAccessToken(refreshToken);

      return ResponseUtil.success(res, tokens, "Token refreshed successfully");
    } catch (error) {
      console.error("Refresh token error:", error);

      if (
        error.message.includes("Invalid") ||
        error.message.includes("expired")
      ) {
        return ResponseUtil.unauthorized(res, error.message);
      }

      return ResponseUtil.error(res, "Token refresh failed");
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      await AuthService.logout(refreshToken);

      return ResponseUtil.success(res, null, "Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
      return ResponseUtil.success(res, null, "Logout successful");
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      // User data is attached by auth middleware
      const user = req.user;

      return ResponseUtil.success(
        res,
        { user },
        "Profile fetched successfully"
      );
    } catch (error) {
      console.error("Get profile error:", error);
      return ResponseUtil.error(res, "Failed to fetch profile");
    }
  }
}

module.exports = AuthController;
