// routes/coordinatorReview.js
const express = require("express");
const router = express.Router();
const db = require("../config/applicants");

const requireAuth = require("../middleware/requireAuth");
const requireCoordinator = require("../middleware/requireCoordinator");

// GET /applicants - coordinator only
router.get("/applicants", requireAuth, requireCoordinator, (req, res) => {
  const applicants = db.prepare(`
    SELECT
      a.id,
      a.name,
      a.studentID,
      a.email,
      a.provisional_status,
      a.final_status,
      a.supervisor,
      COALESCE(r.report_status, 'Not Submitted') AS report_status,
      COALESCE(r.evaluation_status, 'Not Evaluated') AS evaluation_status,
      r.deadline,
      r.report_filename,
      r.report_path,
      r.report_uploaded,
      r.report_uploaded_at,
      r.evaluation_filename,
      r.evaluation_path
    FROM applicants a
    LEFT JOIN reports r ON a.studentID = r.studentID
  `).all();

  return res.status(200).json(applicants);
});

// PATCH /applicants/:id/status - set provisional status
router.patch("/applicants/:id/status", requireAuth, requireCoordinator, (req, res) => {
  const { id } = req.params;
  const { provisional_status } = req.body;

  if (!provisional_status) {
    return res.status(400).json({ error: "provisional_status is required" });
  }

  if (!["Accepted", "Rejected"].includes(provisional_status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const applicant = db.prepare(
    "SELECT * FROM applicants WHERE id = ?"
  ).get(id);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  if (applicant.final_status !== "Pending") {
    return res.status(400).json({
      error: "Cannot change provisional status after finalization"
    });
  }

  db.prepare(
    "UPDATE applicants SET provisional_status = ? WHERE id = ?"
  ).run(provisional_status, id);

  return res.status(200).json({
    message: "Applicant provisional status updated successfully"
  });
});

// PATCH /applicants/:id/finalize - finalize decision
router.patch("/applicants/:id/finalize", requireAuth, requireCoordinator, (req, res) => {
  const { id } = req.params;

  const applicant = db.prepare(
    "SELECT * FROM applicants WHERE id = ?"
  ).get(id);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  if (applicant.provisional_status === "Pending") {
    return res.status(400).json({
      error: "Provisional decision must be made before finalization"
    });
  }

  if (applicant.final_status !== "Pending") {
    return res.status(400).json({
      error: "Applicant decision has already been finalized"
    });
  }

  db.prepare(
    "UPDATE applicants SET final_status = ? WHERE id = ?"
  ).run(applicant.provisional_status, id);

  return res.status(200).json({
    message: "Applicant final status updated successfully"
  });
});

// POST /applicants/:id/create-account - create account for accepted applicant
router.post("/applicants/:id/create-account", requireAuth, requireCoordinator, (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const applicant = db.prepare(
    "SELECT * FROM applicants WHERE id = ?"
  ).get(id);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  if (applicant.final_status !== "Accepted") {
    return res.status(400).json({
      error: "Only applicants with final status Accepted can have an account created"
    });
  }

  const existingUser = db.prepare(
    "SELECT * FROM users WHERE username = ?"
  ).get(applicant.studentID);

  if (existingUser) {
    return res.status(400).json({ error: "Account already exists for this applicant" });
  }

  db.prepare(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
  ).run(applicant.studentID, password, "applicant");

  return res.status(201).json({
    message: "Applicant account created successfully",
    username: applicant.studentID
  });
});

// Back button route after report review
router.post("/back", requireAuth, requireCoordinator, (req, res) => {
  return res.status(200).json({ message: "Back to coordinator dashboard" });
});

module.exports = router;