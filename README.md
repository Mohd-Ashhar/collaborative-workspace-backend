# 🚀 Collaborative Workspace Backend

A production-grade real-time collaborative workspace backend service built with Node.js, featuring WebSocket communication, asynchronous job processing, and comprehensive RBAC.

![Build Status](https://github.com/Mohd-Ashhar/collaborative-workspace-backend/actions/workflows/ci-cd.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Design Decisions](#design-decisions)

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh token rotation
- Role-Based Access Control (RBAC): Owner, Collaborator, Viewer
- Secure password hashing with bcrypt
- API rate limiting (100 requests/15 minutes)
- Input validation and sanitization

### 📊 Project & Workspace Management
- RESTful APIs for CRUD operations
- Project ownership and member management
- Role-based permissions
- Workspace organization within projects
- Email-based collaboration invites

### 🔌 Real-Time Collaboration
- WebSocket server with Socket.io
- Redis Pub/Sub for horizontal scaling
- Real-time events:
  - User presence (join/leave)
  - File change notifications
  - Cursor position tracking
  - Typing indicators
  - Code updates
- Activity logging to MongoDB

### ⚙️ Asynchronous Job Processing
- Bull queue with Redis backend
- Background workers for:
  - Code execution (simulated)
  - File processing (parse, compress, convert)
  - Data export (JSON, CSV, XML)
- Retry logic with exponential backoff
- Idempotent job processing
- Job status tracking and history

### 🗄️ Multi-Database Architecture
- **PostgreSQL**: Users, projects, workspaces, jobs
- **MongoDB**: Activity logs and real-time events
- **Redis**: Caching, pub/sub, job queue

---

## 🛠️ Tech Stack

**Backend Framework:** Node.js 18+ with Express.js  
**Databases:** PostgreSQL 16, MongoDB 7, Redis 7  
**Real-Time:** Socket.io with Redis Adapter  
**Queue:** Bull (Redis-backed)  
**Authentication:** JWT (jsonwebtoken)  
**Validation:** express-validator  
**Security:** Helmet, CORS, bcrypt  
**Testing:** Jest, Supertest  
**Documentation:** Swagger/OpenAPI 3.0  
**Containerization:** Docker & Docker Compose  
**CI/CD:** GitHub Actions  

---

## 🏗️ Architecture

┌─────────────────────────────────────────────────────────────┐
│ Load Balancer / Nginx │
└──────────────────────┬──────────────────────────────────────┘
│
┌──────────────┼──────────────┐
│ │ │
┌────▼────┐ ┌────▼────┐ ┌────▼────┐
│ App │ │ App │ │ App │
│ Server │ │ Server │ │ Server │
│ (Node) │ │ (Node) │ │ (Node) │
└────┬────┘ └────┬────┘ └────┬────┘
│ │ │
└──────────────┼──────────────┘
│
┌──────────────┼──────────────┬──────────────┐
│ │ │ │
┌────▼────┐ ┌────▼────┐ ┌────▼────┐ ┌────▼────┐
│PostgreSQL│ │ MongoDB │ │ Redis │ │ Bull │
│ (Users, │ │(Activity│ │(Cache, │ │ Workers │
│Projects) │ │ Logs) │ │Pub/Sub) │ │ (Jobs) │
└──────────┘ └──────────┘ └──────────┘ └──────────┘


**Key Design Patterns:**
- **Service Layer Architecture**: Business logic separated from controllers
- **Repository Pattern**: Database operations abstracted
- **Pub/Sub Pattern**: Horizontal scaling for WebSocket events
- **Queue Pattern**: Asynchronous job processing with retry logic

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
git clone https://github.com/Mohd-Ashhar/collaborative-workspace-backend
cd collaborative-workspace-backend

2. **Install dependencies**
npm install


3. **Environment setup**
cp .env.example .env
Edit `.env` with your configuration:

NODE_ENV=development
PORT=3000
API_VERSION=v1

JWT Secrets (CHANGE IN PRODUCTION)
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=workspace_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

MongoDB
MONGODB_URI=mongodb://localhost:27017/workspace_db

Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3001


4. **Start services with Docker**
docker-compose up -d
This starts:
- PostgreSQL on port 5432
- MongoDB on port 27017
- Redis on port 6379

5. **Initialize database schema**
docker exec -it workspace_postgres psql -U postgres -d workspace_db -f /docker-entrypoint-initdb.d/schema.sql


6. **Run the application**
Development mode (with auto-reload)
npm run dev

Production mode
npm start


Server will be running at: `http://localhost:3000`

---

## 📚 API Documentation

### Interactive Documentation

Once the server is running, access the Swagger UI:

**Swagger UI:** http://localhost:3000/api-docs  
**OpenAPI JSON:** http://localhost:3000/api-docs.json

### Quick API Reference

#### Authentication Endpoints

Register new user
POST /api/v1/auth/register
Content-Type: application/json

{
"email": "user@example.com",
"password": "SecurePass@123",
"name": "John Doe"
}

Login
POST /api/v1/auth/login
{
"email": "user@example.com",
"password": "SecurePass@123"
}

Get profile (requires auth)
GET /api/v1/auth/profile
Authorization: Bearer <access_token>

Refresh token
POST /api/v1/auth/refresh
{
"refreshToken": "<refresh_token>"
}


#### Project Endpoints
Create project
POST /api/v1/projects
Authorization: Bearer <access_token>
{
"name": "My Project",
"description": "Project description"
}

Get all projects
GET /api/v1/projects
Authorization: Bearer <access_token>

Invite member
POST /api/v1/projects/:projectId/members
{
"email": "collaborator@example.com",
"role": "collaborator"
}


#### Job Endpoints
Submit code execution job
POST /api/v1/jobs/code-execution
{
"projectId": 1,
"code": "console.log('Hello');",
"language": "javascript"
}

Get job status
GET /api/v1/jobs/:jobId

Get queue statistics
GET /api/v1/jobs/stats



### WebSocket Events

Connect to WebSocket server:
const socket = io('http://localhost:3000', {
auth: { token: '<access_token>' }
});

// Join project room
socket.emit('join_project', { projectId: 1 });

// Listen to events
socket.on('user_joined', (data) => console.log(data));
socket.on('file_change', (data) => console.log(data));
socket.on('user_typing', (data) => console.log(data));

---

## 🧪 Testing

### Run Tests

Run all tests
npm test

Run with coverage
npm run test:coverage

Run unit tests only
npm run test:unit

Run integration tests only
npm run test:integration

Watch mode
npm run test:watch


### Test Coverage

Current coverage: **23/23 tests passing**
Test Suites: 3 passed, 3 total
Tests: 23 passed, 23 total
Time: ~3s


Test types:
- **Unit Tests**: Password utils, JWT utils
- **Integration Tests**: Authentication flow, API endpoints

---

## 🐳 Deployment

### Docker Deployment

**Development:**
docker-compose up -d


**Production:**
docker-compose -f docker-compose.prod.yml up -d


### Kubernetes Deployment

Create namespace
kubectl apply -f k8s/namespace.yaml

Apply configurations
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

Deploy databases
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml

Deploy application
kubectl apply -f k8s/app-deployment.yaml


### Environment Variables for Production

**Critical:** Update these in production:
- `JWT_SECRET` - Strong random secret
- `JWT_REFRESH_SECRET` - Different strong secret
- `POSTGRES_PASSWORD` - Secure database password
- `REDIS_PASSWORD` - Enable and set Redis password
- `CORS_ORIGIN` - Your frontend domain

---

## 🤔 Design Decisions & Trade-offs

### 1. **Multi-Database Strategy**

**Decision:** PostgreSQL + MongoDB + Redis

**Rationale:**
- PostgreSQL: ACID compliance for critical data (users, projects)
- MongoDB: Flexible schema for activity logs
- Redis: High-speed cache and pub/sub

**Trade-off:** Increased complexity vs. optimized performance

### 2. **JWT with Refresh Tokens**

**Decision:** Short-lived access tokens (15m) + long-lived refresh tokens (7d)

**Rationale:**
- Security: Minimizes exposure if token is compromised
- UX: Seamless token refresh without re-login

**Trade-off:** Additional refresh endpoint vs. enhanced security

### 3. **Bull Queue for Jobs**

**Decision:** Bull with Redis backend

**Rationale:**
- Persistence: Jobs survive server restarts
- Retry logic: Automatic exponential backoff
- Monitoring: Built-in UI (Bull Board compatible)

**Trade-off:** Redis dependency vs. reliability

### 4. **Redis Pub/Sub for WebSocket Scaling**

**Decision:** Redis adapter for Socket.io

**Rationale:**
- Horizontal scaling: Multiple server instances
- Event distribution: All connected clients receive events

**Trade-off:** Single point of failure (mitigated with Redis Sentinel)

### 5. **Service Layer Architecture**

**Decision:** Controllers → Services → Database

**Rationale:**
- Testability: Easy to mock services
- Reusability: Services can be used across controllers
- Maintainability: Clear separation of concerns

**Trade-off:** More files vs. better organization

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless servers**: All session data in Redis
- **WebSocket scaling**: Redis pub/sub distributes events
- **Load balancing**: Nginx upstream configuration

### Performance Optimizations
- **Database indexing**: All foreign keys and query fields indexed
- **Redis caching**: User sessions and frequently accessed data
- **Connection pooling**: PostgreSQL pool size: 20

### Future Improvements
- [ ] Implement Redis Sentinel for HA
- [ ] Add read replicas for PostgreSQL
- [ ] Implement GraphQL API alongside REST
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Implement feature flags (LaunchDarkly)
- [ ] Add metrics and monitoring (Prometheus + Grafana)

---

## 🔒 Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ SQL injection protection (parameterized queries)
- ✅ NoSQL injection protection (Mongoose sanitization)
- ✅ XSS protection (Helmet)
- ✅ CORS configuration
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation (express-validator)
- ✅ Secure HTTP headers (Helmet)
- ✅ Environment variable secrets

---

## 📝 License

MIT License - see LICENSE file

---

## 👨‍💻 Author

**Mohd Ashhar**  
GitHub: [@Mohd-Ashhar](https://github.com/Mohd-Ashhar)

---

## 🙏 Acknowledgments

Built as part of the Purple Merit Technologies Backend Developer Assessment (December 2025).

**Assessment Requirements:**
- ✅ JWT/OAuth2 Authentication
- ✅ Role-Based Access Control
- ✅ RESTful API Design
- ✅ Real-Time WebSocket Communication
- ✅ Asynchronous Job Processing
- ✅ Multi-Database Architecture
- ✅ Docker & Kubernetes Ready
- ✅ CI/CD Pipeline
- ✅ Comprehensive Testing
- ✅ OpenAPI Documentation

---

**🌟 Star this repo if you find it helpful!**
