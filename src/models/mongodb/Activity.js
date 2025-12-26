const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    projectId: {
      type: Number,
      required: true,
      index: true,
    },
    userId: {
      type: Number,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "file_change",
        "code_update",
        "user_joined",
        "user_left",
        "activity_update",
      ],
    },
    fileName: String,
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
activitySchema.index({ projectId: 1, timestamp: -1 });

module.exports = mongoose.model("Activity", activitySchema);
