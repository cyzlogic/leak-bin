import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";
import { parseRoles, sortUsersByHierarchy, validateRoleList } from "../lib/roles.js";

const router = Router();

router.use((req, res, next) => {
  const key = req.header("x-admin-key");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
});

// ---------------- ANALYTICS ----------------

router.post("/analytics", async (_req, res) => {
  const pastesRes = await db.query("SELECT COUNT(*) FROM pastes");
  const usersRes = await db.query("SELECT COUNT(*) FROM users");

  res.json({
    analytics: {
      pastes: Number(pastesRes.rows[0].count),
      users: Number(usersRes.rows[0].count),
    },
  });
});

// ---------------- GET PASTES ----------------

router.post("/pastes", async (_req, res) => {
  const result = await db.query(
    "SELECT id, title, created_at, author_username FROM pastes ORDER BY created_at DESC"
  );
  res.json({ pastes: result.rows });
});

// ---------------- DELETE PASTE ----------------

router.post("/pastes/delete", async (req, res) => {
  const schema = z.object({ id: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const result = await db.query("DELETE FROM pastes WHERE id = $1", [
    parsed.data.id,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Paste not found" });
  }

  res.json({ ok: true, message: "Paste deleted" });
});

// ---------------- USERS ----------------

router.post("/users", async (_req, res) => {
  const result = await db.query("SELECT username, tag, roles FROM users");

  const users = result.rows.map((u) => ({
    username: u.username,
    roles: parseRoles(u.roles, u.tag),
  }));

  res.json({
    users: sortUsersByHierarchy(users),
  });
});

// ---------------- UPDATE USER ----------------

router.post("/users/update", async (req, res) => {
  const schema = z.object({
    username: z.string().min(2).max(24),
    roles: z.array(z.string().min(1).max(24)).min(1).max(32),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const v = validateRoleList(parsed.data.roles);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const primary = JSON.parse(v.json)[0];

  const result = await db.query(
    "UPDATE users SET tag = $1, roles = $2 WHERE username = $3",
    [primary, v.json, parsed.data.username]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ ok: true, roles: JSON.parse(v.json) });
});

// ---------------- REMOVE USER ----------------

router.post("/users/remove", async (req, res) => {
  const schema = z.object({ username: z.string().min(2).max(24) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });

  const { username } = parsed.data;

  await db.query("DELETE FROM pastes WHERE author_username = $1", [username]);

  const result = await db.query("DELETE FROM users WHERE username = $1", [
    username,
  ]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ ok: true, message: "User and their pastes removed" });
});

// ---------------- UPDATE TOS ----------------

router.post("/tos", async (req, res) => {
  const schema = z.object({ content: z.string().min(1).max(10000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid TOS content" });

  await db.query(
    "UPDATE settings SET value = $1 WHERE key = 'tos_content'",
    [parsed.data.content]
  );

  res.json({ ok: true });
});

export default router;