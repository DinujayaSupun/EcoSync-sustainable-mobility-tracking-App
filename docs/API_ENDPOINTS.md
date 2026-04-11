# API Endpoint Documentation

This document is the assignment-ready API reference for the Sustainability Project backend.

## Base URLs

- Local API base: http://localhost:5000/api
- Production API base: https://application-framework-project-se.onrender.com/api
- Local Swagger UI: http://localhost:5000/api-docs
- Production Swagger UI: https://application-framework-project-se.onrender.com/api-docs

## Authentication Requirements

- Public: no token required
- User JWT: valid bearer token required
- Admin JWT: valid bearer token with admin role required

Authorization header format:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Common Request and Response Format

Most endpoints use JSON.

Typical success response format:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Typical error response format:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

Common HTTP status codes:

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 429 Too Many Requests
- 500 Internal Server Error

## Endpoint Catalog

## 1) Auth Endpoints

| Method | Endpoint       | Auth     | Request Format                       | Success Response Format |
| ------ | -------------- | -------- | ------------------------------------ | ----------------------- |
| POST   | /auth/register | Public   | Body: name, email, password, faculty | User object + token     |
| POST   | /auth/login    | Public   | Body: email, password                | User object + token     |
| GET    | /auth/profile  | User JWT | Header: Authorization                | Current user profile    |

Example request:

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "faculty": "Engineering"
}
```

Example response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "<JWT_TOKEN>",
  "user": {
    "_id": "65a8f2b4c3d4e5f6a7b8c9d0",
    "name": "Test User",
    "email": "test@example.com",
    "faculty": "Engineering",
    "role": "user"
  }
}
```

## 2) Commute Endpoints

| Method | Endpoint                     | Auth     | Request Format                                  | Success Response Format               |
| ------ | ---------------------------- | -------- | ----------------------------------------------- | ------------------------------------- |
| GET    | /commute/footer-stats        | Public   | No body                                         | Platform commute/footer stats         |
| POST   | /commute/log                 | User JWT | Body: startLocation, destination, transportType | Created commute/trip record           |
| GET    | /commute/history             | User JWT | Optional query filters                          | List of user commute records          |
| GET    | /commute/emission-summary    | User JWT | No body                                         | Aggregated user emissions and savings |
| GET    | /commute/autocomplete        | User JWT | Query: input or location text                   | Suggestion list                       |
| GET    | /commute/predict             | User JWT | Query params for prediction                     | Predicted emission result             |
| GET    | /commute/co2-savings-by-mode | User JWT | No body                                         | Savings grouped by transport mode     |
| GET    | /commute/car-usage-impact    | User JWT | No body                                         | Car replacement impact metrics        |
| PUT    | /commute/:id                 | User JWT | Body: editable commute fields                   | Updated commute record                |
| DELETE | /commute/:id                 | User JWT | Path param: id                                  | Deletion confirmation                 |
| POST   | /commute/recalculate-co2     | User JWT | Optional body or recalculation trigger          | Recalculated CO2 summary              |

Example request:

```http
POST /api/commute/log
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "startLocation": "Times Square, New York",
  "destination": "Central Park, New York",
  "transportType": "Bike"
}
```

Example response:

```json
{
  "success": true,
  "message": "Commute logged successfully",
  "data": {
    "tripId": "661abc123def4567890fedcb",
    "transportType": "Bike",
    "distance": 4.2,
    "co2Saved": 0.87,
    "createdAt": "2026-04-11T10:00:00.000Z"
  }
}
```

## 3) Challenge Endpoints

| Method | Endpoint                 | Auth      | Request Format                    | Success Response Format                 |
| ------ | ------------------------ | --------- | --------------------------------- | --------------------------------------- |
| POST   | /challenges              | Admin JWT | Body: challenge definition fields | Created challenge                       |
| GET    | /challenges              | Public    | Optional query filters            | List of challenges                      |
| GET    | /challenges/recommended  | Public    | Optional recommendation params    | Recommended challenges                  |
| GET    | /challenges/:id          | Public    | Path param: id                    | Single challenge details                |
| GET    | /challenges/user         | User JWT  | Header: Authorization             | Current user challenge list             |
| GET    | /challenges/admin/all    | Admin JWT | Header: Authorization             | Full challenge list for admin           |
| PUT    | /challenges/:id          | Admin JWT | Body: update fields               | Updated challenge                       |
| DELETE | /challenges/:id          | Admin JWT | Path param: id                    | Deletion confirmation                   |
| POST   | /challenges/:id/join     | User JWT  | Path param: id                    | Join confirmation + participation state |
| PUT    | /challenges/:id/progress | User JWT  | Body: progress fields (validated) | Updated progress                        |
| DELETE | /challenges/:id/leave    | User JWT  | Path param: id                    | Leave confirmation                      |

## 4) Carbon Endpoints

| Method | Endpoint                 | Auth   | Request Format                        | Success Response Format    |
| ------ | ------------------------ | ------ | ------------------------------------- | -------------------------- |
| POST   | /carbon/calculate        | Public | Body: carbon input fields (validated) | Created carbon record      |
| GET    | /carbon/records/:userId  | Public | Path param: userId                    | User carbon records        |
| GET    | /carbon/record/:id       | Public | Path param: id                        | Single carbon record       |
| PUT    | /carbon/record/:id       | Public | Body: update fields                   | Updated carbon record      |
| DELETE | /carbon/record/:id       | Public | Path param: id                        | Deletion confirmation      |
| GET    | /carbon/insights/:userId | Public | Path param: userId                    | User-level carbon insights |

