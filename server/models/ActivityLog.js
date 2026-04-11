const mongoose = require("mongoose");
const User = require("./User");

const activityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminName: {
      type: String,
      required: false,
    },
    adminEmail: {
      type: String,
      required: false,
    },
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "VIEW", "EXPORT"],
    },
    targetType: {
      type: String,
      required: true,
      enum: [
        "USER",
        "REPORT",
        "SETTINGS",
        "SYSTEM",
        "User",
        "Report",
        "Settings",
        "System",
      ],
    },
    targetId: {
      type: String,
      default: undefined,
    },
    targetName: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: false,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "WARNING"],
      default: "SUCCESS",
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

activityLogSchema.pre("validate", async function () {
  if (!this.description && this.action && this.targetType) {
    this.description = `${this.action} ${this.targetType}`;
  }

  if (this.admin && (!this.adminName || !this.adminEmail)) {
    const adminUser = await User.findById(this.admin).select("name email");
    if (adminUser) {
      if (!this.adminName) this.adminName = adminUser.name;
      if (!this.adminEmail) this.adminEmail = adminUser.email;
    }
  }
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
