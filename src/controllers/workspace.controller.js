const WorkspaceService = require("../services/workspace.service");
const ResponseUtil = require("../utils/response.util");

class WorkspaceController {
  // Create workspace
  static async createWorkspace(req, res) {
    try {
      const { projectId } = req.params;
      const { name } = req.body;

      const workspace = await WorkspaceService.createWorkspace(projectId, name);

      return ResponseUtil.created(
        res,
        { workspace },
        "Workspace created successfully"
      );
    } catch (error) {
      console.error("Create workspace error:", error);
      return ResponseUtil.error(res, "Failed to create workspace");
    }
  }

  // Get all workspaces for project
  static async getProjectWorkspaces(req, res) {
    try {
      const { projectId } = req.params;

      const workspaces = await WorkspaceService.getProjectWorkspaces(projectId);

      return ResponseUtil.success(
        res,
        { workspaces, count: workspaces.length },
        "Workspaces fetched successfully"
      );
    } catch (error) {
      console.error("Get workspaces error:", error);
      return ResponseUtil.error(res, "Failed to fetch workspaces");
    }
  }

  // Get single workspace
  static async getWorkspaceById(req, res) {
    try {
      const { projectId, workspaceId } = req.params;

      const workspace = await WorkspaceService.getWorkspaceById(
        workspaceId,
        projectId
      );

      return ResponseUtil.success(
        res,
        { workspace },
        "Workspace fetched successfully"
      );
    } catch (error) {
      console.error("Get workspace error:", error);

      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, "Workspace not found");
      }

      return ResponseUtil.error(res, "Failed to fetch workspace");
    }
  }

  // Update workspace
  static async updateWorkspace(req, res) {
    try {
      const { projectId, workspaceId } = req.params;
      const { name } = req.body;

      const workspace = await WorkspaceService.updateWorkspace(
        workspaceId,
        projectId,
        name
      );

      return ResponseUtil.success(
        res,
        { workspace },
        "Workspace updated successfully"
      );
    } catch (error) {
      console.error("Update workspace error:", error);

      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, "Workspace not found");
      }

      return ResponseUtil.error(res, "Failed to update workspace");
    }
  }

  // Delete workspace
  static async deleteWorkspace(req, res) {
    try {
      const { projectId, workspaceId } = req.params;

      await WorkspaceService.deleteWorkspace(workspaceId, projectId);

      return ResponseUtil.success(res, null, "Workspace deleted successfully");
    } catch (error) {
      console.error("Delete workspace error:", error);

      if (error.message.includes("not found")) {
        return ResponseUtil.notFound(res, "Workspace not found");
      }

      return ResponseUtil.error(res, "Failed to delete workspace");
    }
  }
}

module.exports = WorkspaceController;
