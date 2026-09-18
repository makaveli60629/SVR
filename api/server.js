require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = String(process.env.NODE_ENV || "development").toLowerCase();
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://svrpoker.com";
const JWT_SECRET = String(process.env.ADMIN_JWT_SECRET || "");
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || "King";
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_SSL_REJECT_UNAUTHORIZED = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED == null
  ? NODE_ENV === "production"
  : String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED).toLowerCase() === "true";
const DATABASE_CONTRACT = require("./database-contract.json");
const SITE_ADMIN_SCHEMA_SQL = fs.readFileSync(path.join(__dirname, "sql", "001_site_admin_schema.sql"), "utf8");

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: DATABASE_SSL_REJECT_UNAUTHORIZED },
      connectionTimeoutMillis: 15000
    })
  : null;

app.disable("x-powered-by");
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
  allowedHeaders: ["Content-Type", "Authorization", "X-SVR-Filename", "X-SVR-Content-Type", "X-SVR-Notes"]
}));

function adminJwtConfigured() {
  return JWT_SECRET.length >= 32;
}

function signAdminToken(identity, adminRole = "owner") {
  if (!adminJwtConfigured()) throw new Error("ADMIN_JWT_SECRET must be at least 32 characters.");
  return jwt.sign({ email: identity, role: "admin", adminRole }, JWT_SECRET, { expiresIn: "8h" });
}

function sendServerError(res, publicMessage, error, status = 500) {
  console.error(publicMessage, error);
  const payload = { ok: false, error: publicMessage };
  if (NODE_ENV !== "production") payload.detail = String(error?.message || error);
  return res.status(status).json(payload);
}

function requireAdmin(req, res, next) {
  if (!adminJwtConfigured()) return res.status(503).json({ ok: false, error: "Admin authentication is not configured." });
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

function cleanText(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function cleanEmail(value) {
  return cleanText(value, 255).toLowerCase();
}

function normalizeMessageId(raw) {
  const id = String(raw || "").trim();
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) return "";
  return id;
}

function cleanFileName(value) {
  const raw = String(value || "upload.bin").trim().replace(/\\/g, "/").split("/").pop() || "upload.bin";
  const safe = raw.replace(/[^a-zA-Z0-9._()\- ]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 180);
  return safe || "upload.bin";
}

function cleanContentType(value) {
  const type = String(value || "application/octet-stream").trim().toLowerCase();
  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(type) ? type : "application/octet-stream";
}

async function ensurePgCrypto() {
  await dbQuery(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
}

async function ensureAdminUsersTable() {
  await ensurePgCrypto();
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      display_name TEXT NOT NULL DEFAULT 'SVR Owner',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username);
    CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users (is_active);
  `);
}

async function ensureAdminStatusTable() {
  await ensurePgCrypto();
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
  await ensurePgCrypto();
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
  await ensurePgCrypto();
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

async function ensureMarketingTables() {
  await ensurePgCrypto();
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS marketing_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_type TEXT NOT NULL DEFAULT 'general',
      name TEXT,
      email TEXT,
      phone TEXT,
      organization TEXT,
      message TEXT,
      source TEXT NOT NULL DEFAULT 'site',
      consent BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      archived_at TIMESTAMPTZ,
      archived_by TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at ON marketing_leads (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_marketing_leads_status ON marketing_leads (status);
  `);
}

async function ensureStoreItemsTable() {
  await ensurePgCrypto();
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS store_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sku TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'svr',
      description TEXT,
      price_cents INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_sandbox_only BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_store_items_category ON store_items (category);
    CREATE INDEX IF NOT EXISTS idx_store_items_active ON store_items (is_active);
  `);
}

async function ensureGameEventsTable() {
  await ensurePgCrypto();
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS game_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL,
      room TEXT,
      build TEXT,
      session_id TEXT,
      source TEXT NOT NULL DEFAULT 'game',
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_game_events_created_at ON game_events (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events (event_type);
    CREATE INDEX IF NOT EXISTS idx_game_events_room ON game_events (room);
  `);
}

