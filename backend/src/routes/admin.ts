import fs from "node:fs";
import path from "node:path";
import { Router, type Request } from "express";
import rateLimit from "express-rate-limit";
import { imageSize } from "image-size";
import { z } from "zod";
import { config } from "../config.js";
import { db, q } from "../db.js";
import { CAMPAIGN_COLLECTIONS, collectionMap, collections, columnsFor, settingsFields } from "../schema.js";
import {
  createItem,
  deleteItem,
  getItem,
  getSettings,
  listItems,
  logActivity,
  reorder,
  saveSettings,
  titleOf,
  updateItem,
} from "../lib/content.js";
import { clearSession, hashPassword, issueSession, requireAdmin, requireAuth, verifyPassword, type SessionUser } from "../lib/auth.js";
import { adminUpload, publicUrl } from "../lib/upload.js";

// ---- Auth --------------------------------------------------------------

export const authRouter = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

authRouter.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Enter your email and password." });
  const user = await db.get<SessionUser & { password_hash: string }>(`SELECT * FROM users WHERE email = ?`, [String(email).trim()]);
  if (!user || !(await verifyPassword(String(password), user.password_hash))) {
    return res.status(401).json({ error: "That email and password don't match." });
  }
  await db.run(`UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?`, [user.id]);
  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  issueSession(res, session);
  await logActivity(session, "signed in");
  res.json({ user: session });
});

authRouter.post("/logout", (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

authRouter.post("/password", requireAuth, async (req, res) => {
  const parsed = z
    .object({ current: z.string().min(1), next: z.string().min(8, "Use at least 8 characters.") })
    .safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.issues[0].message });
  const row = (await db.get<{ password_hash: string }>(`SELECT password_hash FROM users WHERE id = ?`, [req.user!.id]))!;
  if (!(await verifyPassword(parsed.data.current, row.password_hash))) {
    return res.status(400).json({ error: "Your current password is incorrect." });
  }
  await db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [await hashPassword(parsed.data.next), req.user!.id]);
  await logActivity(req.user, "changed their password");
  res.json({ ok: true });
});

// ---- Admin -------------------------------------------------------------

export const adminRouter = Router();
adminRouter.use(requireAuth);

adminRouter.get("/schema", async (_req, res) => {
  // Campaign sections drop out of the dashboard menu while campaign mode is off.
  const { campaign_mode } = await getSettings(settingsFields);
  res.json({
    collections: collections.map((c) => (CAMPAIGN_COLLECTIONS.has(c.key) && !campaign_mode ? { ...c, hidden: true } : c)),
    settings: settingsFields,
  });
});

adminRouter.get("/overview", async (_req, res) => {
  const count = async (sql: string) => (await db.get<{ n: number }>(sql))!.n;
  const counts: Record<string, number> = {};
  for (const c of collections) counts[c.key] = await count(`SELECT COUNT(*) AS n FROM ${q(c.key)}`);
  const unread = {
    messages: await count(`SELECT COUNT(*) AS n FROM messages WHERE status = 'New' OR status IS NULL`),
    volunteers: await count(`SELECT COUNT(*) AS n FROM volunteers WHERE status = 'New' OR status IS NULL`),
    grievances: await count(`SELECT COUNT(*) AS n FROM grievances WHERE status IN ('Received', 'In review', 'In progress')`),
  };
  const grievanceStatus = await db.all(`SELECT status, COUNT(*) AS count FROM grievances GROUP BY status`);
  const recentGrievances = await db.all(`SELECT id, code, subject, category, ward, status, created_at FROM grievances ORDER BY id DESC LIMIT 6`);
  const recentMessages = await db.all(`SELECT id, name, subject, status, created_at FROM messages ORDER BY id DESC LIMIT 5`);
  const activity = await db.all(`SELECT * FROM activity ORDER BY id DESC LIMIT 12`);
  const media = await db.get(`SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS bytes FROM media`);
  const surveys = await db.get(
    `SELECT (SELECT COUNT(*) FROM surveys WHERE status = 'open') AS open,
      (SELECT COUNT(*) FROM survey_responses) AS responses,
      (SELECT COUNT(*) FROM survey_responses WHERE created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY) AS week`,
  );
  res.json({ counts, unread, grievanceStatus, recentGrievances, recentMessages, activity, media, surveys });
});

