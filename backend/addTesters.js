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
  INSERT INTO reports (studentID, report_status, evaluation_status, deadline)
  VALUES (?, ?, ?, ?)
`);

insertUser.run("coordinator", "password", "coordinator");

insertUser.run("supervisor", "password", "supervisor");

const applicants = [
  ["Alice Chen", "123456789", "alice@torontomu.ca", "Pending", "Pending", "Not Submitted", "Not Evaluated", "April 2, 2026 at 11:59 PM"],
  ["Bob Singh", "234567890", "bob@torontomu.ca", "Accepted", "Pending", "Not Submitted", "Not Evaluated", "April 2, 2026 at 11:59 PM"],
  ["Carol Nguyen", "345678901", "carol@torontomu.ca", "Rejected", "Pending", "Not Submitted", "Not Evaluated", "April 2, 2026 at 11:59 PM"],
  ["David Kim", "456789012", "david@torontomu.ca", "Accepted", "Accepted", "Not Submitted", "Not Evaluated", "April 2, 2026 at 11:59 PM"],
  ["Emma Patel", "567890123", "emma@torontomu.ca", "Rejected", "Rejected", "Not Submitted", "Not Evaluated", "April 2, 2026 at 11:59 PM"]
];

for (const applicant of applicants) {
  insertApplicant.run(applicant[0], applicant[1], applicant[2], applicant[3], applicant[4], null);
  insertReport.run(applicant[1], applicant[5], applicant[6], applicant[7]);
}