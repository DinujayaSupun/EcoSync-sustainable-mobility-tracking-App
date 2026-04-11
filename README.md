# 🌱 Sustainability Project - Smart Commute Tracker

A full-stack MERN application for sustainable mobility tracking.
This platform logs commute activity, calculates carbon impact, and boosts engagement through challenges, badges, achievements, and leaderboard mechanics.

<p align="left">
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Backend-Express%205-000000?logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Bundler-Vite%207-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Docs-Swagger-85EA2D?logo=swagger&logoColor=black" alt="Swagger" />
</p>

## 📚 Assignment Documentation Pack

- API Endpoint Documentation: [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md)
- Deployment Report: [docs/DEPLOYMENT_REPORT.md](docs/DEPLOYMENT_REPORT.md)
- Testing Instruction Report: [docs/TESTING_INSTRUCTIONS_REPORT.md](docs/TESTING_INSTRUCTIONS_REPORT.md)
- Interactive API schemas and examples: `/api-docs` (Swagger)

## ✅ Testing Highlights

- End-to-end test expansion completed through Step 1 to Step 5
- Backend status: 14 suites, 96 tests passed
- Frontend status: 14 files, 36 tests passed
- Includes module coverage for Commute, Challenges, Leaderboard, Reports, Weather/Smart Commute, Badges, Achievements, Auth, and admin lifecycle flows
- Full evidence and execution guide: [docs/TESTING_INSTRUCTIONS_REPORT.md](docs/TESTING_INSTRUCTIONS_REPORT.md)

## ✨ Table of Contents

