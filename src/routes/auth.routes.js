const express = require("express");
const AuthController = require("../controllers/auth.controller");
const AuthMiddleware = require("../middleware/auth.middleware");
const {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  validate,
} = require("../middleware/validators/auth.validator");

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", registerValidation, validate, AuthController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", loginValidation, validate, AuthController.login);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  "/refresh",
  refreshTokenValidation,
  validate,
  AuthController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Public
 */
router.post("/logout", refreshTokenValidation, validate, AuthController.logout);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", AuthMiddleware.authenticate, AuthController.getProfile);

module.exports = router;
