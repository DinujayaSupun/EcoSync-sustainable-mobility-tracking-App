const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const User = require("../../models/User");
const Badge = require("../../models/Badge");
const UserBadge = require("../../models/UserBadge");
const Commute = require("../../models/Commute");
const AchievementEvent = require("../../models/AchievementEvent");

const getMongoUri = () =>
  process.env.MONGODB_URI_TEST ||
  process.env.MONGO_URI_TEST ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

describe("Badges and achievements integration tests", () => {
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
      name: "Badge Admin",
      email: "badge.admin@test.com",
      password: "password123",
      role: "admin",
      faculty: "Engineering",
    });

    normalUser = await User.create({
      name: "Badge User",
      email: "badge.user@test.com",
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
    await AchievementEvent.deleteMany({});
    await UserBadge.deleteMany({});
    await Badge.deleteMany({});
    await Commute.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("rejects badges list access without token", async () => {
    const res = await request(app).get("/api/badges");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  test("allows admin to create badge and blocks non-admin", async () => {
    const payload = {
      name: "Trip Starter",
      description: "Complete your first trip",
      type: "TRIP_COUNT",
      threshold: 1,
      imageUrl: "https://example.com/badge-trip.png",
    };

    const forbiddenRes = await request(app)
      .post("/api/badges")
      .set("Authorization", `Bearer ${userToken}`)
      .send(payload);

    expect(forbiddenRes.statusCode).toBe(403);

    const createRes = await request(app)
      .post("/api/badges")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.name).toBe("Trip Starter");
  });

  test("auto-awards eligible badge on me/earned endpoint", async () => {
    const badge = await Badge.create({
      name: "Distance Hero",
      description: "Reach at least 10km total distance",
      type: "TOTAL_DISTANCE",
      threshold: 10,
      imageUrl: "https://example.com/badge-distance.png",
    });

    await Commute.create({
      userId: normalUser._id,
      startLocation: "A",
      destination: "B",
      startCoords: { lat: 6.9, lon: 79.9 },
      destinationCoords: { lat: 6.91, lon: 79.91 },
      transportType: "Bus",
      faculty: "Science",
      dayType: "Weekday",
      distance: 12,
      duration: 30,
      emissionEstimate: 1.2,
      co2Saved: 1.1,
      ecoSuggestion: "Great choice",
    });

    const res = await request(app)
      .get("/api/badges/me/earned")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.newAwards).toBeGreaterThanOrEqual(1);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(String(res.body.data[0].badgeId._id)).toBe(String(badge._id));
  });

  test("returns current user's achievement events with pagination", async () => {
    await AchievementEvent.create([
      {
        user: normalUser._id,
        eventKey: `badge:${normalUser._id}:1`,
        type: "BADGE_EARNED",
        title: "Badge Earned: Starter",
        message: "You earned Starter badge",
        icon: "workspace_premium",
      },
      {
        user: normalUser._id,
        eventKey: `leaderboard:${normalUser._id}:1`,
        type: "LEADERBOARD_PODIUM",
        title: "Leaderboard #1",
        message: "You reached #1",
        icon: "military_tech",
      },
      {
        user: adminUser._id,
        eventKey: `badge:${adminUser._id}:1`,
        type: "BADGE_EARNED",
        title: "Admin Badge",
        message: "Should not appear for normal user",
        icon: "workspace_premium",
      },
    ]);

    const res = await request(app)
      .get("/api/achievements/my?limit=1&page=1")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.limit).toBe(1);
    expect(res.body.total).toBe(2);
    expect(res.body.count).toBe(1);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.data[0].user.toString()).toBe(String(normalUser._id));
  });
});
