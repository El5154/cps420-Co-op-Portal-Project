const request = require("supertest");
const app = require("../app");
const {
  resetDatabase,
  seedApplicant,
  seedUser
} = require("./testUtils");

describe("Login and security check", () => {
  beforeEach(() => {
    resetDatabase();
  });

  test("login_valid_user", async () => {
    seedUser({
      username: "coordinator1",
      password: "pass123",
      role: "coordinator"
    });

    const res = await request(app).post("/login").send({
      username: "coordinator1",
      password: "pass123"
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful");
  });

  test("login_incorrect_password", async () => {
    seedUser({
      username: "coordinator1",
      password: "pass123",
      role: "coordinator"
    });

    const res = await request(app).post("/login").send({
      username: "coordinator1",
      password: "wrongpass"
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("login_incorrect_email", async () => {
    seedUser({
      username: "coordinator1",
      password: "pass123",
      role: "coordinator"
    });

    const res = await request(app).post("/login").send({
      username: "wronguser",
      password: "pass123"
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("login_is_empty", async () => {
    const res = await request(app).post("/login").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Username and password are required");
  });

  test("login_nonexistent_user", async () => {
    const res = await request(app).post("/login").send({
      username: "randomuser",
      password: "pass123"
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("login_valid_user_applicant", async () => {
    seedApplicant({
      name: "Eric Liu",
      studentID: "501111111",
      email: "eric@torontomu.ca"
    });

    seedUser({
      username: "501111111",
      password: "pass123",
      role: "applicant"
    });

    const res = await request(app).post("/login").send({
      username: "501111111",
      password: "pass123"
    });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("applicant");
  });
});