adminRouter.get("/activity", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  res.json({ items: await db.all(`SELECT * FROM activity ORDER BY id DESC LIMIT ?`, [limit]) });
});

// Settings
adminRouter.get("/settings", async (_req, res) => res.json(await getSettings(settingsFields)));
adminRouter.put("/settings", async (req, res) => {
  const saved = await saveSettings(settingsFields, req.body ?? {});
  await logActivity(req.user, "updated", "settings", undefined, "Site settings");
  res.json(saved);
});

// Generic collection CRUD
function collectionOr404(req: Request) {
  return collectionMap.get(String(req.params.collection));
}

adminRouter.get("/c/:collection", async (req, res) => {
  const c = collectionOr404(req);
  if (!c) return res.status(404).json({ error: "Unknown collection" });
  const { limit, offset, q, ...filters } = req.query as Record<string, string>;
  res.json(await listItems(c, { includePrivate: true, limit: Number(limit) || 200, offset: Number(offset) || 0, q, filters }));
});

/** Spreadsheet export, mainly for volunteers and grievances. */
adminRouter.get("/c/:collection/export.csv", async (req, res) => {
  const c = collectionOr404(req);
  if (!c) return res.status(404).json({ error: "Unknown collection" });
  const { items } = await listItems(c, { includePrivate: true, limit: 500 });
  const cols = ["id", ...c.fields.flatMap(columnsFor), "created_at"];
  const esc = (v: unknown) => {
    const s = Array.isArray(v) ? v.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join("; ") : String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(","), ...items.map((it) => cols.map((k) => esc(it[k])).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${c.key}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send("﻿" + csv);
});

adminRouter.get("/c/:collection/:id", async (req, res) => {
  const c = collectionOr404(req);
  const item = c && (await getItem(c, Number(req.params.id), { includePrivate: true }));
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

adminRouter.post("/c/:collection", async (req, res) => {
  const c = collectionOr404(req);
  if (!c) return res.status(404).json({ error: "Unknown collection" });
  const item = await createItem(c, req.body ?? {});
  await logActivity(req.user, "created", c.key, Number(item.id), titleOf(c, item));
  res.status(201).json(item);
});

adminRouter.post("/c/:collection/reorder", async (req, res) => {
  const c = collectionOr404(req);
  if (!c) return res.status(404).json({ error: "Unknown collection" });
  const ids = z.array(z.number().int()).safeParse(req.body?.ids);
  if (!ids.success) return res.status(400).json({ error: "Invalid order." });
  await reorder(c, ids.data);
  await logActivity(req.user, "reordered", c.key);
  res.json({ ok: true });
});

adminRouter.put("/c/:collection/:id", async (req, res) => {
  const c = collectionOr404(req);
  if (!c) return res.status(404).json({ error: "Unknown collection" });
  const item = await updateItem(c, Number(req.params.id), req.body ?? {});
  if (!item) return res.status(404).json({ error: "Not found" });
  await logActivity(req.user, "updated", c.key, Number(item.id), titleOf(c, item));
  res.json(item);
});

adminRouter.delete("/c/:collection/:id", async (req, res) => {
  const c = collectionOr404(req);
  if (!c) return res.status(404).json({ error: "Unknown collection" });
  const item = await getItem(c, Number(req.params.id), { includePrivate: true });
  if (!item || !(await deleteItem(c, Number(req.params.id)))) return res.status(404).json({ error: "Not found" });
  await logActivity(req.user, "deleted", c.key, Number(item.id), titleOf(c, item));
  res.json({ ok: true });
});

// ---- Media library -----------------------------------------------------

adminRouter.post("/upload", adminUpload.array("files", 30), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const saved = [];
  for (const f of files) {
    let width: number | null = null;
    let height: number | null = null;
    if (f.mimetype.startsWith("image/")) {
      try {
        const dim = imageSize(fs.readFileSync(f.path));
        width = dim.width ?? null;
        height = dim.height ?? null;
      } catch {
        /* unreadable header; dimensions stay unknown */
      }
    }
    const url = publicUrl(f.path);
    const info = await db.run(
      `INSERT INTO media (url, filename, original_name, mime, size, width, height, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [url, f.filename, f.originalname, f.mimetype, f.size, width, height, req.user!.id],
    );
    saved.push({ id: info.insertId, url, original_name: f.originalname, mime: f.mimetype, size: f.size, width, height });
  }
  if (saved.length) await logActivity(req.user, `uploaded ${saved.length} file${saved.length > 1 ? "s" : ""}`, "media");
  res.status(201).json({ files: saved });
});

adminRouter.get("/media", async (req, res) => {
  const type = String(req.query.type ?? "");
  const q = String(req.query.q ?? "");
  const where: string[] = [];
  const params: unknown[] = [];
  if (type === "image") where.push(`mime LIKE 'image/%'`);
  if (type === "document") where.push(`mime NOT LIKE 'image/%'`);
  if (q) {
    where.push(`(original_name LIKE ? OR alt LIKE ?)`);
    params.push(`%${q}%`, `%${q}%`);
  }
  const sql = `SELECT * FROM media ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY id DESC LIMIT 500`;
  res.json({ items: await db.all(sql, params) });
});

adminRouter.patch("/media/:id", async (req, res) => {
  await db.run(`UPDATE media SET alt = ? WHERE id = ?`, [String(req.body?.alt ?? "").slice(0, 300), Number(req.params.id)]);
  res.json(await db.get(`SELECT * FROM media WHERE id = ?`, [Number(req.params.id)]));
});

adminRouter.delete("/media/:id", async (req, res) => {
  const row = await db.get<{ url: string; original_name: string }>(`SELECT * FROM media WHERE id = ?`, [Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: "Not found" });
  const abs = path.join(config.uploadDir, row.url.replace(/^\/uploads\//, ""));
  if (abs.startsWith(config.uploadDir)) fs.rmSync(abs, { force: true });
  await db.run(`DELETE FROM media WHERE id = ?`, [Number(req.params.id)]);
  await logActivity(req.user, "deleted file", "media", undefined, row.original_name);
  res.json({ ok: true });
});

// ---- Team (admins only) ------------------------------------------------

adminRouter.get("/users", requireAdmin, async (_req, res) => {
  res.json({ items: await db.all(`SELECT id, name, email, role, last_login_at, created_at FROM users ORDER BY id`) });
});

const userInput = z.object({
  name: z.string().trim().min(2, "Enter a name."),
  email: z.string().trim().email("Enter a valid email."),
  role: z.enum(["admin", "editor"]),
  password: z.string().min(8, "Use at least 8 characters.").optional().or(z.literal("")),
});

adminRouter.post("/users", requireAdmin, async (req, res) => {
  const parsed = userInput.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.issues[0].message });
  if (!parsed.data.password) return res.status(422).json({ error: "Set a password for the new account." });
  try {
    const info = await db.run(`INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)`, [
      parsed.data.name,
      parsed.data.email,
      parsed.data.role,
      await hashPassword(parsed.data.password),
    ]);
    await logActivity(req.user, "added team member", "users", info.insertId, parsed.data.name);
    res.status(201).json({ id: info.insertId });
  } catch {
    res.status(409).json({ error: "An account with that email already exists." });
  }
});

adminRouter.put("/users/:id", requireAdmin, async (req, res) => {
  const parsed = userInput.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: parsed.error.issues[0].message });
  const id = Number(req.params.id);
  if (id === req.user!.id && parsed.data.role !== "admin") {
    return res.status(400).json({ error: "You can't remove your own admin access." });
  }
  await db.run(`UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?`, [parsed.data.name, parsed.data.email, parsed.data.role, id]);
  if (parsed.data.password) {
    await db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [await hashPassword(parsed.data.password), id]);
  }
  await logActivity(req.user, "updated team member", "users", id, parsed.data.name);
  res.json({ ok: true });
});

adminRouter.delete("/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user!.id) return res.status(400).json({ error: "You can't delete your own account." });
  await db.run(`DELETE FROM users WHERE id = ?`, [id]);
  await logActivity(req.user, "removed team member", "users", id);
  res.json({ ok: true });
});