## 5) Badge Endpoints

| Method | Endpoint                       | Auth      | Request Format                                     | Success Response Format        |
| ------ | ------------------------------ | --------- | -------------------------------------------------- | ------------------------------ |
| GET    | /badges                        | User JWT  | Header: Authorization                              | Badge catalog                  |
| GET    | /badges/:id                    | User JWT  | Path param: id                                     | Single badge details           |
| POST   | /badges                        | Admin JWT | Body: name, description, type, threshold, imageUrl | Created badge                  |
| PATCH  | /badges/:id                    | Admin JWT | Body: partial badge fields                         | Updated badge                  |
| DELETE | /badges/:id                    | Admin JWT | Path param: id                                     | Deletion confirmation          |
| GET    | /badges/me/earned              | User JWT  | Header: Authorization                              | Current user earned badges     |
| GET    | /badges/image-suggestion       | Admin JWT | Query: optional prompt/keywords                    | Suggested badge image metadata |
| POST   | /badges/:badgeId/award/:userId | Admin JWT | Path params: badgeId, userId                       | Award confirmation             |

Example request:

```http
POST /api/badges
Content-Type: application/json
Authorization: Bearer <ADMIN_JWT>

{
  "name": "Green Commuter",
  "description": "Complete 20 eco-friendly trips",
  "type": "TRIP_COUNT",
  "threshold": 20,
  "imageUrl": "https://example.com/badges/green-commuter.png"
}
```

## 6) Achievement Endpoints

| Method | Endpoint         | Auth     | Request Format        | Success Response Format   |
| ------ | ---------------- | -------- | --------------------- | ------------------------- |
| GET    | /achievements/my | User JWT | Header: Authorization | Current user achievements |

## 7) Leaderboard Endpoints

| Method | Endpoint     | Auth     | Request Format                       | Success Response Format |
| ------ | ------------ | -------- | ------------------------------------ | ----------------------- |
| GET    | /leaderboard | User JWT | Optional query: period/faculty/limit | Ranked user leaderboard |

## 8) Smart Commute and Weather Endpoints

Note: Weather controller endpoints are available through two mounted route groups.

- Through smart commute namespace: /api/smart-commute/weather-suggestion/\*
- Through direct weather namespace: /api/weather/\*

### Smart Commute module routes

| Method | Endpoint              | Auth   | Request Format | Success Response Format              |
| ------ | --------------------- | ------ | -------------- | ------------------------------------ |
| GET    | /smart-commute/health | Public | No body        | Smart commute service health payload |

### Weather suggestion routes (via /smart-commute/weather-suggestion and /weather)

| Method | Endpoint Path Suffix | Auth   | Request Format                        | Success Response Format          |
| ------ | -------------------- | ------ | ------------------------------------- | -------------------------------- |
| POST   | /                    | Public | Body: userId, origin, destination     | Created weather suggestion       |
| GET    | /autocomplete        | Public | Query: search text                    | Location suggestions             |
| GET    | /forecast            | Public | Query: location/date options          | Forecast payload                 |
| GET    | /current/:location   | Public | Path param: location                  | Current weather-based suggestion |
| GET    | /:userId             | Public | Path param: userId; query: limit,page | User weather suggestion list     |
| PUT    | /:id                 | Public | Path param: id; body: update fields   | Updated weather suggestion       |
| DELETE | /:id                 | Public | Path param: id                        | Deletion confirmation            |

Example request:

```http
POST /api/smart-commute/weather-suggestion
Content-Type: application/json

{
  "userId": "60d5ec49f1b2c72b8c8e4a1b",
  "origin": "New York",
  "destination": "Boston"
}
```

## 9) Admin Endpoints

All admin endpoints require Admin JWT.

| Method | Endpoint             | Auth      | Request Format                            | Success Response Format          |
| ------ | -------------------- | --------- | ----------------------------------------- | -------------------------------- |
| GET    | /admin/stats         | Admin JWT | Optional query filters                    | Dashboard stats summary          |
| GET    | /admin/users         | Admin JWT | Optional query/search                     | User list for admin panel        |
| PUT    | /admin/users/:id     | Admin JWT | Body: name/email/faculty/role (validated) | Updated user                     |
| DELETE | /admin/users/:id     | Admin JWT | Path param: id                            | Deletion confirmation            |
| GET    | /admin/recent-trips  | Admin JWT | Query: limit                              | Recent trip feed                 |
| GET    | /admin/report        | Admin JWT | Query: date range/faculty filters         | Aggregated sustainability report |
| POST   | /admin/email-report  | Admin JWT | Body: email report payload                | Email send status                |
| POST   | /admin/ai-insights   | Admin JWT | Body: report context/options              | AI-generated insights            |
| GET    | /admin/activity-logs | Admin JWT | Query: page, limit, filters               | Paginated activity audit logs    |

Example request:

```http
PUT /api/admin/users/65a8f2b4c3d4e5f6a7b8c9d0
Content-Type: application/json
Authorization: Bearer <ADMIN_JWT>

{
  "role": "admin"
}
```

Example response:

```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "65a8f2b4c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john.doe@university.edu",
    "faculty": "Engineering",
    "role": "admin"
  }
}
```

## Rate Limiting and Security Notes

- Global API rate limiter is enabled with selective route skip logic.
- Dedicated limiters exist for login, autocomplete, commute, and admin/report operations.
- Security middleware includes helmet, CORS controls, and sanitization.

## Validation and Source of Truth

- Primary source of truth for exact schemas and examples: Swagger at /api-docs.
- This file is intended for assignment documentation readability and endpoint traceability.
