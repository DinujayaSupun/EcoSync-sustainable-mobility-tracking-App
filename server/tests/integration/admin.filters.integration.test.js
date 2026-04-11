const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const User = require("../../models/User");
const Trip = require("../../models/Trip");
const ActivityLog = require("../../models/ActivityLog");

const getMongoUri = () =>
  process.env.MONGODB_URI_TEST ||
  process.env.MONGO_URI_TEST ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

describe("Admin filters integration tests", () => {
  let adminUser;
  let userOne;
  let userTwo;
  let adminToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(getMongoUri());
    }
  });

  beforeEach(async () => {
    adminUser = await User.create({
      name: "Filter Admin",
      email: "filter.admin@test.com",
      password: "password123",
      role: "admin",
      faculty: "Engineering",
    });

    userOne = await User.create({
      name: "Engineering User",
      email: "eng.user@test.com",
      password: "password123",
      role: "user",
      faculty: "Engineering",
    });

    userTwo = await User.create({
      name: "Science User",
      email: "sci.user@test.com",
      password: "password123",
      role: "user",
      faculty: "Science",
    });

    adminToken = jwt.sign(
      { id: adminUser._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    await ActivityLog.create([
      {
        admin: adminUser._id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "UPDATE",
        targetType: "USER",
        targetId: userOne._id.toString(),
        description: "Updated user role",
        status: "SUCCESS",
        createdAt: new Date("2026-04-10T09:00:00.000Z"),
      },
      {
        admin: adminUser._id,
        adminName: adminUser.name,
        adminEmail: adminUser.email,
        action: "VIEW",
        targetType: "REPORT",
        description: "Viewed reports",
        status: "SUCCESS",
        createdAt: new Date("2026-03-01T09:00:00.000Z"),
      },
    ]);

    await Trip.create([
      {
        user: userOne._id,
        origin: "Hostel",
        destination: "Engineering Faculty",
        distance: 8,
        transportMode: "bus",
        co2Saved: 1.6,
        createdAt: new Date("2026-04-12T08:00:00.000Z"),
      },
      {
        user: userTwo._id,
        origin: "Library",
        destination: "Science Faculty",
        distance: 3,
        transportMode: "walking",
        co2Saved: 0.6,
        createdAt: new Date("2026-04-12T08:30:00.000Z"),
      },
      {
        user: userOne._id,
        origin: "Station",
        destination: "Engineering Faculty",
        distance: 5,
        transportMode: "train",
        co2Saved: 1.1,
        createdAt: new Date("2026-02-10T08:30:00.000Z"),
      },
    ]);
  });

  afterEach(async () => {
    await Trip.deleteMany({});
    await ActivityLog.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("filters activity logs by action + targetType", async () => {
    const res = await request(app)
      .get(
        `/api/admin/activity-logs?action=UPDATE&targetType=USER&adminId=${adminUser._id.toString()}&page=1&limit=10`,
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination.totalLogs).toBe(1);
    expect(res.body.logs[0].action).toBe("UPDATE");
    expect(res.body.logs[0].targetType).toBe("USER");
  });

  test("filters activity logs by date range", async () => {
    const res = await request(app)
      .get(
        "/api/admin/activity-logs?startDate=2026-04-01&endDate=2026-04-30&page=1&limit=10",
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination.totalLogs).toBe(1);
    expect(res.body.logs[0].description).toContain("Updated user role");
  });

  test("filters report by faculty and date range together", async () => {
    const res = await request(app)
      .get(
        "/api/admin/report?faculty=Engineering&startDate=2026-04-01&endDate=2026-04-30",
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reportData.summary.totalTrips).toBe(1);
    expect(res.body.reportData.summary.faculty).toBe("Engineering");
  });
});
