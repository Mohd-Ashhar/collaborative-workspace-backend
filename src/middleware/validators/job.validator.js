const { body, param, query, validationResult } = require("express-validator");
const ResponseUtil = require("../../utils/response.util");

const codeExecutionValidation = [
  body("projectId")
    .isInt({ min: 1 })
    .withMessage("Valid project ID is required"),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("Code is required")
    .isLength({ max: 10000 })
    .withMessage("Code must not exceed 10000 characters"),

  body("language")
    .isIn(["javascript", "python", "java", "cpp", "go", "rust"])
    .withMessage(
      "Invalid language. Supported: javascript, python, java, cpp, go, rust"
    ),
];

const fileProcessingValidation = [
  body("projectId")
    .isInt({ min: 1 })
    .withMessage("Valid project ID is required"),

  body("fileUrl")
    .trim()
    .notEmpty()
    .withMessage("File URL is required")
    .isURL()
    .withMessage("Invalid file URL"),

  body("operation")
    .isIn(["parse", "compress", "convert"])
    .withMessage("Invalid operation. Supported: parse, compress, convert"),

  body("targetFormat")
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage("Invalid target format"),
];

const dataExportValidation = [
  body("projectId")
    .isInt({ min: 1 })
    .withMessage("Valid project ID is required"),

  body("exportType")
    .isIn(["activities", "members", "workspaces", "all"])
    .withMessage(
      "Invalid export type. Supported: activities, members, workspaces, all"
    ),

  body("format")
    .isIn(["json", "csv", "xml"])
    .withMessage("Invalid format. Supported: json, csv, xml"),
];

const jobIdValidation = [
  param("jobId").isUUID().withMessage("Valid job ID (UUID) is required"),
];

const projectIdValidation = [
  param("projectId")
    .isInt({ min: 1 })
    .withMessage("Valid project ID is required"),
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
  codeExecutionValidation,
  fileProcessingValidation,
  dataExportValidation,
  jobIdValidation,
  projectIdValidation,
  validate,
};
