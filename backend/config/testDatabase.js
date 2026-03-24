// config/testDatabase.js - Separate database configuration for testing

const Database = require("better-sqlite3");

const db = new Database("test.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    studentID TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    provisional_status TEXT DEFAULT 'Pending',
    final_status TEXT DEFAULT 'Pending',
    report_status TEXT DEFAULT 'Not Submitted',
    evaluation_status TEXT DEFAULT 'Not Evaluated',
    deadline TEXT,
    report_filename TEXT NOT NULL,
    report_path TEXT NOT NULL,
    report_uploaded INTEGER DEFAULT 0,
    report_uploaded_at TEXT,
    evaluation_filename TEXT,
    evaluation_path TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );
`);

module.exports = db;