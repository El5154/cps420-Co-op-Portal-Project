const express = require("express");
const session = require("express-session");
const cors = require("cors");

const registerRoutes = require("./routes/register");
const loginRoutes = require("./routes/login");
const coordinatorReviewRoutes = require("./routes/review");
const applicantReviewRoutes = require("./routes/applicant");
const requireAuth = require("./middleware/requireAuth");

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.use(cors({
  origin: "https://el5154.github.io",
  credentials: true
}));

app.use(session({
  secret: "your-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none"
  }
}));

app.use(registerRoutes);
app.use(loginRoutes);
app.use(coordinatorReviewRoutes);
app.use(applicantReviewRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});

app.get("/dashboard", requireAuth, (req, res) => {
  res.status(200).send("Protected route");
});

module.exports = app;