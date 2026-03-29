const request = require("supertest");
const app = require("../app");
const {
  db,
  resetDatabase,
  seedUser,
  seedApplicant,
  seedReport
} = require("./testUtils");

describe("Deadline", () => {
  let agent;

  beforeEach(async () => {
    resetDatabase();

    seedUser({
      username: "coord1",
      password: "pass123",
      role: "coordinator"
    });

    agent = request.agent(app);

    await agent.post("/login").send({
      username: "coord1",
      password: "pass123"
    });
  });

  test("set_deadline_success", async () => {
    const applicant = seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca"
    });

    seedReport({
      studentID: "501234567"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({ deadline: "2099-12-31T23:59:59" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Deadline updated successfully");
    expect(res.body.deadline).toBe("2099-12-31T23:59:59");

    const report = db.prepare(
      "SELECT deadline FROM reports WHERE studentID = ?"
    ).get("501234567");

    expect(report.deadline).toBe("2099-12-31T23:59:59");
  });

  test("set_deadline_missing_value", async () => {
    const applicant = seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca"
    });

    seedReport({
      studentID: "501234567"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Deadline is required");
  });

  test("set_deadline_invalid_format", async () => {
    const applicant = seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca"
    });

    seedReport({
      studentID: "501234567"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({ deadline: "12/31/2099" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Deadline must be in YYYY-MM-DDTHH:MM:SS format");
  });

  test("set_deadline_invalid_date", async () => {
    const applicant = seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca"
    });

    seedReport({
      studentID: "501234567"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({ deadline: "2099-99-99T99:99:99" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid deadline date");
  });

  test("set_deadline_past_date", async () => {
    const applicant = seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca"
    });

    seedReport({
      studentID: "501234567"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({ deadline: "2000-01-01T00:00:00" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Deadline must be at a later date");
  });

  test("set_deadline_applicant_not_found", async () => {
    const res = await agent
      .patch("/applicants/9999/deadline")
      .send({ deadline: "2099-12-31T23:59:59" });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Applicant not found");
  });

  test("set_deadline_reject_if_reports_row_missing", async () => {
    const applicant = seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/deadline`)
      .send({ deadline: "2099-12-31T23:59:59" });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Applicant not found");
  });
});