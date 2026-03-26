const request = require("supertest");
const app = require("../app");
const { resetDatabase, db } = require("./testUtils");

describe("Registration + Student Validation", () => {
  beforeEach(() => {
    resetDatabase();
  });

  test("add_applicant", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "Eric Liu",
        studentID: "501111111",
        email: "eric@torontomu.ca"
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Applicant registered successfully");

    const applicant = db.prepare(
      "SELECT * FROM applicants WHERE studentID = ?"
    ).get("501111111");

    expect(applicant).toBeTruthy();
  });

  test("add_invalid_applicant", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        name: "Eric Liu",
        studentID: "123912",
        email: "eric@gmail.ca"
      });

    expect(res.status).toBe(400);
  });

  test("test_duplicate_id", async () => {
    await request(app).post("/register").send({
      name: "First User",
      studentID: "501111111",
      email: "first@torontomu.ca"
    });

    const res = await request(app).post("/register").send({
      name: "Second User",
      studentID: "501111111",
      email: "second@torontomu.ca"
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Student ID or email already exists");
  });

  test("test_duplicate_email", async () => {
    await request(app).post("/register").send({
      name: "First User",
      studentID: "501111111",
      email: "same@torontomu.ca"
    });

    const res = await request(app).post("/register").send({
      name: "Second User",
      studentID: "502222222",
      email: "same@torontomu.ca"
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Student ID or email already exists");
  });

  test("valid_student_id", async () => {
    const res = await request(app).post("/register").send({
      name: "Valid Student",
      studentID: "123456789",
      email: "valid@torontomu.ca"
    });

    expect(res.status).toBe(201);
  });

  test("invalid_student_id_short", async () => {
    const res = await request(app).post("/register").send({
      name: "Short ID",
      studentID: "12345678",
      email: "short@torontomu.ca"
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Student ID must be exactly 9 digits");
  });

  test("invalid_student_id_long", async () => {
    const res = await request(app).post("/register").send({
      name: "Long ID",
      studentID: "1234567890",
      email: "long@torontomu.ca"
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Student ID must be exactly 9 digits");
  });

  test("invalid_student_id_letters", async () => {
    const res = await request(app).post("/register").send({
      name: "Letter ID",
      studentID: "123A5B89C",
      email: "letters@torontomu.ca"
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Student ID must be exactly 9 digits");
  });

  test("invalid_student_id_special_characters", async () => {
    const res = await request(app).post("/register").send({
      name: "Special ID",
      studentID: "12$%56789",
      email: "special@torontomu.ca"
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Student ID must be exactly 9 digits");
  });

  test("valid_email_domain", async () => {
    const res = await request(app).post("/register").send({
      name: "TMU Student",
      studentID: "503333333",
      email: "student@torontomu.ca"
    });

    expect(res.status).toBe(201);
  });
});