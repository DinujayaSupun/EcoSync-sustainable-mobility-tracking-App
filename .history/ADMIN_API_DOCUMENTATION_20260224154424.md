# Admin & Security API Documentation - Postman Testing Guide

**Project**: Sustainability Commute Tracker  
**Your Role**: Admin Features & Security Implementation  
**Base URL**: `http://localhost:5000` (or your deployed server URL)

---

## 📋 Table of Contents

1. [Security Features Implemented](#security-features)
2. [Authentication APIs](#authentication-apis)
3. [Admin Dashboard APIs](#admin-dashboard-apis)
4. [Postman Collection Setup](#postman-setup)

---

## 🔒 Security Features Implemented

### 1. **JWT Authentication**

- Token-based authentication using JSON Web Tokens
- 7-day token expiration
- Bearer token implementation

### 2. **Role-Based Access Control (RBAC)**

- Two roles: `user` and `admin`
- Middleware: `protect` (authentication) and `isAdmin` (authorization)
- Admin-only routes protection

### 3. **Password Security**

- Bcrypt hashing (10 rounds)
- Minimum 8 characters requirement
- Automatic hashing before database storage

### 4. **Input Validation**

- Email format validation using regex
- Password strength checks
- Required field validation

### 5. **Rate Limiting**

- 100 requests per 15 minutes per IP
- Applied to all `/api/*` routes
- DDoS protection

### 6. **Security Headers**

- Helmet.js implementation
- XSS protection
- Content Security Policy

### 7. **Error Handling**

- Generic error messages (prevents information leakage)
- No password or sensitive data in responses
- User enumeration prevention

### 8. **CORS Configuration**

- Configured allowed origins
- Credentials support

---

## 🔐 AUTHENTICATION APIs

### 1. Register User

**Endpoint**: `POST /api/auth/register`  
**Access**: Public  
**Description**: Register a new user account

**Headers**:

```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "faculty": "Computing"
}
```

**Success Response** (201):

```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65f1234567890abcdef12345",
    "id": "65f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "faculty": "Computing"
  }
}
```

**Error Responses**:

- 400: Missing fields, invalid email, weak password, user exists
- 500: Server error

**Security Validations**:

- ✅ Email format validation
- ✅ Password min 8 characters
- ✅ Duplicate email check
- ✅ Password auto-hashing

---

### 2. Login User

**Endpoint**: `POST /api/auth/login`  
**Access**: Public  
**Description**: Authenticate user and get JWT token

**Headers**:

```json
{
  "Content-Type": "application/json"
}
```

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Welcome back, John Doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "65f1234567890abcdef12345",
    "id": "65f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "faculty": "Computing",
    "total_co2_saved": 125.5
  }
}
```

**Error Responses**:

- 400: Missing credentials
- 401: Invalid email or password
- 500: Server error

**Security Features**:

- ✅ Unified error message (no user enumeration)
- ✅ Bcrypt password comparison
- ✅ JWT generation with role

---

### 3. Get User Profile

**Endpoint**: `GET /api/auth/profile`  
**Access**: Protected (requires authentication)  
**Description**: Get logged-in user's profile

**Headers**:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request Body**: None (GET request)

**Success Response** (200):

```json
{
  "success": true,
  "user": {
    "_id": "65f1234567890abcdef12345",
    "id": "65f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "faculty": "Computing",
    "total_co2_saved": 125.5,
    "joinedDate": "2026-02-01T10:30:00.000Z"
  }
}
```

**Error Responses**:

- 401: Not authorized, no token / invalid token
- 404: User not found
- 500: Server error

**Security Features**:

- ✅ JWT verification
- ✅ Password excluded from response
- ✅ Token expiration check

---

## 👨‍💼 ADMIN DASHBOARD APIs

> **Note**: All admin routes require:
>
> 1. Valid JWT token (authentication)
> 2. Admin role (authorization)

### 4. Get Admin Statistics

**Endpoint**: `GET /api/admin/stats`  
**Access**: Protected + Admin Only  
**Description**: Get comprehensive dashboard statistics

**Headers**:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <ADMIN_TOKEN>"
}
```

**Request Body**: None

**Success Response** (200):

```json
{
  "success": true,
  "totalUsers": 245,
  "totalCO2": 5678.45,
  "activeToday": 42,
  "faculties": 8,
  "facultyData": [
    {
      "faculty": "Computing",
      "students": 89
    },
    {
      "faculty": "Engineering",
      "students": 67
    }
  ]
}
```

**Error Responses**:

- 401: Not authorized (no/invalid token)
- 403: Access denied (not admin)
- 500: Server error

**Security Check**:

- ✅ JWT verification (protect middleware)
- ✅ Admin role check (isAdmin middleware)

---

### 5. Get All Users

**Endpoint**: `GET /api/admin/users`  
**Access**: Protected + Admin Only  
**Description**: Get list of all registered users

**Headers**:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <ADMIN_TOKEN>"
}
```

**Request Body**: None

**Success Response** (200):

```json
[
  {
    "_id": "65f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "faculty": "Computing",
    "total_co2_saved": 125.5,
    "createdAt": "2026-02-01T10:30:00.000Z",
    "updatedAt": "2026-02-15T14:20:00.000Z"
  },
  {
    "_id": "65f1234567890abcdef67890",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "admin",
    "faculty": "Engineering",
    "total_co2_saved": 342.75,
    "createdAt": "2026-01-15T08:15:00.000Z",
    "updatedAt": "2026-02-20T11:45:00.000Z"
  }
]
```

**Error Responses**:

- 401: Not authorized
- 403: Access denied (not admin)
- 500: Server error

**Security Features**:

- ✅ Password excluded from response
- ✅ Admin-only access

---

### 6. Delete User

**Endpoint**: `DELETE /api/admin/users/:id`  
**Access**: Protected + Admin Only  
**Description**: Delete a user by ID

**Headers**:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <ADMIN_TOKEN>"
}
```

**URL Parameters**:

- `id`: User MongoDB ObjectId (e.g., `65f1234567890abcdef12345`)

**Example URL**: `DELETE /api/admin/users/65f1234567890abcdef12345`

**Request Body**: None

**Success Response** (200):

```json
{
  "message": "User deleted successfully"
}
```

**Error Responses**:

- 401: Not authorized
- 403: Access denied (not admin)
- 500: Delete failed

**Security Features**:

- ✅ Admin-only operation
- ✅ Permanent deletion from database

---

### 7. Get Recent Trips

**Endpoint**: `GET /api/admin/recent-trips`  
**Access**: Protected + Admin Only  
**Description**: Get recent commute trips for live feed

**Headers**:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <ADMIN_TOKEN>"
}
```

**Query Parameters** (optional):

- `limit`: Number of trips to return (default: 10)

**Example URL**: `GET /api/admin/recent-trips?limit=20`

**Request Body**: None

**Success Response** (200):

```json
{
  "success": true,
  "trips": [
    {
      "_id": "65f9876543210abcdef12345",
      "faculty": "Computing",
      "userName": "John Doe",
      "co2Saved": 12.45,
      "transportMode": "bicycle",
      "createdAt": "2026-02-24T09:30:00.000Z"
    },
    {
      "_id": "65f9876543210abcdef67890",
      "faculty": "Engineering",
      "userName": "Jane Smith",
      "co2Saved": 8.2,
      "transportMode": "walk",
      "createdAt": "2026-02-24T09:15:00.000Z"
    }
  ]
}
```

**Error Responses**:

- 401: Not authorized
- 403: Access denied (not admin)
- 500: Server error

---

### 8. Generate Reports

**Endpoint**: `GET /api/admin/report`  
**Access**: Protected + Admin Only  
**Description**: Generate comprehensive sustainability reports with filters

**Headers**:

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <ADMIN_TOKEN>"
}
```

