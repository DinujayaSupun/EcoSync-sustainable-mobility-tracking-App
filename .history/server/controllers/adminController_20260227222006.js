const User = require("../models/User");
const Trip = require("../models/Trip");
const ActivityLog = require("../models/ActivityLog");
const nodemailer = require("nodemailer");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.getAdminStats = async (req, res) => {
  try {
    // 1. Total users count
    const totalUsers = await User.countDocuments();

    // 2. Get trip statistics
    const tripStats = await Trip.aggregate([
      {
        $group: {
          _id: null,
          totalDistance: { $sum: "$distance" },
          totalCO2: { $sum: "$co2Saved" },
        },
      },
    ]);

    const stats = tripStats[0] || { totalDistance: 0, totalCO2: 0 };

    // 3. Count unique faculties
    const faculties = await User.distinct("faculty");
    const facultyCount = faculties.filter((f) => f && f.trim() !== "").length;

    // 4. Count users active today (users who logged trips today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    const activeTodayResult = await Trip.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: "$user",
        },
      },
      {
        $count: "uniqueUsers",
      },
    ]);

    const activeToday =
      activeTodayResult.length > 0 ? activeTodayResult[0].uniqueUsers : 0;

    // 5. Faculty breakdown data
    const facultyData = await User.aggregate([
      { $match: { faculty: { $ne: null, $ne: "" } } },
      { $group: { _id: "$faculty", count: { $sum: 1 } } },
      { $project: { faculty: "$_id", students: "$count", _id: 0 } },
      { $sort: { students: -1 } },
    ]);

    res.status(200).json({
      success: true,
      totalUsers,
      totalCO2: parseFloat(stats.totalCO2.toFixed(2)),
      activeToday,
      faculties: facultyCount,
      facultyData,
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
      totalUsers: 0,
      totalCO2: 0,
      activeToday: 0,
      faculties: 0,
      facultyData: [],
    });
  }
};

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password"); // Security: Don't send passwords!
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// UPDATE a user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, faculty, role } = req.body;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        errors: [{ field: "id", message: "Must be a valid MongoDB ObjectId" }],
      });
    }

    // Validate at least one field is provided
    if (!name && !email && !faculty && !role) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
        errors: [
          {
            field: "body",
            message:
              "At least one field (name, email, faculty, role) must be provided",
          },
        ],
      });
    }

    // Find user with error handling
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errors: [{ field: "id", message: `No user found with ID: ${id}` }],
      });
    }

    // Store original values for logging
    const originalValues = {
      name: user.name,
      email: user.email,
      faculty: user.faculty,
      role: user.role,
    };

    // Validate and check email uniqueness
    if (email && email !== user.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
          errors: [
            { field: "email", message: "Please provide a valid email address" },
          ],
        });
      }

      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
          errors: [
            {
              field: "email",
              message: `Email '${email}' is already registered to another user`,
            },
          ],
        });
      }
    }

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Invalid name",
          errors: [
            {
              field: "name",
              message: "Name must be at least 2 characters long",
            },
          ],
        });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Invalid name",
          errors: [
            { field: "name", message: "Name must not exceed 100 characters" },
          ],
        });
      }
    }

    // Validate faculty
    if (faculty !== undefined) {
      if (typeof faculty !== "string" || faculty.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Invalid faculty",
          errors: [
            {
              field: "faculty",
              message: "Faculty must be at least 2 characters long",
            },
          ],
        });
      }
    }

    // Validate role
    if (role !== undefined) {
      if (!["user", "admin"].includes(role.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
          errors: [
            { field: "role", message: "Role must be either 'user' or 'admin'" },
          ],
        });
      }

      // Prevent self-demotion (if implemented with user context)
      // if (req.user && req.user._id.toString() === id && role === 'user' && user.role === 'admin') {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Cannot demote yourself",
      //     errors: [{ field: "role", message: "You cannot change your own admin role" }]
      //   });
      // }
    }

    // Update fields
    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (faculty) user.faculty = faculty.trim();
    if (role) user.role = role.toLowerCase();

    // Save with error handling
    await user.save();

    // Log the update
    console.log(`[ADMIN UPDATE] User ${id} updated by admin. Changes:`, {
      name:
        originalValues.name !== user.name
          ? { from: originalValues.name, to: user.name }
          : "unchanged",
      email:
        originalValues.email !== user.email
          ? { from: originalValues.email, to: user.email }
          : "unchanged",
      faculty:
        originalValues.faculty !== user.faculty
          ? { from: originalValues.faculty, to: user.faculty }
          : "unchanged",
      role:
        originalValues.role !== user.role
          ? { from: originalValues.role, to: user.role }
          : "unchanged",
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        errors: [{ field: error.path, message: "Invalid value provided" }],
      });
    }

    res.status(500).json({
      success: false,
      message: "Update failed due to server error",
      errors: [
        {
          field: "server",
          message: "An unexpected error occurred. Please try again later.",
        },
      ],
    });
  }
};

