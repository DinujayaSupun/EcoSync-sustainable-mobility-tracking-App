const request = require("supertest");
const app = require("../app");

describe("Carbon API Integration Tests", () => {

  let recordId;

  test("POST /api/carbon/calculate should create record", async () => {
    const response = await request(app)
      .post("/api/carbon/calculate")
      .send({
        userId: "testUser",
        vehicleType: "TRAIN",
        distance: 10
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

  test("DELETE /api/carbon/record/:id should delete record", async () => {
    const response = await request(app)
      .delete(`/api/carbon/record/${recordId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });

});