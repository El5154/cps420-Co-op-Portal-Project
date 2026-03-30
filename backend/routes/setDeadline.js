const express = require("express");
const router = express.Router();
const db = require("../config/applicants");

const requireCoordinator = require("../middleware/requireCoordinator");

router.patch("/applicants/:id/deadline", requireCoordinator, (req, res) => {
  const { id } = req.params;
  const { deadline } = req.body;

  if (!deadline) {
    return res.status(400).json({ error: "Deadline is required" });
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(deadline)) {
    return res.status(400).json({ error: "Deadline must be in YYYY-MM-DDTHH:MM:SS format" });
  }

  const today = new Date();
  const deadlineDate = new Date(deadline);

  if (isNaN(deadlineDate.getTime())) {
    return res.status(400).json({ error: "Invalid deadline date" });
  }
  
  if (today > deadlineDate) {
    return res.status(400).json({ error: "Deadline must be at a later date" });
  }

  const applicant = db.prepare(`
    SELECT studentID
    FROM applicants
    WHERE id = ?
  `).get(id);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  const result = db.prepare(`
    UPDATE reports
    SET deadline = ?
    WHERE studentID = ?
  `).run(deadline, applicant.studentID);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  return res.status(200).json({
    message: "Deadline updated successfully",
    deadline
  });
});

module.exports = router;