# Deployment Report

## Project

Sustainability Project - Smart Commute Tracker (MERN stack)

## Deployment Targets

- Frontend hosting: Vercel
- Backend hosting: Render
- Database: MongoDB (local Docker for development, MongoDB service for deployment)

Live URLs:

- Frontend: https://ecosync-pi.vercel.app
- Backend API: https://application-framework-project-se.onrender.com
- Swagger docs: https://application-framework-project-se.onrender.com/api-docs

## Deployment Architecture

- Client and server are deployed independently.
- Client consumes backend using VITE_API_URL.
- Backend enables CORS for the frontend origin and preview origins.
- Backend serves API docs via Swagger UI.

## Environment Configuration

## Frontend environment

Required variable:

```env
VITE_API_URL=https://application-framework-project-se.onrender.com/api
```

## Backend environment

Required variables:

```env
PORT=5000
NODE_ENV=production
MONGO_URI=<production_mongodb_connection_string>
JWT_SECRET=<strong_secret>
CLIENT_URL=https://ecosync-pi.vercel.app
```

Optional integration variables (if used):

```env
OPENAI_API_KEY=
GEMINI_API_KEY=
OPENWEATHER_API_KEY=
UNSPLASH_ACCESS_KEY=
USE_MOCK=false
BREVO_SMTP_EMAIL=
BREVO_SMTP_KEY=
BREVO_FROM_EMAIL=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment Procedure

1. Build and verify locally.
2. Deploy backend service.
3. Set backend environment variables.
4. Verify backend health and Swagger docs.
5. Deploy frontend service.
6. Set frontend environment variable VITE_API_URL to deployed backend API.
7. Validate end-to-end flows from frontend to backend.

## Verification Checklist

- Backend API root endpoint responds with success message.
- Swagger loads and lists all routes.
- Authentication works: register, login, profile.
- Protected routes reject invalid or missing tokens.
- CORS allows frontend origin and blocks unauthorized origins.
- Admin routes are accessible only to admin users.

## Operational Notes

- For local DB bootstrapping, docker-compose includes MongoDB and mongo-express.
- For production stability, keep JWT_SECRET and external API keys secure.
- Use report and activity log endpoints for admin observability.

## Risks and Mitigations

- Risk: mismatched frontend API URL.
  - Mitigation: set VITE_API_URL explicitly in production.
- Risk: CORS misconfiguration.
  - Mitigation: set CLIENT_URL or ALLOWED_ORIGINS correctly.
- Risk: missing secrets.
  - Mitigation: validate env variables before deployment.

## Result

Deployment is active and publicly accessible through the listed frontend and backend URLs with API documentation exposed at /api-docs.
