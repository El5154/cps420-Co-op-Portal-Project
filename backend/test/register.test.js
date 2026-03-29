const request = require("supertest");
const app = require("../app");
const { db, resetDatabase } = require("./testUtils");

describe("Registration", () => {
  beforeEach(() => {
    resetDatabase();
  });

  test("register_success", async () => {
    const res = await request(app).post("/register").send({
      name: "Eric Liu",
      studentID: "501234567",
      email: "eric@torontomu.ca",
      password: "pass123"
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Applicant registered successfully");

    const applicant = db.prepare(
      "SELECT * FROM applicants WHERE studentID = ?"
    ).get("501234567");

    const user = db.prepare(
      "SELECT * FROM users WHERE username = ?"
    ).get("501234567");

    expect(applicant).toBeTruthy();
    expect(user).toBeTruthy();
    expect(user.role).toBe("applicant");
  });

  test("register_missing_field", async () => {
    const res = await request(app).post("/register").send({
      name: "Eric Liu",
      studentID: "501234567",
      email: "eric@torontomu.ca"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("All fields are required");
  });

  test("register_invalid_student_id_short", async () => {
    const res = await request(app).post("/register").send({
      name: "Eric Liu",
      studentID: "12345678",
      email: "eric@torontomu.ca",
      password: "pass123"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Student ID must be exactly 9 digits");
  });

  test("register_invalid_student_id_long", async () => {
    const res = await request(app).post("/register").send({
      name: "Eric Liu",
      studentID: "1234567890",
      email: "eric@torontomu.ca",
      password: "pass123"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Student ID must be exactly 9 digits");
  });

  test("register_invalid_student_id_letters", async () => {
    const res = await request(app).post("/register").send({
      name: "Eric Liu",
      studentID: "123A5B89C",
      email: "eric@torontomu.ca",
      password: "pass123"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Student ID must be exactly 9 digits");
  });

  test("register_invalid_email_domain", async () => {
    const res = await request(app).post("/register").send({
      name: "Eric Liu",
      studentID: "501234567",
      email: "eric@gmail.com",
      password: "pass123"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Email must end with @torontomu.ca");
  });

  test("register_short_password", async () => {
    const res = await request(app).post("/register").send({
      name: "Eric Liu",
      studentID: "501234567",
      email: "eric@torontomu.ca",
      password: "12345"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Password must be at least 6 characters long");
  });

  test("register_duplicate_student_id", async () => {
    await request(app).post("/register").send({
      name: "First User",
      studentID: "501234567",
      email: "first@torontomu.ca",
      password: "pass123"
    });

    const res = await request(app).post("/register").send({
      name: "Second User",
      studentID: "501234567",
      email: "second@torontomu.ca",
      password: "pass123"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Student ID or email already exists");
  });

  test("register_duplicate_email", async () => {
    await request(app).post("/register").send({
      name: "First User",
      studentID: "501234567",
      email: "same@torontomu.ca",
      password: "pass123"
    });

    const res = await request(app).post("/register").send({
      name: "Second User",
      studentID: "509999999",
      email: "same@torontomu.ca",
      password: "pass123"
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Student ID or email already exists");
  });
});