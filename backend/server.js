const express = require("express");
const session = require("express-session");

const db = require("./config/database");

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

app.get("/", (req, res) => {
  res.send("Co-op Support App Running");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});