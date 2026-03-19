// backend/server.js - Main server file for the Co-op Support App backend

const express = require("express");
const session = require("express-session");
const db = require("./config/applicants");

const requireAuth = require("./middleware/requireAuth");
const requireCoordinator = require("./middleware/requireCoordinator");

const registerRoutes = require("./routes/register");
const authRoutes = require("./routes/login");
const review = require("./routes/review");

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

app.get('/dashboard', requireAuth, (req, res) => {
  res.send("Protected route");
});

app.get('/coordinator', requireAuth, requireCoordinator, (req, res) => {
  res.send("Coordinator only");
});

// Basic health check route

app.get("/", (req, res) => {
  res.send("Co-op Support App Running");
});

app.use(registerRoutes);
app.use(authRoutes);
app.use(review);

module.exports = app;

