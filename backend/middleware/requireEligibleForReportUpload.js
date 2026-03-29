const db = require("../config/applicants");

function requireEligibleForReportUpload(req, res, next) {
  if (req.session.user.role !== "applicant") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!req.session.user.studentID) {
    return res.status(400).json({ error: "Applicant student ID missing from session" });
  }

  const studentID = req.session.user.studentID;

  const applicant = db.prepare(`
    SELECT final_status
    FROM applicants
    WHERE studentID = ?
  `).get(studentID);

  if (!applicant) {
    return res.status(404).json({ error: "Applicant not found" });
  }

  if (applicant.final_status !== "Accepted") {
    return res.status(403).json({
      error: "You cannot upload a report until your final status is Accepted"
    });
  }

  const report = db.prepare(`
    SELECT deadline
    FROM reports
    WHERE studentID = ?
  `).get(studentID);

  if (!report) {
    return res.status(404).json({ error: "Report record not found" });
  }

  if (!report.deadline) {
    return res.status(400).json({
      error: "No deadline has been set for this applicant"
    });
  }

  const deadlineDate = new Date(report.deadline);

  if (isNaN(deadlineDate.getTime())) {
    return res.status(400).json({ error: "Stored deadline is invalid" });
  }

  if (new Date() > deadlineDate) {
    return res.status(403).json({
      error: "Deadline has passed. Report can no longer be uploaded"
    });
  }

  req.reportUploadInfo = {
    studentID,
    deadline: report.deadline
  };

  next();
}

module.exports = requireEligibleForReportUpload;