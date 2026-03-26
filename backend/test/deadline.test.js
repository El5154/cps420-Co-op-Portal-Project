const request = require("supertest");
const app = require("../app");
const {
  resetDatabase,
  seedApplicant,
  seedReport,
  seedUser,
  db
} = require("./testUtils");

describe("Setting Deadline Test", () => {
  let agent;
  let applicant;

  beforeEach(async () => {
    resetDatabase();

    seedUser({
      username: "coord1",
      password: "pass123",
      role: "coordinator"
    });

    applicant = seedApplicant({
      name: "Test Applicant",
      studentID: "123456789",
      email: "test@torontomu.ca",
      provisional_status: "Pending",
      final_status: "Pending"
    });

    seedReport({
      studentID: "123456789",
      report_status: "Not Submitted",
      evaluation_status: "Not Evaluated"
    });

    agent = request.agent(app);

    await agent.post("/login").send({
      username: "coord1",
      password: "pass123"
    });
  });

  test("coordinator can set a deadline", async () => {
    const response = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({ deadline: "2026-04-10T23:59:00" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Deadline updated successfully");
    expect(response.body.deadline).toBe("2026-04-10T23:59:00");

    const report = db.prepare(`
      SELECT deadline
      FROM reports
      WHERE studentID = ?
    `).get("123456789");

    expect(report.deadline).toBe("2026-04-10T23:59:00");
  });

  test("missing deadline is rejected", async () => {
    const response = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Deadline is required");
  });

  test("invalid deadline format is rejected", async () => {
    const response = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({ deadline: "04/10/2026" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Deadline must be in YYYY-MM-DDTHH:MM:SS format");
  });

  test("past deadline is rejected", async () => {
    const response = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({ deadline: "2020-01-01T23:59:00" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Deadline must be at a later date");
  });

  test("invalid applicant id returns 404", async () => {
    const response = await agent
      .patch("/applicants/99999/deadline")
      .send({ deadline: "2026-04-10T23:59:00" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Applicant not found");
  });

  test("updated deadline appears in coordinator review", async () => {
    await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({ deadline: "2026-04-15T23:59:00" });

    const response = await agent.get(`/applicants/${applicant.id}/review`);

    expect(response.status).toBe(200);
    expect(response.body.deadline).toBe("2026-04-15T23:59:00");
  });

  test("non coordinator cannot set deadline", async () => {
    resetDatabase();

    seedUser({
      username: "applicant1",
      password: "pass123",
      role: "applicant"
    });

    const otherApplicant = seedApplicant({
      name: "Applicant User",
      studentID: "987654321",
      email: "applicant@torontomu.ca"
    });

    seedReport({
      studentID: "987654321",
      report_status: "Not Submitted",
      evaluation_status: "Not Evaluated"
    });

    const applicantAgent = request.agent(app);

    await applicantAgent.post("/login").send({
      username: "applicant1",
      password: "pass123"
    });

    const response = await applicantAgent
      .patch(`/applicants/${otherApplicant.id}/deadline`)
      .send({ deadline: "2026-04-20T23:59:00" });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Coordinator access only");
  });
});