jest.mock("../../services/weather.service", () => ({
  getWeatherBasedSuggestion: jest.fn(),
  getForecastByCoords: jest.fn(),
  getForecast: jest.fn(),
}));

jest.mock("axios", () => ({
  get: jest.fn(),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
const User = require("../../models/User");
const WeatherLog = require("../../models/WeatherLog");
const weatherService = require("../../services/weather.service");
const axios = require("axios");

const getMongoUri = () =>
  process.env.MONGODB_URI_TEST ||
  process.env.MONGO_URI_TEST ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

describe("Smart commute weather integration tests", () => {
  let user;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(getMongoUri());
    }
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    user = await User.create({
      name: "Weather User",
      email: "weather.user@test.com",
      password: "password123",
      role: "user",
      faculty: "Computing",
    });

    weatherService.getWeatherBasedSuggestion.mockResolvedValue({
      weatherCondition: "Rain",
      suggestedTransport: "Bus",
      temperature: 27,
      humidity: 88,
      description: "light rain",
      distanceKm: 6.4,
      adjustmentReason: "weather-priority",
      weatherTransport: "Bus",
    });

    weatherService.getForecastByCoords.mockResolvedValue({
      city: "Colombo",
      hourly: [{ time: "2026-04-11 10:00:00", temp: 28 }],
      daily: [{ date: "2026-04-11", maxTemp: 30, minTemp: 25 }],
    });

    weatherService.getForecast.mockResolvedValue({
      city: "Colombo",
      hourly: [{ time: "2026-04-11 10:00:00", temp: 28 }],
      daily: [{ date: "2026-04-11", maxTemp: 30, minTemp: 25 }],
    });

    axios.get.mockResolvedValue({
      data: [
        {
          display_name: "Colombo, Sri Lanka",
          lat: "6.9271",
          lon: "79.8612",
          type: "city",
          class: "place",
        },
      ],
    });
  });

  afterEach(async () => {
    await WeatherLog.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("returns smart commute health status", async () => {
    const res = await request(app).get("/api/smart-commute/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/module is running/i);
  });

  test("creates weather suggestion and persists log", async () => {
    const payload = {
      userId: user._id.toString(),
      origin: "Colombo",
      destination: "Kandy",
      originLat: 6.9271,
      originLon: 79.8612,
      destLat: 7.2906,
      destLon: 80.6337,
    };

    const res = await request(app)
      .post("/api/smart-commute/weather-suggestion")
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.weatherLog.suggestedTransport).toBe("Bus");
    expect(res.body.data.weatherLog.distance).toBe(6.4);

    const logs = await WeatherLog.find({ userId: user._id });
    expect(logs).toHaveLength(1);
  });

  test("returns user suggestion history with pagination", async () => {
    await WeatherLog.create({
      userId: user._id,
      origin: "Colombo",
      destination: "Kandy",
      weatherCondition: "Clear",
      suggestedTransport: "Bus",
      temperature: 30,
      humidity: 70,
    });

    const res = await request(app).get(
      `/api/smart-commute/weather-suggestion/${user._id}?page=1&limit=10`,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.suggestions[0].origin).toBe("Colombo");
  });

  test("updates and deletes a weather suggestion", async () => {
    const existing = await WeatherLog.create({
      userId: user._id,
      origin: "Colombo",
      destination: "Kandy",
      weatherCondition: "Clouds",
      suggestedTransport: "Carpool",
      temperature: 29,
      humidity: 75,
    });

    const updateRes = await request(app)
      .put(`/api/smart-commute/weather-suggestion/${existing._id}`)
      .send({ suggestedTransport: "Bus" });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.suggestedTransport).toBe("Bus");

    const deleteRes = await request(app).delete(
      `/api/smart-commute/weather-suggestion/${existing._id}`,
    );

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const deleted = await WeatherLog.findById(existing._id);
    expect(deleted).toBeNull();
  });

  test("returns current weather and forecast data", async () => {
    const currentRes = await request(app)
      .get("/api/smart-commute/weather-suggestion/current/Colombo")
      .query({ lat: 6.9271, lon: 79.8612, destLat: 7.2906, destLon: 80.6337 });

    expect(currentRes.statusCode).toBe(200);
    expect(currentRes.body.success).toBe(true);
    expect(currentRes.body.data.weatherCondition).toBe("Rain");

    const forecastRes = await request(app)
      .get("/api/smart-commute/weather-suggestion/forecast")
      .query({ lat: 6.9271, lon: 79.8612 });

    expect(forecastRes.statusCode).toBe(200);
    expect(forecastRes.body.success).toBe(true);
    expect(forecastRes.body.data.city).toBe("Colombo");
  });

  test("supports autocomplete and validates short query", async () => {
    const invalidRes = await request(app)
      .get("/api/smart-commute/weather-suggestion/autocomplete")
      .query({ query: "c" });

    expect(invalidRes.statusCode).toBe(400);
    expect(invalidRes.body.success).toBe(false);

    const validRes = await request(app)
      .get("/api/smart-commute/weather-suggestion/autocomplete")
      .query({ query: "Col" });

    expect(validRes.statusCode).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.data[0].display_name).toContain("Colombo");
  });
});
