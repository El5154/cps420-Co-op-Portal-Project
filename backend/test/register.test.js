const request = require("supertest");
const app = require("../app");
const db = require("../config/applicants");

beforeEach(() => {
  db.prepare("DELETE FROM applicants").run();
  db.prepare("DELETE FROM users").run();
});

describe("POST /register", () => {
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

  test("missing field", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "student",
        studentID: "123456789"
      });

    expect(res.statusCode).toBe(400);
  });

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

  test("duplicate applicant ID", async () => {
    await request(app).post("/register").send({
      name: "student1",
      studentID: "123456789",
      email: "student1@torontomu.ca"
    });

    const res = await request(app).post("/register").send({
      name: "student2",
      studentID: "123456789",
      email: "student2@torontomu.ca"
    });

    expect(res.statusCode).toBe(400);
  });

  test("duplicate applicant email", async () => {
    await request(app).post("/register").send({
      name: "student1",
      studentID: "123456780",
      email: "student@torontomu.ca"
    });

    const res = await request(app).post("/register").send({
      name: "student2",
      studentID: "123456789",
      email: "student@torontomu.ca"
    });

    expect(res.statusCode).toBe(400);
  });
});