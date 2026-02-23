const Database = require("better-sqlite3");

const db = new Database("database.db");

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
`);

module.exports = db;