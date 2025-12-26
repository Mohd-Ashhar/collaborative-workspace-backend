// WebSocket event types
const WS_EVENTS = {
  // Connection events
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  ERROR: "error",

  // Room events
  JOIN_PROJECT: "join_project",
  LEAVE_PROJECT: "leave_project",

  // User presence events
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  USER_TYPING: "user_typing",
  USER_CURSOR_MOVE: "user_cursor_move",

  // File/Code events
  FILE_CHANGE: "file_change",
  FILE_CREATED: "file_created",
  FILE_DELETED: "file_deleted",
  CODE_UPDATE: "code_update",

  // Activity events
  ACTIVITY_UPDATE: "activity_update",
  NOTIFICATION: "notification",

  // Sync events
  REQUEST_SYNC: "request_sync",
  SYNC_STATE: "sync_state",
};

// Redis pub/sub channels
const REDIS_CHANNELS = {
  PROJECT_EVENTS: "project_events",
  USER_PRESENCE: "user_presence",
  NOTIFICATIONS: "notifications",
};

module.exports = { WS_EVENTS, REDIS_CHANNELS };
