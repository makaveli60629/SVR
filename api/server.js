require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://svrpoker.com";
const JWT_SECRET = String(process.env.ADMIN_JWT_SECRET || "").trim();
const ADMIN_AUTH_READY = JWT_SECRET.length >= 32;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || "King";
const DATABASE_URL = process.env.DATABASE_URL;
// SVR_RESOURCE_UPLOADER_V1
const S3_REGION = process.env.AWS_REGION || process.env.S3_REGION || "us-east-1";
const S3_BUCKET = process.env.SVR_RESOURCE_BUCKET || process.env.S3_BUCKET || "";
const S3_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
const S3_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
const S3_SESSION_TOKEN = process.env.AWS_SESSION_TOKEN || "";
const RESOURCE_MAX_BYTES = Math.max(1, Number(process.env.SVR_RESOURCE_MAX_BYTES || 262144000));
// SVR_RESOURCE_DIRECT_FALLBACK_V3
const DIRECT_RESOURCE_MAX_BYTES = Math.max(1, Number(process.env.SVR_DIRECT_RESOURCE_MAX_BYTES || 26214400));

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 })
  : null;

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: "128kb" }));
app.use("/api/admin", (req,res,next)=>{ res.setHeader("Cache-Control","no-store"); res.setHeader("Pragma","no-cache"); next(); });

const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOGIN_MAX_ATTEMPTS = 8;
const adminLoginAttempts = new Map();
function adminLoginRateLimit(req,res,next){
  const now=Date.now();
  const key=String(req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const recent=(adminLoginAttempts.get(key)||[]).filter((ts)=>now-ts<ADMIN_LOGIN_WINDOW_MS);
  if(recent.length>=ADMIN_LOGIN_MAX_ATTEMPTS){
    res.setHeader("Retry-After",String(Math.ceil(ADMIN_LOGIN_WINDOW_MS/1000)));
    return res.status(429).json({ok:false,error:"Too many login attempts. Try again later."});
  }
  recent.push(now); adminLoginAttempts.set(key,recent);
  return next();
}
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
  if(!ADMIN_AUTH_READY) throw new Error("ADMIN_JWT_SECRET must be configured with at least 32 characters.");
  return jwt.sign({ email, role: "admin" }, JWT_SECRET, { expiresIn: "8h", issuer:"svr-api", audience:"svr-owner" });
}

function requireAdmin(req, res, next) {
  if(!ADMIN_AUTH_READY) return res.status(503).json({ok:false,error:"Admin authentication is not configured."});
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ ok: false, error: "Missing admin token." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {issuer:"svr-api", audience:"svr-owner"});
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

const RESOURCE_EXTENSIONS = new Set(["fbx","obj","glb","gltf","mtl","blend","zip","png","jpg","jpeg","webp","ktx2"]);
// SVR_RESOURCE_MANAGER_V2
const RESOURCE_TARGET_TYPES = new Set(["dealer","avatar-male","avatar-female","poker-table","lobby-environment","prop","animation","texture"]);
const RESOURCE_CONTENT_TYPES = {
  fbx:"application/octet-stream", obj:"text/plain", glb:"model/gltf-binary", gltf:"model/gltf+json",
  mtl:"text/plain", blend:"application/octet-stream", zip:"application/zip", png:"image/png",
  jpg:"image/jpeg", jpeg:"image/jpeg", webp:"image/webp", ktx2:"image/ktx2"
};
function resourceExtension(name){
  const match=String(name||"").toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}
