require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://svrpoker.com";
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "CHANGE_ME_DEV_ONLY";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || "King";
const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 })
  : null;

app.use(helmet());
app.use(express.json({ limit: "128kb" }));
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = String(ALLOWED_ORIGIN).split(",").map((value) => value.trim()).filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin blocked"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

function signAdminToken(email) {
  return jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ ok: false, error: "Missing admin token." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ ok: false, error: "Admin role required." });
    req.admin = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: "Invalid or expired admin token." });
  }
}

async function dbQuery(text, params = []) {
  if (!pool) throw new Error("DATABASE_URL is not configured.");
  return pool.query(text, params);
}

async function ensureAdminStatusTable() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS admin_status (
      id INTEGER PRIMARY KEY DEFAULT 1,
      is_online BOOLEAN NOT NULL DEFAULT FALSE,
      status_text TEXT NOT NULL DEFAULT 'Admin Offline',
      updated_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT single_admin_status CHECK (id = 1)
    );
    INSERT INTO admin_status (id, is_online, status_text)
    VALUES (1, FALSE, 'Admin Offline')
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function ensureSiteMessagesTable() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS site_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      email TEXT,
      subject TEXT,
      message TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'public_site',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE site_messages ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE site_messages ADD COLUMN IF NOT EXISTS archived_by TEXT;
  `);
}

async function ensureAdminLogsTable() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_email TEXT,
      action TEXT NOT NULL,
      details JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function writeAdminLog(email, action, details) {
  try {
    await ensureAdminLogsTable();
    await dbQuery(
      `INSERT INTO admin_logs (admin_email, action, details) VALUES ($1, $2, $3::jsonb)`,
      [email || null, action, JSON.stringify(details || {})]
    );
  } catch (error) {
    console.warn("Admin log write failed:", error.message);
  }
}

function normalizeMessageId(raw) {
  const id = String(raw || "").trim();
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) return "";
  return id;
}

app.get("/api/health", async (req, res) => {
  const response = { ok: true, service: "svr-aws-api", databaseConfigured: Boolean(DATABASE_URL), time: new Date().toISOString() };
  if (!DATABASE_URL) { response.database = "not-configured"; return res.json(response); }
  try {
    const result = await dbQuery(`SELECT current_database() AS database, current_user AS user, NOW() AS server_time`);
    response.database = "connected";
    response.db = result.rows[0];
    return res.json(response);
  } catch (error) {
    response.ok = false;
    response.database = "error";
    response.error = error.message;
    return res.status(500).json(response);
  }
});

app.post("/api/admin/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || JWT_SECRET === "CHANGE_ME_DEV_ONLY") return res.status(500).json({ ok: false, error: "Admin environment variables are not configured." });
  if (email !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) return res.status(401).json({ ok: false, error: "Invalid admin login." });
  try {
    await ensureAdminStatusTable();
    await dbQuery(`
      INSERT INTO admin_status (id, is_online, status_text, updated_by, updated_at)
      VALUES (1, TRUE, 'Admin Online', $1, NOW())
      ON CONFLICT (id) DO UPDATE SET is_online = TRUE, status_text = 'Admin Online', updated_by = EXCLUDED.updated_by, updated_at = NOW()
    `, [email]);
    await writeAdminLog(email, "admin_login", { source: "api" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database write failed during login.", detail: error.message });
  }
  return res.json({ ok: true, token: signAdminToken(email), admin: { email, displayName: ADMIN_DISPLAY_NAME, isOnline: true } });
});

app.post("/api/admin/online", requireAdmin, async (req, res) => {
  const isOnline = req.body?.isOnline;
  if (typeof isOnline !== "boolean") return res.status(400).json({ ok: false, error: "isOnline must be true or false." });
  try {
    await ensureAdminStatusTable();
    await dbQuery(`
      INSERT INTO admin_status (id, is_online, status_text, updated_by, updated_at)
      VALUES (1, $1, $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET is_online = EXCLUDED.is_online, status_text = EXCLUDED.status_text, updated_by = EXCLUDED.updated_by, updated_at = NOW()
    `, [isOnline, isOnline ? "Admin Online" : "Admin Offline", req.admin.email]);
    await writeAdminLog(req.admin.email, isOnline ? "admin_online" : "admin_offline", { source: "api" });
    return res.json({ ok: true, isOnline });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
  }
});

app.get("/api/admin/status", async (req, res) => {
  try {
    await ensureAdminStatusTable();
    const result = await dbQuery(`SELECT id, is_online, status_text, updated_by, updated_at FROM admin_status WHERE id = 1 LIMIT 1`);
    if (!result.rows.length) return res.json({ ok: true, isOnline: false, displayName: ADMIN_DISPLAY_NAME, statusText: "Admin Offline", source: "empty" });
    const row = result.rows[0];
    return res.json({ ok: true, isOnline: Boolean(row.is_online), displayName: ADMIN_DISPLAY_NAME, statusText: row.status_text, updatedBy: row.updated_by, updatedAt: row.updated_at, source: "database" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database read failed.", detail: error.message });
  }
});

app.post("/api/messages", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim();
  const subject = String(req.body?.subject || "Public message").trim();
  const message = String(req.body?.message || "").trim();
  const source = String(req.body?.source || "public_site").trim();
  if (!message) return res.status(400).json({ ok: false, error: "Message is required." });
  try {
    await ensureSiteMessagesTable();
    const result = await dbQuery(`
      INSERT INTO site_messages (name, email, subject, message, source)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [name || null, email || null, subject || null, message, source]);
    return res.status(201).json({ ok: true, message: "Message received.", record: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
  }
});

