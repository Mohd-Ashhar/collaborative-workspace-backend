const ProjectService = require("../services/project.service");
const ResponseUtil = require("../utils/response.util");

class ProjectController {
  // Create new project
  static async createProject(req, res) {
    try {
      const userId = req.user.id;
      const { name, description } = req.body;

      const project = await ProjectService.createProject(
        userId,
        name,
        description
      );

      return ResponseUtil.created(
        res,
        { project },
        "Project created successfully"
      );
    } catch (error) {
      console.error("Create project error:", error);
      return ResponseUtil.error(res, "Failed to create project");
    }
  }

  // Get all user's projects
  static async getUserProjects(req, res) {
    try {
      const userId = req.user.id;

      const projects = await ProjectService.getUserProjects(userId);

      return ResponseUtil.success(
        res,
        { projects, count: projects.length },
        "Projects fetched successfully"
      );
    } catch (error) {
      console.error("Get projects error:", error);
      return ResponseUtil.error(res, "Failed to fetch projects");
    }
  }

  // Get single project by ID
  static async getProjectById(req, res) {
    try {
      const userId = req.user.id;
      const { projectId } = req.params;

      const project = await ProjectService.getProjectById(projectId, userId);

      return ResponseUtil.success(
        res,
        { project },
        "Project fetched successfully"
      );
    } catch (error) {
      console.error("Get project error:", error);

      if (
        error.message.includes("not found") ||
        error.message.includes("access denied")
      ) {
        return ResponseUtil.notFound(res, error.message);
      }

      return ResponseUtil.error(res, "Failed to fetch project");
    }
  }

  // Update project
  static async updateProject(req, res) {
    try {
      const { projectId } = req.params;
      const { name, description } = req.body;

      const project = await ProjectService.updateProject(projectId, {
        name,
        description,
      });

      return ResponseUtil.success(
        res,
        { project },
        "Project updated successfully"
      );
    } catch (error) {
      console.error("Update project error:", error);

      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, "Project not found");
      }

      if (error.message.includes("No fields")) {
        return ResponseUtil.badRequest(res, "No fields to update");
      }

      return ResponseUtil.error(res, "Failed to update project");
    }
  }

  // Delete project
  static async deleteProject(req, res) {
    try {
      const { projectId } = req.params;

      await ProjectService.deleteProject(projectId);

      return ResponseUtil.success(res, null, "Project deleted successfully");
    } catch (error) {
      console.error("Delete project error:", error);

      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, "Project not found");
      }

      return ResponseUtil.error(res, "Failed to delete project");
    }
  }

  // Get project members
  static async getProjectMembers(req, res) {
    try {
      const { projectId } = req.params;

      const members = await ProjectService.getProjectMembers(projectId);

      return ResponseUtil.success(
        res,
        { members, count: members.length },
        "Members fetched successfully"
      );
    } catch (error) {
      console.error("Get members error:", error);
      return ResponseUtil.error(res, "Failed to fetch members");
    }
  }

  // Invite member to project
  static async inviteMember(req, res) {
    try {
      const { projectId } = req.params;
      const { email, role } = req.body;

      const member = await ProjectService.inviteMember(projectId, email, role);

      return ResponseUtil.created(
        res,
        { member },
        "Member invited successfully"
      );
    } catch (error) {
      console.error("Invite member error:", error);

      if (error.message.includes("does not exist")) {
        return ResponseUtil.notFound(res, error.message);
      }

      if (error.message.includes("already a member")) {
        return ResponseUtil.badRequest(res, error.message);
      }

      return ResponseUtil.error(res, "Failed to invite member");
    }
  }

  // Update member role
  static async updateMemberRole(req, res) {
    try {
      const { projectId, memberId } = req.params;
      const { role } = req.body;

      const member = await ProjectService.updateMemberRole(
        projectId,
        memberId,
        role
      );

      return ResponseUtil.success(
        res,
        { member },
        "Member role updated successfully"
      );
    } catch (error) {
      console.error("Update role error:", error);

      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, error.message);
      }

      return ResponseUtil.error(res, "Failed to update member role");
    }
  }

  // Remove member from project
  static async removeMember(req, res) {
    try {
      const { projectId, memberId } = req.params;

      await ProjectService.removeMember(projectId, memberId);

      return ResponseUtil.success(res, null, "Member removed successfully");
    } catch (error) {
      console.error("Remove member error:", error);

      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, error.message);
      }

      if (error.message.includes("Cannot remove")) {
        return ResponseUtil.badRequest(res, error.message);
      }

      return ResponseUtil.error(res, "Failed to remove member");
    }
  }
}

module.exports = ProjectController;
