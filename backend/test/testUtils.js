const db = require("../config/applicants");

function resetDatabase() {
  db.prepare("DELETE FROM evaluation").run();
  db.prepare("DELETE FROM reports").run();
  db.prepare("DELETE FROM users").run();
  db.prepare("DELETE FROM applicants").run();

  try {
    db.prepare(
      "DELETE FROM sqlite_sequence WHERE name IN ('applicants', 'users', 'evaluation')"
    ).run();
  } catch (err) {
    // ignore if sqlite_sequence does not exist yet
  }
}

function seedApplicant({
  name = "Test Applicant",
  studentID = "501234567",
  email = "test@torontomu.ca",
  provisional_status = "Pending",
  final_status = "Pending",
  supervisor = null
} = {}) {
  const result = db.prepare(`
    INSERT INTO applicants (name, studentID, email, provisional_status, final_status, supervisor)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, studentID, email, provisional_status, final_status, supervisor);

  return {
    id: result.lastInsertRowid,
    name,
    studentID,
    email,
    provisional_status,
    final_status,
    supervisor
  };
}

function seedReport({
  studentID = "501234567",
  report_status = "Not Submitted",
  evaluation_status = "Not Evaluated",
  deadline = null,
  report_filename = null,
  report_path = null,
  report_uploaded = 0,
  report_uploaded_at = null,
  evaluation_filename = null,
  evaluation_path = null
} = {}) {
  db.prepare(`
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
}

function seedUser({ username, password, role }) {
  const result = db.prepare(`
    INSERT INTO users (username, password, role)
    VALUES (?, ?, ?)
  `).run(username, password, role);

  return {
    id: result.lastInsertRowid,
    username,
    password,
    role
  };
}

module.exports = {
  db,
  resetDatabase,
  seedApplicant,
  seedReport,
  seedUser
};