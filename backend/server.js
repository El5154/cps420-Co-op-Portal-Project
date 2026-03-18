// server.js - Entry point for the Co-op Support App backend

const app = require("./app");

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});