// DELETE a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        errors: [{ field: "id", message: "Must be a valid MongoDB ObjectId" }],
      });
    }

    // Check if user exists before deletion
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errors: [{ field: "id", message: `No user found with ID: ${id}` }],
      });
    }

    // Prevent self-deletion (if implemented with user context)
    // if (req.user && req.user._id.toString() === id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Cannot delete yourself",
    //     errors: [{ field: "id", message: "You cannot delete your own account" }]
    //   });
    // }

    // Store user info for logging before deletion
    const deletedUserInfo = {
      name: user.name,
      email: user.email,
      role: user.role,
      faculty: user.faculty,
    };

    // Delete the user
    await User.findByIdAndDelete(id);

    // Log the deletion
    console.log(`[ADMIN DELETE] User deleted:`, deletedUserInfo);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      deletedUser: {
        name: deletedUserInfo.name,
        email: deletedUserInfo.email,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);

    // Handle specific errors
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        errors: [{ field: "id", message: "Invalid MongoDB ObjectId" }],
      });
    }

    res.status(500).json({
      success: false,
      message: "Delete failed due to server error",
      errors: [
        {
          field: "server",
          message: "An unexpected error occurred. Please try again later.",
        },
      ],
    });
  }
};

// GET recent trips for live feed
exports.getRecentTrips = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const recentTrips = await Trip.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "faculty name")
      .lean();

    const formattedTrips = recentTrips.map((trip) => ({
      _id: trip._id,
      faculty: trip.user?.faculty || "Unknown",
      userName: trip.user?.name || "Anonymous",
      co2Saved: parseFloat(trip.co2Saved.toFixed(2)),
      transportMode: trip.transportMode,
      createdAt: trip.createdAt,
    }));

    res.status(200).json({
      success: true,
      trips: formattedTrips,
    });
  } catch (error) {
    console.error("Recent trips error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent trips",
      trips: [],
    });
  }
};

