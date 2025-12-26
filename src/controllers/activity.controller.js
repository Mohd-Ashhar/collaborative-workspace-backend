const ActivityLoggerService = require("../services/activity-logger.service");
const ResponseUtil = require("../utils/response.util");

class ActivityController {
  // Get project activities
  static async getProjectActivities(req, res) {
    try {
      const { projectId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const activities = await ActivityLoggerService.getProjectActivities(
        projectId,
        limit
      );

      return ResponseUtil.success(
        res,
        { activities, count: activities.length },
        "Activities fetched successfully"
      );
    } catch (error) {
      console.error("Get activities error:", error);
      return ResponseUtil.error(res, "Failed to fetch activities");
    }
  }
}

module.exports = ActivityController;
