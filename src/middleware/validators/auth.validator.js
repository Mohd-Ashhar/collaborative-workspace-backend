const { body, validationResult } = require("express-validator");
const PasswordUtil = require("../../utils/password.util");
const ResponseUtil = require("../../utils/response.util");

// Validation rules
const registerValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .custom((value) => {
      const { isValid, errors } = PasswordUtil.validateStrength(value);
      if (!isValid) {
        throw new Error(errors.join(", "));
      }
      return true;
    }),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 255 })
    .withMessage("Name must be between 2 and 255 characters"),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return ResponseUtil.badRequest(res, "Validation failed", formattedErrors);
  }
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  validate,
};
