// test/coordinatorReview.test.js

const request = require("supertest");
const express = require("express");

jest.mock("../config/applicants", () => ({
  prepare: jest.fn(),
}));

jest.mock("../middleware/requireAuth", () => {
  return (req, res, next) => {
    const role = req.headers["x-test-role"];

    if (!role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.session = {
      user: {
        role,
      },
    };

    next();
  };
});

jest.mock("../middleware/requireCoordinator", () => {
  return (req, res, next) => {
    if (!req.session || req.session.user.role !== "coordinator") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
});

const db = require("../config/applicants");
const coordinatorReviewRoutes = require("../routes/coordinatorReview");

describe("Coordinator Review Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(coordinatorReviewRoutes);

    jest.clearAllMocks();
  });

  describe("GET /applicants", () => {
    test("view_conditional_status_coordinator: returns all applicants for coordinator", async () => {
      const mockApplicants = [
        {
          id: 1,
          name: "Eric Liu",
          studentID: "123456789",
          provisional_status: "Accepted",
          final_status: "Pending",
        },
        {
          id: 2,
          name: "Jane Doe",
          studentID: "987654321",
          provisional_status: "Rejected",
          final_status: "Rejected",
        },
      ];

      db.prepare.mockReturnValue({
        all: jest.fn().mockReturnValue(mockApplicants),
      });

      const res = await request(app)
        .get("/applicants")
        .set("x-test-role", "coordinator");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockApplicants);
    });

    test("returns 401 if not logged in", async () => {
      const res = await request(app).get("/applicants");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });

    test("returns 403 if logged-in user is not coordinator", async () => {
      const res = await request(app)
        .get("/applicants")
        .set("x-test-role", "applicant");

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Forbidden" });
    });
  });

  describe("PATCH /applicants/:id/status", () => {
    test("updates provisional status to Accepted", async () => {
      const getMock = jest.fn().mockReturnValue({
        id: 1,
        provisional_status: "Pending",
        final_status: "Pending",
      });

      const runMock = jest.fn();

      db.prepare
        .mockReturnValueOnce({ get: getMock })
        .mockReturnValueOnce({ run: runMock });

      const res = await request(app)
        .patch("/applicants/1/status")
        .set("x-test-role", "coordinator")
        .send({ provisional_status: "Accepted" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Applicant provisional status updated successfully",
      });
      expect(runMock).toHaveBeenCalledWith("Accepted", "1");
    });

    test("updates provisional status to Rejected", async () => {
      const getMock = jest.fn().mockReturnValue({
        id: 2,
        provisional_status: "Pending",
        final_status: "Pending",
      });

      const runMock = jest.fn();

      db.prepare
        .mockReturnValueOnce({ get: getMock })
        .mockReturnValueOnce({ run: runMock });

      const res = await request(app)
        .patch("/applicants/2/status")
        .set("x-test-role", "coordinator")
        .send({ provisional_status: "Rejected" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Applicant provisional status updated successfully");
      expect(runMock).toHaveBeenCalledWith("Rejected", "2");
    });

    test("returns 400 if provisional_status is missing", async () => {
      const res = await request(app)
        .patch("/applicants/1/status")
        .set("x-test-role", "coordinator")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "provisional_status is required" });
    });

    test("returns 400 for invalid provisional_status value", async () => {
      const res = await request(app)
        .patch("/applicants/1/status")
        .set("x-test-role", "coordinator")
        .send({ provisional_status: "Pending" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid status value" });
    });

    test("returns 404 if applicant does not exist", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined),
      });

      const res = await request(app)
        .patch("/applicants/999/status")
        .set("x-test-role", "coordinator")
        .send({ provisional_status: "Accepted" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Applicant not found" });
    });

    test("decision_finalization: cannot change provisional status after finalization", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 1,
          provisional_status: "Accepted",
          final_status: "Accepted",
        }),
      });

      const res = await request(app)
        .patch("/applicants/1/status")
        .set("x-test-role", "coordinator")
        .send({ provisional_status: "Rejected" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Cannot change provisional status after finalization",
      });
    });
  });

  describe("PATCH /applicants/:id/finalize", () => {
    test("accept_application: finalizes accepted application", async () => {
      const getMock = jest.fn().mockReturnValue({
        id: 1,
        provisional_status: "Accepted",
        final_status: "Pending",
      });

      const runMock = jest.fn();

      db.prepare
        .mockReturnValueOnce({ get: getMock })
        .mockReturnValueOnce({ run: runMock });

      const res = await request(app)
        .patch("/applicants/1/finalize")
        .set("x-test-role", "coordinator");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Applicant final status updated successfully",
      });
      expect(runMock).toHaveBeenCalledWith("Accepted", "1");
    });

    test("reject_application: finalizes rejected application", async () => {
      const getMock = jest.fn().mockReturnValue({
        id: 2,
        provisional_status: "Rejected",
        final_status: "Pending",
      });

      const runMock = jest.fn();

      db.prepare
        .mockReturnValueOnce({ get: getMock })
        .mockReturnValueOnce({ run: runMock });

      const res = await request(app)
        .patch("/applicants/2/finalize")
        .set("x-test-role", "coordinator");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Applicant final status updated successfully");
      expect(runMock).toHaveBeenCalledWith("Rejected", "2");
    });

    test("returns 404 if applicant does not exist during finalization", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined),
      });

      const res = await request(app)
        .patch("/applicants/999/finalize")
        .set("x-test-role", "coordinator");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Applicant not found" });
    });

    test("returns 400 if provisional decision is still Pending", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 1,
          provisional_status: "Pending",
          final_status: "Pending",
        }),
      });

      const res = await request(app)
        .patch("/applicants/1/finalize")
        .set("x-test-role", "coordinator");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Provisional decision must be made before finalization",
      });
    });

    test("decision_finalization: cannot finalize already finalized decision", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 1,
          provisional_status: "Accepted",
          final_status: "Accepted",
        }),
      });

      const res = await request(app)
        .patch("/applicants/1/finalize")
        .set("x-test-role", "coordinator");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Applicant decision has already been finalized",
      });
    });
  });

  describe("POST /applicants/:id/create-account", () => {
    test("creates account for applicant with final status Accepted", async () => {
      const applicantMock = jest.fn().mockReturnValue({
        id: 1,
        studentID: "123456789",
        final_status: "Accepted",
      });

      const existingUserMock = jest.fn().mockReturnValue(undefined);
      const runMock = jest.fn();

      db.prepare
        .mockReturnValueOnce({ get: applicantMock })
        .mockReturnValueOnce({ get: existingUserMock })
        .mockReturnValueOnce({ run: runMock });

      const res = await request(app)
        .post("/applicants/1/create-account")
        .set("x-test-role", "coordinator")
        .send({ password: "testpass123" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: "Applicant account created successfully",
        username: "123456789",
      });
      expect(runMock).toHaveBeenCalledWith("123456789", "testpass123", "applicant");
    });

    test("returns 400 if password is missing", async () => {
      const res = await request(app)
        .post("/applicants/1/create-account")
        .set("x-test-role", "coordinator")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Password is required" });
    });

    test("returns 404 if applicant does not exist for account creation", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue(undefined),
      });

      const res = await request(app)
        .post("/applicants/999/create-account")
        .set("x-test-role", "coordinator")
        .send({ password: "testpass123" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Applicant not found" });
    });

    test("returns 400 if applicant final status is not Accepted", async () => {
      db.prepare.mockReturnValueOnce({
        get: jest.fn().mockReturnValue({
          id: 1,
          studentID: "123456789",
          final_status: "Rejected",
        }),
      });

      const res = await request(app)
        .post("/applicants/1/create-account")
        .set("x-test-role", "coordinator")
        .send({ password: "testpass123" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Only applicants with final status Accepted can have an account created",
      });
    });

    test("returns 400 if account already exists", async () => {
      db.prepare
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue({
            id: 1,
            studentID: "123456789",
            final_status: "Accepted",
          }),
        })
        .mockReturnValueOnce({
          get: jest.fn().mockReturnValue({
            id: 10,
            username: "123456789",
            role: "applicant",
          }),
        });

      const res = await request(app)
        .post("/applicants/1/create-account")
        .set("x-test-role", "coordinator")
        .send({ password: "testpass123" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "Account already exists for this applicant",
      });
    });
  });
});