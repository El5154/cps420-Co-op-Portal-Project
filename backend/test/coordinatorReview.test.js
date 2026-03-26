const request = require("supertest");
const app = require("../app");
const {
  resetDatabase,
  seedApplicant,
  seedReport,
  seedUser,
  db
} = require("./testUtils");

describe("Application finalization + coordinator status", () => {
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

  test("accept_application", async () => {
    const applicant = seedApplicant({
      name: "Accepted User",
      studentID: "501111111",
      email: "accepted@torontomu.ca"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/status`)
      .send({ provisional_status: "Accepted" });

    expect(res.status).toBe(200);

    const updated = db.prepare(
      "SELECT * FROM applicants WHERE id = ?"
    ).get(applicant.id);

    expect(updated.provisional_status).toBe("Accepted");
  });

  test("reject_application", async () => {
    const applicant = seedApplicant({
      name: "Rejected User",
      studentID: "502222222",
      email: "rejected@torontomu.ca"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/status`)
      .send({ provisional_status: "Rejected" });

    expect(res.status).toBe(200);

    const updated = db.prepare(
      "SELECT * FROM applicants WHERE id = ?"
    ).get(applicant.id);

    expect(updated.provisional_status).toBe("Rejected");
  });

  test("decision_finalization", async () => {
    const applicant = seedApplicant({
      name: "Finalized User",
      studentID: "503333333",
      email: "final@torontomu.ca",
      provisional_status: "Accepted",
      final_status: "Accepted"
    });

    const res = await agent
      .patch(`/applicants/${applicant.id}/status`)
      .send({ provisional_status: "Rejected" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Cannot change provisional status after finalization");

    const unchanged = db.prepare(
      "SELECT * FROM applicants WHERE id = ?"
    ).get(applicant.id);

    expect(unchanged.final_status).toBe("Accepted");
    expect(unchanged.provisional_status).toBe("Accepted");
  });

  test("view_conditional_status_coordinator", async () => {
    seedApplicant({
      name: "Accepted User",
      studentID: "501111111",
      email: "accepted@torontomu.ca",
      provisional_status: "Accepted"
    });

    seedApplicant({
      name: "Rejected User",
      studentID: "502222222",
      email: "rejected@torontomu.ca",
      provisional_status: "Rejected"
    });

    seedApplicant({
      name: "Pending User",
      studentID: "503333333",
      email: "pending@torontomu.ca",
      provisional_status: "Pending"
    });

    seedReport({ studentID: "501111111" });
    seedReport({ studentID: "502222222" });
    seedReport({ studentID: "503333333" });

    const res = await agent.get("/applicants");

    expect(res.status).toBe(200);

    const accepted = res.body.find(a => a.studentID === "501111111");
    const rejected = res.body.find(a => a.studentID === "502222222");
    const pending = res.body.find(a => a.studentID === "503333333");

    expect(accepted.provisional_status).toBe("Accepted");
    expect(rejected.provisional_status).toBe("Rejected");
    expect(pending.provisional_status).toBe("Pending");
  });

  test("view_final_status_coordinator", async () => {
    seedApplicant({
      name: "Accepted Final",
      studentID: "504444444",
      email: "acceptedfinal@torontomu.ca",
      final_status: "Accepted"
    });

    seedApplicant({
      name: "Rejected Final",
      studentID: "505555555",
      email: "rejectedfinal@torontomu.ca",
      final_status: "Rejected"
    });

    seedReport({ studentID: "504444444" });
    seedReport({ studentID: "505555555" });

    const res = await agent.get("/applicants");

    expect(res.status).toBe(200);

    const accepted = res.body.find(a => a.studentID === "504444444");
    const rejected = res.body.find(a => a.studentID === "505555555");

    expect(accepted.final_status).toBe("Accepted");
    expect(rejected.final_status).toBe("Rejected");
  });
});