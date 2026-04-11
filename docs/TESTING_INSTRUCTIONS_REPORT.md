# Testing Instruction Report

This report maps directly to assignment testing documentation requirements.

## 1) How to Run Unit Tests

## Backend unit tests (Jest)

From project root:

```bash
cd server
npm test
```

Notes:

- Test runner: Jest
- Config file: server/jest.config.js
- Setup file: server/tests/setup.js
- Match pattern: tests/\*_/_.test.js

## Frontend unit tests (Vitest)

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

Integration tests in this project are supported by:

- Jest + Supertest test files under server/tests/integration and server/tests/\*.test.js
- HTTP request collections in server/tests/\*.http for manual or REST client testing

## Automated integration execution

```bash
cd server
npm test
```

## Manual integration execution with HTTP files

Use VS Code REST Client, Postman, or Thunder Client with:

- server/tests/api.test.http
- server/tests/commute.test.http
- server/tests/smart-commute.test.http

Recommended flow:

1. Run backend server on localhost:5000.
2. Register a test user.
3. Login to get JWT token.
4. Inject token in protected request headers.
5. Execute endpoint sequence and verify responses.

## 3) Performance Testing Setup and Execution

Performance scenario file:

- server/performance/artillery.yml

Default performance profile includes:

- warm-up phase
- ramp-up phase
- sustained load phase

## Run performance test with Artillery

From project root (if Artillery is installed globally):

```bash
artillery run server/performance/artillery.yml
```

If Artillery is not installed globally, run with npx:

```bash
npx artillery run server/performance/artillery.yml
```

## 4) Testing Environment Configuration Details

## Required services

- Node.js 18+
- npm 8+
- MongoDB instance (local, Docker, or Atlas)

## Backend testing env variables

Create server/.env for test execution:

```env
PORT=5000
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/sustainability-project
JWT_SECRET=replace_with_a_long_secure_secret
CLIENT_URL=http://localhost:5173
```

## Frontend testing env variables

Optional but recommended in client/.env:

```env
VITE_API_URL=http://localhost:5000/api
```

## Docker-supported local database

Start database services:

```bash
docker-compose up -d
```

Stop services:

```bash
docker-compose down
```

## Validation checklist before running tests

- Server dependencies installed.
- Client dependencies installed.
- Database reachable.
- Env variables configured.
- Backend server starts successfully.

## Expected outcomes

- Unit and integration tests execute through Jest/Vitest commands.
- Manual endpoint tests return expected status codes and JSON responses.
- Performance test generates throughput, latency, and error-rate metrics.
