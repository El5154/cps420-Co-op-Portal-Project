// routes/applicantReview.js
const express = require("express");
const router = express.Router();
const db = require("../config/applicants");
const requireAuth = require("../middleware/requireAuth");

router.get("/applicant/dashboard", requireAuth, (req, res) => {
  if (req.session.user.role !== "applicant") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const studentID = req.session.user.studentID;

  const applicant = db.prepare(`
    SELECT
      name,
      studentID,
      provisional_status,
      final_status,
      report_status,
      evaluation_status,
      deadline
    FROM applicants
    WHERE studentID = ?
  `).get(studentID);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  res.status(200).json(applicant);
});

module.exports = router;