const request = require("supertest");
const mongoose = require("mongoose")
const app = require("../app");

describe("Carbon API Integration Tests", () => {

  let recordId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("POST /api/carbon/calculate should create record", async () => {
    const response = await request(app)
      .post("/api/carbon/calculate")
      .send({
        userId: "testUser",
        vehicleType: "TRAIN",
        distance: 10
      })

      .send({
        userId:  "user001",
        vehicleType: "TRAIN",
        distance: 15
      })

      .send({
        userId:  "user002",
        vehicleType: "WALK",
        distance: 5
      })

      .send({
        userId:  "user002",
        vehicleType: "WALK",
        distance: 5
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    recordId = response.body.record._id;
  });

  test("GET /api/carbon/record/:id should return record", async () => {
    const response = await request(app)
      .get(`/api/carbon/record/${recordId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("PUT /api/carbon/record/:id should update record", async () => {
    const response = await request(app)
      .put(`/api/carbon/record/${recordId}`)
      .send({
        userId: "testUser",
        vehicleType: "BUS",
        distance: 10
      })

      .send({
        userId: "user001",
        vehicleType: "BUS",
        distance: 10
      })

      .send({
        userId:  "user003",
        vehicleType: "WALK",
        distance: 5
      })

      .send({
        userId:  "user004",
        vehicleType: "WALK",
        distance: 5
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      //recordId = response.body.record._id;
  })

  test("DELETE /api/carbon/record/:id should delete record", async () => {
    const response = await request(app)
      .delete(`/api/carbon/record/${recordId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

});