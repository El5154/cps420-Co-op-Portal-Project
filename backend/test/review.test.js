const request = require("supertest");
const app = require("../app");
const db = require("../config/applicants");

describe("POST /login", () => {
  beforeEach(() => {
    db.prepare("DELETE FROM users").run();
    db.prepare("DELETE FROM applicants").run();

    db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run("coordinator", "password", "coordinator");

    db.prepare(`
      INSERT INTO applicants (name, studentID, email)
      VALUES (?, ?, ?)
    `).run("Alice", "123456789", "alice@torontomu.ca");

    db.prepare(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `).run("123456789", "password", "applicant");
  });

  test("valid coordinator login", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        username: "coordinator",
        password: "password"
      });

    expect(res.statusCode).toBe(200);
  });

  test("valid applicant login", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        username: "123456789",
        password: "password"
      });

    expect(res.statusCode).toBe(200);
  });

  test("invalid login", async () => {
    const res = await request(app)
      .post("/login")
      .send({
        username: "coordinator",
        password: "wrongpassword"
      });

    expect(res.statusCode).toBe(401);
  });

  test("logout destroys session and blocks protected route", async () => {
    const agent = request.agent(app);

    const loginRes = await agent.post("/login").send({
      username: "coordinator",
      password: "password"
    });
    expect(loginRes.statusCode).toBe(200);

    const beforeLogout = await agent.get("/dashboard");
    expect(beforeLogout.statusCode).toBe(200);

    const logoutRes = await agent.post("/logout");
    expect(logoutRes.statusCode).toBe(200);

    const afterLogout = await agent.get("/dashboard");
    expect(afterLogout.statusCode).toBe(401);
  });
});