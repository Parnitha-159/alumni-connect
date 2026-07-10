const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

let db = null;

async function getDb() {
  if (db) return db;
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  return db;
}

async function initDb() {
  const database = await getDb();
  
  // Enable foreign keys
  await database.get('PRAGMA foreign_keys = ON');

  // Create Users table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- admin, alumni, student
      name TEXT, -- For student/admin names
      department TEXT, -- For student departments
      approved INTEGER DEFAULT 0, -- 0 = pending, 1 = approved
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Alumni Profiles table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS alumni_profiles (
      user_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      batch_year INTEGER NOT NULL,
      department TEXT NOT NULL,
      current_company TEXT,
      current_role TEXT,
      location TEXT,
      linkedin TEXT,
      phone TEXT,
      profile_photo TEXT, -- base64 or file path
      bio TEXT,
      mentor_opt_in INTEGER DEFAULT 0, -- 0 = no, 1 = yes
      mentor_expertise TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Jobs table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poster_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL, -- Full-time, Internship, etc.
      duration TEXT,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(poster_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Events table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      base_rsvp_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create RSVPs table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS rsvps (
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (event_id, user_id),
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Success Stories table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS success_stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      headline TEXT NOT NULL,
      writeup TEXT NOT NULL,
      photo TEXT,
      author_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      department TEXT NOT NULL,
      is_approved INTEGER DEFAULT 0, -- 0 = pending, 1 = approved
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Mentorship Requests table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS mentorship_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      mentor_id INTEGER NOT NULL,
      request_message TEXT NOT NULL,
      status TEXT DEFAULT 'Pending', -- Pending, Accepted, Declined
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(mentor_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create Discussions table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully.');
}

module.exports = {
  getDb,
  initDb
};
