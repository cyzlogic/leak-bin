import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { parseRoles, serializeRoles } from "../lib/roles.js";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve("server/db/data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(path.join(dataDir, "leakbin.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  tag TEXT DEFAULT 'User',
  banned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
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

const seedTos = db.prepare(
  "INSERT OR IGNORE INTO settings(key, value) VALUES ('tos_content', ?)",
);
seedTos.run(
  "By using leak.bin, you agree not to upload illegal content, malware, or private data without consent.",
);

db.prepare("UPDATE users SET tag = 'User' WHERE tag = 'user'").run();
db.prepare("UPDATE users SET tag = 'Admin' WHERE tag = 'admin'").run();
db.prepare("UPDATE users SET tag = 'Vip' WHERE tag = 'vip'").run();
db.prepare("UPDATE users SET tag = 'Owner' WHERE tag = 'owner'").run();

const userCols = db.prepare("PRAGMA table_info(users)").all();
if (!userCols.some((c) => c.name === "roles")) {
  db.exec("ALTER TABLE users ADD COLUMN roles TEXT");
}
const toPurge = db
  .prepare("SELECT username FROM users WHERE banned = 1")
  .all()
  .map((r) => r.username);
for (const u of toPurge) {
  db.prepare("DELETE FROM pastes WHERE author_username = ?").run(u);
}
db.prepare("DELETE FROM users WHERE banned = 1").run();
for (const row of db.prepare("SELECT id, username, tag, roles FROM users").all()) {
  if (!row.roles) {
    const json = serializeRoles(parseRoles(null, row.tag));
    const primary = JSON.parse(json)[0];
    db.prepare("UPDATE users SET roles = ?, tag = ? WHERE id = ?").run(json, primary, row.id);
  }
}