async function ensureSiteAnalyticsTable() {
  await ensurePgCrypto();
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS site_analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL DEFAULT 'page_view',
      page_path TEXT,
      page_title TEXT,
      referrer TEXT,
      session_id TEXT,
      source TEXT NOT NULL DEFAULT 'site',
      user_agent TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_site_analytics_created_at ON site_analytics_events (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_site_analytics_event_type ON site_analytics_events (event_type);
    CREATE INDEX IF NOT EXISTS idx_site_analytics_page_path ON site_analytics_events (page_path);
    CREATE INDEX IF NOT EXISTS idx_site_analytics_session_id ON site_analytics_events (session_id);
  `);
}
async function ensureSiteAdminSchema() {
  if (!pool) return { configured: false, pass: false, reason: "DATABASE_URL_NOT_CONFIGURED" };
  await dbQuery(SITE_ADMIN_SCHEMA_SQL);
  return auditDatabaseSchema();
}

async function auditDatabaseSchema() {
  if (!pool) return { configured: false, pass: false, reason: "DATABASE_URL_NOT_CONFIGURED" };
  const tables = DATABASE_CONTRACT.siteAdminPostgres?.tables || {};
  const names = Object.keys(tables);
  const result = await dbQuery(
    `SELECT table_name, column_name
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [names]
  );
  const found = new Map();
  for (const row of result.rows) {
    if (!found.has(row.table_name)) found.set(row.table_name, new Set());
    found.get(row.table_name).add(row.column_name);
  }
  const missingTables = [];
  const missingColumns = [];
  for (const [table, requiredColumns] of Object.entries(tables)) {
    if (!found.has(table)) {
      missingTables.push(table);
      continue;
    }
    const columns = found.get(table);
    for (const column of requiredColumns) {
      if (!columns.has(column)) missingColumns.push(`${table}.${column}`);
    }
  }
  return {
    configured: true,
    contractVersion: DATABASE_CONTRACT.contractVersion,
    pass: missingTables.length === 0 && missingColumns.length === 0,
    missingTables,
    missingColumns,
    checkedAt: new Date().toISOString()
  };
}

let databaseSchemaState = {
  configured: Boolean(DATABASE_URL),
  contractVersion: DATABASE_CONTRACT.contractVersion,
  pass: false,
  reason: DATABASE_URL ? "NOT_CHECKED" : "DATABASE_URL_NOT_CONFIGURED"
};

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

const STARTER_STORE_ITEMS = [
  {
    sku: "SVR-FOUNDER-BADGE-001",
    title: "Founder Support Badge",
    category: "membership",
    description: "Sandbox-only founder support badge for early SVR supporters and future profile recognition.",
    price_cents: 999,
    tags: ["founder", "support", "sandbox"]
  },
  {
    sku: "SVR-WATCH-NEON-PURPLE-001",
    title: "Neon Purple Watch Skin",
    category: "game-cosmetic",
    description: "Sample forearm-watch cosmetic for the VR poker interface. Preview only until checkout approval.",
    price_cents: 999,
    tags: ["watch", "cosmetic", "vr"]
  },
  {
    sku: "SVR-GLOVES-SCORPION-BLACK-001",
    title: "Scorpion Black Gloves",
    category: "avatar-gear",
    description: "Sample avatar glove item for future controller/hand visual customization.",
    price_cents: 1499,
    tags: ["gloves", "avatar", "scorpion"]
  },
  {
    sku: "SVR-TABLE-FELT-CLASSIC-001",
    title: "SVR Classic Table Felt",
    category: "table-theme",
    description: "Classic SVR table felt preview with sponsor-safe styling and play-money positioning.",
    price_cents: 1299,
    tags: ["table", "felt", "poker"]
  },
  {
    sku: "SVR-CHIP-SKIN-TOURNAMENT-001",
    title: "Tournament Chip Skin Set",
    category: "game-cosmetic",
    description: "Sample chip skin set for future member inventory and tournament table themes.",
    price_cents: 799,
    tags: ["chips", "cosmetic", "tournament"]
  },
  {
    sku: "SVR-PGA-RANGE-PASS-001",
    title: "PGA Range Preview Pass",
    category: "pga",
    description: "Preview pass placeholder for the private golf training module. No live sale in this phase.",
    price_cents: 0,
    tags: ["pga", "range", "preview"]
  },
  {
    sku: "SVR-REIKI-ROOM-PASS-001",
    title: "Reiki Room Preview Pass",
    category: "reiki",
    description: "Approval-safe Reiki room preview pass with no unapproved sponsor/founder branding.",
    price_cents: 0,
    tags: ["reiki", "approval", "preview"]
  },
  {
    sku: "SVR-LOUNGE-HOODIE-001",
    title: "Lounge Neon Hoodie",
    category: "lounge",
    description: "Compliant lounge-branded apparel sample for store layout and sponsor interest testing.",
    price_cents: 4499,
    tags: ["lounge", "apparel", "sample"]
  }
];

