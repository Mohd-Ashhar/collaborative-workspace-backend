const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Collaborative Workspace API",
      version: "1.0.0",
      description:
        "A real-time collaborative workspace backend with WebSocket support, async job processing, and RBAC",
      contact: {
        name: "API Support",
        email: "support@workspace.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.workspace.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            name: { type: "string", example: "John Doe" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "My Project" },
            description: { type: "string", example: "Project description" },
            owner_id: { type: "integer", example: 1 },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Workspace: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Development" },
            project_id: { type: "integer", example: 1 },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Job: {
          type: "object",
          properties: {
            jobId: { type: "string", format: "uuid" },
            type: {
              type: "string",
              enum: ["code_execution", "file_processing", "data_export"],
            },
            status: {
              type: "string",
              enum: ["pending", "processing", "completed", "failed"],
            },
            progress: { type: "integer", minimum: 0, maximum: 100 },
            result: { type: "object" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"], // Path to route files for JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
