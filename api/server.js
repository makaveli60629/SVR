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

async function ensurePgCrypto() {
  await dbQuery(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
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
  const email = cleanEmail(req.body?.email);
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
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
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
    return res.status(500).json({ ok: false, error: "Database read failed.", detail: error.message });
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
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
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
    return res.status(500).json({ ok: false, error: "Database read failed.", detail: error.message });
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
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
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
    return res.status(500).json({ ok: false, error: "Database read failed.", detail: error.message });
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
    return res.status(500).json({ ok: false, error: "Database read failed.", detail: error.message });
  }
});

app.post("/api/admin/store/items/seed", requireAdmin, async (req, res) => {
  try {
    await seedStarterStoreItems(req.admin.email);
    return res.json({ ok: true, seeded: STARTER_STORE_ITEMS.length });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
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
    return res.status(500).json({ ok: false, error: "Database write failed.", detail: error.message });
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
