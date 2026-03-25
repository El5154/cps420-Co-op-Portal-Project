// routes/uploadReport.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const requireAuth = require("../middleware/requireAuth");
const db = require("../config/applicants");

const uploadDir = path.join(__dirname, "../uploads/reports");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" &&
      path.extname(file.originalname).toLowerCase() === ".pdf";

    if (isPdf) {
      return cb(null, true);
    }

    cb(new Error("Only PDF files are allowed!"));
  }
}).single("report");

router.post("/uploadReport", requireAuth, (req, res) => {
  if (req.session.user.role !== "applicant") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!req.session.user.studentID) {
    return res.status(400).json({ error: "Applicant student ID missing from session" });
  }

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const tempPath = req.file.path;
    const finalFilename = `${req.session.user.studentID}_report.pdf`;
    const targetPath = path.join(uploadDir, finalFilename);

    fs.rename(tempPath, targetPath, (err) => {
      if (err) {
        return res.status(500).json({ error: "Error saving file" });
      }

      const result = db.prepare(`
        UPDATE applicants
        SET report_status = ?,
            report_filename = ?,
            report_path = ?,
            report_uploaded = 1,
            report_uploaded_at = ?
        WHERE studentID = ?
      `).run(
        "Submitted",
        finalFilename,
        targetPath,
        new Date().toISOString(),
        req.session.user.studentID
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: "Applicant not found" });
      }

      return res.status(200).json({ message: "Report uploaded successfully" });
    });
  });
});

module.exports = router;