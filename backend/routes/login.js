// routes/login.js - Routes for user authentication (login/logout)
const express = require("express");
const router = express.Router();
const db = require("../config/applicants");

// POST /login - Authenticate user and create session
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  const user = db.prepare(
    "SELECT * FROM users WHERE username = ? AND password = ?"
  ).get(username, password);

  if (!user) {
    return res.status(401).send("Invalid credentials");
  }

  req.session.user = {
    id: user.id,
    role: user.role
  };

  res.send("Login successful");
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.send("Logged out");
});

module.exports = router;