app.get("/api/messages/admin", requireAdmin, async (req, res) => {
  const includeArchived = String(req.query?.includeArchived || "") === "1";
  try {
    await ensureSiteMessagesTable();
    const result = await dbQuery(`
      SELECT id, name, email, subject, message, source, is_read, created_at, archived_at, archived_by
      FROM site_messages
      WHERE ($1::boolean = TRUE OR archived_at IS NULL)
      ORDER BY created_at DESC
      LIMIT 100
    `, [includeArchived]);
    const counts = await dbQuery(`
      SELECT
        COUNT(*) FILTER (WHERE archived_at IS NULL) AS active_count,
        COUNT(*) FILTER (WHERE archived_at IS NULL AND is_read = FALSE) AS unread_count,
        COUNT(*) FILTER (WHERE archived_at IS NOT NULL) AS archived_count
      FROM site_messages
    `);
    return res.json({ ok: true, messages: result.rows, counts: counts.rows[0] || {} });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database read failed.", detail: error.message });
  }
});

app.post("/api/messages/admin/read", requireAdmin, async (req, res) => {
  const id = normalizeMessageId(req.body?.id);
  const isRead = typeof req.body?.isRead === "boolean" ? req.body.isRead : true;
  if (!id) return res.status(400).json({ ok: false, error: "Valid message id is required." });
  try {
    await ensureSiteMessagesTable();
    const result = await dbQuery(`UPDATE site_messages SET is_read = $1 WHERE id = $2 RETURNING id, is_read`, [isRead, id]);
    if (!result.rows.length) return res.status(404).json({ ok: false, error: "Message not found." });
    await writeAdminLog(req.admin.email, isRead ? "message_mark_read" : "message_mark_unread", { id });
    return res.json({ ok: true, message: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
  }
});

app.post("/api/messages/admin/archive", requireAdmin, async (req, res) => {
  const id = normalizeMessageId(req.body?.id);
  const archive = req.body?.archive !== false;
  if (!id) return res.status(400).json({ ok: false, error: "Valid message id is required." });
  try {
    await ensureSiteMessagesTable();
    const result = archive
      ? await dbQuery(`UPDATE site_messages SET archived_at = NOW(), archived_by = $1 WHERE id = $2 RETURNING id, archived_at`, [req.admin.email, id])
      : await dbQuery(`UPDATE site_messages SET archived_at = NULL, archived_by = NULL WHERE id = $1 RETURNING id, archived_at`, [id]);
    if (!result.rows.length) return res.status(404).json({ ok: false, error: "Message not found." });
    await writeAdminLog(req.admin.email, archive ? "message_archive" : "message_restore", { id });
    return res.json({ ok: true, message: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
  }
});

app.post("/api/messages/admin/delete", requireAdmin, async (req, res) => {
  const id = normalizeMessageId(req.body?.id);
  if (!id) return res.status(400).json({ ok: false, error: "Valid message id is required." });
  try {
    await ensureSiteMessagesTable();
    const result = await dbQuery(`DELETE FROM site_messages WHERE id = $1 RETURNING id`, [id]);
    if (!result.rows.length) return res.status(404).json({ ok: false, error: "Message not found." });
    await writeAdminLog(req.admin.email, "message_delete", { id });
    return res.json({ ok: true, deleted: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
  }
});

app.get("/api/admin/logs", requireAdmin, async (req, res) => {
  try {
    await ensureAdminLogsTable();
    const result = await dbQuery(`SELECT id, admin_email, action, details, created_at FROM admin_logs ORDER BY created_at DESC LIMIT 50`);
    return res.json({ ok: true, logs: result.rows });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database read failed.", detail: error.message });
  }
});

app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "API route not found." }));

app.listen(PORT, () => console.log(`SVR AWS PostgreSQL API listening on port ${PORT}`));
