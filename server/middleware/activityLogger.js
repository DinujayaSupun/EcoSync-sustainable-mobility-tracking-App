const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

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
    // Supports both signatures:
    // 1) createActivityLog(adminUser, action, targetType, details)
    // 2) createActivityLog({ adminId, action, targetType, ...details })
    let resolvedAdmin = adminUser;
    let resolvedAction = action;
    let resolvedTargetType = targetType;
    let resolvedDetails = details;

    if (
      adminUser &&
      typeof adminUser === "object" &&
      adminUser.adminId &&
      !action
    ) {
      const payload = adminUser;
      resolvedAction = payload.action;
      resolvedTargetType = payload.targetType;
      resolvedDetails = {
        targetId: payload.targetId,
        targetName: payload.targetName,
        description: payload.description,
        changes: payload.changes,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        status: payload.status,
      };

      resolvedAdmin = await User.findById(payload.adminId).select(
        "_id name email",
      );
    }

    if (!resolvedAdmin || !resolvedAdmin._id) {
      throw new Error("Invalid admin user");
    }

    const logEntry = {
      admin: resolvedAdmin._id,
      adminName: resolvedAdmin.name,
      adminEmail: resolvedAdmin.email,
      action: resolvedAction,
      targetType: resolvedTargetType,
      targetId: resolvedDetails.targetId || null,
      targetName: resolvedDetails.targetName || null,
      description:
        resolvedDetails.description ||
        `${resolvedAction} ${resolvedTargetType}`,
      changes: resolvedDetails.changes || null,
      ipAddress: resolvedDetails.ipAddress || null,
      userAgent: resolvedDetails.userAgent || null,
      status: resolvedDetails.status || "SUCCESS",
    };

    return await ActivityLog.create(logEntry);
  } catch (error) {
    console.error("Failed to create activity log:", error);
    throw error;
  }
};

module.exports = { logActivity, createActivityLog };
