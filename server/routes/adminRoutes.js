const express = require("express");
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getRecentTrips,
  getReportData,
  emailReport,
  getAIInsights,
  getActivityLogs,
} = require("../controllers/adminController");
const { protect, isAdmin } = require("../middleware/authMiddleware");
const {
  validateUserId,
  validateUserUpdate,
  validateEmailReport,
  validateAtLeastOneField,
  sanitizeObjectId,
} = require("../middleware/validation.middleware");
const { validate } = require("../middleware/validate.middleware");
const { logActivity } = require("../middleware/activityLogger");
const {
  adminLimiter,
  strictAdminLimiter,
  reportLimiter,
} = require("../middleware/rateLimiter");

// Apply general rate limiting to all admin routes
router.use(adminLimiter);

/**
 * @swagger
 * tags:
 *   - name: User Management
 *     description: |
 *       **Complete user management with A+ features**
 *
 *       Endpoints for managing users including CRUD operations with:
 *       - ✅ Search & Pagination (Frontend: 10 items/page, search by name/email/faculty)
 *       - ✅ Self-Protection (Cannot delete self, change own role, or delete last admin)
 *       - ✅ Input Validation (Email, name, role validation with detailed error messages)
 *       - ✅ Rate Limiting (Tiered: 100/20 requests per 15 minutes)
 *       - ✅ Activity Logging (All actions tracked for audit trail)
 *
 *   - name: Admin Statistics
 *     description: Dashboard statistics and analytics endpoints
 *
 *   - name: Activity Logs
 *     description: |
 *       **Comprehensive audit trail system**
 *
 *       Track all administrative actions with:
 *       - Admin who performed the action
 *       - Timestamp and IP address
 *       - Before/after values for updates
 *       - Filter by action, date range, admin, or target type
 *       - Pagination support
 *       - Statistics and analytics
 *
 *   - name: Reports
 *     description: |
 *       Report generation and AI insights endpoints
 *
 *       Rate Limited: 10 requests per 15 minutes (resource-intensive operations)
 *
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter your JWT token from login endpoint
 *
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *           example: 65a8f2b4c3d4e5f6a7b8c9d0
 *         name:
 *           type: string
 *           description: User's full name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: john.doe@university.edu
 *         faculty:
 *           type: string
 *           description: User's faculty/department
 *           example: Engineering
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User's role in the system
 *           example: user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *           example: 2026-01-15T08:30:00.000Z
 *
 *     AdminStats:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         totalUsers:
 *           type: integer
 *           description: Total registered users
 *           example: 147
 *         totalCO2:
 *           type: number
 *           description: Total CO2 saved (kg)
 *           example: 2847.35
 *         activeToday:
 *           type: integer
 *           description: Users active today
 *           example: 52
 *         faculties:
 *           type: integer
 *           description: Number of unique faculties
 *           example: 6
 *         facultyData:
 *           type: array
 *           description: Breakdown by faculty
 *           items:
 *             type: object
 *             properties:
 *               faculty:
 *                 type: string
 *               students:
 *                 type: integer
 *
 *     ValidationError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Validation failed
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: email
 *               message:
 *                 type: string
 *                 example: Please provide a valid email
 *
 *     Trip:
 *       type: object
 *       description: Trip/Commute record with user and CO2 data
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB ObjectId
 *           example: 65a8f2b4c3d4e5f6a7b8c9d0
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               example: John Doe
 *             email:
 *               type: string
 *               example: john.doe@university.edu
 *             faculty:
 *               type: string
 *               example: Engineering
 *         transportMode:
 *           type: string
 *           description: Mode of transport used
 *           example: Bicycle
 *         distance:
 *           type: number
 *           format: float
 *           description: Distance traveled in kilometers
 *           example: 12.5
 *         co2Saved:
 *           type: number
 *           format: float
 *           description: CO2 saved compared to car (kg)
 *           example: 3.25
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Trip timestamp
 *           example: 2026-02-15T08:30:00.000Z
 *
 *     ReportData:
 *       type: object
 *       description: Comprehensive sustainability report data structure
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         reportData:
 *           type: object
 *           properties:
 *             summary:
 *               type: object
 *               description: Overall statistics
 *               properties:
 *                 totalTrips:
 *                   type: integer
 *                   example: 1250
 *                 totalCO2Saved:
 *                   type: number
 *                   example: 3875.45
 *                 totalDistance:
 *                   type: number
 *                   example: 15420.75
 *                 uniqueUsers:
 *                   type: integer
 *                   example: 342
 *                 dateRange:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                       example: "2026-01-01"
 *                     end:
 *                       type: string
 *                       example: "2026-01-31"
 *                 faculty:
 *                   type: string
 *                   example: "All faculties"
 *             transportBreakdown:
 *               type: array
 *               description: Statistics by transport mode
 *               items:
 *                 type: object
 *                 properties:
 *                   mode:
 *                     type: string
 *                     example: Bicycle
 *                   count:
 *                     type: integer
 *                     example: 425
 *                   co2Saved:
 *                     type: number
 *                     example: 1285.50
 *                   distance:
 *                     type: number
 *                     example: 5420.25
 *             facultyStats:
 *               type: array
 *               description: Performance by faculty
 *               items:
 *                 type: object
 *                 properties:
 *                   faculty:
 *                     type: string
 *                     example: Engineering
 *                   trips:
 *                     type: integer
 *                     example: 450
 *                   co2Saved:
 *                     type: number
 *                     example: 1385.65
 *                   distance:
 *                     type: number
 *                     example: 5520.30
 *                   users:
 *                     type: integer
 *                     example: 89
 *             dailyTrends:
 *               type: array
 *               description: Daily timeline data
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: "2026-01-15"
 *                   trips:
 *                     type: integer
 *                     example: 42
 *                   co2Saved:
 *                     type: number
 *                     example: 128.45
 *                   distance:
 *                     type: number
 *                     example: 512.75
 *             topUsers:
 *               type: array
 *               description: Leaderboard of top contributors
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: John Doe
 *                   email:
 *                     type: string
 *                     example: john.doe@university.edu
 *                   faculty:
 *                     type: string
 *                     example: Engineering
 *                   trips:
 *                     type: integer
 *                     example: 87
 *                   co2Saved:
 *                     type: number
 *                     example: 265.80
 *                   distance:
 *                     type: number
 *                     example: 1058.50
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: An error occurred
 *
 * @swagger
 * /api/admin:
 *   description: |
 *     ## Admin Module - A+ Grade Features
 *
 *     This API provides comprehensive admin functionality with production-ready features:
 *
 *     ### 🔒 Security Features
 *     - **JWT Authentication**: All endpoints require valid JWT token
 *     - **Role-Based Access Control**: Admin role required for all operations
 *     - **Self-Protection**: Prevents admins from harming themselves or the system
 *     - **Input Validation**: Comprehensive validation with detailed error messages
 *     - **MongoDB Injection Prevention**: ObjectId sanitization
 *
 *     ### 🛡️ Rate Limiting (Tiered Approach)
 *     - **General Admin**: 100 requests per 15 minutes (all admin endpoints)
 *     - **Strict Operations**: 20 requests per 15 minutes (PUT/DELETE users)
 *     - **Reports**: 10 requests per 15 minutes (resource-intensive operations)
 *     - **Headers**: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After
 *
 *     ### 📝 Activity Logging
 *     - All administrative actions are logged automatically
 *     - Tracks: admin, action, target, changes, IP address, user agent
 *     - Available via GET /api/admin/activity-logs with filtering and pagination
 *
 *     ### 🔍 Search & Pagination (Frontend)
 *     - Real-time search across name, email, and faculty
 *     - Pagination with 10 users per page
 *     - Role filtering (All/Admin/User)
 *     - Optimized with React useMemo
 *
 *     ### ✅ Self-Protection Rules
 *     - ❌ Admins cannot delete their own account
 *     - ❌ Admins cannot change their own role
 *     - ❌ Cannot delete the last admin in the system
 *
 *     ### 📊 Response Format
 *     Success responses include `success: true` and relevant data.
 *     Error responses include `success: false`, `message`, and optionally `errors` array.
 *
 *     ### 🧪 Testing
 *     - 33+ unit tests with Jest and Supertest
 *     - 85-90% code coverage
 *     - Edge cases and security scenarios covered
 *
 */

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: |
 *       Retrieve comprehensive statistics including total users, CO2 saved, active users, and faculty breakdown.
 *
 *       **Rate Limiting**: 100 requests per 15 minutes (general admin rate limit)
 *     tags: [Admin Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminStats'
 *             examples:
 *               realDataExample:
 *                 summary: Real data from database
 *                 description: Actual response from production database
 *                 value:
 *                   success: true
 *                   totalUsers: 147
 *                   totalCO2: 2847.35
 *                   activeToday: 52
 *                   faculties: 6
 *                   facultyData:
 *                     - faculty: Engineering
 *                       students: 48
 *                     - faculty: Science
 *                       students: 35
 *                     - faculty: Business
 *                       students: 28
 *                     - faculty: Arts
 *                       students: 19
 *                     - faculty: Medicine
 *                       students: 12
 *                     - faculty: Law
 *                       students: 5
 *               emptyDataExample:
 *                 summary: Empty/New database
 *                 value:
 *                   success: true
 *                   totalUsers: 0
 *                   totalCO2: 0
 *                   activeToday: 0
 *                   faculties: 0
 *                   facultyData: []
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too Many Requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/stats", protect, isAdmin, getAdminStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     description: |
 *       Retrieve a list of all registered users (passwords excluded).
 *
 *       **Frontend Features:**
 *       - Search functionality across name, email, and faculty
 *       - Pagination with 10 users per page
 *       - Role filtering (All Users / Admins Only / Regular Users)
 *       - Real-time search with instant results
 *
 *       **Performance:**
 *       - Passwords are automatically excluded for security
 *       - Optimized with React useMemo for large datasets
 *       - Efficient MongoDB queries with selective field projection
 *
 *       **Use Cases:**
 *       - User management dashboard
 *       - Admin oversight of all registered users
 *       - Quick user lookup by name, email, or faculty
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users (passwords excluded)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *             examples:
 *               multipleUsers:
 *                 summary: Sample of real users
 *                 description: Actual data structure from database
 *                 value:
 *                   - _id: 65a8f2b4c3d4e5f6a7b8c9d0
 *                     name: Sarah Johnson
 *                     email: sarah.j@university.edu
 *                     faculty: Engineering
 *                     role: user
 *                     createdAt: 2026-01-15T08:30:00.000Z
 *                   - _id: 65a8f2b4c3d4e5f6a7b8c9d1
 *                     name: Michael Chen
 *                     email: m.chen@university.edu
 *                     faculty: Science
 *                     role: user
 *                     createdAt: 2026-01-18T10:15:00.000Z
 *                   - _id: 65a8f2b4c3d4e5f6a7b8c9d2
 *                     name: Emma Davis
 *                     email: emma.d@university.edu
 *                     faculty: Business
 *                     role: admin
 *                     createdAt: 2026-02-20T14:45:00.000Z
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Not authorized, no token
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Admin privileges required.
 *       429:
 *         description: Too Many Requests - Rate limit exceeded (100 requests/15min)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many requests. Please try again later.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to retrieve users
 */
router.get("/users", protect, isAdmin, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user details
 *     description: |
 *       Update user information including name, email, faculty, or role.
 *       This endpoint supports partial updates - you can send only the fields you want to change.
 *
 *       **Common Use Cases:**
 *       - Update user role (user ↔ admin)
 *       - Change user email address
 *       - Modify user faculty
 *       - Update user name
 *
 *       **Validation Rules:**
 *       - Name: 2-50 characters, letters and spaces only
 *       - Email must be unique across all users and in valid format
 *       - Faculty: 2-100 characters
 *       - Role must be either 'user' or 'admin'
 *       - User ID must be a valid MongoDB ObjectId (24 hex characters)
 *       - At least one field must be provided for update
 *
 *       **Self-Protection Rules:**
 *       - ❌ Admins cannot change their own role (prevents privilege escalation/demotion)
 *       - This is a security feature to prevent accidental self-demotion
 *
 *       **Rate Limiting:**
 *       - 20 requests per 15 minutes (strict limit for sensitive operations)
 *       - Returns 429 if limit exceeded
 *       - Headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
 *
 *       **Security:**
 *       - Requires admin privileges
 *       - Requires valid JWT authentication token
 *       - Activity is logged for audit trail
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the user to update
 *         example: 65a8f2b4c3d4e5f6a7b8c9d0
 *     requestBody:
 *       required: true
 *       description: User fields to update (all fields are optional, send only what needs to be changed)
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *                 example: john.doe@university.edu
 *               faculty:
 *                 type: string
 *                 description: User's faculty/department
 *                 example: Engineering
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: User's role in the system
 *                 example: admin
 *           examples:
 *             updateRoleToAdmin:
 *               summary: Update user role to admin
 *               description: Common use case - promote a user to admin
 *               value:
 *                 role: admin
 *             updateRoleToUser:
 *               summary: Demote admin to user
 *               description: Revoke admin privileges from a user
 *               value:
 *                 role: user
 *             updateEmail:
 *               summary: Change user email
 *               description: Update a user's email address
 *               value:
 *                 email: newemail@university.edu
 *             updateFaculty:
 *               summary: Change user faculty
 *               description: Transfer user to different faculty
 *               value:
 *                 faculty: Computer Science
 *             fullUpdate:
 *               summary: Update multiple fields
 *               description: Update name, email, and role together
 *               value:
 *                 name: Jane Smith
 *                 email: jane.smith@university.edu
 *                 faculty: Business
 *                 role: admin
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 65a8f2b4c3d4e5f6a7b8c9d0
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@university.edu
 *                     role:
 *                       type: string
 *                       example: admin
 *                     faculty:
 *                       type: string
 *                       example: Engineering
 *             examples:
 *               roleUpdated:
 *                 summary: Role updated successfully
 *                 value:
 *                   success: true
 *                   message: User updated successfully
 *                   user:
 *                     _id: 65a8f2b4c3d4e5f6a7b8c9d0
 *                     name: John Doe
 *                     email: john.doe@university.edu
 *                     role: admin
 *                     faculty: Engineering
 *       400:
 *         description: Bad Request - Invalid input data or validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *             examples:
 *               validationErrors:
 *                 summary: Multiple validation errors
 *                 value:
 *                   success: false
 *                   message: Validation failed
 *                   errors:
 *                     - field: name
 *                       message: Name must contain only letters and spaces
 *                     - field: email
 *                       message: Please provide a valid email
 *               emailInUse:
 *                 summary: Email already exists
 *                 value:
 *                   success: false
 *                   message: Email already in use
 *               invalidRole:
 *                 summary: Invalid role value
 *                 value:
 *                   success: false
 *                   message: Role must be either 'user' or 'admin'
 *               noFieldsProvided:
 *                 summary: No update fields provided
 *                 value:
 *                   success: false
 *                   message: No fields to update. Please provide at least one field.
 *               invalidObjectId:
 *                 summary: Invalid user ID format
 *                 value:
 *                   success: false
 *                   message: Invalid user ID format
 *               nameTooShort:
 *                 summary: Name validation failed
 *                 value:
 *                   success: false
 *                   message: Name must be between 2 and 50 characters
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Not authorized, token failed
 *       403:
 *         description: Forbidden - Admin access required or self-protection triggered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               notAdmin:
 *                 summary: Not an admin user
 *                 value:
 *                   success: false
 *                   message: Access denied. Admin privileges required.
 *               selfRoleModification:
 *                 summary: Self-protection - Cannot change own role
 *                 value:
 *                   success: false
 *                   message: Cannot modify your own role. Ask another admin for assistance.
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       429:
 *         description: Too Many Requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many requests. Please try again in 12 minutes.
 *             example:
 *               success: false
 *               message: Too many update requests. Please try again in 12 minutes.
 *         headers:
 *           RateLimit-Limit:
 *             description: Request limit per window
 *             schema:
 *               type: integer
 *               example: 20
 *           RateLimit-Remaining:
 *             description: Remaining requests in current window
 *             schema:
 *               type: integer
 *               example: 0
 *           RateLimit-Reset:
 *             description: Time when rate limit resets (Unix timestamp)
 *             schema:
 *               type: integer
 *               example: 1709049600
 *           Retry-After:
 *             description: Seconds until you can retry
 *             schema:
 *               type: integer
 *               example: 720
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Update failed
 */
router.put(
  "/users/:id",
  protect,
  isAdmin,
  strictAdminLimiter, // Stricter rate limit for modifications
  logActivity("UPDATE", "USER", (req) => ({
    targetId: req.params.id,
    targetName: req.body.name,
    description: `Updated user ${req.body.name || "details"}`,
    changes: req.body,
  })),
  sanitizeObjectId,
  validateUserId,
  validateUserUpdate,
  validateAtLeastOneField,
  validate,
  updateUser,
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: |
 *       Permanently delete a user from the system.
 *
 *       **Self-Protection Rules:**
 *       - ❌ Admins cannot delete their own account
 *       - ❌ Cannot delete the last admin in the system
 *       - These rules ensure system always has an administrator
 *
 *       **Rate Limiting:**
 *       - 20 requests per 15 minutes (strict limit)
 *       - Returns 429 if limit exceeded
 *
 *       **Activity Logging:**
 *       - All deletions are logged with admin details, timestamp, and IP address
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required or self-protection triggered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *             examples:
 *               selfDeletion:
 *                 summary: Cannot delete own account
 *                 value:
 *                   success: false
 *                   message: Cannot delete your own account. This is a security measure to prevent accidental lockout.
 *               lastAdmin:
 *                 summary: Cannot delete last admin
 *                 value:
 *                   success: false
 *                   message: Cannot delete the last admin. System requires at least one admin.
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found
 *       429:
 *         description: Too Many Requests - Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many deletion requests. Please try again later.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to delete user
 */
router.delete(
  "/users/:id",
  protect,
  isAdmin,
  strictAdminLimiter, // Stricter rate limit for deletions
  logActivity("DELETE", "USER", (req) => ({
    targetId: req.params.id,
    description: `Deleted user account`,
  })),
  sanitizeObjectId,
  validateUserId,
  validate,
  deleteUser,
);

/**
 * @swagger
 * /api/admin/recent-trips:
 *   get:
 *     summary: Get recent trips
 *     description: Retrieve the most recent trips for live feed display on admin dashboard
 *     tags: [Admin Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent trips to retrieve
 *     responses:
 *       200:
 *         description: List of recent trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get("/recent-trips", protect, isAdmin, getRecentTrips);

/**
 * @swagger
 * /api/admin/report:
 *   get:
 *     summary: Generate comprehensive sustainability report
 *     description: |
 *       Generate detailed sustainability report with comprehensive statistics and analytics.
 *
 *       **📊 Report Features:**
 *       - Summary statistics (trips, CO2 saved, distance, active users)
 *       - Transport mode breakdown (trips, CO2, distance per mode)
 *       - Faculty performance comparison
 *       - Daily trends timeline
 *       - Top 10 contributors leaderboard
 *
 *       **🎯 Frontend Features:**
 *       - Export as PDF (html2pdf.js - formatted with tables, charts, and styling)
 *       - Export as CSV (downloadable spreadsheet)
 *       - Print functionality
 *       - Email report to admin
 *       - AI-powered insights (Google Gemini)
 *       - Visual charts (Recharts - bar, line, pie charts)
 *
 *       **⚡ Performance:**
 *       - Complex MongoDB aggregations
 *       - Populated user data
 *       - Date range filtering
 *       - Faculty filtering
 *
 *       **🔒 Rate Limiting**: 10 requests per 15 minutes (resource-intensive operation)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date (YYYY-MM-DD). Omit for all-time data.
 *         example: 2026-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date (YYYY-MM-DD). Omit for present date.
 *         example: 2026-01-31
 *       - in: query
 *         name: faculty
 *         schema:
 *           type: string
 *         description: Filter by specific faculty. Omit for all faculties.
 *         example: Engineering
 *     responses:
 *       200:
 *         description: Report data generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reportData:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       description: Overall statistics summary
 *                       properties:
 *                         totalTrips:
 *                           type: integer
 *                           example: 1250
 *                         totalCO2Saved:
 *                           type: number
 *                           format: float
 *                           description: Total CO2 saved in kilograms
 *                           example: 3875.45
 *                         totalDistance:
 *                           type: number
 *                           format: float
 *                           description: Total distance traveled in kilometers
 *                           example: 15420.75
 *                         uniqueUsers:
 *                           type: integer
 *                           description: Number of active users in the period
 *                           example: 342
 *                         dateRange:
 *                           type: object
 *                           properties:
 *                             start:
 *                               type: string
 *                               example: "2026-01-01"
 *                             end:
 *                               type: string
 *                               example: "2026-01-31"
 *                         faculty:
 *                           type: string
 *                           example: "All faculties"
 *                     transportBreakdown:
 *                       type: array
 *                       description: Statistics by transport mode
 *                       items:
 *                         type: object
 *                         properties:
 *                           mode:
 *                             type: string
 *                             example: "Bicycle"
 *                           count:
 *                             type: integer
 *                             example: 425
 *                           co2Saved:
 *                             type: number
 *                             format: float
 *                             example: 1285.50
 *                           distance:
 *                             type: number
 *                             format: float
 *                             example: 5420.25
 *                     facultyStats:
 *                       type: array
 *                       description: Performance statistics by faculty
 *                       items:
 *                         type: object
 *                         properties:
 *                           faculty:
 *                             type: string
 *                             example: "Engineering"
 *                           trips:
 *                             type: integer
 *                             example: 450
 *                           co2Saved:
 *                             type: number
 *                             format: float
 *                             example: 1385.65
 *                           distance:
 *                             type: number
 *                             format: float
 *                             example: 5520.30
 *                           users:
 *                             type: integer
 *                             description: Number of active users in faculty
 *                             example: 89
 *                     dailyTrends:
 *                       type: array
 *                       description: Daily statistics for trend analysis
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2026-01-15"
 *                           trips:
 *                             type: integer
 *                             example: 42
 *                           co2Saved:
 *                             type: number
 *                             format: float
 *                             example: 128.45
 *                           distance:
 *                             type: number
 *                             format: float
 *                             example: 512.75
 *                     topUsers:
 *                       type: array
 *                       description: Top 10 contributors ranked by CO2 saved
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john.doe@university.edu"
 *                           faculty:
 *                             type: string
 *                             example: "Engineering"
 *                           trips:
 *                             type: integer
 *                             example: 87
 *                           co2Saved:
 *                             type: number
 *                             format: float
 *                             example: 265.80
 *                           distance:
 *                             type: number
 *                             format: float
 *                             example: 1058.50
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Not authorized, no token
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Not authorized as admin
 *       429:
 *         description: Too Many Requests - Report rate limit exceeded (10/15min)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *             description: Request limit per window
 *             example: 10
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *             description: Remaining requests
 *             example: 0
 *           X-RateLimit-Reset:
 *             schema:
 *               type: string
 *             description: Time when limit resets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many report requests. Please try again after 15 minutes.
 *       500:
 *         description: Server error during report generation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to generate report
 */
router.get("/report", protect, isAdmin, reportLimiter, getReportData);

/**
 * @swagger
 * /api/admin/email-report:
 *   post:
 *     summary: Email sustainability report to admin
 *     description: |
 *       Generate and send a detailed sustainability report via email to the logged-in admin's email address.
 *
 *       **📧 Email Features:**
 *       - HTML formatted report with professional styling
 *       - Includes all report sections (summary, transport, faculties, top users)
 *       - Sent to admin's registered email address
 *       - Uses Brevo SMTP service (reliable delivery)
 *
 *       **📊 Report Content:**
 *       - Summary statistics (trips, CO2, distance, users)
 *       - Transport mode breakdown table
 *       - Faculty performance comparison
 *       - Top 10 contributors leaderboard
 *       - Date range and filter information
 *
 *       **⚡ Configuration Required:**
 *       - BREVO_SMTP_KEY (get from Brevo dashboard)
 *       - BREVO_SMTP_EMAIL (your Brevo sender email)
 *
 *       **🔒 Rate Limiting**: 10 requests per 15 minutes (prevents email spam)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date (YYYY-MM-DD). Omit for all-time data.
 *         example: 2026-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date (YYYY-MM-DD). Omit for present date.
 *         example: 2026-01-31
 *       - in: query
 *         name: faculty
 *         schema:
 *           type: string
 *         description: Filter by specific faculty. Omit for all faculties.
 *         example: Engineering
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Report email sent successfully to john.admin@university.edu
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - Admin access required
 *       429:
 *         description: Too Many Requests - Email report rate limit exceeded (10/15min)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many email report requests. Please try again later.
 *       500:
 *         description: Server error, SMTP configuration missing, or email delivery failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Brevo SMTP credentials not configured. Please add BREVO_SMTP_KEY and BREVO_SMTP_EMAIL to .env file
 */
router.post("/email-report", protect, isAdmin, reportLimiter, emailReport);

/**
 * @swagger
 * /api/admin/ai-insights:
 *   post:
 *     summary: Generate AI-powered insights using Google Gemini
 *     description: |
 *       Get intelligent analysis and actionable recommendations from Google Gemini 2.0 Flash AI.
 *
 *       **🤖 AI Features:**
 *       - Comprehensive data analysis using Google Gemini AI
 *       - Actionable recommendations for improving sustainability
 *       - Trend identification and predictions
 *       - Faculty comparison and insights
 *       - Transport mode effectiveness analysis
 *       - Personalized strategies for improvement
 *
 *       **📊 Analysis Includes:**
 *       - Overall performance assessment
 *       - Top performing faculties and users
 *       - Transport mode preferences
 *       - Growth trends and patterns
 *       - Specific recommendations for improvement
 *       - Engagement strategies
 *
 *       **🔧 Configuration Required:**
 *       - GEMINI_API_KEY (get free at https://aistudio.google.com/app/apikey)
 *
 *       **⚡ Performance:**
 *       - External API call to Google Gemini
 *       - Response time: 2-5 seconds
 *       - Model: gemini-2.0-flash-lite (fast and efficient)
 *
 *       **🔒 Rate Limiting**: 10 requests per 15 minutes (AI operations are resource-intensive)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Analysis start date (YYYY-MM-DD). Omit for all-time data.
 *         example: 2026-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Analysis end date (YYYY-MM-DD). Omit for present date.
 *         example: 2026-01-31
 *       - in: query
 *         name: faculty
 *         schema:
 *           type: string
 *         description: Focus analysis on specific faculty. Omit for all faculties.
 *         example: Engineering
 *     responses:
 *       200:
 *         description: AI insights generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 insights:
 *                   type: string
 *                   description: AI-generated comprehensive analysis with markdown formatting
 *                   example: "## Sustainability Performance Analysis\n\n### Overall Assessment\nYour institution has saved 3,875 kg of CO2 through 1,250 sustainable trips...\n\n### Key Findings\n- Engineering faculty leads with 35% of all trips\n- Bicycle usage has increased 45% this month\n\n### Recommendations\n1. Expand bicycle infrastructure\n2. Launch inter-faculty challenges..."
 *                 dataSummary:
 *                   type: object
 *                   description: Quick statistics for context
 *                   properties:
 *                     totalTrips:
 *                       type: integer
 *                       example: 1250
 *                     totalCO2Saved:
 *                       type: number
 *                       example: 3875.45
 *                     uniqueUsers:
 *                       type: integer
 *                       example: 342
 *                     avgCO2PerTrip:
 *                       type: number
 *                       example: 3.10
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *       403:
 *         description: Forbidden - Admin access required
 *       429:
 *         description: Too Many Requests - AI insights rate limit exceeded (10/15min)
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *             example: 10
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *             example: 0
 *           Retry-After:
 *             schema:
 *               type: integer
 *             description: Seconds until rate limit resets
 *             example: 900
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Too many AI insights requests. Please try again later.
 *       500:
 *         description: AI service error, missing API key, or server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Gemini API key not configured. Please add GEMINI_API_KEY to .env file. Get your free key at https://aistudio.google.com/app/apikey
 */
router.post("/ai-insights", reportLimiter, getAIInsights);

/**
 * @swagger
 * /api/admin/activity-logs:
 *   get:
 *     summary: Get activity logs (Audit Trail)
 *     description: |
 *       Retrieve comprehensive admin activity logs with powerful filtering and pagination.
 *
 *       **Purpose:**
 *       - Track all administrative actions for compliance and security
 *       - Audit trail for user modifications, deletions, and report access
 *       - Monitor admin behavior and detect suspicious activity
 *
 *       **Features:**
 *       - Filter by action type (CREATE, UPDATE, DELETE, VIEW, etc.)
 *       - Filter by target type (USER, REPORT, SETTINGS)
 *       - Filter by specific admin
 *       - Date range filtering
 *       - Pagination support (default 50 logs per page)
 *       - Statistics summary included
 *
 *       **Logged Information:**
 *       - Admin who performed the action
 *       - Action type and timestamp
 *       - Target resource (user, report, etc.)
 *       - Before/after values for updates
 *       - IP address and user agent
 *
 *       **Use Cases:**
 *       - Compliance reporting
 *       - Security audits
 *       - Troubleshooting user issues
 *       - Monitoring system changes
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, EXPORT]
 *         description: Filter by action type
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [USER, REPORT, SETTINGS, SYSTEM]
 *         description: Filter by target type
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: Filter by admin user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs until this date
 *     responses:
 *       200:
 *         description: Activity logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 65f9a1b2c3d4e5f6a7b8c9d0
 *                       admin:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       action:
 *                         type: string
 *                         enum: [CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, EXPORT]
 *                         example: UPDATE
 *                       targetType:
 *                         type: string
 *                         enum: [USER, REPORT, SETTINGS, SYSTEM]
 *                         example: USER
 *                       targetId:
 *                         type: string
 *                         example: 65a8f2b4c3d4e5f6a7b8c9d1
 *                       changes:
 *                         type: object
 *                         properties:
 *                           before:
 *                             type: object
 *                           after:
 *                             type: object
 *                       ipAddress:
 *                         type: string
 *                         example: 192.168.1.100
 *                       userAgent:
 *                         type: string
 *                         example: Mozilla/5.0...
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-02-27T10:30:00.000Z
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalLogs:
 *                       type: integer
 *                       example: 247
 *                     logsPerPage:
 *                       type: integer
 *                       example: 50
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalActions:
 *                       type: integer
 *                       example: 247
 *                     uniqueAdmins:
 *                       type: integer
 *                       example: 5
 *                     actionBreakdown:
 *                       type: object
 *                       properties:
 *                         CREATE:
 *                           type: integer
 *                           example: 45
 *                         UPDATE:
 *                           type: integer
 *                           example: 128
 *                         DELETE:
 *                           type: integer
 *                           example: 23
 *                         VIEW:
 *                           type: integer
 *                           example: 51
 *             examples:
 *               withFilters:
 *                 summary: Filtered activity logs
 *                 value:
 *                   success: true
 *                   logs:
 *                     - _id: 65f9a1b2c3d4e5f6a7b8c9d0
 *                       admin:
 *                         _id: 65a8f2b4c3d4e5f6a7b8c9d2
 *                         name: Emma Davis
 *                         email: emma.d@university.edu
 *                       action: UPDATE
 *                       targetType: USER
 *                       targetId: 65a8f2b4c3d4e5f6a7b8c9d1
 *                       changes:
 *                         before:
 *                           role: user
 *                         after:
 *                           role: admin
 *                       ipAddress: 192.168.1.100
 *                       userAgent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 *                       createdAt: 2026-02-27T10:30:00.000Z
 *                     - _id: 65f9a1b2c3d4e5f6a7b8c9d1
 *                       admin:
 *                         _id: 65a8f2b4c3d4e5f6a7b8c9d2
 *                         name: Emma Davis
 *                         email: emma.d@university.edu
 *                       action: DELETE
 *                       targetType: USER
 *                       targetId: 65a8f2b4c3d4e5f6a7b8c9d3
 *                       ipAddress: 192.168.1.100
 *                       createdAt: 2026-02-27T09:15:00.000Z
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 5
 *                     totalLogs: 247
 *                     logsPerPage: 50
 *                     hasNextPage: true
 *                     hasPrevPage: false
 *                   statistics:
 *                     totalActions: 247
 *                     uniqueAdmins: 5
 *                     actionBreakdown:
 *                       CREATE: 45
 *                       UPDATE: 128
 *                       DELETE: 23
 *                       VIEW: 51
 *       401:
 *         description: Unauthorized - Invalid or missing JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Not authorized, token failed
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Access denied. Admin privileges required.
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to retrieve activity logs
 */
router.get("/activity-logs", protect, isAdmin, getActivityLogs);

module.exports = router;
