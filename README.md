# Sustainability Project - Smart Commute Tracker

A full-stack MERN application for sustainable mobility tracking. The platform logs commute activity, calculates carbon impact, and drives engagement through challenges, badges, achievements, and leaderboard mechanics.

## Table of Contents

1. Overview
2. Key Features
3. Architecture
4. Tech Stack
5. Repository Structure
6. Prerequisites
7. Environment Variables
8. Installation
9. Running the System
10. API Reference Map
11. Authentication and Authorization
12. Rate Limiting and Security
13. Testing
14. Docker
15. Operational Utilities
16. Troubleshooting
17. Development Notes
18. License

## 1) Overview

The project is split into two deployable apps:

- client: React + Vite SPA
- server: Express API + MongoDB

Main capabilities include:

- User auth and profile access
- Commute logging and emissions analytics
- Challenge participation and progress tracking
- Badge and achievement progression
- Leaderboard rankings
- Weather-aware smart commute suggestions
- Admin reports, user management, and activity logs
- Swagger-powered API documentation

### Live Deployment URLs

- Frontend (Vercel): https://ecosync-pi.vercel.app
- Backend API (Render): https://application-framework-project-se.onrender.com
- Backend Swagger: https://application-framework-project-se.onrender.com/api-docs

## 2) Key Features

### User-facing

- Register/login with JWT
- Log commute trips and view history
- View personal emission summaries and insights
- Join challenges and update progress
- Earn badges and achievements
- Compare progress on leaderboard
- Smart commute and weather suggestions

### Admin-facing

- View platform-level statistics
- Manage users
- Access report data and AI insights
- Send report emails
- View activity/audit logs
- Manage challenge inventory

## 3) Architecture

### Runtime Flow

1. Client calls API through Axios instance in client/src/api/axios.js.
2. Axios attaches JWT from localStorage when available.
3. Server validates token in auth middleware for protected routes.
4. Controller layer handles domain logic and persistence.
5. MongoDB stores users, trips, challenges, badges, and logs.

### High-level Components

- Frontend:
  - Routing and protected pages
  - Context-based auth state
  - Page-level API integrations
- Backend:
  - Route modules under server/routes
  - Controllers for request orchestration
  - Services for reusable business logic
  - Middleware for auth, validation, security, limits
  - Mongoose models for persistence

## 4) Tech Stack

### Frontend (client)

- React 19
- Vite 7
- React Router DOM
- Tailwind CSS
- Axios
- Recharts
- React Leaflet
- Vitest + Testing Library + jsdom

### Backend (server)

- Node.js (works with current Node 24 setup)
- Express 5
- MongoDB + Mongoose
- jsonwebtoken for JWT
- express-validator
- helmet
- express-rate-limit
- express-mongo-sanitize
- swagger-jsdoc + swagger-ui-express
- Jest + Supertest

### Infrastructure

- Docker Compose
  - mongodb
  - mongo-express

## 5) Repository Structure

```text
SourceCode/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   ├── index.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 6) Prerequisites

- Node.js 18+
- npm 8+
- MongoDB local instance OR Docker Desktop OR MongoDB Atlas
- Git

## 7) Environment Variables

Create server/.env:

```env
# Required
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/sustainability-project
JWT_SECRET=replace_with_a_long_secure_secret
CLIENT_URL=http://localhost:5173

# AI and optional integrations
OPENAI_API_KEY=
GEMINI_API_KEY=
OPENWEATHER_API_KEY=
UNSPLASH_ACCESS_KEY=
USE_MOCK=false

# Email reporting (Brevo SMTP)
BREVO_SMTP_EMAIL=
BREVO_SMTP_KEY=
BREVO_FROM_EMAIL=

# Optional global rate limit tuning
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Create client/.env (optional but recommended):

```env
VITE_API_URL=http://localhost:5000/api
```

Production example (Vercel):

```env
VITE_API_URL=https://application-framework-project-se.onrender.com/api
```

Notes:

- server/config/db.js uses MONGO_URI.
- client/src/api/axios.js falls back to http://localhost:5000/api when VITE_API_URL is not set.
- JWT token is expected in localStorage key token.
- For deployed frontend/backend communication, set server CLIENT_URL (or ALLOWED_ORIGINS) to https://ecosync-pi.vercel.app.

## 8) Installation

From project root:

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

## 9) Running the System

### Option A: Local MongoDB

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

### Option B: Docker MongoDB

From root:

```bash
docker-compose up -d
```

Then run backend and frontend as above.

### Production-oriented commands

Backend:

```bash
cd server
npm start
```

Frontend build and preview:

```bash
cd client
npm run build
npm run preview
```

## 10) API Reference Map

Base URL: http://localhost:5000/api

Production Base URL: https://application-framework-project-se.onrender.com/api

Swagger UI: http://localhost:5000/api-docs

Production Swagger UI: https://application-framework-project-se.onrender.com/api-docs

