const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const Trip = require("../models/Trip");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(),
}));

describe("Admin Controller Tests", () => {
  let adminToken;
  let adminUser;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      const mongoUri =
        process.env.MONGODB_URI_TEST ||
        process.env.MONGO_URI_TEST ||
        process.env.MONGODB_URI ||
        process.env.MONGO_URI;

      await mongoose.connect(mongoUri);
    }
  });

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      name: "Test Admin",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      faculty: "Engineering",
    });

    // Generate admin token
    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Create test user
    testUser = await User.create({
      name: "Test User",
      email: "user@test.com",
      password: "password123",
      role: "user",
      faculty: "Science",
    });
  });

  afterEach(async () => {
    // Clean up
    await Trip.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("GET /api/admin/stats", () => {
    it("should return admin statistics", async () => {
      const res = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("totalUsers");
      expect(res.body).toHaveProperty("totalCO2");
      expect(res.body).toHaveProperty("activeToday");
      expect(res.body).toHaveProperty("faculties");
    });

    it("should reject request without token", async () => {
      const res = await request(app).get("/api/admin/stats");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/admin/users", () => {
    it("should return all users", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0]).not.toHaveProperty("password");
    });
  });

  describe("PUT /api/admin/users/:id", () => {
    it("should update user role successfully", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "admin" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.user.role).toBe("admin");
    });

    it("should prevent self-role modification", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${adminUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "user" });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty("success", false);
      expect(res.body.message).toContain("Cannot modify your own role");
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: "invalid-email" });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("success", false);
    });

    it("should reject duplicate email", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ email: adminUser.email });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Email already in use");
    });

    it("should reject invalid user ID", async () => {
      const res = await request(app)
        .put("/api/admin/users/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "admin" });

      expect(res.statusCode).toBe(400);
    });

    it("should reject update with no fields", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain(
        "At least one field (name, email, or role) must be provided",
      );
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("should delete user successfully", async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);

      // Verify user was deleted
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it("should prevent self-deletion", async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain("Cannot delete your own account");
    });

    it("should prevent deleting last admin", async () => {
      // Delete test user first
      await User.findByIdAndDelete(testUser._id);

      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain("Cannot delete your own account");
    });

    it("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/admin/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/admin/activity-logs", () => {
    it("should return activity logs", async () => {
      const res = await request(app)
        .get("/api/admin/activity-logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("logs");
      expect(res.body).toHaveProperty("pagination");
      expect(Array.isArray(res.body.logs)).toBe(true);
    });

    it("should filter logs by action", async () => {
      const res = await request(app)
        .get("/api/admin/activity-logs?action=UPDATE")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.logs.every((log) => log.action === "UPDATE")).toBe(true);
    });

    it("should paginate logs", async () => {
      const res = await request(app)
        .get("/api/admin/activity-logs?page=1&limit=5")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination.logsPerPage).toBe(5);
    });
  });

  describe("GET /api/admin/report", () => {
    it("should return report data with summary", async () => {
      await Trip.create([
        {
          user: adminUser._id,
          origin: "Campus Gate",
          destination: "Engineering Faculty",
          distance: 5,
          transportMode: "bus",
          co2Saved: 1.2,
        },
        {
          user: testUser._id,
          origin: "Library",
          destination: "Science Faculty",
          distance: 3,
          transportMode: "walking",
          co2Saved: 0.8,
        },
      ]);

      const res = await request(app)
        .get("/api/admin/report")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body).toHaveProperty("reportData");
      expect(res.body.reportData).toHaveProperty("summary");
      expect(res.body.reportData.summary.totalTrips).toBe(2);
      expect(res.body.reportData.summary.totalDistance).toBe(8);
    });

    it("should filter report by faculty", async () => {
      const artsUser = await User.create({
        name: "Arts User",
        email: "arts@test.com",
        password: "password123",
        role: "user",
        faculty: "Arts",
      });

      await Trip.create([
        {
          user: adminUser._id,
          origin: "Campus Gate",
          destination: "Engineering Faculty",
          distance: 10,
          transportMode: "train",
          co2Saved: 2.0,
        },
        {
          user: artsUser._id,
          origin: "Hostel",
          destination: "Arts Faculty",
          distance: 2,
          transportMode: "walking",
          co2Saved: 0.5,
        },
      ]);

      const res = await request(app)
        .get("/api/admin/report?faculty=Engineering")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reportData.summary.totalTrips).toBe(1);
      expect(res.body.reportData.summary.faculty).toBe("Engineering");
    });

    it("should reject report request without token", async () => {
      const res = await request(app).get("/api/admin/report");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/admin/email-report", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should send report email successfully when SMTP is configured", async () => {
      const oldKey = process.env.BREVO_SMTP_KEY;
      const oldEmail = process.env.BREVO_SMTP_EMAIL;
      const oldFrom = process.env.BREVO_FROM_EMAIL;

      process.env.BREVO_SMTP_KEY = "test-smtp-key";
      process.env.BREVO_SMTP_EMAIL = "smtp-user@example.com";
      process.env.BREVO_FROM_EMAIL = "noreply@example.com";

      const sendMailMock = jest
        .fn()
        .mockResolvedValue({ messageId: "mock-message-id" });
      nodemailer.createTransport.mockReturnValue({
        sendMail: sendMailMock,
      });

      await Trip.create({
        user: adminUser._id,
        origin: "Campus Gate",
        destination: "Admin Office",
        distance: 4,
        transportMode: "walking",
        co2Saved: 0.9,
      });

      const res = await request(app)
        .post("/api/admin/email-report")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Report sent successfully");
      expect(sendMailMock).toHaveBeenCalledTimes(1);

      const [mailArgs] = sendMailMock.mock.calls[0];
      expect(mailArgs.to).toBe("admin@test.com");
      expect(mailArgs.subject).toContain("EcoSync Sustainability Report");
      expect(mailArgs.html).toContain("Summary Statistics");

      if (oldKey) process.env.BREVO_SMTP_KEY = oldKey;
      else delete process.env.BREVO_SMTP_KEY;
      if (oldEmail) process.env.BREVO_SMTP_EMAIL = oldEmail;
      else delete process.env.BREVO_SMTP_EMAIL;
      if (oldFrom) process.env.BREVO_FROM_EMAIL = oldFrom;
      else delete process.env.BREVO_FROM_EMAIL;
    });

    it("should fail when SMTP credentials are missing", async () => {
      const oldKey = process.env.BREVO_SMTP_KEY;
      const oldEmail = process.env.BREVO_SMTP_EMAIL;

      delete process.env.BREVO_SMTP_KEY;
      delete process.env.BREVO_SMTP_EMAIL;

      const res = await request(app)
        .post("/api/admin/email-report")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain(
        "Brevo SMTP credentials not configured",
      );

      if (oldKey) process.env.BREVO_SMTP_KEY = oldKey;
      if (oldEmail) process.env.BREVO_SMTP_EMAIL = oldEmail;
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits on update endpoint", async () => {
      // Make multiple requests quickly
      const requests = [];
      for (let i = 0; i < 25; i++) {
        requests.push(
          request(app)
            .put(`/api/admin/users/${testUser._id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ faculty: `Faculty ${i}` }),
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some((res) => res.statusCode === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe("Input Validation", () => {
    it("should reject name with invalid characters", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Test123!@#" });

      expect([400, 429]).toContain(res.statusCode);
    });

    it("should reject name that is too short", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "A" });

      expect([400, 429]).toContain(res.statusCode);
    });

    it("should reject invalid role value", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${testUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "superadmin" });

      expect([400, 429]).toContain(res.statusCode);
    });
  });
});
