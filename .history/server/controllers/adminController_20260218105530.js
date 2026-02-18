const User = require('../models/User');
const Trip = require('../models/Trip');

exports.getAdminStats = async (req, res) => {
  try {
    // 1. KPI Calculations
    const totalStudents = await User.countDocuments({ role: 'user' });
    
    const tripStats = await Trip.aggregate([
      {
        $group: {
          _id: null,
          totalDistance: { $sum: "$distance" },
          totalCO2: { $sum: "$co2Saved" }
        }
      }
    ]);

    const stats = tripStats[0] || { totalDistance: 0, totalCO2: 0 };
    
    // Tree conversion: 21kg = 1 tree
    const treeEquivalent = (stats.totalCO2 / 21).toFixed(1);

    // 2. Faculty Comparison (Bar Chart Data)
    const facultyData = await User.aggregate([
      { $group: { _id: "$faculty", count: { $sum: 1 } } },
      { $project: { faculty: "$_id", students: "$count", _id: 0 } }
    ]);

    res.status(200).json({
      success: true,
      kpis: {
        totalStudents,
        totalDistance: stats.totalDistance.toFixed(2),
        totalCO2: stats.totalCO2.toFixed(2),
        treeEquivalent
      },
      facultyData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};