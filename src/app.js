const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use(`/api/${process.env.API_VERSION}`, limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger.config");

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Swagger API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Workspace API Docs",
  })
);

// Swagger JSON
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// API Routes
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const workspaceRoutes = require("./routes/workspace.routes");
const jobRoutes = require("./routes/job.routes");
const AuthMiddleware = require("./middleware/auth.middleware");

// Auth routes (public + protected)
app.use(`/api/${process.env.API_VERSION}/auth`, authRoutes);

// Protected routes with authentication
app.use(
  `/api/${process.env.API_VERSION}/workspaces`,
  AuthMiddleware.authenticate,
  workspaceRoutes
);
app.use(
  `/api/${process.env.API_VERSION}/projects`,
  AuthMiddleware.authenticate,
  projectRoutes
);
app.use(
  `/api/${process.env.API_VERSION}/jobs`,
  AuthMiddleware.authenticate,
  jobRoutes
);

// 404 handler - BEFORE error handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handling middleware - MUST be last
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
