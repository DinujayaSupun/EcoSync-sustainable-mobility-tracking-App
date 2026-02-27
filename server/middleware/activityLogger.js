const ActivityLog = require("../models/ActivityLog");

/**
 * Middleware to log admin activities
 */
const logActivity = (action, targetType, getDetails) => {
  return async (req, res, next) => {
    // Store original send method
    const originalSend = res.send;

    // Override send method to capture response
    res.send = function (data) {
      // Restore original send
      res.send = originalSend;

      // Log activity after response
      setImmediate(async () => {
        try {
          if (req.user && req.user.role === "admin") {
            const details =
              typeof getDetails === "function" ? getDetails(req, data) : {};

            const logEntry = {
              admin: req.user._id,
              adminName: req.user.name,
              adminEmail: req.user.email,
              action,
              targetType,
              targetId: details.targetId || req.params.id || null,
              targetName: details.targetName || null,
              description: details.description || `${action} ${targetType}`,
              changes: details.changes || null,
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get("user-agent"),
              status:
                res.statusCode >= 200 && res.statusCode < 300
                  ? "SUCCESS"
                  : "FAILED",
            };

            await ActivityLog.create(logEntry);
          }
        } catch (error) {
          console.error("Failed to log activity:", error);
          // Don't fail the request if logging fails
        }
      });

      // Send response
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Manual activity logging function
 */
const createActivityLog = async (
  adminUser,
  action,
  targetType,
  details = {},
) => {
  try {
    const logEntry = {
      admin: adminUser._id,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      action,
      targetType,
      targetId: details.targetId || null,
      targetName: details.targetName || null,
      description: details.description || `${action} ${targetType}`,
      changes: details.changes || null,
      ipAddress: details.ipAddress || null,
      userAgent: details.userAgent || null,
      status: details.status || "SUCCESS",
    };

    await ActivityLog.create(logEntry);
  } catch (error) {
    console.error("Failed to create activity log:", error);
  }
};

module.exports = { logActivity, createActivityLog };
