const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireCoordinator = require("../middleware/requireCoordinator");
const db = require("../config/applicants");

router.get("/applicants/:id/review", requireAuth, requireCoordinator, async (req, res) => {
    const applicantId = req.params.id;

    const applicant = db.prepare("SELECT * FROM applicants WHERE id = ?").get(applicantId);
    if (!applicant) {
        return res.status(404).json({ message: "Applicant not found" });
    }

    const reports = db.prepare("SELECT * FROM reports WHERE studentID = ?").get(applicant.studentID);

    res.status(200).json({
        name: applicant.name,
        email: applicant.email,
        studentID: applicant.studentID,
        report_status: reports ? reports.report_status : null,
        evaluation_status: reports ? reports.evaluation_status : null,
        report_filename: reports ? reports.report_filename : null,
        report_uploaded_at: reports ? reports.report_uploaded_at : null,
        report_url: reports && reports.report_filename ? `/reports/${reports.report_filename}` : null,
        deadline: reports ? reports.deadline : null
    });
});

const path = require("path");
const uploadDir = path.join(__dirname, "../uploads/reports");

router.get("/reports/:file", requireAuth, (req, res) => {
  const file = req.params.file;
  if (!file.endsWith("_report.pdf")) {
    return res.status(400).send("Invalid file");
  }
  const filePath = path.join(uploadDir, file);
  res.sendFile(filePath, err => {
    if (err) res.status(404).send("Not found");
  });
});

module.exports = router;