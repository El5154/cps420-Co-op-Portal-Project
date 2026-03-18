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
        name: "student",
        studentID: "123456789",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(201);
  });

// Missing field
  test("missing field", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789"
      });

    expect(res.statusCode).toBe(400);
  });

// Invalid student ID
  test("invalid student ID < 9 digits", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "12345678",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

  test("invalid student ID > 9 digits", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "1234567890",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

  test("invalid student ID contains letters", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123A5B89C",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

  test("invalid student ID contains symbols", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "12$%56@89",
        email: "student@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

// Invalid email
  test("invalid email", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789",
        email: "test@gmail.com"
      });

    expect(res.statusCode).toBe(400);
  });
  
// Duplicate registration
  test("duplicate applicant", async () => {
    await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789",
        email: "test@torontomu.ca"
      });

    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789",
        email: "test@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

  test("duplicate applicant ID", async () => {
    await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789",
        email: "student@torontomu.ca"
      });

    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789",
        email: "test@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });

  test("duplicate applicant Email", async () => {
    await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456780",
        email: "test@torontomu.ca"
      });

    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789",
        email: "test@torontomu.ca"
      });

    expect(res.statusCode).toBe(400);
  });
});