'use strict';

const { createClient } = require('@libsql/client');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../../skillbridge.db');

let db;

/**
 * Returns the libSQL client.
 * Throws if initDatabase() has not been called yet.
 */
function getDb() {
  if (!db) throw new Error('Database not initialised. Call initDatabase() first.');
  return db;
}

/**
 * Initialises the SQLite database, creates all tables, and seeds the demo user.
 * Uses @libsql/client with a local file: URL — no native compilation required.
 * Safe to call multiple times — uses IF NOT EXISTS guards.
 *
 * @returns {Promise<void>}
 */
async function initDatabase() {
  db = createClient({ url: `file:${DB_PATH}` });

  await createTables();
  await runMigrations();
  await seedDemoUser();

  console.log(`📦  Database ready at ${DB_PATH}`);
}

// ── Schema ────────────────────────────────────────────────────────────────────

async function createTables() {
  // libSQL executes multi-statement SQL via db.executeMultiple()
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      full_name   TEXT NOT NULL,
      is_demo     INTEGER DEFAULT 1,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id               TEXT PRIMARY KEY,
      user_id          TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      headline         TEXT,
      location         TEXT DEFAULT 'Bengaluru, Karnataka',
      career_interests TEXT DEFAULT '[]',
      education        TEXT DEFAULT '[]',
      experience       TEXT DEFAULT '[]',
      certifications   TEXT DEFAULT '[]',
      projects         TEXT DEFAULT '[]',
      about            TEXT,
      onboarding_step  INTEGER DEFAULT 0,
      updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_skills (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      skill_name        TEXT NOT NULL,
      category          TEXT NOT NULL DEFAULT 'technical',
      source            TEXT NOT NULL DEFAULT 'user_added',
      confidence        REAL DEFAULT 1.0,
      confirmed_by_user INTEGER DEFAULT 0,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, skill_name)
    );

    CREATE TABLE IF NOT EXISTS opportunity_matches (
      id                  TEXT PRIMARY KEY,
      user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id      TEXT NOT NULL,
      match_score         REAL NOT NULL,
      present_skills      TEXT DEFAULT '[]',
      missing_skills      TEXT DEFAULT '[]',
      transferable_skills TEXT DEFAULT '[]',
      match_explanation   TEXT,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, opportunity_id)
    );

    CREATE TABLE IF NOT EXISTS saved_opportunities (
      user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id TEXT NOT NULL,
      saved_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, opportunity_id)
    );

    CREATE TABLE IF NOT EXISTS gap_analyses (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id   TEXT NOT NULL,
      present_skills   TEXT DEFAULT '[]',
      missing_skills   TEXT DEFAULT '[]',
      transferable     TEXT DEFAULT '[]',
      gap_explanation  TEXT,
      created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, opportunity_id)
    );

    CREATE TABLE IF NOT EXISTS roadmaps (
      id             TEXT PRIMARY KEY,
      user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id TEXT NOT NULL,
      steps          TEXT NOT NULL DEFAULT '[]',
      generated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, opportunity_id)
    );

    CREATE TABLE IF NOT EXISTS roadmap_progress (
      roadmap_id  TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
      step_index  INTEGER NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (roadmap_id, step_index)
    );
  `);
}

// ── Migrations ───────────────────────────────────────────────────────────────
// Add columns introduced after the initial schema without breaking existing DBs.
// Each ALTER TABLE is wrapped in try/catch — libSQL throws if the column exists.

async function runMigrations() {
  // Each statement is wrapped in try/catch.
  // libSQL throws on duplicate column — safe to ignore.
  const ddlMigrations = [
    // Day 2: personal_info JSON column on profiles
    `ALTER TABLE profiles ADD COLUMN personal_info TEXT DEFAULT '{}'`,
    // Day 5: richer gap_analyses columns
    `ALTER TABLE gap_analyses ADD COLUMN readiness_score REAL DEFAULT 0`,
    `ALTER TABLE gap_analyses ADD COLUMN skill_recommendations TEXT DEFAULT '[]'`,
    `ALTER TABLE gap_analyses ADD COLUMN missing_preferred TEXT DEFAULT '[]'`,
  ];

  for (const sql of ddlMigrations) {
    try {
      await db.execute({ sql, args: [] });
    } catch (_err) {
      // Column already exists — safe to ignore
    }
  }

  // Day 5: create skill_progress table (safe if already exists)
  try {
    await db.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS skill_progress (
          id          TEXT PRIMARY KEY,
          user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          skill_name  TEXT NOT NULL,
          status      TEXT NOT NULL DEFAULT 'learning',
          updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, skill_name)
        )
      `,
      args: [],
    });
  } catch (_err) {
    // Table already exists — safe to ignore
  }

  // Day 3: standardise skill category 'domain' → 'transferable'
  // This is a data migration — safe to re-run (no-op if already done).
  try {
    await db.execute({
      sql:  "UPDATE user_skills SET category = 'transferable' WHERE category = 'domain'",
      args: [],
    });
  } catch (_err) {
    // Ignore — table may be empty or migration already applied
  }
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seedDemoUser() {
  const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@skillbridge.ai';
  const demoName  = process.env.DEMO_USER_NAME  || 'Demo User';

  const result = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [demoEmail],
  });

  if (result.rows.length > 0) return; // already seeded

  const userId    = uuidv4();
  const profileId = uuidv4();

  await db.execute({
    sql:  'INSERT INTO users (id, email, full_name, is_demo) VALUES (?, ?, ?, 1)',
    args: [userId, demoEmail, demoName],
  });

  await db.execute({
    sql:  'INSERT INTO profiles (id, user_id) VALUES (?, ?)',
    args: [profileId, userId],
  });

  console.log(`🌱  Demo user seeded (id: ${userId})`);
}

module.exports = { getDb, initDatabase };
