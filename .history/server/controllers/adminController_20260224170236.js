const User = require("../models/User");
const Trip = require("../models/Trip");

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

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (faculty) user.faculty = faculty;
    if (role && ["user", "admin"].includes(role)) user.role = role;

    await user.save();

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
    console.error("Update user error:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// DELETE a user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
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