function safeResourceName(name){
  const cleaned=String(name||"resource").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^[-.]+|[-.]+$/g,"");
  return cleaned.slice(0,180) || "resource";
}
function awsEncode(value){ return encodeURIComponent(String(value)).replace(/[!'()*]/g,(c)=>"%"+c.charCodeAt(0).toString(16).toUpperCase()); }
function hmac(key,data,encoding){ return crypto.createHmac("sha256",key).update(data,"utf8").digest(encoding); }
function sha256Hex(data){ return crypto.createHash("sha256").update(data,"utf8").digest("hex"); }
function s3ConfigReady(){ return Boolean(S3_BUCKET && S3_REGION && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY); }
function createS3PresignedUrl(objectKey, method="GET", expiresSeconds=900){
  if(!s3ConfigReady()) throw new Error("S3 resource storage is not configured.");
  const verb=String(method||"GET").toUpperCase();
  const now=new Date();
  const amzDate=now.toISOString().replace(/[:-]|\.\d{3}/g,"");
  const dateStamp=amzDate.slice(0,8);
  const host=`${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;
  const canonicalUri="/"+objectKey.split("/").map(awsEncode).join("/");
  const scope=`${dateStamp}/${S3_REGION}/s3/aws4_request`;
  const query={
    "X-Amz-Algorithm":"AWS4-HMAC-SHA256",
    "X-Amz-Credential":`${S3_ACCESS_KEY_ID}/${scope}`,
    "X-Amz-Date":amzDate,
    "X-Amz-Expires":String(expiresSeconds),
    "X-Amz-SignedHeaders":"host"
  };
  if(S3_SESSION_TOKEN) query["X-Amz-Security-Token"]=S3_SESSION_TOKEN;
  const canonicalQuery=Object.keys(query).sort().map((k)=>`${awsEncode(k)}=${awsEncode(query[k])}`).join("&");
  const canonicalHeaders=`host:${host}\n`;
  const canonicalRequest=[verb,canonicalUri,canonicalQuery,canonicalHeaders,"host","UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign=["AWS4-HMAC-SHA256",amzDate,scope,sha256Hex(canonicalRequest)].join("\n");
  const kDate=hmac(Buffer.from("AWS4"+S3_SECRET_ACCESS_KEY,"utf8"),dateStamp);
  const kRegion=hmac(kDate,S3_REGION);
  const kService=hmac(kRegion,"s3");
  const kSigning=hmac(kService,"aws4_request");
  const signature=hmac(kSigning,stringToSign,"hex");
  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
function createS3PresignedPut(objectKey, expiresSeconds=900){ return createS3PresignedUrl(objectKey,"PUT",expiresSeconds); }
function createS3PresignedGet(objectKey, expiresSeconds=900){ return createS3PresignedUrl(objectKey,"GET",expiresSeconds); }
/* legacy body retained below only as unreachable documentation */
function __legacyCreateS3PresignedPut(objectKey, expiresSeconds=900){
  if(!s3ConfigReady()) throw new Error("S3 resource storage is not configured.");
  const now=new Date();
  const amzDate=now.toISOString().replace(/[:-]|\.\d{3}/g,"");
  const dateStamp=amzDate.slice(0,8);
  const host=`${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;
  const canonicalUri="/"+objectKey.split("/").map(awsEncode).join("/");
  const scope=`${dateStamp}/${S3_REGION}/s3/aws4_request`;
  const query={
    "X-Amz-Algorithm":"AWS4-HMAC-SHA256",
    "X-Amz-Credential":`${S3_ACCESS_KEY_ID}/${scope}`,
    "X-Amz-Date":amzDate,
    "X-Amz-Expires":String(expiresSeconds),
    "X-Amz-SignedHeaders":"host"
  };
  if(S3_SESSION_TOKEN) query["X-Amz-Security-Token"]=S3_SESSION_TOKEN;
  const canonicalQuery=Object.keys(query).sort().map((k)=>`${awsEncode(k)}=${awsEncode(query[k])}`).join("&");
  const canonicalHeaders=`host:${host}\n`;
  const canonicalRequest=["PUT",canonicalUri,canonicalQuery,canonicalHeaders,"host","UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign=["AWS4-HMAC-SHA256",amzDate,scope,sha256Hex(canonicalRequest)].join("\n");
  const kDate=hmac(Buffer.from("AWS4"+S3_SECRET_ACCESS_KEY,"utf8"),dateStamp);
  const kRegion=hmac(kDate,S3_REGION);
  const kService=hmac(kRegion,"s3");
  const kSigning=hmac(kService,"aws4_request");
  const signature=hmac(kSigning,stringToSign,"hex");
  return `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
async function ensureResourceAssetsTable(){
  await ensurePgCrypto();
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS resource_assets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      original_name TEXT NOT NULL,
      object_key TEXT UNIQUE NOT NULL,
      bucket_name TEXT NOT NULL,
      extension TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size_bytes BIGINT NOT NULL,
      category TEXT NOT NULL DEFAULT '3d-model',
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      uploaded_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
    ALTER TABLE resource_assets ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE resource_assets ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE resource_assets ADD COLUMN IF NOT EXISTS archived_by TEXT;
    CREATE INDEX IF NOT EXISTS idx_resource_assets_created_at ON resource_assets (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_resource_assets_status ON resource_assets (status);
    ALTER TABLE resource_assets ADD COLUMN IF NOT EXISTS storage_backend TEXT NOT NULL DEFAULT 's3';
    CREATE INDEX IF NOT EXISTS idx_resource_assets_category ON resource_assets (category);
  `);
}
async function ensureResourceBlobsTable(){
  await ensureResourceAssetsTable();
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS resource_blobs (
      resource_id UUID PRIMARY KEY REFERENCES resource_assets(id) ON DELETE CASCADE,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}
async function ensureResourceAssignmentsTable(){
  await ensureResourceAssetsTable();
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS resource_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resource_id UUID NOT NULL REFERENCES resource_assets(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL DEFAULT 'primary',
      assigned_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(target_type,target_key)
    );
    CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource ON resource_assignments(resource_id);
    CREATE INDEX IF NOT EXISTS idx_resource_assignments_target ON resource_assignments(target_type,target_key);
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

app.post("/api/admin/login", adminLoginRateLimit, async (req, res) => {
  const email = cleanEmail(req.body?.email);
  const password = String(req.body?.password || "");
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_AUTH_READY) return res.status(503).json({ ok: false, error: "Admin authentication is not configured." });
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
    return res.status(500).json({ ok: false, error: "Analytics write failed.", detail: error.message });
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
    return res.status(500).json({ ok: false, error: "Analytics summary failed.", detail: error.message });
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
    return res.status(500).json({ ok: false, error: "Analytics events failed.", detail: error.message });
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



app.post("/api/admin/resources/direct", requireAdmin, express.raw({type:"application/octet-stream",limit:DIRECT_RESOURCE_MAX_BYTES}), async (req,res)=>{
  const originalName=cleanText(req.query?.fileName,220);
  const extension=resourceExtension(originalName);
  const category=cleanText(req.query?.category||"3d-model",80);
  const notes=cleanText(req.query?.notes||"",500);
  const body=Buffer.isBuffer(req.body)?req.body:Buffer.alloc(0);
  if(!originalName || !RESOURCE_EXTENSIONS.has(extension)) return res.status(400).json({ok:false,error:"Unsupported resource file type."});
  if(!body.length) return res.status(400).json({ok:false,error:"Upload body is empty."});
  if(body.length>DIRECT_RESOURCE_MAX_BYTES) return res.status(413).json({ok:false,error:`Direct fallback uploads are limited to ${DIRECT_RESOURCE_MAX_BYTES} bytes.`});
  const safeName=safeResourceName(originalName), contentType=RESOURCE_CONTENT_TYPES[extension]||"application/octet-stream";
  const objectKey=`postgres/resources/${new Date().toISOString().slice(0,7)}/${crypto.randomUUID()}-${safeName}`;
  if(!pool) return res.status(503).json({ok:false,error:"PostgreSQL fallback storage is not configured."});
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    await ensureResourceBlobsTable();
    const asset=await client.query(`
      INSERT INTO resource_assets(original_name,object_key,bucket_name,extension,content_type,size_bytes,category,notes,status,uploaded_by,completed_at,storage_backend)
      VALUES($1,$2,'postgres',$3,$4,$5,$6,$7,'ready',$8,NOW(),'postgres')
      RETURNING id,original_name,object_key,extension,content_type,size_bytes,category,notes,status,storage_backend,created_at,completed_at
    `,[originalName,objectKey,extension,contentType,body.length,category,notes||null,req.admin.email||null]);
    await client.query("INSERT INTO resource_blobs(resource_id,data) VALUES($1,$2)",[asset.rows[0].id,body]);
    await client.query("COMMIT");
    await writeAdminLog(req.admin.email,"resource_direct_upload",{resourceId:asset.rows[0].id,originalName,sizeBytes:body.length,storage:"postgres"});
    return res.status(201).json({ok:true,storage:"postgres",resource:asset.rows[0],directMaxBytes:DIRECT_RESOURCE_MAX_BYTES});
  }catch(error){
    await client.query("ROLLBACK").catch(()=>{});
    return res.status(500).json({ok:false,error:"Direct resource upload failed.",detail:error.message});
  }finally{client.release();}
});

app.get("/api/game/resources/:id/file", async (req,res)=>{
  const id=normalizeMessageId(req.params?.id);
  const token=String(req.query?.token||"");
  if(!id||!token) return res.status(401).json({ok:false,error:"Signed resource token required."});
  try{
    const decoded=jwt.verify(token,JWT_SECRET,{audience:"svr-resource"});
    if(decoded.role!=="resource"||decoded.resourceId!==id) return res.status(403).json({ok:false,error:"Invalid resource token."});
    await ensureResourceBlobsTable();
    const result=await dbQuery(`
      SELECT r.original_name,r.content_type,r.size_bytes,b.data
      FROM resource_assets r JOIN resource_blobs b ON b.resource_id=r.id
      WHERE r.id=$1 AND r.storage_backend='postgres' AND r.status='ready' AND r.archived_at IS NULL
      LIMIT 1
    `,[id]);
    if(!result.rows.length) return res.status(404).json({ok:false,error:"Resource not found."});
    const row=result.rows[0];
    res.setHeader("Content-Type",row.content_type||"application/octet-stream");
    res.setHeader("Content-Length",String(row.size_bytes||row.data.length));
    res.setHeader("Content-Disposition",`inline; filename="${safeResourceName(row.original_name)}"`);
    res.setHeader("Cache-Control","private,max-age=300");
    return res.send(row.data);
  }catch(error){ return res.status(401).json({ok:false,error:"Resource token expired or invalid."}); }
});

app.post("/api/admin/resources/presign", requireAdmin, async (req, res) => {
  const originalName=cleanText(req.body?.fileName,220);
  const extension=resourceExtension(originalName);
  const sizeBytes=Number(req.body?.sizeBytes||0);
  const category=cleanText(req.body?.category||"3d-model",80);
  const notes=cleanText(req.body?.notes||"",500);
  if(!s3ConfigReady()) return res.status(503).json({ok:false,error:"AWS S3 resource storage is not configured on the API service."});
  if(!originalName || !RESOURCE_EXTENSIONS.has(extension)) return res.status(400).json({ok:false,error:"Unsupported resource file type."});
  if(!Number.isFinite(sizeBytes) || sizeBytes<1 || sizeBytes>RESOURCE_MAX_BYTES) return res.status(400).json({ok:false,error:`Resource must be between 1 byte and ${RESOURCE_MAX_BYTES} bytes.`});
  const safeName=safeResourceName(originalName);
  const now=new Date();
  const objectKey=`resources/${now.getUTCFullYear()}/${String(now.getUTCMonth()+1).padStart(2,"0")}/${crypto.randomUUID()}-${safeName}`;
  const contentType=RESOURCE_CONTENT_TYPES[extension] || "application/octet-stream";
  try{
    await ensureResourceAssetsTable();
    const result=await dbQuery(`
      INSERT INTO resource_assets (original_name,object_key,bucket_name,extension,content_type,size_bytes,category,notes,status,uploaded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9)
      RETURNING id
    `,[originalName,objectKey,S3_BUCKET,extension,contentType,sizeBytes,category,notes||null,req.admin.email||null]);
    const uploadUrl=createS3PresignedPut(objectKey,900);
    await writeAdminLog(req.admin.email,"resource_upload_presigned",{resourceId:result.rows[0].id,objectKey,originalName,sizeBytes,category});
    return res.json({ok:true,resourceId:result.rows[0].id,objectKey,contentType,maxBytes:RESOURCE_MAX_BYTES,expiresIn:900,uploadUrl});
  }catch(error){
    return res.status(500).json({ok:false,error:"Resource upload preparation failed.",detail:error.message});
  }
});

app.post("/api/admin/resources/complete", requireAdmin, async (req, res) => {
  const id=normalizeMessageId(req.body?.resourceId);
  if(!id) return res.status(400).json({ok:false,error:"Valid resourceId is required."});
  try{
    await ensureResourceAssetsTable();
    const result=await dbQuery(`
      UPDATE resource_assets
      SET status='ready', completed_at=NOW()
      WHERE id=$1 AND status='pending'
      RETURNING id,original_name,object_key,bucket_name,extension,content_type,size_bytes,category,notes,status,created_at,completed_at
    `,[id]);
    if(!result.rows.length) return res.status(404).json({ok:false,error:"Pending resource record not found."});
    await writeAdminLog(req.admin.email,"resource_upload_complete",{resourceId:id,objectKey:result.rows[0].object_key});
    return res.json({ok:true,resource:result.rows[0]});
  }catch(error){
    return res.status(500).json({ok:false,error:"Resource completion failed.",detail:error.message});
  }
});

app.get("/api/admin/resources", requireAdmin, async (req, res) => {
  try{
    await ensureResourceAssetsTable();
    const result=await dbQuery(`
      SELECT id,original_name,display_name,object_key,bucket_name,extension,content_type,size_bytes,category,notes,status,uploaded_by,created_at,completed_at,archived_at,archived_by,storage_backend
      FROM resource_assets
      ORDER BY created_at DESC
      LIMIT 200
    `);
    return res.json({ok:true,storage:"aws-s3",bucketConfigured:Boolean(S3_BUCKET),resources:result.rows});
  }catch(error){
    return res.status(500).json({ok:false,error:"Resource library read failed.",detail:error.message});
  }
});

app.post("/api/admin/resources/update", requireAdmin, async (req,res)=>{
  const id=normalizeMessageId(req.body?.resourceId);
  const displayName=cleanText(req.body?.displayName||"",220);
  const category=cleanText(req.body?.category||"other",80);
  const notes=cleanText(req.body?.notes||"",500);
  if(!id) return res.status(400).json({ok:false,error:"Valid resourceId is required."});
  try{
    await ensureResourceAssetsTable();
    const result=await dbQuery(`
      UPDATE resource_assets SET display_name=NULLIF($1,''),category=$2,notes=NULLIF($3,'')
      WHERE id=$4 AND archived_at IS NULL
      RETURNING id,original_name,display_name,category,notes,status
    `,[displayName,category,notes,id]);
    if(!result.rows.length) return res.status(404).json({ok:false,error:"Active resource not found."});
    await writeAdminLog(req.admin.email,"resource_update",{resourceId:id,displayName,category});
    return res.json({ok:true,resource:result.rows[0]});
  }catch(error){ return res.status(500).json({ok:false,error:"Resource update failed.",detail:error.message}); }
});

app.post("/api/admin/resources/archive", requireAdmin, async (req,res)=>{
  const id=normalizeMessageId(req.body?.resourceId);
  if(!id) return res.status(400).json({ok:false,error:"Valid resourceId is required."});
  try{
    await ensureResourceAssignmentsTable();
    await dbQuery("DELETE FROM resource_assignments WHERE resource_id=$1",[id]);
    const result=await dbQuery(`
      UPDATE resource_assets SET archived_at=NOW(),archived_by=$1,status='archived'
      WHERE id=$2 AND archived_at IS NULL
      RETURNING id,original_name,display_name,status,archived_at
    `,[req.admin.email||null,id]);
    if(!result.rows.length) return res.status(404).json({ok:false,error:"Active resource not found."});
    await writeAdminLog(req.admin.email,"resource_archive",{resourceId:id});
    return res.json({ok:true,resource:result.rows[0]});
  }catch(error){ return res.status(500).json({ok:false,error:"Resource archive failed.",detail:error.message}); }
});

app.post("/api/admin/resources/assign", requireAdmin, async (req,res)=>{
  const id=normalizeMessageId(req.body?.resourceId);
  const targetType=cleanText(req.body?.targetType,80);
  const targetKey=cleanText(req.body?.targetKey||"primary",120).toLowerCase();
  if(!id) return res.status(400).json({ok:false,error:"Valid resourceId is required."});
  if(!RESOURCE_TARGET_TYPES.has(targetType)) return res.status(400).json({ok:false,error:"Unsupported resource target type."});
  if(!/^[a-z0-9._-]{1,120}$/.test(targetKey)) return res.status(400).json({ok:false,error:"Target key may use letters, numbers, dot, underscore and dash."});
  try{
    await ensureResourceAssignmentsTable();
    const resource=await dbQuery("SELECT id FROM resource_assets WHERE id=$1 AND status='ready' AND archived_at IS NULL LIMIT 1",[id]);
    if(!resource.rows.length) return res.status(409).json({ok:false,error:"Only ready, active resources can be assigned."});
    const result=await dbQuery(`
      INSERT INTO resource_assignments(resource_id,target_type,target_key,assigned_by)
      VALUES($1,$2,$3,$4)
      ON CONFLICT(target_type,target_key) DO UPDATE SET resource_id=EXCLUDED.resource_id,assigned_by=EXCLUDED.assigned_by,updated_at=NOW()
      RETURNING id,resource_id,target_type,target_key,assigned_by,created_at,updated_at
    `,[id,targetType,targetKey,req.admin.email||null]);
    await writeAdminLog(req.admin.email,"resource_assign",{resourceId:id,targetType,targetKey});
    return res.json({ok:true,assignment:result.rows[0]});
  }catch(error){ return res.status(500).json({ok:false,error:"Resource assignment failed.",detail:error.message}); }
});

app.get("/api/admin/resources/assignments", requireAdmin, async (req,res)=>{
  try{
    await ensureResourceAssignmentsTable();
    const result=await dbQuery(`
      SELECT a.id,a.target_type,a.target_key,a.assigned_by,a.created_at,a.updated_at,
             r.id AS resource_id,r.original_name,r.display_name,r.object_key,r.extension,r.category,r.status
      FROM resource_assignments a
      JOIN resource_assets r ON r.id=a.resource_id
      WHERE r.archived_at IS NULL
      ORDER BY a.target_type,a.target_key
    `);
    return res.json({ok:true,assignments:result.rows});
  }catch(error){ return res.status(500).json({ok:false,error:"Resource assignments read failed.",detail:error.message}); }
});

app.get("/api/game/resources/manifest", async (req,res)=>{
  if(!ADMIN_AUTH_READY) return res.status(503).json({ok:false,error:"Resource signing is not configured."});
  try{
    await ensureResourceAssignmentsTable();
    const result=await dbQuery(`
      SELECT a.target_type,a.target_key,r.id AS resource_id,r.original_name,r.display_name,r.object_key,r.extension,r.content_type,r.size_bytes,r.category,r.storage_backend
      FROM resource_assignments a
      JOIN resource_assets r ON r.id=a.resource_id
      WHERE r.status='ready' AND r.archived_at IS NULL
      ORDER BY a.target_type,a.target_key
    `);
    const resources=result.rows.map((r)=>{
      if(r.storage_backend==='postgres'){
        const token=jwt.sign({role:'resource',resourceId:r.resource_id},JWT_SECRET,{expiresIn:'15m',audience:'svr-resource'});
        return {...r,url:`/api/game/resources/${r.resource_id}/file?token=${encodeURIComponent(token)}`,expiresIn:900};
      }
      return s3ConfigReady()
        ? {...r,url:createS3PresignedGet(r.object_key,900),expiresIn:900}
        : {...r,url:null,expiresIn:0,unavailable:"s3-not-configured"};
    });
    return res.json({ok:true,build:"SVR_RESOURCE_MANAGER_V3",storage:"hybrid-private",resources});
  }catch(error){ return res.status(500).json({ok:false,error:"Game resource manifest failed.",detail:error.message}); }
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


