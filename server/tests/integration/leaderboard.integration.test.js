const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const User = require("../../models/User");
const Commute = require("../../models/Commute");
const AchievementEvent = require("../../models/AchievementEvent");

const getMongoUri = () =>
  process.env.MONGODB_URI_TEST ||
  process.env.MONGO_URI_TEST ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

describe("Leaderboard integration tests", () => {
  let userOne;
  let userTwo;
  let userThree;
  let userOneToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(getMongoUri());
    }
  });

  beforeEach(async () => {
    userOne = await User.create({
      name: "Leaderboard One",
      email: "leaderboard.one@test.com",
      password: "password123",
      role: "user",
      faculty: "Engineering",
    });

    userTwo = await User.create({
      name: "Leaderboard Two",
      email: "leaderboard.two@test.com",
      password: "password123",
      role: "user",
      faculty: "Science",
    });

    userThree = await User.create({
      name: "Leaderboard Three",
      email: "leaderboard.three@test.com",
      password: "password123",
      role: "user",
      faculty: "Business",
    });

    userOneToken = jwt.sign(
      { id: userOne._id, role: userOne.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    await Commute.create([
      {
        userId: userOne._id,
        startLocation: "A",
        destination: "B",
        startCoords: { lat: 6.9, lon: 79.9 },
        destinationCoords: { lat: 6.91, lon: 79.91 },
        transportType: "Bus",
        faculty: "Engineering",
        dayType: "Weekday",
        distance: 10,
        duration: 25,
        emissionEstimate: 1.05,
        co2Saved: 2.2,
        ecoSuggestion: "Keep it up",
      },
      {
        userId: userTwo._id,
        startLocation: "C",
        destination: "D",
        startCoords: { lat: 6.8, lon: 79.8 },
        destinationCoords: { lat: 6.82, lon: 79.82 },
        transportType: "Train",
        faculty: "Science",
        dayType: "Weekday",
        distance: 8,
        duration: 20,
        emissionEstimate: 0.5,
        co2Saved: 1.5,
        ecoSuggestion: "Great choice",
      },
      {
        userId: userThree._id,
        startLocation: "E",
        destination: "F",
        startCoords: { lat: 7.1, lon: 80.1 },
        destinationCoords: { lat: 7.11, lon: 80.11 },
        transportType: "Bike",
        faculty: "Business",
        dayType: "Weekend",
        distance: 6,
        duration: 30,
        emissionEstimate: 0,
        co2Saved: 0.9,
        ecoSuggestion: "Excellent",
      },
    ]);
  });

  afterEach(async () => {
    await AchievementEvent.deleteMany({});
    await Commute.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("rejects leaderboard access without token", async () => {
    const res = await request(app).get("/api/leaderboard");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/no token/i);
  });

  test("returns impact leaderboard ordered by total CO2 saved", async () => {
    const res = await request(app)
      .get("/api/leaderboard?period=weekly&board=impact&limit=3")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.period).toBe("weekly");
    expect(res.body.board).toBe("impact");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].name).toBe("Leaderboard One");
    expect(res.body.data[0].totalCo2Saved).toBeGreaterThanOrEqual(
      res.body.data[1].totalCo2Saved,
    );
  });

  test("falls back to default board and period for invalid query values", async () => {
    const res = await request(app)
      .get("/api/leaderboard?period=invalid&period=invalid&board=unknown")
      .set("Authorization", `Bearer ${userOneToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.period).toBe("weekly");
    expect(res.body.board).toBe("hybrid");
    expect(res.body.meta?.me?.rank).toBeGreaterThanOrEqual(1);
  });
});
