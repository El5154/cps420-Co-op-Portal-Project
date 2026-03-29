const request = require("supertest");
const app = require("../app");
const {
  db,
  resetDatabase,
  seedUser,
  seedApplicant
} = require("./testUtils");

describe("Login and Logout", () => {
  beforeEach(() => {
    resetDatabase();
  });

  test("login_success_coordinator", async () => {
    seedUser({
      username: "coord1",
      password: "pass123",
      role: "coordinator"
    });

    const res = await request(app).post("/login").send({
      username: "coord1",
      password: "pass123"
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.role).toBe("coordinator");
  });

  test("login_success_applicant", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    const res = await request(app).post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Login successful");
    expect(res.body.role).toBe("applicant");
  });

  test("login_missing_fields", async () => {
    const res = await request(app).post("/login").send({
      username: "",
      password: ""
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Username and password are required");
  });

  test("login_invalid_credentials", async () => {
    seedUser({
      username: "coord1",
      password: "pass123",
      role: "coordinator"
    });

    const res = await request(app).post("/login").send({
      username: "coord1",
      password: "wrongpass"
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("logout_success", async () => {
    const agent = request.agent(app);

    seedUser({
      username: "coord1",
      password: "pass123",
      role: "coordinator"
    });

    await agent.post("/login").send({
      username: "coord1",
      password: "pass123"
    });

    const res = await agent.post("/logout");

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged out");
  });
});