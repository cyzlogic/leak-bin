import { Router } from "express";
import { nanoid } from "nanoid";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../db/client.js";
import {
  getTopRole,
  parseRoles,
  serializeRoles,
  sortUsersByHierarchy
} from "../lib/roles.js";

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

// ---------------- CREATE PASTE ----------------

router.post("/pastes", createLimiter, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const data = parsed.data;

  const existingUser = data.username
    ? (await db.query("SELECT * FROM users WHERE username = $1", [
        data.username
      ])).rows[0]
    : null;

  if (existingUser?.banned) {
    return res.status(403).json({ error: "User is banned" });
  }

  if (data.username && !existingUser) {
    await db.query(
      "INSERT INTO users (username, tag, roles, banned) VALUES ($1, $2, $3, 0)",
      [data.username, "User", serializeRoles(["User"])]
    );
  }

  const now = new Date();
  const expiresAt =
    data.expiration === "never"
      ? null
      : new Date(now.getTime() + durations[data.expiration]).toISOString();

  const id = nanoid(9);

  await db.query(
    `INSERT INTO pastes
     (id, title, content, created_at, expires_at, author_username, visibility, burn_after_read)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      data.title || null,
      data.content,
      now.toISOString(),
      expiresAt,
      data.username || null,
      data.visibility,
      data.burnAfterRead ? 1 : 0
    ]
  );

  return res.json({ paste: { id } });
});

// ---------------- RECENT PASTES ----------------

router.get("/pastes/recent", async (_req, res) => {
  const result = await db.query(
    `SELECT p.id, p.title, p.created_at, u.username, u.tag, u.roles
     FROM pastes p
     LEFT JOIN users u ON u.username = p.author_username
     WHERE p.visibility = 'public'
     ORDER BY p.created_at DESC
     LIMIT 12`
  );

  return res.json({
    pastes: result.rows.map((r) => ({
      ...r,
      roles: parseRoles(r.roles, r.tag),
    })),
  });
});

// ---------------- GET PASTE ----------------

router.get("/pastes/:id", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM pastes WHERE id = $1",
    [req.params.id]
  );

  const row = result.rows[0];
  if (!row) return res.status(404).json({ error: "Paste not found" });

  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    await db.query("DELETE FROM pastes WHERE id = $1", [row.id]);
    return res.status(410).json({ error: "Paste has expired" });
  }

  const userRes = row.author_username
    ? await db.query(
        "SELECT username, tag, roles FROM users WHERE username = $1",
        [row.author_username]
      )
    : { rows: [] };

  const user = userRes.rows[0];

  if (row.burn_after_read) {
    await db.query("DELETE FROM pastes WHERE id = $1", [row.id]);
  }

  const roles = user ? parseRoles(user.roles, user.tag) : ["User"];

  return res.json({
    paste: {
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      username: user?.username,
      tag: roles[0] || "User",
      roles,
    },
  });
});

// ---------------- USERS ----------------

router.get("/users", async (_req, res) => {
  const result = await db.query(
    "SELECT username, tag, roles, created_at FROM users"
  );

  const users = result.rows.map((u) => {
    const roles = parseRoles(u.roles, u.tag);
    return {
      username: u.username,
      tag: getTopRole(roles),
      roles,
      created_at: u.created_at,
    };
  });

  res.json({ users: sortUsersByHierarchy(users) });
});

// ---------------- SINGLE USER ----------------

router.get("/users/:username", async (req, res) => {
  const userRes = await db.query(
    "SELECT username, tag, roles, created_at FROM users WHERE username = $1",
    [req.params.username]
  );

  const row = userRes.rows[0];
  if (!row) return res.status(404).json({ error: "User not found" });

  const roles = parseRoles(row.roles, row.tag);

  const countRes = await db.query(
    "SELECT COUNT(*) FROM pastes WHERE author_username = $1",
    [row.username]
  );

  const recentRes = await db.query(
    `SELECT id, title, created_at
     FROM pastes
     WHERE author_username = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [row.username]
  );

  res.json({
    user: {
      username: row.username,
      roles,
      topRole: getTopRole(roles),
      createdAt: row.created_at,
      totalPastes: Number(countRes.rows[0].count),
      recentPastes: recentRes.rows,
    },
  });
});

// ---------------- TOS ----------------

router.get("/tos", async (_req, res) => {
  const result = await db.query(
    "SELECT value FROM settings WHERE key = 'tos_content'"
  );

  res.json({ content: result.rows[0]?.value || "" });
});

export default router;