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
  handleValidation,
  sanitizeObjectId,
} = require("../middleware/validation.middlewire");
const { logActivity } = require("../middleware/activityLogger");

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Retrieve comprehensive statistics including total users, CO2 saved, active users, and faculty breakdown
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
 *     description: Retrieve a list of all registered users (passwords excluded)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
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
 *                     createdAt: 2026-01-20T14:45:00.000Z
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
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
 *       - Email must be unique across all users
 *       - Role must be either 'user' or 'admin'
 *       - User ID must be a valid MongoDB ObjectId
 *
 *       **Security:**
 *       - Requires admin privileges
 *       - Requires valid JWT authentication token
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
 *         description: Bad Request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               emailInUse:
 *                 summary: Email already exists
 *                 value:
 *                   message: Email already in use
 *               invalidRole:
 *                 summary: Invalid role value
 *                 value:
 *                   message: Role must be either 'user' or 'admin'
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
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access denied. Admin privileges required.
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Update failed
 */
router.put(
  "/users/:id",
  protect,
  isAdmin,
  logActivity('UPDATE', 'USER', (req) => ({
    targetId: req.params.id,
    targetName: req.body.name,
    description: `Updated user ${req.body.name || 'details'}`,
    changes: req.body
  })),
  sanitizeObjectId,
  validateUserId,
  validateUserUpdate,
  validateAtLeastOneField,
  handleValidation,
  updateUser,
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Permanently delete a user from the system
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
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/users/:id",
  protect,
  isAdmin,
  logActivity('DELETE', 'USER', (req) => ({
    targetId: req.params.id,
    description: `Deleted user account`
  })),
  sanitizeObjectId,
  validateUserId,
  handleValidation,
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
 *     summary: Get report data
 *     description: Generate comprehensive report data for admin analysis
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date (YYYY-MM-DD)
 *         example: 2026-01-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date (YYYY-MM-DD)
 *         example: 2026-01-31
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
 *                   description: Comprehensive report statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get("/report", protect, isAdmin, getReportData);

/**
 * @swagger
 * /api/admin/email-report:
 *   post:
 *     summary: Email report to recipient
 *     description: Generate and send a detailed report via email to specified address
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailReport'
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
 *                   example: Report email sent successfully
 *       400:
 *         description: Invalid request - missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error or email delivery failed
 */
router.post("/email-report", protect, isAdmin, emailReport);

/**
 * @swagger
 * /api/admin/ai-insights:
 *   post:
 *     summary: Get AI-powered insights
 *     description: Request AI analysis and insights based on provided data using Google Gemini
 *     tags: [AI Insights]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIInsightsRequest'
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
 *                   description: AI generated insights and recommendations
 *                   example: Based on the data, Engineering faculty has the highest CO2 savings...
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: AI service error
 */
router.post("/ai-insights", getAIInsights);

/**
 * @swagger
 * /api/admin/activity-logs:
 *   get:
 *     summary: Get activity logs
 *     description: Retrieve admin activity logs with filtering and pagination
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
 *                 pagination:
 *                   type: object
 *                 statistics:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get("/activity-logs", protect, isAdmin, getActivityLogs);

module.exports = router;