**Query Parameters** (all optional):

- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `faculty`: Faculty name filter

**Example URLs**:

- All data: `GET /api/admin/report`
- Date range: `GET /api/admin/report?startDate=2026-02-01&endDate=2026-02-24`
- Faculty: `GET /api/admin/report?faculty=Computing`
- Combined: `GET /api/admin/report?startDate=2026-02-01&faculty=Computing`

**Request Body**: None

**Success Response** (200):

```json
{
  "success": true,
  "reportData": {
    "summary": {
      "totalTrips": 1250,
      "totalCO2Saved": 5678.45,
      "totalDistance": 8950.3,
      "uniqueUsers": 245,
      "dateRange": {
        "start": "2026-02-01",
        "end": "2026-02-24"
      },
      "faculty": "All faculties"
    },
    "transportBreakdown": [
      {
        "mode": "bicycle",
        "count": 520,
        "co2Saved": 2340.5,
        "distance": 3200.75
      },
      {
        "mode": "walk",
        "count": 380,
        "co2Saved": 1890.25,
        "distance": 2500.4
      },
      {
        "mode": "bus",
        "count": 350,
        "co2Saved": 1447.7,
        "distance": 3249.15
      }
    ],
    "facultyStats": [
      {
        "faculty": "Computing",
        "trips": 450,
        "co2Saved": 2034.5,
        "distance": 3200.25,
        "users": 89
      },
      {
        "faculty": "Engineering",
        "trips": 380,
        "co2Saved": 1723.4,
        "distance": 2890.5,
        "users": 67
      }
    ],
    "dailyTrends": [
      {
        "date": "2026-02-01",
        "trips": 45,
        "co2Saved": 203.45,
        "distance": 320.5
      },
      {
        "date": "2026-02-02",
        "trips": 52,
        "co2Saved": 234.8,
        "distance": 380.25
      }
    ],
    "topUsers": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "faculty": "Computing",
        "trips": 45,
        "co2Saved": 342.75,
        "distance": 520.3
      },
      {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "faculty": "Engineering",
        "trips": 38,
        "co2Saved": 298.6,
        "distance": 450.8
      }
    ]
  }
}
```

