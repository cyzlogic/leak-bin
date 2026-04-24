import { Router } from "express";
import { nanoid } from "nanoid";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db/client.js";

const router = Router();

const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const createSchema = z.object({
  title: z.string().max(120).optional().default(""),
  content: z.string().min(1).max(50000),
  username: z.string().min(2).max(24).optional().default(""),
  expiration: z.enum(["1h", "1d", "7d", "never"]).default("1d"),
  visibility: z.enum(["public", "unlisted"]).default("public"),
  burnAfterRead: z.boolean().default(false),
});

const durations = {
  "1h": 60 * 60 * 1000,
  "1d": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

router.post("/pastes", createLimiter, (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const data = parsed.data;
  const existingUser = data.username
    ? db.prepare("SELECT * FROM users WHERE username = ?").get(data.username)
    : null;

  if (existingUser?.banned) {
    return res.status(403).json({ error: "User is banned" });
  }

  if (data.username && !existingUser) {
    db.prepare("INSERT INTO users(username, tag, banned) VALUES (?, 'User', 0)").run(data.username);
  }

  const now = new Date();
  const expiresAt =
    data.expiration === "never"
      ? null
      : new Date(now.getTime() + durations[data.expiration]).toISOString();
  const id = nanoid(9);

  db.prepare(
    `INSERT INTO pastes(id, title, content, created_at, expires_at, author_username, visibility, burn_after_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    data.title || null,
    data.content,
    now.toISOString(),
    expiresAt,
    data.username || null,
    data.visibility,
    data.burnAfterRead ? 1 : 0,
  );

  return res.json({ paste: { id } });
});

router.get("/pastes/recent", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT p.id, p.title, p.created_at, u.username, u.tag
       FROM pastes p
       LEFT JOIN users u ON u.username = p.author_username
       WHERE p.visibility = 'public'
       ORDER BY p.created_at DESC
       LIMIT 12`,
    )
    .all();
  return res.json({ pastes: rows });
});

router.get("/pastes/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM pastes WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Paste not found" });

  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM pastes WHERE id = ?").run(row.id);
    return res.status(410).json({ error: "Paste has expired" });
  }

  const user = row.author_username
    ? db.prepare("SELECT username, tag FROM users WHERE username = ?").get(row.author_username)
    : null;

  if (row.burn_after_read) {
    db.prepare("DELETE FROM pastes WHERE id = ?").run(row.id);
  }

  return res.json({
    paste: {
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      username: user?.username,
      tag: user?.tag || "User",
    },
  });
});

router.get("/users", (_req, res) => {
  const users = db
    .prepare("SELECT username, tag, banned, created_at FROM users ORDER BY created_at DESC")
    .all();
  res.json({ users });
});

router.get("/tos", (_req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'tos_content'").get();
  res.json({ content: row?.value || "" });
});

export default router;
