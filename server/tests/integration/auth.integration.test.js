const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../../app");
const User = require("../../models/User");

describe("Auth API integration tests", () => {
  const mongoUri =
    process.env.MONGODB_URI_TEST ||
    process.env.MONGO_URI_TEST ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI;

  beforeAll(async () => {
    process.env.JWT_SECRET =
      process.env.JWT_SECRET || "integration-test-secret";

    if (!mongoUri) {
      throw new Error(
        "Set MONGODB_URI_TEST (or MONGODB_URI) to run integration tests.",
      );
    }

    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("registers a user successfully", async () => {
    const payload = {
      name: "Test User",
      email: "test.user@example.com",
      password: "password123",
      faculty: "Engineering",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(payload);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty("token");
    expect(response.body.user.email).toBe("test.user@example.com");

    const dbUser = await User.findOne({ email: payload.email });
    expect(dbUser).not.toBeNull();
  });

  it("rejects register with invalid email", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Bad Email User",
      email: "invalid-email",
      password: "password123",
      faculty: "Science",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("logs in and fetches protected profile", async () => {
    const registerPayload = {
      name: "Jane Doe",
      email: "jane.doe@example.com",
      password: "password123",
      faculty: "Computing",
    };

    await request(app).post("/api/auth/register").send(registerPayload);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: registerPayload.email,
      password: registerPayload.password,
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body).toHaveProperty("token");

    const profileResponse = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${loginResponse.body.token}`);

    expect(profileResponse.statusCode).toBe(200);
    expect(profileResponse.body.success).toBe(true);
    expect(profileResponse.body.user.email).toBe(registerPayload.email);
  });

  it("returns 401 for profile without token", async () => {
    const response = await request(app).get("/api/auth/profile");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBeDefined();
  });

  it("returns 401 for wrong login password", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Wrong Password User",
      email: "wrong.password@example.com",
      password: "password123",
      faculty: "Science",
    });

    const response = await request(app).post("/api/auth/login").send({
      email: "wrong.password@example.com",
      password: "invalid-password",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
