// backend/server.js - Main server file for the Co-op Support App backend

const express = require("express");
const session = require("express-session");

const db = require("./config/applicants");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "coop-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Routes for applicants for registration

app.post("/register", (req, res) => {
  const { name, studentID, email } = req.body;

  if (!name || !studentID || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!/^\d{8}$/.test(studentID)) {
    return res.status(400).json({ error: "Student ID must be 8 digits" });
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

// Route to get all applicants (for testing purposes)

app.get("/applicant", (req, res) => {
  try {
    const applicants = db.prepare('SELECT * FROM applicants').all();
    res.json(applicants); // Sends the list as JSON
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

// Basic health check route

app.get("/", (req, res) => {
  res.send("Co-op Support App Running");
});

module.exports = app;

