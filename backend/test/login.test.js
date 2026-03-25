// test/login.test.js

const request = require("supertest");
const express = require("express");

jest.mock("../config/applicants", () => ({
  prepare: jest.fn(),
}));

const db = require("../config/applicants");
const loginRoutes = require("../routes/login");

describe("Login Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // fake session middleware for testing
    app.use((req, res, next) => {
      req.session = {
        save: jest.fn((cb) => cb(null)),
        destroy: jest.fn((cb) => cb()),
      };
      next();
    });

    app.use(loginRoutes);

    jest.clearAllMocks();
  });

  describe("POST /login", () => {
    test("login_valid_user: logs in coordinator with valid credentials", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 1,
          username: "coordinator1",
          password: "pass123",
          role: "coordinator",
        }),
      });

      const res = await request(app)
        .post("/login")
        .send({
          username: "coordinator1",
          password: "pass123",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Login successful",
        role: "coordinator",
      });
    });

    test("login_valid_user: logs in applicant and attaches studentID to session", async () => {
      const userGetMock = jest.fn().mockReturnValue({
        id: 2,
        username: "123456789",
        password: "applicantpass",
        role: "applicant",
      });

      const applicantGetMock = jest.fn().mockReturnValue({
        studentID: "123456789",
      });

      db.prepare
        .mockReturnValueOnce({ get: userGetMock })
        .mockReturnValueOnce({ get: applicantGetMock });

      let savedSessionUser;

      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.session = {
          save: jest.fn((cb) => {
            savedSessionUser = req.session.user;
            cb(null);
          }),
          destroy: jest.fn((cb) => cb()),
        };
        next();
      });
      app.use(loginRoutes);

      const res = await request(app)
        .post("/login")
        .send({
          username: "123456789",
          password: "applicantpass",
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Login successful",
        role: "applicant",
      });

      expect(savedSessionUser).toEqual({
        id: 2,
        username: "123456789",
        role: "applicant",
        studentID: "123456789",
      });
    });

    test("login_incorrect_password: rejects wrong password", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined),
      });

      const res = await request(app)
        .post("/login")
        .send({
          username: "coordinator1",
          password: "wrongpass",
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: "Invalid credentials",
      });
    });

    test("login_incorrect_email: rejects wrong username", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined),
      });

      const res = await request(app)
        .post("/login")
        .send({
          username: "wronguser",
          password: "pass123",
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: "Invalid credentials",
      });
    });

    test("login_nonexistent_user: rejects user not in system", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined),
      });

      const res = await request(app)
        .post("/login")
        .send({
          username: "randomuser",
          password: "randompass",
        });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: "Invalid credentials",
      });
    });

    test("login_is_empty: rejects empty input", async () => {
      const res = await request(app)
        .post("/login")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Username and password are required",
      });
    });

    test("returns 500 if session save fails", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 1,
          username: "coordinator1",
          password: "pass123",
          role: "coordinator",
        }),
      });

      app = express();
      app.use(express.json());
      app.use((req, res, next) => {
        req.session = {
          save: jest.fn((cb) => cb(new Error("session failed"))),
          destroy: jest.fn((cb) => cb()),
        };
        next();
      });
      app.use(loginRoutes);

      const res = await request(app)
        .post("/login")
        .send({
          username: "coordinator1",
          password: "pass123",
        });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: "Failed to save session",
      });
    });
  });

  describe("POST /logout", () => {
    test("logs out successfully", async () => {
      const res = await request(app).post("/logout");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Logged out",
      });
    });
  });
});