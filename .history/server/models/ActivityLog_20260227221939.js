const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  adminEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT']
  },
  targetType: {
    type: String,
    required: true,
    enum: ['USER', 'REPORT', 'SETTINGS', 'SYSTEM']
  },
  targetId: {
    type: String,
    default: null
  },
  targetName: {
    type: String,
    default: null
  },
  description: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'WARNING'],
    default: 'SUCCESS'
  }
}, {
  timestamps: true
});

// Index for faster queries
activityLogSchema.index({ admin: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
