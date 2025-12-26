const express = require("express");
const ProjectController = require("../controllers/project.controller");
const AuthMiddleware = require("../middleware/auth.middleware");
const { RBACMiddleware } = require("../middleware/rbac.middleware");
const {
  createProjectValidation,
  updateProjectValidation,
  projectIdValidation,
  inviteMemberValidation,
  updateMemberRoleValidation,
  validate,
} = require("../middleware/validators/project.validator");
const ActivityController = require("../controllers/activity.controller");

const router = express.Router();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post(
  "/",
  createProjectValidation,
  validate,
  ProjectController.createProject
);

/**
 * @route   GET /api/v1/projects
 * @desc    Get all projects for logged-in user
 * @access  Private
 */
router.get("/", ProjectController.getUserProjects);

/**
 * @route   GET /api/v1/projects/:projectId
 * @desc    Get single project by ID
 * @access  Private (must be project member)
 */
router.get(
  "/:projectId",
  projectIdValidation,
  validate,
  RBACMiddleware.canRead(),
  ProjectController.getProjectById
);

/**
 * @route   PUT /api/v1/projects/:projectId
 * @desc    Update project
 * @access  Private (owner or collaborator)
 */
router.put(
  "/:projectId",
  updateProjectValidation,
  validate,
  RBACMiddleware.canWrite(),
  ProjectController.updateProject
);

/**
 * @route   DELETE /api/v1/projects/:projectId
 * @desc    Delete project
 * @access  Private (owner only)
 */
router.delete(
  "/:projectId",
  projectIdValidation,
  validate,
  RBACMiddleware.isProjectOwner(),
  ProjectController.deleteProject
);

/**
 * @route   GET /api/v1/projects/:projectId/members
 * @desc    Get all members of a project
 * @access  Private (must be project member)
 */
router.get(
  "/:projectId/members",
  projectIdValidation,
  validate,
  RBACMiddleware.canRead(),
  ProjectController.getProjectMembers
);

/**
 * @route   POST /api/v1/projects/:projectId/members
 * @desc    Invite a member to project
 * @access  Private (owner only)
 */
router.post(
  "/:projectId/members",
  inviteMemberValidation,
  validate,
  RBACMiddleware.isProjectOwner(),
  ProjectController.inviteMember
);

/**
 * @route   PUT /api/v1/projects/:projectId/members/:memberId
 * @desc    Update member role
 * @access  Private (owner only)
 */
router.put(
  "/:projectId/members/:memberId",
  updateMemberRoleValidation,
  validate,
  RBACMiddleware.isProjectOwner(),
  ProjectController.updateMemberRole
);

/**
 * @route   DELETE /api/v1/projects/:projectId/members/:memberId
 * @desc    Remove member from project
 * @access  Private (owner only)
 */
router.delete(
  "/:projectId/members/:memberId",
  projectIdValidation,
  validate,
  RBACMiddleware.isProjectOwner(),
  ProjectController.removeMember
);

/**
 * @route   GET /api/v1/projects/:projectId/activities
 * @desc    Get project activities
 * @access  Private (must be project member)
 */
router.get(
  "/:projectId/activities",
  projectIdValidation,
  validate,
  RBACMiddleware.canRead(),
  ActivityController.getProjectActivities
);

module.exports = router;