Mounted route groups from server/app.js:

- /api/auth
- /api/commute
- /api/admin
- /api/smart-commute
- /api/challenges
- /api/carbon
- /api/badges
- /api/achievements
- /api/leaderboard
- /api/weather

### Core endpoint groups

#### Auth

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile

#### Commute

- GET /api/commute/footer-stats
- POST /api/commute/log
- GET /api/commute/history
- GET /api/commute/emission-summary
- GET /api/commute/autocomplete
- GET /api/commute/predict
- GET /api/commute/co2-savings-by-mode
- GET /api/commute/car-usage-impact
- PUT /api/commute/:id
- DELETE /api/commute/:id
- POST /api/commute/recalculate-co2

#### Challenges

- POST /api/challenges
- GET /api/challenges
- GET /api/challenges/recommended
- GET /api/challenges/:id
- GET /api/challenges/user
- GET /api/challenges/admin/all
- PUT /api/challenges/:id
- DELETE /api/challenges/:id
- POST /api/challenges/:id/join
- PUT /api/challenges/:id/progress
- DELETE /api/challenges/:id/leave

#### Carbon

- POST /api/carbon/calculate
- GET /api/carbon/records/:userId
- GET /api/carbon/record/:id
- PUT /api/carbon/record/:id
- DELETE /api/carbon/record/:id
- GET /api/carbon/insights/:userId

#### Badges

- GET /api/badges
- GET /api/badges/:id
- POST /api/badges
- PATCH /api/badges/:id
- DELETE /api/badges/:id
- GET /api/badges/me/earned
- GET /api/badges/image-suggestion
- POST /api/badges/:badgeId/award/:userId

#### Achievements

- GET /api/achievements/my

#### Leaderboard

- GET /api/leaderboard

#### Weather and Smart Commute

- GET /api/smart-commute/health
- POST /api/smart-commute/weather-suggestion
- GET /api/smart-commute/weather-suggestion/autocomplete
- GET /api/smart-commute/weather-suggestion/forecast
- GET /api/smart-commute/weather-suggestion/current/:location
- GET /api/smart-commute/weather-suggestion/:userId
- PUT /api/smart-commute/weather-suggestion/:id
- DELETE /api/smart-commute/weather-suggestion/:id

#### Admin

- GET /api/admin/stats
- GET /api/admin/users
- PUT /api/admin/users/:id
- DELETE /api/admin/users/:id
- GET /api/admin/recent-trips
- GET /api/admin/report
- POST /api/admin/email-report
- POST /api/admin/ai-insights
- GET /api/admin/activity-logs

Use /api-docs as the canonical source for request and response schema details.

## 11) Authentication and Authorization

- JWT bearer token is required for protected endpoints.
- Header format:

```text
Authorization: Bearer <token>
```

- Role checks are enforced for admin-only routes via middleware.

## 12) Rate Limiting and Security

Implemented in backend middleware and app bootstrap:

- helmet for common HTTP hardening
- express-mongo-sanitize for query/body sanitization
- express-rate-limit for abuse control
- CORS allow-list includes:
  - CLIENT_URL from env
  - http://localhost:5173
  - http://localhost:5174

Admin routes use dedicated limiters in server/middleware/rateLimiter.js.

## 13) Testing

### Backend (Jest)

```bash
cd server
npm test
```

- Jest config: server/jest.config.js
- Setup file: server/tests/setup.js
- Tests include unit/integration style files under server/tests

### Frontend (Vitest)

```bash
cd client
npm test
# watch mode
npm run test:watch
```

## 14) Docker

docker-compose.yml includes:

- mongodb (port 27017)
- mongo-express (port 8081)

Commands:

```bash
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## 15) Operational Utilities

Server utility scripts:

- node setAdmin.js
- node checkUsers.js
- node fixUserRoles.js
- node generateToken.js
- node test-gemini-models.js
- node test-direct-api.js
- node test-ip-whitelist.js

Gamification seed command:

```bash
cd server
npm run seed:gamification
```

## 16) Troubleshooting

### Backend fails to connect to DB

- Verify MONGO_URI in server/.env
- Ensure MongoDB is running
- If Atlas is used, verify network access and credentials

### CORS issues in browser

- Set CLIENT_URL correctly in server/.env
- In production set CLIENT_URL=https://ecosync-pi.vercel.app
- If using multiple frontend origins, set ALLOWED_ORIGINS with comma-separated domains
- Start frontend on an allowed origin (5173 or 5174)

### Auth issues

- Ensure JWT_SECRET is set
- Ensure token exists in localStorage key token

### Build/runtime break after merge

- Search and resolve conflict markers:
  - <<<<<<<
  - =======
  - >>>>>>>

## 17) Development Notes

- Root has no package.json scripts; run scripts from client and server separately.
- Swagger documentation is available only when backend is running.
- Some AI/email features are optional and depend on environment keys.

## 18) License

ISC
