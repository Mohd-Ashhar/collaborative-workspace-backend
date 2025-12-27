const io = require("socket.io-client");

// Replace with your actual access token
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsImVtYWlsIjoib3duZXJAdGVzdC5jb20iLCJpYXQiOjE3NjY4MTM5MTMsImV4cCI6MTc2NjgxNDgxMywiYXVkIjoid29ya3NwYWNlLWNsaWVudCIsImlzcyI6IndvcmtzcGFjZS1hcGkifQ.Zvy-pNzPsTYP2TAm4o0sRWDz5uVqr9aSPGL_rnHqPEQ";
const PROJECT_ID = 2;

const socket = io("http://localhost:3000", {
  auth: { token: TOKEN },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected to WebSocket");

  // Join project
  socket.emit("join_project", { projectId: PROJECT_ID });
  console.log(`📡 Joining project ${PROJECT_ID}`);
});

socket.on("user_joined", (data) => {
  console.log("👤 User joined:", data);
});

socket.on("user_left", (data) => {
  console.log("👋 User left:", data);
});

socket.on("user_typing", (data) => {
  console.log("⌨️  User typing:", data);
});

socket.on("user_cursor_move", (data) => {
  console.log("🖱️  Cursor moved:", data);
});

socket.on("file_change", (data) => {
  console.log("📝 File changed:", data);
});

socket.on("code_update", (data) => {
  console.log("💻 Code updated:", data);
});

socket.on("activity_update", (data) => {
  console.log("📊 Activity:", data);
});

socket.on("error", (error) => {
  console.error("❌ Error:", error);
});

socket.on("disconnect", () => {
  console.log("🔌 Disconnected");
});

// Send test events after 2 seconds
setTimeout(() => {
  console.log("\n📤 Sending test events...\n");

  // Send typing event
  socket.emit("user_typing", {
    projectId: PROJECT_ID,
    fileName: "test.js",
    isTyping: true,
  });

  // Send file change
  setTimeout(() => {
    socket.emit("file_change", {
      projectId: PROJECT_ID,
      fileName: "app.js",
      changeType: "update",
      content: 'console.log("WebSocket test");',
    });
  }, 1000);

  // Send code update
  setTimeout(() => {
    socket.emit("code_update", {
      projectId: PROJECT_ID,
      fileName: "index.js",
      changes: [{ line: 10, text: "new code here" }],
      version: Date.now(),
    });
  }, 2000);
}, 2000);

// Keep alive for 30 seconds
setTimeout(() => {
  console.log("\n⏹️  Test complete, disconnecting...");
  socket.disconnect();
  process.exit(0);
}, 30000);
