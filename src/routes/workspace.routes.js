const express = require("express");
const WorkspaceController = require("../controllers/workspace.controller");
const { RBACMiddleware } = require("../middleware/rbac.middleware");
const { body, param } = require("express-validator");
const { validate } = require("../middleware/validators/project.validator");

const router = express.Router({ mergeParams: true }); // mergeParams to access :projectId

/**
 * @route   POST /api/v1/projects/:projectId/workspaces
 * @desc    Create workspace in project
 * @access  Private (owner or collaborator)
 */
router.post(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Workspace name is required")
      .isLength({ min: 3, max: 255 })
      .withMessage("Workspace name must be between 3 and 255 characters"),
  ],
  validate,
  RBACMiddleware.canWrite(),
  WorkspaceController.createWorkspace
);

/**
 * @route   GET /api/v1/projects/:projectId/workspaces
 * @desc    Get all workspaces for project
 * @access  Private (any project member)
 */
router.get(
  "/",
  RBACMiddleware.canRead(),
  WorkspaceController.getProjectWorkspaces
);

/**
 * @route   GET /api/v1/projects/:projectId/workspaces/:workspaceId
 * @desc    Get single workspace
 * @access  Private (any project member)
 */
router.get(
  "/:workspaceId",
  [
    param("workspaceId")
      .isInt({ min: 1 })
      .withMessage("Valid workspace ID is required"),
  ],
  validate,
  RBACMiddleware.canRead(),
  WorkspaceController.getWorkspaceById
);

/**
 * @route   PUT /api/v1/projects/:projectId/workspaces/:workspaceId
 * @desc    Update workspace
 * @access  Private (owner or collaborator)
 */
router.put(
  "/:workspaceId",
  [
    param("workspaceId")
      .isInt({ min: 1 })
      .withMessage("Valid workspace ID is required"),
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Workspace name is required")
      .isLength({ min: 3, max: 255 })
      .withMessage("Workspace name must be between 3 and 255 characters"),
  ],
  validate,
  RBACMiddleware.canWrite(),
  WorkspaceController.updateWorkspace
);

/**
 * @route   DELETE /api/v1/projects/:projectId/workspaces/:workspaceId
 * @desc    Delete workspace
 * @access  Private (owner only)
 */
router.delete(
  "/:workspaceId",
  [
    param("workspaceId")
      .isInt({ min: 1 })
      .withMessage("Valid workspace ID is required"),
  ],
  validate,
  RBACMiddleware.isProjectOwner(),
  WorkspaceController.deleteWorkspace
);

module.exports = router;
