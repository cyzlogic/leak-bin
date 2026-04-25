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

router.post("/analytics", (_req, res) => {
  const pastes = db.prepare("SELECT COUNT(*) AS count FROM pastes").get().count;
  const users = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  res.json({ analytics: { pastes, users } });
});

router.post("/pastes", (_req, res) => {
  const pastes = db
    .prepare("SELECT id, title, created_at, author_username FROM pastes ORDER BY created_at DESC")
    .all();
  res.json({ pastes });
});

router.post("/pastes/delete", (req, res) => {
  const schema = z.object({ id: z.string().min(3) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const result = db.prepare("DELETE FROM pastes WHERE id = ?").run(parsed.data.id);
  if (!result.changes) {
    return res.status(404).json({ error: "Paste not found" });
  }
  res.json({ ok: true, message: "Paste deleted" });
});

router.post("/users", (_req, res) => {
  const rows = db
    .prepare("SELECT username, tag, roles FROM users")
    .all();
  const users = rows.map((u) => ({
    username: u.username,
    roles: parseRoles(u.roles, u.tag),
  }));
  res.json({
    users: sortUsersByHierarchy(users),
  });
});

router.post("/users/update", (req, res) => {
  const schema = z.object({
    username: z.string().min(2).max(24),
    roles: z.array(z.string().min(1).max(24)).min(1).max(32),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const v = validateRoleList(parsed.data.roles);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const primary = JSON.parse(v.json)[0];
  const result = db
    .prepare("UPDATE users SET tag = ?, roles = ? WHERE username = ?")
    .run(primary, v.json, parsed.data.username);
  if (!result.changes) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ ok: true, roles: JSON.parse(v.json) });
});

router.post("/users/remove", (req, res) => {
  const schema = z.object({ username: z.string().min(2).max(24) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const { username } = parsed.data;
  db.prepare("DELETE FROM pastes WHERE author_username = ?").run(username);
  const result = db.prepare("DELETE FROM users WHERE username = ?").run(username);
  if (!result.changes) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ ok: true, message: "User and their pastes removed" });
});

router.post("/tos", (req, res) => {
  const schema = z.object({ content: z.string().min(1).max(10000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid TOS content" });
  db.prepare("UPDATE settings SET value = ? WHERE key = 'tos_content'").run(parsed.data.content);
  res.json({ ok: true });
});

export default router;
