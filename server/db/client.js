import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { parseRoles, serializeRoles } from "../lib/roles.js";

const { Pool } = pg;

// -------------------- POSTGRES CONNECTION --------------------

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// -------------------- TABLE SETUP --------------------

await db.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  tag TEXT DEFAULT 'User',
  banned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  roles TEXT
);

CREATE TABLE IF NOT EXISTS pastes (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  author_username TEXT,
  visibility TEXT DEFAULT 'public',
  burn_after_read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`);

// -------------------- DEFAULT SETTINGS --------------------

await db.query(
  `INSERT INTO settings(key, value)
   VALUES ('tos_content', $1)
   ON CONFLICT (key) DO NOTHING`,
  [
    "By using leak.bin, you agree not to upload illegal content, malware, or private data without consent."
  ]
);

// -------------------- TAG FIXES --------------------

await db.query(`UPDATE users SET tag = 'User' WHERE tag = 'user'`);
await db.query(`UPDATE users SET tag = 'Admin' WHERE tag = 'admin'`);
await db.query(`UPDATE users SET tag = 'Vip' WHERE tag = 'vip'`);
await db.query(`UPDATE users SET tag = 'Owner' WHERE tag = 'owner'`);

// -------------------- CLEAN BANNED USERS --------------------

const bannedUsers = await db.query(
  `SELECT username FROM users WHERE banned = 1`
);

for (const row of bannedUsers.rows) {
  await db.query(`DELETE FROM pastes WHERE author_username = $1`, [
    row.username,
  ]);
}

await db.query(`DELETE FROM users WHERE banned = 1`);

// -------------------- ROLE MIGRATION --------------------

const users = await db.query(
  `SELECT id, username, tag, roles FROM users`
);

for (const row of users.rows) {
  if (!row.roles) {
    const json = serializeRoles(parseRoles(null, row.tag));
    const primary = JSON.parse(json)[0];

    await db.query(
      `UPDATE users SET roles = $1, tag = $2 WHERE id = $3`,
      [json, primary, row.id]
    );
  }
}
