import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client.js";

const router = Router();
const allowedTags = new Set(["Known", "Vip", "Admin", "Owner", "User", "known"]);
const legacyTagMap = {
  user: "User",
  USER: "User",
  admin: "Admin",
  vip: "Vip",
  owner: "Owner",
  known_red: "known",
};

function normalizeTag(input) {
  const cleaned = String(input || "").trim();
  if (allowedTags.has(cleaned)) return cleaned;
  return legacyTagMap[cleaned] || cleaned;
}

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
  const users = db.prepare("SELECT username, tag, banned FROM users ORDER BY username ASC").all();
  res.json({ users });
});

router.post("/users/update", (req, res) => {
  const schema = z.object({
    username: z.string().min(2).max(24),
    tag: z.string().min(2).max(24),
    banned: z.boolean(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid payload" });
  const normalizedTag = normalizeTag(parsed.data.tag);
  if (!allowedTags.has(normalizedTag)) {
    return res.status(400).json({ error: "Tag not allowed" });
  }

  db.prepare("UPDATE users SET tag = ?, banned = ? WHERE username = ?").run(
    normalizedTag,
    parsed.data.banned ? 1 : 0,
    parsed.data.username,
  );
  res.json({ ok: true, tag: normalizedTag });
});

router.post("/tos", (req, res) => {
  const schema = z.object({ content: z.string().min(1).max(10000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid TOS content" });
  db.prepare("UPDATE settings SET value = ? WHERE key = 'tos_content'").run(parsed.data.content);
  res.json({ ok: true });
});

export default router;