// GET comprehensive report data
exports.getReportData = async (req, res) => {
  try {
    const { startDate, endDate, faculty } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // Get trips with optional filters
    const trips = await Trip.find(dateFilter)
      .populate("user", "faculty name email")
      .sort({ createdAt: -1 })
      .lean();

    // Filter by faculty if specified
    const filteredTrips = faculty
      ? trips.filter((trip) => trip.user?.faculty === faculty)
      : trips;

    // Overall statistics
    const totalTrips = filteredTrips.length;
    const totalCO2Saved = filteredTrips.reduce(
      (sum, trip) => sum + trip.co2Saved,
      0,
    );
    const totalDistance = filteredTrips.reduce(
      (sum, trip) => sum + trip.distance,
      0,
    );
    const uniqueUsers = new Set(
      filteredTrips.map((trip) => trip.user?._id?.toString()),
    ).size;

    // Transport mode breakdown
    const transportBreakdown = {};
    filteredTrips.forEach((trip) => {
      const mode = trip.transportMode;
      if (!transportBreakdown[mode]) {
        transportBreakdown[mode] = {
          count: 0,
          co2Saved: 0,
          distance: 0,
        };
      }
      transportBreakdown[mode].count += 1;
      transportBreakdown[mode].co2Saved += trip.co2Saved;
      transportBreakdown[mode].distance += trip.distance;
    });

    // Faculty breakdown
    const facultyBreakdown = {};
    filteredTrips.forEach((trip) => {
      const fac = trip.user?.faculty || "Unknown";
      if (!facultyBreakdown[fac]) {
        facultyBreakdown[fac] = {
          trips: 0,
          co2Saved: 0,
          distance: 0,
          users: new Set(),
        };
      }
      facultyBreakdown[fac].trips += 1;
      facultyBreakdown[fac].co2Saved += trip.co2Saved;
      facultyBreakdown[fac].distance += trip.distance;
      facultyBreakdown[fac].users.add(trip.user?._id?.toString());
    });

    // Convert Sets to counts and format
    const facultyStats = Object.entries(facultyBreakdown).map(
      ([name, data]) => ({
        faculty: name,
        trips: data.trips,
        co2Saved: parseFloat(data.co2Saved.toFixed(2)),
        distance: parseFloat(data.distance.toFixed(2)),
        users: data.users.size,
      }),
    );

    // Daily trends
    const dailyData = {};
    filteredTrips.forEach((trip) => {
      const date = new Date(trip.createdAt).toISOString().split("T")[0];
      if (!dailyData[date]) {
        dailyData[date] = { trips: 0, co2Saved: 0, distance: 0 };
      }
      dailyData[date].trips += 1;
      dailyData[date].co2Saved += trip.co2Saved;
      dailyData[date].distance += trip.distance;
    });

    const dailyTrends = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        trips: data.trips,
        co2Saved: parseFloat(data.co2Saved.toFixed(2)),
        distance: parseFloat(data.distance.toFixed(2)),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Top users
    const userStats = {};
    filteredTrips.forEach((trip) => {
      const userId = trip.user?._id?.toString();
      if (!userId) return;

      if (!userStats[userId]) {
        userStats[userId] = {
          name: trip.user.name,
          email: trip.user.email,
          faculty: trip.user.faculty,
          trips: 0,
          co2Saved: 0,
          distance: 0,
        };
      }
      userStats[userId].trips += 1;
      userStats[userId].co2Saved += trip.co2Saved;
      userStats[userId].distance += trip.distance;
    });

    const topUsers = Object.values(userStats)
      .map((user) => ({
        ...user,
        co2Saved: parseFloat(user.co2Saved.toFixed(2)),
        distance: parseFloat(user.distance.toFixed(2)),
      }))
      .sort((a, b) => b.co2Saved - a.co2Saved)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      reportData: {
        summary: {
          totalTrips,
          totalCO2Saved: parseFloat(totalCO2Saved.toFixed(2)),
          totalDistance: parseFloat(totalDistance.toFixed(2)),
          uniqueUsers,
          dateRange: {
            start: startDate || "All time",
            end: endDate || "Present",
          },
          faculty: faculty || "All faculties",
        },
        transportBreakdown: Object.entries(transportBreakdown).map(
          ([mode, data]) => ({
            mode,
            count: data.count,
            co2Saved: parseFloat(data.co2Saved.toFixed(2)),
            distance: parseFloat(data.distance.toFixed(2)),
          }),
        ),
        facultyStats,
        dailyTrends,
        topUsers,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
    });
  }
};

/**
 * @desc    Email sustainability report to admin
 * @route   POST /api/admin/email-report
 * @access  Admin only
 */
