const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const User = require("../../models/User");
const Commute = require("../../models/Commute");
const Challenge = require("../../models/Challenges/challenges");

const getMongoUri = () =>
  process.env.MONGODB_URI_TEST ||
  process.env.MONGO_URI_TEST ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

describe("Commute integration tests", () => {
  let userOne;
  let userTwo;
  let userOneToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(getMongoUri());
    }
  });

  beforeEach(async () => {
    userOne = await User.create({
      name: "Commute User One",
      email: "commute.user.one@test.com",
      password: "password123",
      role: "user",
      faculty: "Engineering",
    });

    userTwo = await User.create({
      name: "Commute User Two",
      email: "commute.user.two@test.com",
      password: "password123",
      role: "user",
      faculty: "Science",
    });

    userOneToken = jwt.sign(
      { id: userOne._id, role: userOne.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    await Commute.create([
      {
        userId: userOne._id,
        startLocation: "Hostel",
        destination: "Faculty",
        startCoords: { lat: 6.9, lon: 79.9 },
        destinationCoords: { lat: 6.91, lon: 79.91 },
        transportType: "Bus",
        faculty: "Engineering",
        dayType: "Weekday",
        distance: 10,
        duration: 20,
        emissionEstimate: 1.05,
        co2Saved: 0.87,
        ecoSuggestion: "Keep using bus",
      },
      {
        userId: userOne._id,
        startLocation: "Library",
        destination: "Lab",
        startCoords: { lat: 6.92, lon: 79.92 },
        destinationCoords: { lat: 6.93, lon: 79.93 },
        transportType: "Walk",
        faculty: "Engineering",
        dayType: "Weekday",
        distance: 2,
        duration: 25,
        emissionEstimate: 0,
        co2Saved: 0.38,
        ecoSuggestion: "Great healthy option",
      },
      {
        userId: userTwo._id,
        startLocation: "Town",
        destination: "Campus",
        startCoords: { lat: 7.0, lon: 80.0 },
        destinationCoords: { lat: 7.01, lon: 80.01 },
        transportType: "Car",
        faculty: "Science",
        dayType: "Weekend",
        distance: 5,
        duration: 15,
        emissionEstimate: 0.96,
        co2Saved: 0.03,
        ecoSuggestion: "Try carpool",
      },
    ]);

    await Challenge.create({
      title: "Transit Starter",
      description: "Use transit for daily commute to reduce emissions.",
      tagline: "Save more every day",
      transportMode: "BUS",
      emissionTarget: 3,
      durationDays: 7,
      difficulty: "EASY",
      rewardPoints: 50,
      type: "INDIVIDUAL",
      status: "ACTIVE",
      createdBy: userOne._id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });
  });

  afterEach(async () => {
    await Commute.deleteMany({});
    await Challenge.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("rejects commute history without token", async () => {
    const res = await request(app).get("/api/commute/history");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  test("returns only current user's commute history", async () => {
    const res = await request(app)
      .get("/api/commute/history")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(
      res.body.data.every(
        (trip) => String(trip.userId) === String(userOne._id),
      ),
    ).toBe(true);
  });

  test("returns user emission summary totals", async () => {
    const res = await request(app)
      .get("/api/commute/emission-summary")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalCommutes).toBe(2);
    expect(res.body.data.totalDistance).toBe(12);
    expect(res.body.data.totalEmissions).toBe(1.05);
    expect(res.body.data.transportBreakdown.Bus.count).toBe(1);
    expect(res.body.data.transportBreakdown.Walk.count).toBe(1);
  });

  test("returns public footer stats", async () => {
    const res = await request(app).get("/api/commute/footer-stats");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeUsers).toBe(2);
    expect(res.body.data.totalCO2Saved).toBe(1.28);
    expect(res.body.data.activeChallenges).toBe(1);
  });
});
