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

describe("JWT security integration tests", () => {
  let adminUser;
  let normalUser;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(getMongoUri());
    }
  });

  beforeEach(async () => {
    adminUser = await User.create({
      name: "Security Admin",
      email: "security.admin@test.com",
      password: "password123",
      role: "admin",
      faculty: "Engineering",
    });

    normalUser = await User.create({
      name: "Security User",
      email: "security.user@test.com",
      password: "password123",
      role: "user",
      faculty: "Science",
    });

    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    userToken = jwt.sign(
      { id: normalUser._id, role: normalUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
  });

  afterEach(async () => {
    await Trip.deleteMany({});
    await ActivityLog.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("rejects admin route when Authorization header is missing Bearer prefix", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", adminToken);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  test("rejects tampered token", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}tampered`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/token failed/i);
  });

  test("rejects expired token", async () => {
    const expiredToken = jwt.sign(
      {
        id: adminUser._id,
        role: "admin",
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      process.env.JWT_SECRET,
    );

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/token failed/i);
  });

  test("rejects non-admin token for admin route", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/admins only|admin/i);
  });

  test("allows valid admin token for admin route", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
