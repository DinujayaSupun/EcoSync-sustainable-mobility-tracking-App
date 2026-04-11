# Admin Module, User Management, and JWT Security Documentation

This document is a complete technical write-up for the project areas:

- Admin module
- User management
- JWT authentication and authorization security

It is designed to be submitted as an ownership-specific assignment section.

## 1) Scope Ownership Summary

## Features covered

- Admin dashboard statistics and analytics endpoints
- Admin user lifecycle management (view, update, delete)
- Activity log auditing and filtering
- Report generation, report emailing, and AI insights endpoints
- JWT-based authentication and role-based authorization
- Security controls around admin actions and access

## Main backend files

- server/routes/adminRoutes.js
- server/controllers/adminController.js
- server/middleware/authMiddleware.js
- server/middleware/rateLimiter.js
- server/middleware/activityLogger.js
- server/models/User.js
- server/models/ActivityLog.js

## 2) Admin Module Design

The admin module is exposed under:

- /api/admin/*

All admin endpoints enforce:

- JWT validation via protect middleware
- role validation via isAdmin middleware
- endpoint-level rate limits
- validation middleware for sensitive input paths
- activity logging for auditable admin actions

## Admin endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/admin/stats | Dashboard statistics (users, CO2, active users, faculties) |
| GET | /api/admin/users | List all users (password excluded) |
| PUT | /api/admin/users/:id | Update user profile fields and role |
| DELETE | /api/admin/users/:id | Delete a user with safety checks |
| GET | /api/admin/recent-trips | Admin live feed of latest trip activity |
| GET | /api/admin/report | Aggregated sustainability report payload |
| POST | /api/admin/email-report | Send report email using SMTP settings |
| POST | /api/admin/ai-insights | Generate AI insights for report context |
| GET | /api/admin/activity-logs | Paginated and filterable audit logs |

## 3) User Management (Admin Side)

## Read users

- Endpoint: GET /api/admin/users
- Access: Admin JWT only
- Security: password field excluded from response

## Update users

- Endpoint: PUT /api/admin/users/:id
- Access: Admin JWT only
- Validation and safety:
  - MongoDB ObjectId format validation
  - Input field validation (name, email, faculty, role)
  - Email uniqueness enforcement
  - At least one update field must be provided
  - Prevents self-role modification

## Delete users

- Endpoint: DELETE /api/admin/users/:id
- Access: Admin JWT only
- Safety controls:
  - Prevents self-deletion
  - Prevents deleting last admin account
  - Returns proper not-found and validation errors

## Activity logs integration

Sensitive management routes integrate action logs through activityLogger middleware:

- action type
- target type and target id
- optional before/after change payload
- request IP and user agent
- operation status

## 4) JWT Authentication and Authorization

## Authentication flow

1. User registers or logs in at /api/auth/register or /api/auth/login.
2. Server signs a JWT token with:
   - user id
   - user role
3. Client stores token and sends it in:
   - Authorization: Bearer <token>
4. protect middleware verifies token and loads user from database.
5. isAdmin middleware validates role === admin for admin routes.

## Token verification behavior

- Missing token: 401 Unauthorized
- Invalid/expired token: 401 Unauthorized
- Token user not found: 401 Unauthorized
- Valid token but non-admin for admin routes: 403 Forbidden

## Middleware responsibilities

## protect middleware

- Extracts bearer token from Authorization header
- Verifies JWT with JWT_SECRET
- Hydrates req.user from database (password excluded)
- Rejects invalid state with 401

## isAdmin middleware

- Checks req.user role
- Allows only admin role
- Rejects with 403 if not admin

## 5) Security Controls Implemented

## Role-based access control (RBAC)

- Separate checks for authenticated user vs admin user
- Admin-only route protections centralized in route middleware chain

## Input validation and sanitization

- express-validator based input checks on user update and report/email operations
- ObjectId sanitization utilities for route params
- Validation errors returned in structured format

## Rate limiting strategy

Defined in rateLimiter middleware with tiered controls:

- loginLimiter: login brute-force defense
- adminLimiter: baseline admin API throttling
- strictAdminLimiter: lower threshold for update/delete operations
- reportLimiter: tighter limits on heavy report/AI endpoints

This reduces abuse and denial-of-service risk for privileged operations.

## Self-protection rules (critical admin safety)

- Admin cannot modify own role
- Admin cannot delete own account
- System prevents deleting last remaining admin

These controls prevent accidental lockout and privilege mishandling.

## HTTP security middleware

Applied globally in app bootstrap:

- helmet for secure HTTP headers
- CORS restriction logic with allowed origins
- request sanitization middleware to reduce injection surface

## 6) Request/Response Examples (Admin + JWT)

## Example: get admin stats

```http
GET /api/admin/stats
Authorization: Bearer <ADMIN_JWT>
```

Success response:

```json
{
  "success": true,
  "totalUsers": 147,
  "totalCO2": 2847.35,
  "activeToday": 52,
  "faculties": 6,
  "facultyData": [
    { "faculty": "Engineering", "students": 48 }
  ]
}
```

## Example: update user role

```http
PUT /api/admin/users/65a8f2b4c3d4e5f6a7b8c9d0
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{
  "role": "admin"
}
```

Success response:

```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "65a8f2b4c3d4e5f6a7b8c9d0",
    "name": "John Doe",
    "email": "john.doe@university.edu",
    "role": "admin",
    "faculty": "Engineering"
  }
}
```

## Example: missing token

```json
{
  "message": "Not authorized, no token"
}
```

## Example: non-admin token on admin route

```json
{
  "message": "Access denied. Admins only."
}
```

## 7) Audit and Observability

Admin operations are auditable through:

- /api/admin/activity-logs

Supports:

- pagination
- filtering by action
- timeline review
- monitoring administrative change history

This provides traceability and accountability for privileged actions.

## 8) Test Evidence for This Scope

Relevant backend tests that validate this scope:

- server/tests/admin.controller.test.js
- server/tests/activityLog.test.js
- server/tests/integration/auth.integration.test.js

Coverage includes:

- admin authorization outcomes
- user update and delete edge cases
- activity logging and aggregation behavior
- JWT-protected profile and auth flows
- rate limiting enforcement scenarios

## 9) Conclusion

The Admin + User Management + JWT implementation is production-aligned with:

- strong role-based access enforcement
- structured input validation
- safety controls for privileged operations
- audit logging for traceability
- layered security (JWT, rate limiting, CORS, helmet, sanitization)

This module satisfies assignment requirements for secure administration and user governance in a full-stack MERN application.
