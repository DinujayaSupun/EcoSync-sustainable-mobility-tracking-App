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

    // 4. Count users active today (placeholder - needs actual activity tracking)
    const activeToday = 0; // TODO: Implement activity tracking

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
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password'); // Security: Don't send passwords!
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// DELETE a user
export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed" });
    }
};