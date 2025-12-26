const { Server } = require("socket.io");
const SocketMiddleware = require("../middleware/socket.middleware");
const { WS_EVENTS, REDIS_CHANNELS } = require("../utils/events.util");
const { getRedisPubSub } = require("./redis-pubsub.service");

class WebSocketService {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.redisPubSub = getRedisPubSub();
    this.activeUsers = new Map(); // Track active users per project

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupRedisSubscriptions();

    console.log("✅ WebSocket server initialized");
  }

  // Setup authentication middleware
  setupMiddleware() {
    this.io.use(SocketMiddleware.authenticate);
  }

  // Setup Redis subscriptions
  setupRedisSubscriptions() {
    // Subscribe to project events
    this.redisPubSub.subscribe(REDIS_CHANNELS.PROJECT_EVENTS, (event) => {
      this.handleRedisProjectEvent(event);
    });

    // Subscribe to user presence
    this.redisPubSub.subscribe(REDIS_CHANNELS.USER_PRESENCE, (event) => {
      this.handleRedisPresenceEvent(event);
    });
  }

  // Setup WebSocket event handlers
  setupEventHandlers() {
    this.io.on(WS_EVENTS.CONNECTION, (socket) => {
      console.log(`🔌 User connected: ${socket.user.name} (${socket.id})`);

      // Join project room
      socket.on(WS_EVENTS.JOIN_PROJECT, async (data) => {
        await this.handleJoinProject(socket, data);
      });

      // Leave project room
      socket.on(WS_EVENTS.LEAVE_PROJECT, async (data) => {
        await this.handleLeaveProject(socket, data);
      });

      // User typing event
      socket.on(WS_EVENTS.USER_TYPING, (data) => {
        this.handleUserTyping(socket, data);
      });

      // Cursor movement
      socket.on(WS_EVENTS.USER_CURSOR_MOVE, (data) => {
        this.handleCursorMove(socket, data);
      });

      // File change event
      socket.on(WS_EVENTS.FILE_CHANGE, (data) => {
        this.handleFileChange(socket, data);
      });

      // Code update event
      socket.on(WS_EVENTS.CODE_UPDATE, (data) => {
        this.handleCodeUpdate(socket, data);
      });

      // Activity update
      socket.on(WS_EVENTS.ACTIVITY_UPDATE, (data) => {
        this.handleActivityUpdate(socket, data);
      });

      // Request state sync
      socket.on(WS_EVENTS.REQUEST_SYNC, (data) => {
        this.handleRequestSync(socket, data);
      });

      // Disconnect
      socket.on(WS_EVENTS.DISCONNECT, () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // Handle user joining project
  async handleJoinProject(socket, data) {
    const { projectId } = data;

    // Verify project access
    const { hasAccess, role } = await SocketMiddleware.verifyProjectAccess(
      socket,
      projectId
    );

    if (!hasAccess) {
      socket.emit(WS_EVENTS.ERROR, {
        message: "Access denied to this project",
      });
      return;
    }

    const roomName = `project:${projectId}`;
    socket.join(roomName);
    socket.currentProject = projectId;
    socket.projectRole = role;

    // Track active user
    if (!this.activeUsers.has(projectId)) {
      this.activeUsers.set(projectId, new Set());
    }
    this.activeUsers.get(projectId).add(socket.user.id);

    // Broadcast user joined via Redis (for horizontal scaling)
    await this.redisPubSub.broadcastUserPresence(
      projectId,
      socket.user.id,
      "joined"
    );

    console.log(
      `👤 ${socket.user.name} joined project ${projectId} as ${role}`
    );
  }

  // Handle user leaving project
  async handleLeaveProject(socket, data) {
    const { projectId } = data;
    const roomName = `project:${projectId}`;

    socket.leave(roomName);

    // Remove from active users
    if (this.activeUsers.has(projectId)) {
      this.activeUsers.get(projectId).delete(socket.user.id);
    }

    // Broadcast user left
    await this.redisPubSub.broadcastUserPresence(
      projectId,
      socket.user.id,
      "left"
    );

    console.log(`👤 ${socket.user.name} left project ${projectId}`);
  }

  // Handle user typing
  handleUserTyping(socket, data) {
    const { projectId, fileName, isTyping } = data;

    if (socket.currentProject !== projectId) return;

    socket.to(`project:${projectId}`).emit(WS_EVENTS.USER_TYPING, {
      userId: socket.user.id,
      userName: socket.user.name,
      fileName,
      isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle cursor movement
  handleCursorMove(socket, data) {
    const { projectId, position, fileName } = data;

    if (socket.currentProject !== projectId) return;

    socket.to(`project:${projectId}`).emit(WS_EVENTS.USER_CURSOR_MOVE, {
      userId: socket.user.id,
      userName: socket.user.name,
      position,
      fileName,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle file change
  async handleFileChange(socket, data) {
    const { projectId, fileName, changeType, content } = data;

    if (socket.currentProject !== projectId) return;

    const event = {
      type: WS_EVENTS.FILE_CHANGE,
      userId: socket.user.id,
      userName: socket.user.name,
      fileName,
      changeType, // 'create', 'update', 'delete'
      content,
      timestamp: new Date().toISOString(),
    };

    // Broadcast via Redis
    await this.redisPubSub.broadcastProjectEvent(projectId, event);
  }

  // Handle code update
  async handleCodeUpdate(socket, data) {
    const { projectId, fileName, changes, version } = data;

    if (socket.currentProject !== projectId) return;

    const event = {
      type: WS_EVENTS.CODE_UPDATE,
      userId: socket.user.id,
      userName: socket.user.name,
      fileName,
      changes,
      version,
      timestamp: new Date().toISOString(),
    };

    await this.redisPubSub.broadcastProjectEvent(projectId, event);
  }

  // Handle activity update
  async handleActivityUpdate(socket, data) {
    const { projectId, activity } = data;

    if (socket.currentProject !== projectId) return;

    const event = {
      type: WS_EVENTS.ACTIVITY_UPDATE,
      userId: socket.user.id,
      userName: socket.user.name,
      activity,
      timestamp: new Date().toISOString(),
    };

    await this.redisPubSub.broadcastProjectEvent(projectId, event);
  }

  // Handle sync request
  handleRequestSync(socket, data) {
    const { projectId } = data;

    if (socket.currentProject !== projectId) return;

    // Get active users in project
    const activeUserIds = Array.from(this.activeUsers.get(projectId) || []);

    socket.emit(WS_EVENTS.SYNC_STATE, {
      activeUsers: activeUserIds,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle disconnect
  handleDisconnect(socket) {
    console.log(`🔌 User disconnected: ${socket.user.name} (${socket.id})`);

    if (socket.currentProject) {
      const projectId = socket.currentProject;

      // Remove from active users
      if (this.activeUsers.has(projectId)) {
        this.activeUsers.get(projectId).delete(socket.user.id);
      }

      // Broadcast user left
      this.redisPubSub.broadcastUserPresence(projectId, socket.user.id, "left");
    }
  }

  // Handle Redis project events
  handleRedisProjectEvent(event) {
    const { projectId, type, ...eventData } = event;
    const roomName = `project:${projectId}`;

    // Broadcast to all clients in the room
    this.io.to(roomName).emit(type, eventData);
  }

  // Handle Redis presence events
  handleRedisPresenceEvent(event) {
    const { projectId, userId, status } = event;
    const roomName = `project:${projectId}`;

    if (status === "joined") {
      this.io.to(roomName).emit(WS_EVENTS.USER_JOINED, {
        userId,
        timestamp: event.timestamp,
      });
    } else if (status === "left") {
      this.io.to(roomName).emit(WS_EVENTS.USER_LEFT, {
        userId,
        timestamp: event.timestamp,
      });
    }
  }

  // Get Socket.io instance
  getIO() {
    return this.io;
  }
}

module.exports = WebSocketService;
