const db = require("./config/applicants");

db.prepare("DELETE FROM users").run();
db.prepare("DELETE FROM applicants").run();
db.prepare("DELETE FROM reports").run();

const insertUser = db.prepare(`
  INSERT INTO users (username, password, role)
  VALUES (?, ?, ?)
`);

const insertApplicant = db.prepare(`
  INSERT INTO applicants (name, studentID, email, provisional_status, final_status, supervisor)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertReport = db.prepare(`
  INSERT INTO reports (studentID, evaluation_status, report_status)
  VALUES (?, ?, ?)
`);

insertUser.run("123456789", "password", "applicant");
insertUser.run("coordinator", "password", "coordinator");
insertUser.run("supervisor", "password", "supervisor");

const supervisorUser = db.prepare(`
  SELECT id FROM users WHERE username = ?
`).get("supervisor");

insertApplicant.run(
  "student",
  "123456789",
  "student@torontomu.ca",
  "Pending",
  "Pending",
  supervisorUser.id
);

insertReport.run("123456789", "Not Evaluated", "Not Submitted");