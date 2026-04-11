const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const User = require("../../models/User");
const Badge = require("../../models/Badge");
const UserBadge = require("../../models/UserBadge");

const getMongoUri = () =>
  process.env.MONGODB_URI_TEST ||
  process.env.MONGO_URI_TEST ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

describe("Badge admin lifecycle integration tests", () => {
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
      name: "Lifecycle Admin",
      email: "lifecycle.admin@test.com",
      password: "password123",
      role: "admin",
      faculty: "Engineering",
    });

    normalUser = await User.create({
      name: "Lifecycle User",
      email: "lifecycle.user@test.com",
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
    await UserBadge.deleteMany({});
    await Badge.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("admin can update a badge", async () => {
    const badge = await Badge.create({
      name: "Eco Starter",
      description: "Initial description",
      type: "TRIP_COUNT",
      threshold: 1,
      imageUrl: "https://example.com/eco-starter.png",
    });

    const res = await request(app)
      .patch(`/api/badges/${badge._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Updated description", threshold: 3 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe("Updated description");
    expect(res.body.data.threshold).toBe(3);
  });

  test("manual award is idempotent for duplicate award attempts", async () => {
    const badge = await Badge.create({
      name: "Manual Award Badge",
      description: "Admin grants this badge",
      type: "TRIP_COUNT",
      threshold: 1,
      imageUrl: "https://example.com/manual-award.png",
    });

    const firstRes = await request(app)
      .post(`/api/badges/${badge._id}/award/${normalUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(firstRes.statusCode).toBe(201);
    expect(firstRes.body.success).toBe(true);

    const secondRes = await request(app)
      .post(`/api/badges/${badge._id}/award/${normalUser._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.success).toBe(true);
    expect(secondRes.body.message).toMatch(/already awarded/i);

    const records = await UserBadge.find({
      userId: normalUser._id,
      badgeId: badge._id,
    });
    expect(records).toHaveLength(1);
  });

  test("cannot delete badge that has already been awarded", async () => {
    const badge = await Badge.create({
      name: "Protected Badge",
      description: "Cannot be removed after award",
      type: "TRIP_COUNT",
      threshold: 1,
      imageUrl: "https://example.com/protected.png",
    });

    await UserBadge.create({ userId: normalUser._id, badgeId: badge._id });

    const res = await request(app)
      .delete(`/api/badges/${badge._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot delete/i);
  });

  test("non-admin cannot manually award badges", async () => {
    const badge = await Badge.create({
      name: "Restricted Award",
      description: "Only admins can award",
      type: "TRIP_COUNT",
      threshold: 1,
      imageUrl: "https://example.com/restricted.png",
    });

    const res = await request(app)
      .post(`/api/badges/${badge._id}/award/${adminUser._id}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/admin/i);
  });
});