async function seedStarterStoreItems(adminEmail = null) {
  await ensureStoreItemsTable();
  for (const item of STARTER_STORE_ITEMS) {
    await dbQuery(`
      INSERT INTO store_items (sku, title, category, description, price_cents, tags, is_active, is_sandbox_only, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, TRUE, TRUE, NOW())
      ON CONFLICT (sku) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        price_cents = EXCLUDED.price_cents,
        tags = EXCLUDED.tags,
        is_sandbox_only = TRUE,
        updated_at = NOW()
    `, [item.sku, item.title, item.category, item.description, item.price_cents, JSON.stringify(item.tags)]);
  }
  await writeAdminLog(adminEmail, "store_seed_starter_packet", { count: STARTER_STORE_ITEMS.length });
}

app.get("/api/health", async (req, res) => {
  const response = {
    ok: true,
    service: "svr-site-admin-postgres-api",
    databaseConfigured: Boolean(DATABASE_URL),
    adminJwtConfigured: adminJwtConfigured(),
    schema: {
      contractVersion: databaseSchemaState.contractVersion,
      pass: Boolean(databaseSchemaState.pass),
      missingTableCount: databaseSchemaState.missingTables?.length || 0,
      missingColumnCount: databaseSchemaState.missingColumns?.length || 0
    },
    time: new Date().toISOString()
  };
  if (!DATABASE_URL) {
    response.database = "not-configured";
    return res.json(response);
  }
  try {
    await dbQuery(`SELECT 1 AS ok`);
    response.database = "connected";
    return res.json(response);
  } catch (error) {
    console.error("Database health check failed.", error);
    response.ok = false;
    response.database = "error";
    if (NODE_ENV !== "production") response.detail = String(error?.message || error);
    return res.status(500).json(response);
  }
});

app.post("/api/admin/login", async (req, res) => {
  const identifier = cleanText(req.body?.email || req.body?.username, 255).toLowerCase();
  const password = String(req.body?.password || "");
  if (!DATABASE_URL || !adminJwtConfigured()) {
    return res.status(503).json({ ok: false, error: "Admin authentication is not configured." });
  }
  if (!identifier || !password) return res.status(400).json({ ok: false, error: "Email/username and password are required." });
  try {
    await ensureAdminUsersTable();
    const result = await dbQuery(`
      SELECT id, username, email, display_name, role, must_change_password
      FROM admin_users
      WHERE is_active = TRUE
        AND (LOWER(COALESCE(email,'')) = $1 OR LOWER(username) = $1)
        AND password_hash = crypt($2, password_hash)
      LIMIT 1
    `, [identifier, password]);
    const row = result.rows[0];
    if (!row) return res.status(401).json({ ok: false, error: "Invalid admin login." });
    const identity = row.email || row.username;
    await dbQuery(`UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`, [row.id]);
    await ensureAdminStatusTable();
    await dbQuery(`
      INSERT INTO admin_status (id, is_online, status_text, updated_by, updated_at)
      VALUES (1, TRUE, 'Admin Online', $1, NOW())
      ON CONFLICT (id) DO UPDATE SET
        is_online = TRUE,
        status_text = 'Admin Online',
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    `, [identity]);
    await writeAdminLog(identity, "admin_login", { source: "api", username: row.username, role: row.role });
    return res.json({
      ok: true,
      token: signAdminToken(identity, row.role),
      admin: {
        email: row.email || null,
        username: row.username,
        displayName: row.display_name || ADMIN_DISPLAY_NAME,
        role: row.role,
        mustChangePassword: Boolean(row.must_change_password),
        isOnline: true
      }
    });
  } catch (error) {
    return sendServerError(res, "Admin login failed.", error);
  }
});

