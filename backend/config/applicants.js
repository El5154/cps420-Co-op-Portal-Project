// config/applicants.js - Database configuration for the Co-op Support App

const Database = require("better-sqlite3");

const dbName =
  process.env.NODE_ENV === "test"
    ? "test.db"
    : "applicants.db";

const db = new Database(dbName);

db.exec(`
  CREATE TABLE IF NOT EXISTS applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    studentID TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    provisional_status TEXT DEFAULT 'Pending',
    final_status TEXT DEFAULT 'Pending'
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id INTEGER NOT NULL,
    report_filename TEXT NOT NULL,
    report_path TEXT NOT NULL,
    report_uploaded INTEGER DEFAULT 0,
    report_uploaded_at TEXT
  );
`);

module.exports = db;