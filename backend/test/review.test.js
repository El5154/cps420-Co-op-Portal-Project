const request = require("supertest");
const app = require("../app");
const db = require("../config/applicants");

// Clear the applicants table before each test
beforeEach(() => {
  db.prepare("DELETE FROM applicants").run();
  db.prepare("DELETE FROM users").run();

  db.prepare(`
    INSERT INTO applicants (name, studentID, email, provisional_status)
    VALUES (?, ?, ?, ?)
  `).run("Alice Smith", "123456789", "alice@torontomu.ca", "pending");
  db.prepare(`
    INSERT INTO applicants (name, studentID, email, provisional_status)
    VALUES (?, ?, ?, ?)
  `).run("Sam Joseph", "123456780", "sam@torontomu.ca", "pending");

  db.prepare(`
    INSERT INTO users (username, password, role)
    VALUES (?, ?, ?)
    `).run("coordinator", "password", "coordinator");
  db.prepare(`
    INSERT INTO users (username, password, role)
    VALUES (?, ?, ?)
    `).run("student", "password", "applicant");
});

// Test cases for reviewing and managing co-op applications
describe("GET /applicants", () => {
    // Get all applicants (not authenticated)
    test("Get applicants without authentication", async () => {
        const agent = request.agent(app);

        const getApplicants = await agent.get("/applicants");
        expect(getApplicants.statusCode).toBe(401);
    });
    // Get all applicants (authenticated as student)
    test("Get applicants as Student", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "student",
            password: "password"
        });

        const getApplicants = await agent.get("/applicants");
        expect(getApplicants.statusCode).toBe(403);
    });

    // Get all applicants (authenticated as coordinator)
    test("Get applicants as Coordinator", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "coordinator",
            password: "password"
        });

        const getApplicants = await agent.get("/applicants");

        expect(getApplicants.statusCode).toBe(200);
        expect(getApplicants.body.length).toBe(2);
        expect(Array.isArray(getApplicants.body)).toBe(true);
    });
});

// Test cases for updating applicant status
describe("PATCH /applicants/:id/status", () => {
    // Update applicant status (not authenticated)
    test("Update applicant status without authentication", async () => {
        const application = db.prepare("SELECT * FROM applicants WHERE studentID = ?").get("123456789");

        const res = await request(app)
            .patch(`/applicants/${application.id}/status`)
            .send({ provisional_status: "Approved" });

        expect(res.statusCode).toBe(401);
    });

    // Update applicant status (authenticated as student)
    test("Update applicant status as Student", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "student",
            password: "password"
        });

        const application = db.prepare("SELECT * FROM applicants WHERE studentID = ?").get("123456789");

        const res = await agent
            .patch(`/applicants/${application.id}/status`)
            .send({ provisional_status: "Approved" });

        expect(res.statusCode).toBe(403);
    });

    // Update applicant status to Accepted (authenticated as coordinator)
    test("coordinator can update applicant status to Accepted", async () => {
      const agent = request.agent(app);

      await agent.post("/login").send({
        username: "coordinator",
        password: "password"
      });

      const applicant = db.prepare("SELECT * FROM applicants WHERE studentID = ?").get("123456789");

      const res = await agent
        .patch(`/applicants/${applicant.id}/status`)
        .send({ provisional_status: "Approved" });

      expect(res.statusCode).toBe(200);

      const updatedApplicant = db.prepare("SELECT * FROM applicants WHERE id = ?").get(applicant.id);
      expect(updatedApplicant.provisional_status).toBe("Approved");
    });

    // Update applicant status to Rejected (authenticated as coordinator)
    test("coordinator can update applicant status to Rejected", async () => {
      const agent = request.agent(app);

      await agent.post("/login").send({
        username: "coordinator",
        password: "password"
      });

      const applicant = db.prepare("SELECT * FROM applicants WHERE studentID = ?").get("123456789");

      const res = await agent
        .patch(`/applicants/${applicant.id}/status`)
        .send({ provisional_status: "Rejected" });

      expect(res.statusCode).toBe(200);

      const updatedApplicant = db.prepare("SELECT * FROM applicants WHERE id = ?").get(applicant.id);
      expect(updatedApplicant.provisional_status).toBe("Rejected");
    });

    // Update applicant status with invalid status value (authenticated as coordinator)
    test("invalid status gives 400", async () => {
      const agent = request.agent(app);

      await agent.post("/login").send({
        username: "coordinator",
        password: "password"
      });

      const applicant = db.prepare("SELECT * FROM applicants WHERE studentID = ?").get("123456789");

      const res = await agent
        .patch(`/applicants/${applicant.id}/status`)
        .send({ provisional_status: "Maybe" });

      expect(res.statusCode).toBe(400);
    });
});