**Error Responses**:

- 401: Not authorized
- 403: Access denied (not admin)
- 500: Failed to generate report

**Features**:

- ✅ Flexible date filtering
- ✅ Faculty-specific reports
- ✅ Statistical aggregations
- ✅ Top contributors ranking

---

## 🔧 POSTMAN COLLECTION SETUP

### Environment Variables

Create a Postman environment with:

```
BASE_URL = http://localhost:5000
USER_TOKEN = (leave empty, will be set after login)
ADMIN_TOKEN = (leave empty, will be set after admin login)
```

### Step-by-Step Testing Flow

#### Part 1: User Authentication Testing

1. **Register Regular User**
   - POST `{{BASE_URL}}/api/auth/register`
   - Body: Regular user credentials
   - Save token to `USER_TOKEN`

2. **Register Admin User**
   - POST `{{BASE_URL}}/api/auth/register`
   - Body: Admin credentials (Note: Create admin via script or database)
   - OR use existing admin credentials

3. **Login as Regular User**
   - POST `{{BASE_URL}}/api/auth/login`
   - Save token to `USER_TOKEN` environment variable

4. **Login as Admin**
   - POST `{{BASE_URL}}/api/auth/login`
   - Save token to `ADMIN_TOKEN` environment variable

5. **Test Get Profile**
   - GET `{{BASE_URL}}/api/auth/profile`
   - Authorization: `Bearer {{USER_TOKEN}}`

#### Part 2: Security Testing

6. **Test Without Token**
   - GET `{{BASE_URL}}/api/admin/stats`
   - No Authorization header
   - Expected: 401 Unauthorized

7. **Test User Accessing Admin Route**
   - GET `{{BASE_URL}}/api/admin/stats`
   - Authorization: `Bearer {{USER_TOKEN}}` (regular user token)
   - Expected: 403 Forbidden

8. **Test Invalid Token**
   - GET `{{BASE_URL}}/api/admin/stats`
   - Authorization: `Bearer invalid_token_here`
   - Expected: 401 Unauthorized

#### Part 3: Admin Features Testing

9. **Get Admin Statistics**
   - GET `{{BASE_URL}}/api/admin/stats`
   - Authorization: `Bearer {{ADMIN_TOKEN}}`
   - Expected: 200 with stats

10. **Get All Users**
    - GET `{{BASE_URL}}/api/admin/users`
    - Authorization: `Bearer {{ADMIN_TOKEN}}`
    - Expected: 200 with user list

11. **Get Recent Trips**
    - GET `{{BASE_URL}}/api/admin/recent-trips?limit=10`
    - Authorization: `Bearer {{ADMIN_TOKEN}}`
    - Expected: 200 with trips

12. **Generate Full Report**
    - GET `{{BASE_URL}}/api/admin/report`
    - Authorization: `Bearer {{ADMIN_TOKEN}}`
    - Expected: 200 with comprehensive report

