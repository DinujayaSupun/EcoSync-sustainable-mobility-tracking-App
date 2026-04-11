const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const User = require("../../models/User");
const Challenge = require("../../models/Challenges/challenges");
const Participation = require("../../models/Challenges/participation.model");

const getMongoUri = () =>
  process.env.MONGODB_URI_TEST ||
  process.env.MONGO_URI_TEST ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

describe("Challenges integration tests", () => {
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
      name: "Challenge Admin",
      email: "challenge.admin@test.com",
      password: "password123",
      role: "admin",
      faculty: "Engineering",
    });

    normalUser = await User.create({
      name: "Challenge User",
      email: "challenge.user@test.com",
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
    await Participation.deleteMany({});
    await Challenge.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("blocks non-admin challenge creation", async () => {
    const payload = {
      title: "No Car Week",
      description: "Reduce your emissions by avoiding car transport.",
      tagline: "Walk, bike, or bus",
      transportMode: "BUS",
      emissionTarget: 5,
      durationDays: 7,
      difficulty: "EASY",
      type: "INDIVIDUAL",
      rewardPoints: 120,
    };

    const res = await request(app)
      .post("/api/challenges")
      .set("Authorization", `Bearer ${userToken}`)
      .send(payload);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/admins only|access denied/i);
  });

  test("allows admin challenge creation", async () => {
    const payload = {
      title: "Bike Sprint",
      description: "Complete low-carbon bike commutes this week.",
      tagline: "Pedal for the planet",
      transportMode: "BIKE",
      emissionTarget: 4,
      durationDays: 10,
      difficulty: "MEDIUM",
      type: "INDIVIDUAL",
      rewardPoints: 180,
    };

    const res = await request(app)
      .post("/api/challenges")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(payload.title);
    expect(res.body.transportMode).toBe(payload.transportMode);
    expect(res.body.createdBy).toBe(String(adminUser._id));
  });

  test("lets a user join a challenge and complete it by progress update", async () => {
    const challenge = await Challenge.create({
      title: "Train Saver",
      description: "Use train rides to save enough CO2 this week.",
      tagline: "Tracks to sustainability",
      transportMode: "TRAIN",
      emissionTarget: 1,
      durationDays: 5,
      difficulty: "EASY",
      rewardPoints: 100,
      type: "INDIVIDUAL",
      status: "ACTIVE",
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdBy: adminUser._id,
    });

    const joinRes = await request(app)
      .post(`/api/challenges/${challenge._id}/join`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(joinRes.statusCode).toBe(201);
    expect(joinRes.body.status).toBe("ACTIVE");

    const progressRes = await request(app)
      .put(`/api/challenges/${challenge._id}/progress`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ progress: 1.2 });

    expect(progressRes.statusCode).toBe(200);
    expect(progressRes.body.status).toBe("COMPLETED");
    expect(progressRes.body.rewardGranted).toBe(true);
    expect(progressRes.body.rewardedPoints).toBe(100);
  });
});
