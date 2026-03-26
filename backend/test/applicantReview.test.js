const request = require("supertest");
const app = require("../app");
const {
  resetDatabase,
  seedApplicant,
  seedReport,
  seedUser
} = require("./testUtils");

describe("Application status for student", () => {
  beforeEach(() => {
    resetDatabase();
  });

  async function loginApplicant(studentID, password = "pass123") {
    const agent = request.agent(app);

    await agent.post("/login").send({
      username: studentID,
      password
    });

    return agent;
  }

  test("view_conditional_status_accept", async () => {
    seedApplicant({
      name: "Accepted Student",
      studentID: "501111111",
      email: "accept@torontomu.ca",
      provisional_status: "Accepted"
    });

    seedReport({ studentID: "501111111" });

    seedUser({
      username: "501111111",
      password: "pass123",
      role: "applicant"
    });

    const agent = await loginApplicant("501111111");
    const res = await agent.get("/applicant/dashboard");

    expect(res.status).toBe(200);
    expect(res.body.provisional_status).toBe("Accepted");
  });

  test("view_conditional_status_reject", async () => {
    seedApplicant({
      name: "Rejected Student",
      studentID: "502222222",
      email: "reject@torontomu.ca",
      provisional_status: "Rejected"
    });

    seedReport({ studentID: "502222222" });

    seedUser({
      username: "502222222",
      password: "pass123",
      role: "applicant"
    });

    const agent = await loginApplicant("502222222");
    const res = await agent.get("/applicant/dashboard");

    expect(res.status).toBe(200);
    expect(res.body.provisional_status).toBe("Rejected");
  });

  test("view_condtional_status_pending", async () => {
    seedApplicant({
      name: "Pending Student",
      studentID: "503333333",
      email: "pending@torontomu.ca",
      provisional_status: "Pending"
    });

    seedReport({ studentID: "503333333" });

    seedUser({
      username: "503333333",
      password: "pass123",
      role: "applicant"
    });

    const agent = await loginApplicant("503333333");
    const res = await agent.get("/applicant/dashboard");

    expect(res.status).toBe(200);
    expect(res.body.provisional_status).toBe("Pending");
  });

  test("view_final_status_reject", async () => {
    seedApplicant({
      name: "Final Reject",
      studentID: "504444444",
      email: "finalreject@torontomu.ca",
      final_status: "Rejected"
    });

    seedReport({ studentID: "504444444" });

    seedUser({
      username: "504444444",
      password: "pass123",
      role: "applicant"
    });

    const agent = await loginApplicant("504444444");
    const res = await agent.get("/applicant/dashboard");

    expect(res.status).toBe(200);
    expect(res.body.final_status).toBe("Rejected");
  });

  test("view_final_status_accept", async () => {
    seedApplicant({
      name: "Final Accept",
      studentID: "505555555",
      email: "finalaccept@torontomu.ca",
      final_status: "Accepted"
    });

    seedReport({ studentID: "505555555" });

    seedUser({
      username: "505555555",
      password: "pass123",
      role: "applicant"
    });

    const agent = await loginApplicant("505555555");
    const res = await agent.get("/applicant/dashboard");

    expect(res.status).toBe(200);
    expect(res.body.final_status).toBe("Accepted");
  });

  test("status_after_finalization", async () => {
    seedApplicant({
      name: "Read Only Student",
      studentID: "506666666",
      email: "readonly@torontomu.ca",
      provisional_status: "Accepted",
      final_status: "Accepted"
    });

    seedReport({ studentID: "506666666" });

    seedUser({
      username: "506666666",
      password: "pass123",
      role: "applicant"
    });

    const agent = await loginApplicant("506666666");
    const res = await agent.get("/applicant/dashboard");

    expect(res.status).toBe(200);
    expect(res.body.provisional_status).toBe("Accepted");
    expect(res.body.final_status).toBe("Accepted");
  });
});