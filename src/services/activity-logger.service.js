const Activity = require("../models/mongodb/Activity");

class ActivityLoggerService {
  // Log activity to MongoDB
  static async logActivity(
    projectId,
    userId,
    userName,
    eventType,
    details = {}
  ) {
    try {
      const activity = new Activity({
        projectId,
        userId,
        userName,
        eventType,
        fileName: details.fileName,
        description: details.description,
        metadata: details.metadata,
      });

      await activity.save();
      return activity;
    } catch (error) {
      console.error("Activity logging error:", error);
    }
  }

  // Get project activities
  static async getProjectActivities(projectId, limit = 50) {
    try {
      const activities = await Activity.find({ projectId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return activities;
    } catch (error) {
      console.error("Get activities error:", error);
      return [];
    }
  }

  // Get user activities in project
  static async getUserActivities(projectId, userId, limit = 50) {
    try {
      const activities = await Activity.find({ projectId, userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return activities;
    } catch (error) {
      console.error("Get user activities error:", error);
      return [];
    }
  }

  // Clear old activities (for cleanup)
  static async clearOldActivities(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Activity.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      console.log(`🗑️ Deleted ${result.deletedCount} old activities`);
      return result.deletedCount;
    } catch (error) {
      console.error("Clear activities error:", error);
      return 0;
    }
  }
}

module.exports = ActivityLoggerService;
