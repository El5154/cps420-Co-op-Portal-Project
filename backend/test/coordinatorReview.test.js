const request = require("supertest");
const app = require("../app");
const {
  db,
  resetDatabase,
  seedUser,
  seedApplicant,
  seedReport
} = require("./testUtils");

describe("Coordinator Review", () => {
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

  test("get_applicants_success", async () => {
    const applicant = seedApplicant({
      name: "Accepted User",
      studentID: "501234567",
      email: "accepted@torontomu.ca",
      provisional_status: "Accepted",
      final_status: "Accepted"
    });

    seedReport({
      studentID: applicant.studentID,
      report_status: "Submitted",
      evaluation_status: "Not Evaluated"
    });

    const res = await agent.get("/applicants");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Accepted User");
    expect(res.body[0].report_status).toBe("Submitted");
  });

  test("patch_provisional_status_success", async () => {
    const applicant = seedApplicant({
      name: "Pending User",
      studentID: "501234567",
      email: "pending@torontomu.ca"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/status`)
      .send({ provisional_status: "Accepted" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Applicant provisional status updated successfully");

    const updated = db.prepare(
      "SELECT provisional_status FROM applicants WHERE id = ?"
    ).get(applicant.id);

    expect(updated.provisional_status).toBe("Accepted");
  });

  test("patch_provisional_status_missing_value", async () => {
    const applicant = seedApplicant({
      name: "Pending User",
      studentID: "501234567",
      email: "pending@torontomu.ca"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/status`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("provisional_status is required");
  });

  test("patch_provisional_status_invalid_value", async () => {
    const applicant = seedApplicant({
      name: "Pending User",
      studentID: "501234567",
      email: "pending@torontomu.ca"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/status`)
      .send({ provisional_status: "Pending" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid status value");
  });

  test("patch_provisional_status_applicant_not_found", async () => {
    const res = await agent
      .patch("/applicants/9999/status")
      .send({ provisional_status: "Accepted" });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe("Applicant not found");
  });

  test("patch_provisional_status_rejected_after_finalization", async () => {
    const applicant = seedApplicant({
      name: "Finalized User",
      studentID: "501234567",
      email: "finalized@torontomu.ca",
      provisional_status: "Accepted",
      final_status: "Accepted"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/status`)
      .send({ provisional_status: "Rejected" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Cannot change provisional status after finalization");
  });

  test("finalize_success_after_provisional_accept", async () => {
    const applicant = seedApplicant({
      name: "Accepted User",
      studentID: "501234567",
      email: "accepted@torontomu.ca",
      provisional_status: "Accepted",
      final_status: "Pending"
    });

    const res = await agent.patch(`/applicants/${applicant.id}/finalize`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Applicant final status updated successfully");

    const updated = db.prepare(
      "SELECT final_status FROM applicants WHERE id = ?"
    ).get(applicant.id);

    expect(updated.final_status).toBe("Accepted");
  });

  test("finalize_success_after_provisional_reject", async () => {
    const applicant = seedApplicant({
      name: "Rejected User",
      studentID: "501234568",
      email: "rejected@torontomu.ca",
      provisional_status: "Rejected",
      final_status: "Pending"
    });

    const res = await agent.patch(`/applicants/${applicant.id}/finalize`);

    expect(res.statusCode).toBe(200);

    const updated = db.prepare(
      "SELECT final_status FROM applicants WHERE id = ?"
    ).get(applicant.id);

    expect(updated.final_status).toBe("Rejected");
  });

  test("finalize_reject_if_provisional_pending", async () => {
    const applicant = seedApplicant({
      name: "Pending User",
      studentID: "501234567",
      email: "pending@torontomu.ca",
      provisional_status: "Pending",
      final_status: "Pending"
    });

    const res = await agent.patch(`/applicants/${applicant.id}/finalize`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Provisional decision must be made before finalization");
  });

  test("finalize_reject_if_already_finalized", async () => {
    const applicant = seedApplicant({
      name: "Finalized User",
      studentID: "501234567",
      email: "finalized@torontomu.ca",
      provisional_status: "Accepted",
      final_status: "Accepted"
    });

    const res = await agent.patch(`/applicants/${applicant.id}/finalize`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Applicant decision has already been finalized");
  });
});