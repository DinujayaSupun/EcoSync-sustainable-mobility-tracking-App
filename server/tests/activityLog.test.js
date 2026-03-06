const mongoose = require("mongoose");
const ActivityLog = require("../models/ActivityLog");
const {
  logActivity,
  createActivityLog,
} = require("../middleware/activityLogger");
const User = require("../models/User");

describe("Activity Logger Tests", () => {
  let adminUser;
  let testUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI_TEST || process.env.MONGODB_URI,
      );
    }
  });

  beforeEach(async () => {
    adminUser = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      faculty: "Engineering",
    });

    testUser = await User.create({
      name: "Test User",
      email: "user@test.com",
      password: "password123",
      role: "user",
      faculty: "Science",
    });
  });

  afterEach(async () => {
    await ActivityLog.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("ActivityLog Model", () => {
    it("should create activity log entry", async () => {
      const log = await ActivityLog.create({
        admin: adminUser._id,
        action: "UPDATE",
        targetType: "User",
        targetId: testUser._id,
        changes: {
          before: { role: "user" },
          after: { role: "admin" },
        },
        ipAddress: "127.0.0.1",
      });

      expect(log).toHaveProperty("_id");
      expect(log.action).toBe("UPDATE");
      expect(log.targetType).toBe("User");
      expect(log.admin.toString()).toBe(adminUser._id.toString());
    });

    it("should require admin field", async () => {
      try {
        await ActivityLog.create({
          action: "DELETE",
          targetType: "User",
          targetId: testUser._id,
        });
        fail("Should have thrown validation error");
      } catch (error) {
        expect(error.name).toBe("ValidationError");
      }
    });

    it("should validate action enum", async () => {
      try {
        await ActivityLog.create({
          admin: adminUser._id,
          action: "INVALID_ACTION",
          targetType: "User",
          targetId: testUser._id,
        });
        fail("Should have thrown validation error");
      } catch (error) {
        expect(error.name).toBe("ValidationError");
      }
    });

    it("should auto-populate createdAt timestamp", async () => {
      const log = await ActivityLog.create({
        admin: adminUser._id,
        action: "VIEW",
        targetType: "Report",
      });

      expect(log.createdAt).toBeInstanceOf(Date);
      expect(log.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("createActivityLog function", () => {
    it("should create log with all parameters", async () => {
      const log = await createActivityLog({
        adminId: adminUser._id,
        action: "UPDATE",
        targetType: "User",
        targetId: testUser._id,
        changes: {
          before: { faculty: "Science" },
          after: { faculty: "Engineering" },
        },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      });

      expect(log).toHaveProperty("_id");
      expect(log.action).toBe("UPDATE");
      expect(log.ipAddress).toBe("192.168.1.1");
      expect(log.userAgent).toBe("Mozilla/5.0");
      expect(log.changes).toEqual({
        before: { faculty: "Science" },
        after: { faculty: "Engineering" },
      });
    });

    it("should create log without optional fields", async () => {
      const log = await createActivityLog({
        adminId: adminUser._id,
        action: "DELETE",
        targetType: "User",
        targetId: testUser._id,
      });

      expect(log).toHaveProperty("_id");
      expect(log.action).toBe("DELETE");
    });

    it("should handle errors gracefully", async () => {
      try {
        await createActivityLog({
          adminId: "invalid-id",
          action: "UPDATE",
          targetType: "User",
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Query Performance", () => {
    beforeEach(async () => {
      // Create multiple log entries
      const logs = [];
      for (let i = 0; i < 20; i++) {
        logs.push({
          admin: adminUser._id,
          action: i % 2 === 0 ? "UPDATE" : "DELETE",
          targetType: "User",
          targetId: testUser._id,
          createdAt: new Date(Date.now() - i * 1000 * 60 * 60),
        });
      }
      await ActivityLog.insertMany(logs);
    });

    it("should query logs by admin efficiently", async () => {
      const startTime = Date.now();
      const logs = await ActivityLog.find({ admin: adminUser._id });
      const queryTime = Date.now() - startTime;

      expect(logs.length).toBe(20);
      expect(queryTime).toBeLessThan(100); // Should be fast with index
    });

    it("should query logs by action efficiently", async () => {
      const logs = await ActivityLog.find({ action: "UPDATE" });
      expect(logs.length).toBe(10);
    });

    it("should query logs by date range", async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const logs = await ActivityLog.find({ createdAt: { $gte: oneDayAgo } });
      expect(logs.length).toBeLessThanOrEqual(20);
    });

    it("should paginate logs correctly", async () => {
      const page1 = await ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .skip(0);
      const page2 = await ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .skip(10);

      expect(page1.length).toBe(10);
      expect(page2.length).toBe(10);
      expect(page1[0]._id).not.toEqual(page2[0]._id);
    });
  });

  describe("Activity Statistics", () => {
    beforeEach(async () => {
      const logs = [
        {
          admin: adminUser._id,
          action: "UPDATE",
          targetType: "User",
          targetId: testUser._id,
        },
        {
          admin: adminUser._id,
          action: "UPDATE",
          targetType: "User",
          targetId: testUser._id,
        },
        {
          admin: adminUser._id,
          action: "DELETE",
          targetType: "User",
          targetId: testUser._id,
        },
        { admin: adminUser._id, action: "VIEW", targetType: "Report" },
      ];
      await ActivityLog.insertMany(logs);
    });

    it("should aggregate logs by action", async () => {
      const stats = await ActivityLog.aggregate([
        { $group: { _id: "$action", count: { $sum: 1 } } },
      ]);

      expect(stats.length).toBeGreaterThan(0);
      const updateStat = stats.find((s) => s._id === "UPDATE");
      expect(updateStat.count).toBe(2);
    });

    it("should aggregate logs by admin", async () => {
      const stats = await ActivityLog.aggregate([
        { $group: { _id: "$admin", count: { $sum: 1 } } },
      ]);

      expect(stats.length).toBe(1);
      expect(stats[0].count).toBe(4);
    });

    it("should calculate action distribution", async () => {
      const distribution = await ActivityLog.aggregate([
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            action: "$_id",
            count: 1,
            _id: 0,
          },
        },
      ]);

      expect(distribution.some((d) => d.action === "UPDATE")).toBe(true);
      expect(distribution.some((d) => d.action === "DELETE")).toBe(true);
    });
  });

  describe("Data Integrity", () => {
    it("should populate admin details", async () => {
      await ActivityLog.create({
        admin: adminUser._id,
        action: "UPDATE",
        targetType: "User",
        targetId: testUser._id,
      });

      const log = await ActivityLog.findOne().populate("admin", "name email");
      expect(log.admin.name).toBe("Admin User");
      expect(log.admin.email).toBe("admin@test.com");
    });

    it("should store changes object correctly", async () => {
      const changes = {
        before: { role: "user", faculty: "Science" },
        after: { role: "admin", faculty: "Engineering" },
      };

      const log = await ActivityLog.create({
        admin: adminUser._id,
        action: "UPDATE",
        targetType: "User",
        targetId: testUser._id,
        changes,
      });

      expect(log.changes).toEqual(changes);
      expect(log.changes.before.role).toBe("user");
      expect(log.changes.after.role).toBe("admin");
    });

    it("should handle missing targetId gracefully", async () => {
      const log = await ActivityLog.create({
        admin: adminUser._id,
        action: "VIEW",
        targetType: "Report",
        // targetId is optional for certain actions
      });

      expect(log.targetId).toBeUndefined();
    });
  });
});
