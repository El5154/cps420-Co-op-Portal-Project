// routes/register.js - Route for applicant registration
const express = require("express");
const router = express.Router();
const db = require("../config/applicants");

// POST /register - Register a new applicant
router.post("/register", (req, res) => {
  const { name, studentID, email } = req.body;

  if (!name || !studentID || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!/^\d{9}$/.test(studentID)) {
    return res.status(400).json({ error: "Student ID must be 9 digits" });
  }

  if (!email.endsWith("@torontomu.ca")) {
    return res.status(400).json({ error: "Email must end with @torontomu.ca" });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO applicants (name, studentID, email)
      VALUES (?, ?, ?)
    `);

    stmt.run(name, studentID, email);

    res.status(201).json({ message: "Applicant registered successfully" });

  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ error: "Student ID or email already exists" });
    }

    res.status(500).json({ error: err.message });
  }
});


module.exports = router;