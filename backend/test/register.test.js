// test/register.test.js - Tests for the /register endpoint

const request = require("supertest");
const app = require("../app");
const db = require("../config/applicants");

// Clear the applicants table before each test
beforeEach(() => {
  db.prepare("DELETE FROM applicants").run();
});

// Test cases for applicant registration
describe("POST /register", () => {

// Valid registration
  test("valid applicant", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "Eric",
        studentID: "12345678",
        email: "test@torontomu.ca"
      });

    expect(res.statusCode).toBe(201);
  });

// Missing field
  test("missing field", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "Eric",
        studentID: "12345678"
      });

    expect(res.statusCode).toBe(400);
  });

// Invalid student ID
  test("invalid student ID", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "Eric",
        studentID: "1234",
        email: "test@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

// Invalid email
  test("invalid email", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "Eric",
        studentID: "12345678",
        email: "test@gmail.com"
      });

    expect(res.statusCode).toBe(400);
  });
  
// Duplicate registration
  test("duplicate applicant", async () => {
    await request(app)
      .post("/register")
      .send({
        name: "Eric",
        studentID: "12345678",
        email: "test@torontomu.ca"
      });

    const res = await request(app)
      .post("/register")
      .send({
        name: "Eric",
        studentID: "12345678",
        email: "test@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

});