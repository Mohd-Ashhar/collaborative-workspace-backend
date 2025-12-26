const { body, param, validationResult } = require("express-validator");
const ResponseUtil = require("../../utils/response.util");

const createProjectValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ min: 3, max: 255 })
    .withMessage("Project name must be between 3 and 255 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
];

const updateProjectValidation = [
  param("projectId")
    .isInt({ min: 1 })
    .withMessage("Valid project ID is required"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage("Project name must be between 3 and 255 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),
];

const projectIdValidation = [
  param("projectId")
    .isInt({ min: 1 })
    .withMessage("Valid project ID is required"),
];

const inviteMemberValidation = [
  param("projectId")
    .isInt({ min: 1 })
    .withMessage("Valid project ID is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("role")
    .isIn(["collaborator", "viewer"])
    .withMessage("Role must be either collaborator or viewer"),
];

const updateMemberRoleValidation = [
  param("projectId")
    .isInt({ min: 1 })
    .withMessage("Valid project ID is required"),

  param("memberId")
    .isInt({ min: 1 })
    .withMessage("Valid member ID is required"),

  body("role")
    .isIn(["owner", "collaborator", "viewer"])
    .withMessage("Role must be owner, collaborator, or viewer"),
];

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
  createProjectValidation,
  updateProjectValidation,
  projectIdValidation,
  inviteMemberValidation,
  updateMemberRoleValidation,
  validate,
};
