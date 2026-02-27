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
} = require("../controllers/adminController");
const { protect, isAdmin } = require("../middleware/authMiddleware");

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
 *     description: Update user information including name, email, faculty, or role
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to update
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               faculty:
 *                 type: string
 *                 example: Engineering
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
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
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/users/:id", protect, isAdmin, updateUser);

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
router.delete("/users/:id", protect, isAdmin, deleteUser);

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

module.exports = router;
