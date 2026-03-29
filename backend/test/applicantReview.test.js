const request = require("supertest");
const app = require("../app");
const {
  resetDatabase,
  seedUser,
  seedApplicant,
  seedReport
} = require("./testUtils");

describe("Applicant Dashboard", () => {
  let agent;

  beforeEach(async () => {
    resetDatabase();
    agent = request.agent(app);
  });

  test("dashboard_returns_applicant_data_with_report", async () => {
    seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca",
      provisional_status: "Accepted",
      final_status: "Accepted"
    });

    seedReport({
      studentID: "501234567",
      report_status: "Submitted",
      report_filename: "501234567_report.pdf",
      report_uploaded_at: "2026-03-29T10:00:00",
      evaluation_status: "Not Evaluated",
      deadline: "2026-04-10T23:59:59"
    });

    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const res = await agent.get("/applicant/dashboard");

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Applicant User");
    expect(res.body.studentID).toBe("501234567");
    expect(res.body.provisional_status).toBe("Accepted");
    expect(res.body.final_status).toBe("Accepted");
    expect(res.body.report_status).toBe("Submitted");
    expect(res.body.report_filename).toBe("501234567_report.pdf");
    expect(res.body.evaluation_status).toBe("Not Evaluated");
    expect(res.body.deadline).toBe("2026-04-10T23:59:59");
  });

  test("dashboard_returns_applicant_data_without_report", async () => {
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

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const res = await agent.get("/applicant/dashboard");

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Applicant User");
    expect(res.body.studentID).toBe("501234567");
    expect(res.body.report_status).toBeNull();
    expect(res.body.report_filename).toBeNull();
    expect(res.body.report_uploaded_at).toBeNull();
    expect(res.body.evaluation_status).toBeNull();
    expect(res.body.deadline).toBeNull();
  });

  test("dashboard_forbidden_for_coordinator", async () => {
    seedUser({
      username: "coord1",
      password: "pass123",
      role: "coordinator"
    });

    await agent.post("/login").send({
      username: "coord1",
      password: "pass123"
    });

    const res = await agent.get("/applicant/dashboard");

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("Forbidden");
  });

  test("dashboard_requires_login", async () => {
    const res = await request(app).get("/applicant/dashboard");
    expect(res.statusCode).not.toBe(200);
  });

  test("dashboard_applicant_not_found", async () => {
    seedUser({
      username: "501234567",
      password: "pass123",
      role: "applicant"
    });

    await agent.post("/login").send({
      username: "501234567",
      password: "pass123"
    });

    const res = await agent.get("/applicant/dashboard");

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Applicant not found");
  });
});