app.post("/api/admin/password", requireAdmin, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  if (newPassword.length < 12) return res.status(400).json({ ok: false, error: "New password must be at least 12 characters." });
  try {
    await ensureAdminUsersTable();
    const identity = String(req.admin?.email || "").toLowerCase();
    const result = await dbQuery(`
      UPDATE admin_users
      SET password_hash = crypt($2, gen_salt('bf', 12)),
          must_change_password = FALSE,
          updated_at = NOW()
      WHERE is_active = TRUE
        AND (LOWER(COALESCE(email,'')) = $1 OR LOWER(username) = $1)
        AND password_hash = crypt($3, password_hash)
      RETURNING username, email
    `, [identity, newPassword, currentPassword]);
    if (!result.rows.length) return res.status(401).json({ ok: false, error: "Current password is incorrect." });
    await writeAdminLog(identity, "admin_password_changed", { username: result.rows[0].username });
    return res.json({ ok: true, changed: true });
  } catch (error) {
    return sendServerError(res, "Admin password update failed.", error);
  }
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
    return sendServerError(res, "Database write failed.", error);
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
    return sendServerError(res, "Database read failed.", error);
  }
});

app.post("/api/messages", async (req, res) => {
  const name = cleanText(req.body?.name, 120);
  const email = cleanEmail(req.body?.email);
  const subject = cleanText(req.body?.subject || "Public message", 180);
  const message = cleanText(req.body?.message, 5000);
  const source = cleanText(req.body?.source || "public_site", 120);
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
    return sendServerError(res, "Database write failed.", error);
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
    return sendServerError(res, "Database read failed.", error);
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
    return sendServerError(res, "Database write failed.", error);
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
    return sendServerError(res, "Database write failed.", error);
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
    return sendServerError(res, "Database write failed.", error);
  }
});