13. **Generate Filtered Report**
    - GET `{{BASE_URL}}/api/admin/report?startDate=2026-02-01&endDate=2026-02-24&faculty=Computing`
    - Authorization: `Bearer {{ADMIN_TOKEN}}`
    - Expected: 200 with filtered data

14. **Delete User** (Use with caution!)
    - DELETE `{{BASE_URL}}/api/admin/users/<USER_ID>`
    - Authorization: `Bearer {{ADMIN_TOKEN}}`
    - Expected: 200 success message

#### Part 4: Validation Testing

15. **Test Weak Password**
    - POST `{{BASE_URL}}/api/auth/register`
    - Body: password = "weak"
    - Expected: 400 - Password must be at least 8 characters

16. **Test Invalid Email**
    - POST `{{BASE_URL}}/api/auth/register`
    - Body: email = "notanemail"
    - Expected: 400 - Invalid email format

17. **Test Duplicate Email**
    - POST `{{BASE_URL}}/api/auth/register`
    - Body: Use existing email
    - Expected: 400 - User already exists

18. **Test Missing Fields**
    - POST `{{BASE_URL}}/api/auth/register`
    - Body: Missing required fields
    - Expected: 400 - Provide all required fields

---

## 📝 POSTMAN TEST SCRIPTS

### Auto-save Token After Login

Add this to the "Tests" tab of login requests:

```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set("ADMIN_TOKEN", jsonData.token);
  console.log("Token saved:", jsonData.token);
}
```

### Verify Response Status

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property("success");
  pm.expect(jsonData.success).to.be.true;
});
```

---

## 🎯 EVALUATION DEMONSTRATION CHECKLIST

### Security Features to Showcase:

✅ **Authentication System**

- User registration with validation
- Secure login with JWT
- Token-based session management

✅ **Authorization System**

- Role-based access control
- Protected routes middleware
- Admin-only endpoint protection

✅ **Password Security**

- Bcrypt hashing demonstration
- Password strength validation
- No plaintext passwords

✅ **Input Validation**

- Email format validation
- Required field checks
- Error message handling

✅ **Error Handling**

- Generic error messages
- No sensitive data leakage
- Consistent error responses

✅ **Rate Limiting**

- Protection against DDoS
- IP-based request limiting

✅ **Admin Dashboard Features**

- User management (view, delete)
- Real-time statistics
- Comprehensive reporting
- Recent activity monitoring

---

## 🚀 Quick Start Commands

### Create Admin User (Run in MongoDB or via script)

```javascript
// In server/setAdmin.js or MongoDB shell
const user = await User.findOne({ email: "admin@example.com" });
if (user) {
  user.role = "admin";
  await user.save();
  console.log("Admin created successfully");
}
```

### Server Start

```bash
cd server
npm start
```

### Expected Server Port

```
Server running on: http://localhost:5000
```

---

## 📊 Sample Test Data

### Regular User

```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "TestPass123",
  "faculty": "Computing"
}
```

### Admin User

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "AdminPass123",
  "faculty": "Administration"
}
```

---

## 🔍 Common Issues & Solutions

### Issue: 401 Unauthorized

**Solution**: Ensure you're using Bearer token format: `Bearer <token>`

### Issue: 403 Forbidden

**Solution**: User role is not admin. Use admin token or update user role in database.

### Issue: Token Expired

**Solution**: Login again to get a fresh token (7-day expiry).

### Issue: CORS Error

**Solution**: Ensure server CORS is configured for your client URL.

---

## 📌 Important Notes for Evaluation

1. **Security Implementation**: All admin routes require both authentication (valid JWT) and authorization (admin role)

2. **Password Security**: Passwords are hashed using bcrypt before storage, never stored in plaintext

3. **Data Protection**: User passwords are never returned in API responses

4. **Error Messages**: Generic messages prevent user enumeration and information leakage

5. **Rate Limiting**: Protects API from abuse and DDoS attacks

6. **Input Validation**: All user inputs are validated before processing

7. **Token Management**: JWT tokens expire in 7 days for security

---

**Created by**: [Your Name]  
**Role**: Admin Panel & Security Implementation  
**Date**: February 24, 2026  
**Project**: Sustainability Commute Tracker
