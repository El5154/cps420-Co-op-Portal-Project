const request = require("supertest");
const app = require("../app");
const {
  resetDatabase,
  seedUser,
  seedApplicant,
  seedReport
} = require("./testUtils");

describe("Review Report", () => {
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

  test("review_report_success_with_report", async () => {
    const applicant = seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca"
    });

    seedReport({
      studentID: "501234567",
      report_status: "Submitted",
      evaluation_status: "Not Evaluated",
      report_filename: "501234567_report.pdf",
      report_uploaded_at: "2026-03-29T10:00:00",
      deadline: "2026-04-10T23:59:59"
    });

    const res = await agent.get(`/applicants/${applicant.id}/review`);

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Applicant User");
    expect(res.body.studentID).toBe("501234567");
    expect(res.body.report_status).toBe("Submitted");
    expect(res.body.report_filename).toBe("501234567_report.pdf");
    expect(res.body.report_url).toBe("/reports/501234567_report.pdf");
  });

  test("review_report_success_without_report", async () => {
    const applicant = seedApplicant({
      name: "Applicant User",
      studentID: "501234567",
      email: "applicant@torontomu.ca"
    });

    const res = await agent.get(`/applicants/${applicant.id}/review`);

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Applicant User");
    expect(res.body.report_status).toBeNull();
    expect(res.body.report_filename).toBeNull();
    expect(res.body.report_url).toBeNull();
    expect(res.body.deadline).toBeNull();
  });

  test("review_report_applicant_not_found", async () => {
    const res = await agent.get("/applicants/9999/review");

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Applicant not found");
  });
});