app.post("/api/leads", async (req, res) => {
  const leadType = cleanText(req.body?.leadType || req.body?.type || "general", 80);
  const name = cleanText(req.body?.name, 160);
  const email = cleanEmail(req.body?.email);
  const phone = cleanText(req.body?.phone, 80);
  const organization = cleanText(req.body?.organization, 180);
  const message = cleanText(req.body?.message, 4000);
  const source = cleanText(req.body?.source || "site", 180);
  const consent = Boolean(req.body?.consent);
  if (!email && !message) return res.status(400).json({ ok: false, error: "Email or message is required." });
  try {
    await ensureMarketingTables();
    const result = await dbQuery(`
      INSERT INTO marketing_leads (lead_type, name, email, phone, organization, message, source, consent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, created_at
    `, [leadType, name || null, email || null, phone || null, organization || null, message || null, source, consent]);
    return res.status(201).json({ ok: true, message: "Lead received.", record: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Database write failed.", error);
  }
});

app.get("/api/store/items", async (req, res) => {
  try {
    await ensureStoreItemsTable();
    const count = await dbQuery(`SELECT COUNT(*)::int AS count FROM store_items`);
    if (Number(count.rows[0]?.count || 0) === 0) await seedStarterStoreItems(null);
    const result = await dbQuery(`
      SELECT id, sku, title, category, description, price_cents, image_url, tags, is_sandbox_only, updated_at
      FROM store_items
      WHERE is_active = TRUE
      ORDER BY category ASC, title ASC
      LIMIT 100
    `);
    return res.json({ ok: true, checkoutEnabled: false, sandboxOnly: true, items: result.rows });
  } catch (error) {
    return sendServerError(res, "Database read failed.", error);
  }
});

app.post("/api/game/events", async (req, res) => {
  const eventType = cleanText(req.body?.eventType || req.body?.type, 120);
  const room = cleanText(req.body?.room, 120);
  const build = cleanText(req.body?.build, 120);
  const sessionId = cleanText(req.body?.sessionId, 180);
  const source = cleanText(req.body?.source || "game", 80);
  const payload = req.body?.payload && typeof req.body.payload === "object" ? req.body.payload : {};
  if (!eventType) return res.status(400).json({ ok: false, error: "eventType is required." });
  try {
    await ensureGameEventsTable();
    const result = await dbQuery(`
      INSERT INTO game_events (event_type, room, build, session_id, source, payload)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id, created_at
    `, [eventType, room || null, build || null, sessionId || null, source, JSON.stringify(payload)]);
    return res.status(201).json({ ok: true, event: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Database write failed.", error);
  }
});

app.post("/api/analytics/event", async (req, res) => {
  const eventType = cleanText(req.body?.eventType || req.body?.type || "page_view", 100);
  const pagePath = cleanText(req.body?.pagePath || req.body?.path || "/", 500);
  const pageTitle = cleanText(req.body?.pageTitle || req.body?.title || "", 240);
  const referrer = cleanText(req.body?.referrer || "", 700);
  const sessionId = cleanText(req.body?.sessionId || "anonymous", 180);
  const source = cleanText(req.body?.source || "site", 80);
  const userAgent = cleanText(req.headers["user-agent"] || req.body?.userAgent || "", 500);
  const metadata = req.body?.metadata && typeof req.body.metadata === "object" ? req.body.metadata : {};
  try {
    await ensureSiteAnalyticsTable();
    const result = await dbQuery(`
      INSERT INTO site_analytics_events (event_type, page_path, page_title, referrer, session_id, source, user_agent, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING id, created_at
    `, [eventType, pagePath, pageTitle || null, referrer || null, sessionId || null, source, userAgent || null, JSON.stringify(metadata)]);
    return res.status(201).json({ ok: true, event: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Analytics write failed.", error);
  }
});

app.get("/api/admin/analytics/summary", requireAdmin, async (req, res) => {
  try {
    await ensureSiteAnalyticsTable();
    await ensureSiteMessagesTable();
    await ensureMarketingTables();
    await ensureGameEventsTable();
    await ensureStoreItemsTable();

    const totals = await dbQuery(`
      SELECT
        COUNT(*)::int AS all_events,
        COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS all_page_views,
        COUNT(DISTINCT session_id)::int AS all_sessions,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS events_24h,
        COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at >= NOW() - INTERVAL '24 hours')::int AS page_views_24h,
        COUNT(DISTINCT session_id) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS sessions_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS events_7d,
        COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at >= NOW() - INTERVAL '7 days')::int AS page_views_7d,
        COUNT(DISTINCT session_id) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS sessions_7d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS events_30d,
        COUNT(*) FILTER (WHERE event_type = 'page_view' AND created_at >= NOW() - INTERVAL '30 days')::int AS page_views_30d,
        COUNT(DISTINCT session_id) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS sessions_30d
      FROM site_analytics_events
    `);
    const business = await dbQuery(`
      SELECT
        (SELECT COUNT(*)::int FROM site_messages WHERE created_at >= NOW() - INTERVAL '30 days') AS messages_30d,
        (SELECT COUNT(*)::int FROM marketing_leads WHERE created_at >= NOW() - INTERVAL '30 days') AS leads_30d,
        (SELECT COUNT(*)::int FROM game_events WHERE created_at >= NOW() - INTERVAL '30 days') AS game_events_30d,
        (SELECT COUNT(*)::int FROM store_items WHERE is_active = TRUE) AS active_store_items
    `);
    const topPages = await dbQuery(`
      SELECT COALESCE(page_path, '/') AS page_path, COUNT(*)::int AS views, COUNT(DISTINCT session_id)::int AS sessions
      FROM site_analytics_events
      WHERE event_type = 'page_view' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT 12
    `);
    const referrers = await dbQuery(`
      SELECT COALESCE(NULLIF(referrer, ''), 'direct') AS referrer, COUNT(*)::int AS visits
      FROM site_analytics_events
      WHERE event_type = 'page_view' AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY COALESCE(NULLIF(referrer, ''), 'direct')
      ORDER BY visits DESC
      LIMIT 10
    `);
    const eventCounts = await dbQuery(`
      SELECT event_type, COUNT(*)::int AS count
      FROM site_analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 20
    `);
    const daily = await dbQuery(`
      SELECT TO_CHAR(day, 'YYYY-MM-DD') AS day, COALESCE(events,0)::int AS events, COALESCE(page_views,0)::int AS page_views, COALESCE(sessions,0)::int AS sessions
      FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS day
      LEFT JOIN (
        SELECT DATE_TRUNC('day', created_at)::date AS d, COUNT(*) AS events, COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views, COUNT(DISTINCT session_id) AS sessions
        FROM site_analytics_events
        WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY d
      ) stats ON stats.d = day::date
      ORDER BY day
    `);
    return res.json({ ok: true, totals: totals.rows[0] || {}, business: business.rows[0] || {}, topPages: topPages.rows, referrers: referrers.rows, eventCounts: eventCounts.rows, daily: daily.rows });
  } catch (error) {
    return sendServerError(res, "Analytics summary failed.", error);
  }
});

app.get("/api/admin/analytics/events", requireAdmin, async (req, res) => {
  try {
    await ensureSiteAnalyticsTable();
    const result = await dbQuery(`
      SELECT id, event_type, page_path, page_title, referrer, session_id, source, created_at
      FROM site_analytics_events
      ORDER BY created_at DESC
      LIMIT 200
    `);
    return res.json({ ok: true, events: result.rows });
  } catch (error) {
    return sendServerError(res, "Analytics events failed.", error);
  }
});
app.get("/api/admin/leads", requireAdmin, async (req, res) => {
  const includeArchived = String(req.query?.includeArchived || "") === "1";
  try {
    await ensureMarketingTables();
    const result = await dbQuery(`
      SELECT id, lead_type, name, email, phone, organization, message, source, consent, status, created_at, archived_at, archived_by
      FROM marketing_leads
      WHERE ($1::boolean = TRUE OR archived_at IS NULL)
      ORDER BY created_at DESC
      LIMIT 150
    `, [includeArchived]);
    const counts = await dbQuery(`
      SELECT
        COUNT(*) FILTER (WHERE archived_at IS NULL) AS active_count,
        COUNT(*) FILTER (WHERE archived_at IS NULL AND status = 'new') AS new_count,
        COUNT(*) FILTER (WHERE archived_at IS NOT NULL) AS archived_count
      FROM marketing_leads
    `);
    return res.json({ ok: true, leads: result.rows, counts: counts.rows[0] || {} });
  } catch (error) {
    return sendServerError(res, "Database read failed.", error);
  }
});

app.post("/api/admin/leads/status", requireAdmin, async (req, res) => {
  const id = normalizeMessageId(req.body?.id);
  const status = cleanText(req.body?.status || "reviewed", 80);
  if (!id) return res.status(400).json({ ok: false, error: "Valid lead id is required." });
  try {
    await ensureMarketingTables();
    const result = await dbQuery(`UPDATE marketing_leads SET status = $1 WHERE id = $2 RETURNING id, status`, [status, id]);
    if (!result.rows.length) return res.status(404).json({ ok: false, error: "Lead not found." });
    await writeAdminLog(req.admin.email, "lead_status_update", { id, status });
    return res.json({ ok: true, lead: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Database write failed.", error);
  }
});

app.get("/api/admin/game/events", requireAdmin, async (req, res) => {
  try {
    await ensureGameEventsTable();
    const result = await dbQuery(`
      SELECT id, event_type, room, build, session_id, source, payload, created_at
      FROM game_events
      ORDER BY created_at DESC
      LIMIT 200
    `);
    const counts = await dbQuery(`
      SELECT event_type, COUNT(*)::int AS count
      FROM game_events
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 20
    `);
    return res.json({ ok: true, events: result.rows, counts: counts.rows });
  } catch (error) {
    return sendServerError(res, "Database read failed.", error);
  }
});

app.get("/api/admin/store/items", requireAdmin, async (req, res) => {
  const includeInactive = String(req.query?.includeInactive || "") === "1";
  try {
    await ensureStoreItemsTable();
    const result = await dbQuery(`
      SELECT id, sku, title, category, description, price_cents, image_url, tags, is_active, is_sandbox_only, created_at, updated_at
      FROM store_items
      WHERE ($1::boolean = TRUE OR is_active = TRUE)
      ORDER BY category ASC, title ASC
      LIMIT 200
    `, [includeInactive]);
    return res.json({ ok: true, items: result.rows });
  } catch (error) {
    return sendServerError(res, "Database read failed.", error);
  }
});

app.post("/api/admin/store/items/seed", requireAdmin, async (req, res) => {
  try {
    await seedStarterStoreItems(req.admin.email);
    return res.json({ ok: true, seeded: STARTER_STORE_ITEMS.length });
  } catch (error) {
    return sendServerError(res, "Database write failed.", error);
  }
});

app.post("/api/admin/store/items/upsert", requireAdmin, async (req, res) => {
  const sku = cleanText(req.body?.sku, 120).toUpperCase();
  const title = cleanText(req.body?.title, 220);
  const category = cleanText(req.body?.category || "svr", 120);
  const description = cleanText(req.body?.description, 2000);
  const imageUrl = cleanText(req.body?.imageUrl || req.body?.image_url, 500);
  const priceCents = Number.isFinite(Number(req.body?.priceCents ?? req.body?.price_cents)) ? Number(req.body?.priceCents ?? req.body?.price_cents) : 0;
  const tags = Array.isArray(req.body?.tags) ? req.body.tags.map((tag) => cleanText(tag, 60)).filter(Boolean).slice(0, 12) : [];
  const isActive = req.body?.isActive !== false;
  if (!sku || !title) return res.status(400).json({ ok: false, error: "sku and title are required." });
  try {
    await ensureStoreItemsTable();
    const result = await dbQuery(`
      INSERT INTO store_items (sku, title, category, description, price_cents, image_url, tags, is_active, is_sandbox_only, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, TRUE, NOW())
      ON CONFLICT (sku) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        price_cents = EXCLUDED.price_cents,
        image_url = EXCLUDED.image_url,
        tags = EXCLUDED.tags,
        is_active = EXCLUDED.is_active,
        is_sandbox_only = TRUE,
        updated_at = NOW()
      RETURNING id, sku, title, category, price_cents, is_active
    `, [sku, title, category, description || null, priceCents, imageUrl || null, JSON.stringify(tags), isActive]);
    await writeAdminLog(req.admin.email, "store_item_upsert", { sku });
    return res.json({ ok: true, item: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Database write failed.", error);
  }
});

app.post("/api/admin/store/items/active", requireAdmin, async (req, res) => {
  const sku = cleanText(req.body?.sku, 120).toUpperCase();
  const isActive = Boolean(req.body?.isActive);
  if (!sku) return res.status(400).json({ ok: false, error: "sku is required." });
  try {
    await ensureStoreItemsTable();
    const result = await dbQuery(`UPDATE store_items SET is_active = $1, updated_at = NOW() WHERE sku = $2 RETURNING sku, is_active`, [isActive, sku]);
    if (!result.rows.length) return res.status(404).json({ ok: false, error: "Store item not found." });
    await writeAdminLog(req.admin.email, "store_item_active_update", { sku, isActive });
    return res.json({ ok: true, item: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "Database write failed.", error);
  }
});

app.get("/api/admin/database/schema", requireAdmin, async (req, res) => {
  try {
    databaseSchemaState = await auditDatabaseSchema();
    return res.status(databaseSchemaState.pass ? 200 : 503).json({ ok: databaseSchemaState.pass, schema: databaseSchemaState });
  } catch (error) {
    return sendServerError(res, "Database schema audit failed.", error);
  }
});

app.post("/api/admin/uploads", requireAdmin, express.raw({ type: "application/octet-stream", limit: "8mb" }), async (req, res) => {
  const originalName = cleanFileName(req.get("X-SVR-Filename"));
  const contentType = cleanContentType(req.get("X-SVR-Content-Type"));
  const notes = cleanText(req.get("X-SVR-Notes"), 1000);
  const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  if (!payload.length) return res.status(400).json({ ok: false, error: "File payload is required." });
  const sha256 = crypto.createHash("sha256").update(payload).digest("hex");
  const storedName = `${Date.now()}-${sha256.slice(0, 12)}-${originalName}`;
  try {
    const result = await dbQuery(`
      INSERT INTO admin_uploads
        (original_name, stored_name, content_type, byte_size, sha256, payload, notes, uploaded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id, original_name, stored_name, content_type, byte_size, sha256, notes, uploaded_by, created_at
    `, [originalName, storedName, contentType, payload.length, sha256, payload, notes || null, req.admin.email]);
    await writeAdminLog(req.admin.email, "admin_file_upload", { id: result.rows[0].id, originalName, byteSize: payload.length, sha256 });
    return res.status(201).json({ ok: true, file: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "File upload failed.", error);
  }
});

app.get("/api/admin/uploads", requireAdmin, async (req, res) => {
  try {
    const result = await dbQuery(`
      SELECT id, original_name, stored_name, content_type, byte_size, sha256, notes, uploaded_by, created_at
      FROM admin_uploads
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 100
    `);
    return res.json({ ok: true, files: result.rows });
  } catch (error) {
    return sendServerError(res, "File list failed.", error);
  }
});

app.get("/api/admin/uploads/:id/download", requireAdmin, async (req, res) => {
  const id = normalizeMessageId(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: "Valid file id is required." });
  try {
    const result = await dbQuery(`
      SELECT original_name, content_type, byte_size, sha256, payload
      FROM admin_uploads
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1
    `, [id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ ok: false, error: "File not found." });
    const name = cleanFileName(row.original_name);
    res.setHeader("Content-Type", cleanContentType(row.content_type));
    res.setHeader("Content-Length", String(row.byte_size));
    res.setHeader("X-SVR-SHA256", row.sha256);
    res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/"/g, "")}"`);
    return res.send(row.payload);
  } catch (error) {
    return sendServerError(res, "File download failed.", error);
  }
});

app.post("/api/admin/uploads/:id/delete", requireAdmin, async (req, res) => {
  const id = normalizeMessageId(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: "Valid file id is required." });
  try {
    const result = await dbQuery(`
      UPDATE admin_uploads
      SET deleted_at = NOW(), deleted_by = $1
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id, original_name, byte_size, sha256, deleted_at
    `, [req.admin.email, id]);
    if (!result.rows.length) return res.status(404).json({ ok: false, error: "File not found." });
    await writeAdminLog(req.admin.email, "admin_file_delete", { id, originalName: result.rows[0].original_name, sha256: result.rows[0].sha256 });
    return res.json({ ok: true, file: result.rows[0] });
  } catch (error) {
    return sendServerError(res, "File delete failed.", error);
  }
});

app.get("/api/admin/logs", requireAdmin, async (req, res) => {
  try {
    await ensureAdminLogsTable();
    const result = await dbQuery(`SELECT id, admin_email, action, details, created_at FROM admin_logs ORDER BY created_at DESC LIMIT 50`);
    return res.json({ ok: true, logs: result.rows });
  } catch (error) {
    return sendServerError(res, "Database read failed.", error);
  }
});

app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "API route not found." }));

async function startServer() {
  if (DATABASE_URL) {
    try {
      databaseSchemaState = await ensureSiteAdminSchema();
      if (!databaseSchemaState.pass) {
        throw new Error(`Database schema contract failed: ${JSON.stringify(databaseSchemaState)}`);
      }
    } catch (error) {
      console.error("SVR database bootstrap failed.", error);
      process.exitCode = 1;
      return;
    }
  }
  app.listen(PORT, () => console.log(`SVR Site/Admin PostgreSQL API listening on port ${PORT}`));
}

startServer();


