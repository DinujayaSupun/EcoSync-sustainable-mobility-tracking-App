# Testing Instruction Report

This report maps directly to assignment testing documentation requirements and reflects the completed step-by-step expansion of test coverage.

## 1) How to Run Tests

### Backend tests (Jest)

From project root:

```bash
cd server
npm test
```

Additional backend test scripts:

```bash
cd server
npm run test:security
```

```bash
cd server
npm run test:perf
```

Notes:

- Test runner: Jest
- Config file: server/jest.config.js
- Setup file: server/tests/setup.js
- Default execution mode: runInBand (serial) for DB-test stability

### Frontend tests (Vitest)

From project root:

```bash
cd client
npm test
```

Watch mode:

```bash
cd client
npm run test:watch
```

## 2) Integration Testing Setup and Execution

Integration testing in this project uses:

- Jest + Supertest for backend API integration tests
- Vitest + React Testing Library for frontend integration-style page tests
- Optional manual HTTP flows in server/tests/\*.http

### Automated integration execution

```bash
cd server
npm test
```

### Manual integration execution with HTTP files

Use VS Code REST Client, Postman, or Thunder Client with:

- server/tests/api.test.http
- server/tests/commute.test.http
- server/tests/smart-commute.test.http

Recommended flow:

1. Run backend server on localhost:5000.
2. Register a test user.
3. Login to obtain a JWT token.
4. Inject token in protected request headers.
5. Execute endpoint sequence and validate status/payloads.

## 3) Coverage Expansion (Completed Steps)

### Step 1: Commute + Challenges

Backend:

- server/tests/integration/commute.integration.test.js
- server/tests/integration/challenges.integration.test.js

Frontend:

- client/src/pages/**tests**/CommuteHistory.test.jsx
- client/src/pages/**tests**/Challenges.test.jsx

### Step 2: Leaderboard + Reports

Backend:

- server/tests/integration/leaderboard.integration.test.js

Frontend:

- client/src/pages/**tests**/Leaderboard.test.jsx
- client/src/pages/**tests**/Reports.test.jsx

### Step 3: Weather + Smart Commute

Backend:

- server/tests/integration/weather.smart-commute.integration.test.js

Frontend:

- client/src/pages/**tests**/WeatherSuggestion.test.jsx

### Step 4: Badges + Achievements

Backend:

- server/tests/integration/badges.achievements.integration.test.js

Frontend:

- client/src/pages/**tests**/Badges.test.jsx
- client/src/pages/**tests**/TripAchievements.test.jsx

### Step 5: Auth + Badge Admin Lifecycle

Backend:

- server/tests/integration/badges.admin.lifecycle.integration.test.js

Frontend:

- client/src/pages/**tests**/Login.test.jsx
- client/src/pages/**tests**/Register.test.jsx

## 4) Performance Testing Setup and Execution

Performance scenario file:

- server/performance/artillery.yml

Performance assertion gate script:

- server/scripts/assertPerformance.js

Run performance flow:

```bash
cd server
npm run test:perf
```

Validation gate checks:

- p95 latency threshold
- p99 latency threshold
- 2xx success presence
- 5xx error absence

## 5) Testing Environment Configuration Details

### Required services

- Node.js 18+
- npm 8+
- MongoDB instance (local, Docker, or Atlas)

### Backend env variables

Create server/.env for test execution:

```env
PORT=5000
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/sustainability-project
JWT_SECRET=replace_with_a_long_secure_secret
CLIENT_URL=http://localhost:5173
```

### Frontend env variables

Optional but recommended in client/.env:

```env
VITE_API_URL=http://localhost:5000/api
```

### Docker-supported local database

Start database services:

```bash
docker-compose up -d
```

Stop services:

```bash
docker-compose down
```

## 6) Latest Verified Results

Latest full-run status after Step 5:

- Backend: 14 test suites, 96 tests passed
- Frontend: 14 test files, 36 tests passed

## 7) Validation Checklist Before Submission

- Server dependencies installed
- Client dependencies installed
- Database reachable
- Env variables configured
- Backend tests pass (npm test in server)
- Frontend tests pass (npm test in client)
- Optional performance gate passes (npm run test:perf in server)
