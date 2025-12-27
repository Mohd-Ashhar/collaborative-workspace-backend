// Load environment variables FIRST
require("dotenv").config();

// Override with test-specific values
process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.API_VERSION = "v1";
process.env.JWT_SECRET = "test_jwt_secret_12345";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_12345";
process.env.JWT_EXPIRE = "15m";
process.env.JWT_REFRESH_EXPIRE = "7d";
process.env.POSTGRES_HOST = "localhost";
process.env.POSTGRES_PORT = "5432";
process.env.POSTGRES_DB = "workspace_test_db";
process.env.POSTGRES_USER = "postgres";
process.env.POSTGRES_PASSWORD = "postgres";
process.env.MONGODB_URI = "mongodb://localhost:27017/workspace_test_db";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.REDIS_PASSWORD = "";

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Increase timeout for all tests
jest.setTimeout(10000);
