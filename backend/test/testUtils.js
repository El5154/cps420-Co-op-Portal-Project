const db = require("../config/applicants");

function resetDatabase() {
  db.prepare("DELETE FROM users").run();
  db.prepare("DELETE FROM reports").run();
  db.prepare("DELETE FROM applicants").run();
}

function seedUser({
  username,
  password,
  role = "applicant"
}) {
  const result = db.prepare(`
    INSERT INTO users (username, password, role)
    VALUES (?, ?, ?)
  `).run(username, password, role);

  return result.lastInsertRowid;
}

function seedApplicant({
  name = "Test User",
  studentID = "501234567",
  email = "test@torontomu.ca",
  provisional_status = "Pending",
  final_status = "Pending",
  supervisor = null
}) {
  const result = db.prepare(`
    INSERT INTO applicants (
      name, studentID, email, provisional_status, final_status, supervisor
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, studentID, email, provisional_status, final_status, supervisor);

  return {
    id: result.lastInsertRowid,
    studentID
  };
}

function seedReport({
  studentID,
  report_status = "Not Submitted",
  evaluation_status = "Not Evaluated",
  deadline = null,
  report_filename = null,
  report_path = null,
  report_uploaded = 0,
  report_uploaded_at = null,
  evaluation_filename = null,
  evaluation_path = null
}) {
  const result = db.prepare(`
    INSERT INTO reports (
      studentID,
      report_status,
      evaluation_status,
      deadline,
      report_filename,
      report_path,
      report_uploaded,
      report_uploaded_at,
      evaluation_filename,
      evaluation_path
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    studentID,
    report_status,
    evaluation_status,
    deadline,
    report_filename,
    report_path,
    report_uploaded,
    report_uploaded_at,
    evaluation_filename,
    evaluation_path
  );

  return result.lastInsertRowid;
}

module.exports = {
  db,
  resetDatabase,
  seedUser,
  seedApplicant,
  seedReport
};