1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Architecture](#-architecture)
4. [Tech Stack](#-tech-stack)
5. [Repository Structure](#-repository-structure)
6. [Prerequisites](#-prerequisites)
7. [Environment Variables](#-environment-variables)
8. [Installation](#-installation)
9. [Running the System](#-running-the-system)
10. [API Reference Map](#-api-reference-map)
11. [Authentication and Authorization](#-authentication-and-authorization)
12. [Rate Limiting and Security](#-rate-limiting-and-security)
13. [Testing](#-testing)
14. [Docker](#-docker)
15. [Operational Utilities](#-operational-utilities)
16. [Troubleshooting](#-troubleshooting)
17. [Development Notes](#-development-notes)
18. [License](#-license)

## 🚀 Overview

This project is split into two deployable apps:

- `client`: React + Vite SPA
- `server`: Express API + MongoDB

### 🌍 Live Deployment URLs

- Frontend (Vercel): https://ecosync-pi.vercel.app
- Backend API (Render): https://application-framework-project-se.onrender.com
- Backend Swagger: https://application-framework-project-se.onrender.com/api-docs

### 🎯 Main Capabilities

- User authentication and profile access
- Commute logging and emissions analytics
- Challenge participation and progress tracking
- Badge and achievement progression
- Leaderboard rankings
- Weather-aware smart commute suggestions
- Admin reports, user management, and activity logs
- Swagger-powered API documentation

## 🧩 Key Features

### 👤 User-Facing

- Register/login with JWT
- Log commute trips and view history
- View personal emission summaries and insights
- Join challenges and update progress
- Earn badges and achievements
- Compare progress on leaderboard
- Smart commute and weather suggestions

### 🛠️ Admin-Facing

- View platform-level statistics
- Manage users
- Access report data and AI insights
- Send report emails
- View activity/audit logs
- Manage challenge inventory

## 🏗️ Architecture

### 🔄 Runtime Flow

1. Client calls API through Axios instance in `client/src/api/axios.js`.
2. Axios attaches JWT from `localStorage` when available.
3. Server validates token in auth middleware for protected routes.
4. Controller layer handles domain logic and persistence.
5. MongoDB stores users, trips, challenges, badges, and logs.

### 🧠 High-Level Components

- Frontend
  - Routing and protected pages
  - Context-based auth state
  - Page-level API integrations
- Backend
  - Route modules under `server/routes`
  - Controllers for request orchestration
  - Services for reusable business logic
  - Middleware for auth, validation, security, limits
  - Mongoose models for persistence

## 🧪 Tech Stack

### 🎨 Frontend (`client`)

- React 19
- Vite 7
- React Router DOM
- Tailwind CSS
- Axios
- Recharts
- React Leaflet
- Vitest + Testing Library + jsdom

### ⚙️ Backend (`server`)

- Node.js (works with current Node 24 setup)
- Express 5
- MongoDB + Mongoose
- `jsonwebtoken` for JWT
- `express-validator`
- `helmet`
- `express-rate-limit`
- `express-mongo-sanitize`
- `swagger-jsdoc` + `swagger-ui-express`
- Jest + Supertest

### 🐳 Infrastructure

- Docker Compose
  - `mongodb`
  - `mongo-express`

## 📁 Repository Structure

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

## ✅ Prerequisites

- Node.js 18+
- npm 8+
- MongoDB local instance OR Docker Desktop OR MongoDB Atlas
- Git

## 🔐 Environment Variables

Create `server/.env`:

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

Create `client/.env` (optional but recommended):

```env
VITE_API_URL=http://localhost:5000/api
```

Production example (Vercel):

```env
VITE_API_URL=https://application-framework-project-se.onrender.com/api
```

### Notes

- `server/config/db.js` uses `MONGO_URI`.
- `client/src/api/axios.js` falls back to `http://localhost:5000/api` when `VITE_API_URL` is not set.
- JWT token is expected in `localStorage` key `token`.
- For deployed frontend/backend communication, set server `CLIENT_URL` (or `ALLOWED_ORIGINS`) to `https://ecosync-pi.vercel.app`.

## 📦 Installation

From project root:

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

## 🛠️ Step-by-Step Setup Guide

1. Clone the repository and open it in your editor.
2. Install backend dependencies:

```bash
cd server
npm install
```

3. Install frontend dependencies:

```bash
cd ../client
npm install
```

4. Create environment files:

- `server/.env` using the variables in the Environment Variables section.
- `client/.env` with `VITE_API_URL=http://localhost:5000/api`.

5. Start MongoDB:

- Local service, or
- Docker: `docker-compose up -d`

6. Run backend:

```bash
cd server
npm run dev
```

7. Run frontend in a second terminal:

```bash
cd client
npm run dev
```

8. Open the app:

- Frontend: `http://localhost:5173`
- Swagger docs: `http://localhost:5000/api-docs`

## ▶️ Running the System

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

### Production-Oriented Commands

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

## 🗺️ API Reference Map

- Base URL: `http://localhost:5000/api`
- Production Base URL: `https://application-framework-project-se.onrender.com/api`
- Swagger UI: `http://localhost:5000/api-docs`
- Production Swagger UI: `https://application-framework-project-se.onrender.com/api-docs`

Mounted route groups from `server/app.js`:

- `/api/auth`
- `/api/commute`
- `/api/admin`
- `/api/smart-commute`
- `/api/challenges`
- `/api/carbon`
- `/api/badges`
- `/api/achievements`
- `/api/leaderboard`
- `/api/weather`

### Core Endpoint Groups

#### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

#### Commute

- `GET /api/commute/footer-stats`
- `POST /api/commute/log`
- `GET /api/commute/history`
- `GET /api/commute/emission-summary`
- `GET /api/commute/autocomplete`
- `GET /api/commute/predict`
- `GET /api/commute/co2-savings-by-mode`
- `GET /api/commute/car-usage-impact`
- `PUT /api/commute/:id`
- `DELETE /api/commute/:id`
- `POST /api/commute/recalculate-co2`

#### Challenges

- `POST /api/challenges`
- `GET /api/challenges`
- `GET /api/challenges/recommended`
- `GET /api/challenges/:id`
- `GET /api/challenges/user`
- `GET /api/challenges/admin/all`
- `PUT /api/challenges/:id`
- `DELETE /api/challenges/:id`
- `POST /api/challenges/:id/join`
- `PUT /api/challenges/:id/progress`
- `DELETE /api/challenges/:id/leave`

#### Carbon

- `POST /api/carbon/calculate`
- `GET /api/carbon/records/:userId`
- `GET /api/carbon/record/:id`
- `PUT /api/carbon/record/:id`
- `DELETE /api/carbon/record/:id`
- `GET /api/carbon/insights/:userId`

#### Badges

- `GET /api/badges`
- `GET /api/badges/:id`
- `POST /api/badges`
- `PATCH /api/badges/:id`
- `DELETE /api/badges/:id`
- `GET /api/badges/me/earned`
- `GET /api/badges/image-suggestion`
- `POST /api/badges/:badgeId/award/:userId`

#### Achievements

- `GET /api/achievements/my`

#### Leaderboard

- `GET /api/leaderboard`

#### Weather and Smart Commute

- `GET /api/smart-commute/health`
- `POST /api/smart-commute/weather-suggestion`
- `GET /api/smart-commute/weather-suggestion/autocomplete`
- `GET /api/smart-commute/weather-suggestion/forecast`
- `GET /api/smart-commute/weather-suggestion/current/:location`
- `GET /api/smart-commute/weather-suggestion/:userId`
- `PUT /api/smart-commute/weather-suggestion/:id`
- `DELETE /api/smart-commute/weather-suggestion/:id`

#### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/recent-trips`
- `GET /api/admin/report`
- `POST /api/admin/email-report`
- `POST /api/admin/ai-insights`
- `GET /api/admin/activity-logs`

Use `/api-docs` as the canonical source for request and response schema details.

## 🔑 Authentication and Authorization

- JWT bearer token is required for protected endpoints.
- Header format:

```text
Authorization: Bearer <token>
```

- Role checks are enforced for admin-only routes via middleware.

## 🛡️ Rate Limiting and Security

Implemented in backend middleware and app bootstrap:

- `helmet` for common HTTP hardening
- `express-mongo-sanitize` for query/body sanitization
- `express-rate-limit` for abuse control
- CORS allow-list includes:
  - `CLIENT_URL` from env
  - `http://localhost:5173`
  - `http://localhost:5174`

Admin routes use dedicated limiters in `server/middleware/rateLimiter.js`.

## 🧫 Testing

### Quick Run Commands

Backend (full suite):

```bash
cd server
npm test
```

Backend security-focused suites:

```bash
cd server
npm run test:security
```

Backend performance gate:

```bash
cd server
npm run test:perf
```

Frontend (full suite):

```bash
cd client
npm test
```

Frontend watch mode:

```bash
cd client
npm run test:watch
```

### Current Coverage Expansion (Completed)

- Step 1: Commute + Challenges
- Step 2: Leaderboard + Reports
- Step 3: Weather + Smart Commute
- Step 4: Badges + Achievements
- Step 5: Auth + Badge Admin Lifecycle

### Latest Verified Status

- Backend: 14 suites, 96 tests passed
- Frontend: 14 files, 36 tests passed

For the complete testing evidence pack (module map, files, environment setup, and checklist), see:

- [docs/TESTING_INSTRUCTIONS_REPORT.md](docs/TESTING_INSTRUCTIONS_REPORT.md)

## 🐳 Docker

`docker-compose.yml` includes:

- `mongodb` (port 27017)
- `mongo-express` (port 8081)

Commands:

```bash
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## 🧰 Operational Utilities

Server utility scripts:

- `node setAdmin.js`
- `node checkUsers.js`
- `node fixUserRoles.js`
- `node generateToken.js`
- `node test-gemini-models.js`
- `node test-direct-api.js`
- `node test-ip-whitelist.js`

Gamification seed command:

```bash
cd server
npm run seed:gamification
```

## 🧯 Troubleshooting

### Backend Fails to Connect to DB

- Verify `MONGO_URI` in `server/.env`
- Ensure MongoDB is running
- If Atlas is used, verify network access and credentials

### CORS Issues in Browser

- Set `CLIENT_URL` correctly in `server/.env`
- In production set `CLIENT_URL=https://ecosync-pi.vercel.app`
- If using multiple frontend origins, set `ALLOWED_ORIGINS` with comma-separated domains
- Start frontend on an allowed origin (`5173` or `5174`)

### Auth Issues

- Ensure `JWT_SECRET` is set
- Ensure token exists in `localStorage` key `token`

### Build/Runtime Break After Merge

Search and resolve conflict markers:

- `<<<<<<<`
- `=======`
- `>>>>>>>`

## 📝 Development Notes

- Root has no `package.json` scripts; run scripts from `client` and `server` separately.
- Swagger documentation is available only when backend is running.
- Some AI/email features are optional and depend on environment keys.

## 📄 License

ISC
