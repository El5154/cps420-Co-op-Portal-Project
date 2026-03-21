const express = require("express");
const session = require("express-session");

const registerRoutes = require("./routes/register");
const loginRoutes = require("./routes/login");
const coordinatorReviewRoutes = require("./routes/coordinatorReview");
const applicantReviewRoutes = require("./routes/applicantReview");
const requireAuth = require("./middleware/requireAuth");

const app = express();

app.use(express.json());
app.use(session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: false
}));

app.use(registerRoutes);
app.use(loginRoutes);
app.use(coordinatorReviewRoutes);
app.use(applicantReviewRoutes);

app.get("/dashboard", requireAuth, (req, res) => {
  res.status(200).send("Protected route");
});

module.exports = app;