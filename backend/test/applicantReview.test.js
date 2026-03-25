// test/applicantDashboard.test.js

const request = require("supertest");
const express = require("express");

jest.mock("../config/applicants", () => ({
  prepare: jest.fn(),
}));

jest.mock("../middleware/requireAuth", () => {
  return (req, res, next) => {
    const role = req.headers["x-test-role"];
    const studentID = req.headers["x-test-studentid"];

    if (!role || !studentID) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.session = {
      user: {
        role,
        studentID,
      },
    };

    next();
  };
});

const db = require("../config/applicants");
const applicantReviewRoutes = require("../routes/applicantReview");

describe("GET /applicant/dashboard", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(applicantReviewRoutes);

    jest.clearAllMocks();
  });

  test("view_conditional_status_accept: returns applicant dashboard data when applicant is accepted", async () => {
    const mockApplicant = {
      name: "Eric Liu",
      studentID: "123456789",
      provisional_status: "Accepted",
      final_status: "Pending",
      report_status: "Not Submitted",
      evaluation_status: "Not Evaluated",
      deadline: "2026-04-01",
    };

    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue(mockApplicant),
    });

    const res = await request(app)
      .get("/applicant/dashboard")
      .set("x-test-role", "applicant")
      .set("x-test-studentid", "123456789");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockApplicant);
    expect(db.prepare).toHaveBeenCalled();
  });

  test("view_conditional_status_pending: returns pending statuses for applicant", async () => {
    const mockApplicant = {
      name: "Jane Doe",
      studentID: "987654321",
      provisional_status: "Pending",
      final_status: "Pending",
      report_status: "Not Submitted",
      evaluation_status: "Not Evaluated",
      deadline: "2026-04-15",
    };

    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue(mockApplicant),
    });

    const res = await request(app)
      .get("/applicant/dashboard")
      .set("x-test-role", "applicant")
      .set("x-test-studentid", "987654321");

    expect(res.status).toBe(200);
    expect(res.body.provisional_status).toBe("Pending");
    expect(res.body.final_status).toBe("Pending");
  });

  test("view_final_status_accept: returns final accepted status for applicant", async () => {
    const mockApplicant = {
      name: "Alex Kim",
      studentID: "111222333",
      provisional_status: "Accepted",
      final_status: "Accepted",
      report_status: "Submitted",
      evaluation_status: "Received",
      deadline: "2026-04-20",
    };

    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue(mockApplicant),
    });

    const res = await request(app)
      .get("/applicant/dashboard")
      .set("x-test-role", "applicant")
      .set("x-test-studentid", "111222333");

    expect(res.status).toBe(200);
    expect(res.body.final_status).toBe("Accepted");
  });

  test("returns 403 if logged-in user is not an applicant", async () => {
    const res = await request(app)
      .get("/applicant/dashboard")
      .set("x-test-role", "coordinator")
      .set("x-test-studentid", "123456789");

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: "Forbidden" });
  });

  test("returns 404 if applicant record is not found", async () => {
    db.prepare.mockReturnValue({
      get: jest.fn().mockReturnValue(undefined),
    });

    const res = await request(app)
      .get("/applicant/dashboard")
      .set("x-test-role", "applicant")
      .set("x-test-studentid", "000000000");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Applicant not found" });
  });

  test("returns 401 if user is not logged in", async () => {
    const res = await request(app).get("/applicant/dashboard");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});