exports.emailReport = async (req, res) => {
  try {
    // Verify Brevo SMTP credentials are configured
    if (!process.env.BREVO_SMTP_KEY || !process.env.BREVO_SMTP_EMAIL) {
      return res.status(500).json({
        success: false,
        message:
          "Brevo SMTP credentials not configured. Please add BREVO_SMTP_KEY and BREVO_SMTP_EMAIL to .env file",
      });
    }

    // Create Brevo SMTP transporter (try sendinblue.com as fallback)
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.sendinblue.com", // Alternative: smtp-relay.brevo.com
      port: 465, // SSL port (alternative to 587)
      secure: true, // Use SSL
      auth: {
        user: process.env.BREVO_SMTP_EMAIL,
        pass: process.env.BREVO_SMTP_KEY,
      },
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Get report data (reuse existing logic)
    const { startDate, endDate, faculty } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const trips = await Trip.find(dateFilter)
      .populate("user", "faculty name email")
      .sort({ createdAt: -1 })
      .lean();

    const filteredTrips = faculty
      ? trips.filter((trip) => trip.user?.faculty === faculty)
      : trips;

    // Calculate statistics
    const totalTrips = filteredTrips.length;
    const totalCO2Saved = filteredTrips.reduce(
      (sum, trip) => sum + trip.co2Saved,
      0,
    );
    const totalDistance = filteredTrips.reduce(
      (sum, trip) => sum + trip.distance,
      0,
    );
    const uniqueUsers = new Set(
      filteredTrips.map((trip) => trip.user?._id?.toString()),
    ).size;

    // Transport mode breakdown
    const transportBreakdown = {};
    filteredTrips.forEach((trip) => {
      const mode = trip.transportMode;
      if (!transportBreakdown[mode]) {
        transportBreakdown[mode] = { count: 0, co2Saved: 0 };
      }
      transportBreakdown[mode].count += 1;
      transportBreakdown[mode].co2Saved += trip.co2Saved;
    });

    // Create HTML email content
    const transportRows = Object.entries(transportBreakdown)
      .map(
        ([mode, data]) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${mode}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.count}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${data.co2Saved.toFixed(2)} kg</td>
        </tr>
      `,
      )
      .join("");

    // Get admin email - check if user email exists
    const adminEmail = req.user?.email;

    if (!adminEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Admin email not found. Please ensure your user profile has a valid email address.",
      });
    }

    const mailOptions = {
      from: `"EcoSync Admin" <${process.env.BREVO_FROM_EMAIL || "authn.sapuarachchi@gmail.com"}>`, // Use verified sender email
      to: adminEmail,
      subject: `EcoSync Sustainability Report - ${new Date().toLocaleDateString()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .stat-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .stat-value { font-size: 32px; font-weight: bold; color: #667eea; }
            .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
            th { background: #667eea; color: white; padding: 12px; text-align: left; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌱 EcoSync Sustainability Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">
              <h2>Summary Statistics</h2>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="stat-card">
                  <div class="stat-value">${totalTrips}</div>
                  <div class="stat-label">Total Trips</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${totalCO2Saved.toFixed(2)} kg</div>
                  <div class="stat-label">CO2 Saved</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${totalDistance.toFixed(2)} km</div>
                  <div class="stat-label">Total Distance</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${uniqueUsers}</div>
                  <div class="stat-label">Active Users</div>
                </div>
              </div>

              <h2 style="margin-top: 30px;">Transport Mode Breakdown</h2>
              <table>
                <thead>
                  <tr>
                    <th>Transport Mode</th>
                    <th>Trips</th>
                    <th>CO2 Saved</th>
                  </tr>
                </thead>
                <tbody>
                  ${transportRows}
                </tbody>
              </table>

              <div class="footer">
                <p>This is an automated report from EcoSync Admin Dashboard</p>
                <p>© ${new Date().getFullYear()} EcoSync - Sustainability Project</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Report email sent to: ${adminEmail}`);

    res.status(200).json({
      success: true,
      message: `Report sent successfully to ${adminEmail}`,
      stats: {
        totalTrips,
        totalCO2Saved: parseFloat(totalCO2Saved.toFixed(2)),
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        uniqueUsers,
      },
    });
  } catch (error) {
    console.error("Email report error:", error.message);

    if (error.response) {
      console.error("Brevo SMTP error:", error.response);
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to send email report",
    });
  }
};

/**
 * @desc    Generate AI-powered insights from report data
 * @route   POST /api/admin/ai-insights
 * @access  Admin only
 */
exports.getAIInsights = async (req, res) => {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "Gemini API key not configured. Please add GEMINI_API_KEY to .env file. Get your free key at: https://aistudio.google.com/app/apikey",
      });
    }

    // Get report data (same logic as getReportData)
    const { startDate, endDate, faculty } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    const trips = await Trip.find(dateFilter)
      .populate("user", "faculty name email")
      .sort({ createdAt: -1 })
      .lean();

    const filteredTrips = faculty
      ? trips.filter((trip) => trip.user?.faculty === faculty)
      : trips;

    // Calculate statistics for AI analysis
    const totalTrips = filteredTrips.length;
    const totalCO2Saved = filteredTrips.reduce(
      (sum, trip) => sum + trip.co2Saved,
      0,
    );
    const totalDistance = filteredTrips.reduce(
      (sum, trip) => sum + trip.distance,
      0,
    );
    const uniqueUsers = new Set(
      filteredTrips.map((trip) => trip.user?._id?.toString()),
    ).size;

    // Transport mode breakdown
    const transportBreakdown = {};
    filteredTrips.forEach((trip) => {
      const mode = trip.transportMode;
      if (!transportBreakdown[mode]) {
        transportBreakdown[mode] = { count: 0, co2Saved: 0, distance: 0 };
      }
      transportBreakdown[mode].count += 1;
      transportBreakdown[mode].co2Saved += trip.co2Saved;
      transportBreakdown[mode].distance += trip.distance;
    });

    // Faculty breakdown
    const facultyBreakdown = {};
    filteredTrips.forEach((trip) => {
      const fac = trip.user?.faculty || "Unknown";
      if (!facultyBreakdown[fac]) {
        facultyBreakdown[fac] = { trips: 0, co2Saved: 0, users: new Set() };
      }
      facultyBreakdown[fac].trips += 1;
      facultyBreakdown[fac].co2Saved += trip.co2Saved;
      facultyBreakdown[fac].users.add(trip.user?._id?.toString());
    });

    const facultyStats = Object.entries(facultyBreakdown).map(
      ([fac, data]) => ({
        faculty: fac,
        trips: data.trips,
        co2Saved: parseFloat(data.co2Saved.toFixed(2)),
        users: data.users.size,
      }),
    );

    // Prepare data summary for AI
    const dataSummary = {
      totalTrips,
      totalCO2Saved: parseFloat(totalCO2Saved.toFixed(2)),
      totalDistance: parseFloat(totalDistance.toFixed(2)),
      uniqueUsers,
      avgCO2PerTrip:
        totalTrips > 0
          ? parseFloat((totalCO2Saved / totalTrips).toFixed(2))
          : 0,
      avgDistancePerTrip:
        totalTrips > 0
          ? parseFloat((totalDistance / totalTrips).toFixed(2))
          : 0,
      transportModes: Object.entries(transportBreakdown).map(
        ([mode, data]) => ({
          mode,
          count: data.count,
          percentage: parseFloat(((data.count / totalTrips) * 100).toFixed(1)),
          co2Saved: parseFloat(data.co2Saved.toFixed(2)),
          avgDistance: parseFloat((data.distance / data.count).toFixed(2)),
        }),
      ),
      faculties: facultyStats,
      dateRange: {
        start: startDate || "All time",
        end: endDate || "Present",
      },
    };

    // Initialize Google Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Create AI prompt
    const prompt = `You are a sustainability analyst for a university campus commute tracking system. 
Analyze the following data and provide actionable insights for the administration team.

DATA SUMMARY:
${JSON.stringify(dataSummary, null, 2)}

Please provide a comprehensive analysis with:
1. Performance Analysis: Overall assessment of sustainability performance
2. Key Findings: 3-5 most important insights from the data
3. Strategic Recommendations: Specific actionable steps to improve outcomes
4. Trend Analysis: Patterns and trends you observe
5. Areas Needing Attention: Specific concerns or underperforming areas

Format your response in clear sections with bullet points. Be specific and data-driven.
Keep it professional and suitable for presentation to university administrators.`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiInsights = response.text();

    console.log(`🤖 AI Insights generated successfully using Google Gemini`);

    res.status(200).json({
      success: true,
      insights: aiInsights,
      dataSummary,
      timestamp: new Date().toISOString(),
      provider: "Google Gemini",
    });
  } catch (error) {
    console.error("AI Insights error:", error.message);

    let userMessage = error.message || "Failed to generate AI insights";

    // Handle specific Gemini errors
    if (error.message?.includes("API_KEY_INVALID")) {
      userMessage =
        "Gemini API key is invalid. Please get a valid key at https://aistudio.google.com/app/apikey";
    } else if (error.message?.includes("QUOTA_EXCEEDED")) {
      userMessage =
        "Gemini API quota exceeded. Please try again later or check your usage.";
    } else if (error.status === 429 || error.message?.includes("429")) {
      userMessage =
        "API rate limit exceeded. Please try again in a few moments.";
    } else if (error.message?.includes("quota")) {
      userMessage =
        "API quota exceeded. The free tier has generous limits - please try again later.";
    }

    res.status(500).json({
      success: false,
      message: userMessage,
      dataAvailable: true, // Data summary is still available even if AI fails
      fallbackMessage:
        "AI insights are temporarily unavailable. Please review the data summary manually.",
    });
  }
};
