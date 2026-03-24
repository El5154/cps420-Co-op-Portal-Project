const db = require("./config/applicants");

db.prepare("DELETE FROM users").run();
db.prepare("DELETE FROM applicants").run();

const insertUser = db.prepare(`
  INSERT INTO users (username, password, role)
  VALUES (?, ?, ?)
`);

const insertApplicant = db.prepare(`
  INSERT INTO applicants (name, studentID, email, provisional_status, final_status, report_status, evaluation_status, deadline)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run("coordinator", "password", "coordinator");

const applicants = [
  ["Alice Chen", "123456789", "alice@torontomu.ca", "Pending", "Pending", "Not Submitted", "Not Evaluated", "2023-12-31"],
  ["Bob Singh", "234567890", "bob@torontomu.ca", "Accepted", "Pending", "Not Submitted", "Not Evaluated", "2023-12-31"],
  ["Carol Nguyen", "345678901", "carol@torontomu.ca", "Rejected", "Pending", "Not Submitted", "Not Evaluated", "2023-12-31"],
  ["David Kim", "456789012", "david@torontomu.ca", "Accepted", "Accepted", "Not Submitted", "Not Evaluated", "2023-12-31"],
  ["Emma Patel", "567890123", "emma@torontomu.ca", "Rejected", "Rejected", "Not Submitted", "Not Evaluated", "2023-12-31"]
];

for (const applicant of applicants) {
  insertApplicant.run(...applicant);
}