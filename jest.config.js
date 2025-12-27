module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/**",
    "!**/node_modules/**",
    "!**/test/**",
  ],
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],

  // Setup files - runs BEFORE each test file
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],

  // Handle ES modules in node_modules (uuid, etc.)
  transformIgnorePatterns: ["node_modules/(?!(uuid)/)"],

  // Transform ES modules to CommonJS
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      {
        presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      },
    ],
  },

  // Lower coverage thresholds for now (can increase later)
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },

  testTimeout: 10000,
  verbose: true,

  // Prevent hanging
  forceExit: true,
  detectOpenHandles: true,
};
