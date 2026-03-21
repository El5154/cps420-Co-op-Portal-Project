// routes/applicantReview.js
const express = require("express");
const router = express.Router();
const db = require("../config/applicants");
const requireAuth = require("../middleware/requireAuth");

router.get("/applicants/status", requireAuth, (req, res) => {
  if (req.session.user.role !== "applicant") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { studentID } = req.session.user;

  if (!studentID) {
    return res.status(400).json({ error: "Applicant session is missing studentID" });
  }

  const applicant = db.prepare(`
    SELECT name, studentID, provisional_status, final_status
    FROM applicants
    WHERE studentID = ?
  `).get(studentID);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  return res.status(200).json(applicant);
});

module.exports = router;