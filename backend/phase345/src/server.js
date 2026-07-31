import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import { z } from 'zod';

const BUILD = 'PHASE-345-PLAYER-LOGIN-PROFILE-DAILY-REWARD-API-LOCK';
const PORT = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.PLAYER_JWT_SECRET || '';
const SQL_CONNECTION = process.env.AZURE_SQL_CONNECTION_STRING || '';
const COOKIE_NAME = process.env.PLAYER_COOKIE_NAME || 'svr_player_session';
const COOKIE_DOMAIN = process.env.PLAYER_COOKIE_DOMAIN || undefined;
const REWARD_CHIPS = Number(process.env.DAILY_REWARD_CHIPS || 5000);
const REQUIRED_ACTIVE_SECONDS = Number(process.env.DAILY_REWARD_ACTIVE_SECONDS || 300);
const REQUIRED_HEARTBEATS = Number(process.env.DAILY_REWARD_HEARTBEATS || 3);
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || 'https://svrpoker.com')
  .split(',').map((value) => value.trim()).filter(Boolean);

if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('PLAYER_JWT_SECRET must be at least 32 characters');
if (!SQL_CONNECTION) throw new Error('AZURE_SQL_CONNECTION_STRING is required');

const app = express();
let poolPromise = null;
function pool() {
  if (!poolPromise) poolPromise = sql.connect(SQL_CONNECTION);
  return poolPromise;
}
function originAllowed(origin) {
  return !origin || ALLOWED_ORIGINS.includes(origin);
}
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) {
    callback(originAllowed(origin) ? null : new Error('Origin not allowed'), originAllowed(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-SVR-Client']
}));
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    if (!originAllowed(req.get('origin'))) return res.status(403).json({ error: 'ORIGIN_NOT_ALLOWED' });
    if (!req.get('X-SVR-Client')) return res.status(400).json({ error: 'CLIENT_HEADER_REQUIRED' });
  }
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const actionLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });
app.use('/api', actionLimiter);
app.use('/api/auth', authLimiter);

const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  email: z.string().trim().email().max(255),
  password: z.string().min(10).max(128)
});
const loginSchema = z.object({ email: z.string().trim().email().max(255), password: z.string().min(1).max(128) });
const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(40).optional(),
  avatarUrl: z.union([z.string().url().max(1000), z.literal(''), z.null()]).optional(),
  equippedOutfit: z.record(z.string(), z.unknown()).optional()
});
const sessionSchema = z.object({
  platform: z.enum(['android', 'quest', 'desktop', 'web']).default('web'),
  metadata: z.record(z.string(), z.unknown()).optional()
});
const heartbeatSchema = z.object({
  sessionId: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function tokenFor(player) {
  return jwt.sign({ sub: player.PlayerId, role: player.Role || 'player', ver: 1 }, JWT_SECRET, {
    issuer: 'svrpoker.com', audience: 'svr-player-api', expiresIn: '7d'
  });
}
function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: COOKIE_DOMAIN,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}
function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', domain: COOKIE_DOMAIN, path: '/' });
}
function parseJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}
function mapProfile(row) {
  return {
    playerId: row.PlayerId,
    displayName: row.DisplayName,
    email: row.Email,
    role: row.Role,
    playMoney: Number(row.PlayMoney || 0),
    dailyStreak: Number(row.DailyStreak || 0),
    lastRewardClaim: row.LastRewardClaimAt || null,
    avatarUrl: row.AvatarUrl || null,
    equippedOutfit: parseJson(row.EquippedOutfitJson, {}),
    inventory: parseJson(row.InventoryJson, []),
    createdAt: row.CreatedAt,
    lastLoginAt: row.LastLoginAt,
    demoMode: false
  };
}
async function fetchProfile(playerId, executor = null) {
  const source = executor || await pool();
  const result = await source.request()
    .input('playerId', sql.UniqueIdentifier, playerId)
    .query(`SELECT p.PlayerId,p.DisplayName,p.Email,p.Role,p.PlayMoney,p.DailyStreak,p.LastRewardClaimAt,p.AvatarUrl,p.EquippedOutfitJson,p.CreatedAt,p.LastLoginAt,
      (SELECT ItemId,ItemType,AssetUrl,Quantity,Equipped FROM dbo.PlayerInventory WHERE PlayerId=p.PlayerId FOR JSON PATH) AS InventoryJson
      FROM dbo.Players p WHERE p.PlayerId=@playerId AND p.IsActive=1`);
  return result.recordset[0] ? mapProfile(result.recordset[0]) : null;
}
async function auth(req, res, next) {
  try {
    const bearer = String(req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const token = req.cookies[COOKIE_NAME] || bearer;
    if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
    const payload = jwt.verify(token, JWT_SECRET, { issuer: 'svrpoker.com', audience: 'svr-player-api' });
    req.playerId = payload.sub;
    req.playerRole = payload.role;
    next();
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ error: 'SESSION_INVALID' });
  }
}
function validate(schema, body, res) {
  const result = schema.safeParse(body || {});
  if (!result.success) {
    res.status(400).json({ error: 'VALIDATION_FAILED', issues: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) });
    return null;
  }
  return result.data;
}
function sessionPayload(row) {
  return {
    sessionId: row.SessionId,
    platform: row.Platform,
    startedAt: row.StartedAt,
    lastHeartbeatAt: row.LastHeartbeatAt,
    activeSeconds: Number(row.ActiveSeconds || 0),
    heartbeatCount: Number(row.HeartbeatCount || 0),
    endedAt: row.EndedAt || null
  };
}

app.get('/api/health', async (_req, res, next) => {
  try {
    const db = await pool();
    await db.request().query('SELECT 1 AS ok');
    res.json({ status: 'ok', build: BUILD, database: 'connected', time: new Date().toISOString() });
  } catch (error) { next(error); }
});

app.post('/api/auth/register', async (req, res, next) => {
  const input = validate(registerSchema, req.body, res); if (!input) return;
  const transaction = new sql.Transaction(await pool());
  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const email = normalizeEmail(input.email);
    const exists = await transaction.request().input('email', sql.NVarChar(255), email)
      .query('SELECT PlayerId FROM dbo.Players WITH (UPDLOCK,HOLDLOCK) WHERE Email=@email');
    if (exists.recordset.length) {
      await transaction.rollback();
      return res.status(409).json({ error: 'EMAIL_ALREADY_REGISTERED' });
    }
    const playerId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(input.password, 12);
    await transaction.request()
      .input('playerId', sql.UniqueIdentifier, playerId)
      .input('displayName', sql.NVarChar(40), input.displayName)
      .input('email', sql.NVarChar(255), email)
      .query(`INSERT dbo.Players(PlayerId,DisplayName,Email,Role,PlayMoney,DailyStreak,CreatedAt,UpdatedAt,LastLoginAt,IsActive)
        VALUES(@playerId,@displayName,@email,'player',50000,0,SYSUTCDATETIME(),SYSUTCDATETIME(),SYSUTCDATETIME(),1)`);
    await transaction.request()
      .input('playerId', sql.UniqueIdentifier, playerId)
      .input('passwordHash', sql.NVarChar(255), passwordHash)
      .query('INSERT dbo.PlayerCredentials(PlayerId,PasswordHash,PasswordUpdatedAt) VALUES(@playerId,@passwordHash,SYSUTCDATETIME())');
    await transaction.commit();
    const profile = await fetchProfile(playerId);
    setSessionCookie(res, tokenFor({ PlayerId: playerId, Role: 'player' }));
    res.status(201).json({ profile });
  } catch (error) {
    if (transaction._aborted !== true) await transaction.rollback().catch(() => undefined);
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  const input = validate(loginSchema, req.body, res); if (!input) return;
  try {
    const db = await pool();
    const result = await db.request().input('email', sql.NVarChar(255), normalizeEmail(input.email))
      .query(`SELECT p.PlayerId,p.Role,c.PasswordHash FROM dbo.Players p JOIN dbo.PlayerCredentials c ON c.PlayerId=p.PlayerId
        WHERE p.Email=@email AND p.IsActive=1`);
    const row = result.recordset[0];
    if (!row || !(await bcrypt.compare(input.password, row.PasswordHash))) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    await db.request().input('playerId', sql.UniqueIdentifier, row.PlayerId)
      .query('UPDATE dbo.Players SET LastLoginAt=SYSUTCDATETIME(),UpdatedAt=SYSUTCDATETIME() WHERE PlayerId=@playerId');
    const profile = await fetchProfile(row.PlayerId);
    setSessionCookie(res, tokenFor(row));
    res.json({ profile });
  } catch (error) { next(error); }
});
app.post('/api/auth/logout', (_req, res) => { clearSessionCookie(res); res.json({ signedOut: true }); });

app.get('/api/player/profile', auth, async (req, res, next) => {
  try {
    const profile = await fetchProfile(req.playerId);
    if (!profile) return res.status(404).json({ error: 'PLAYER_NOT_FOUND' });
    res.json({ profile });
  } catch (error) { next(error); }
});
app.put('/api/player/profile', auth, async (req, res, next) => {
  const input = validate(profileSchema, req.body, res); if (!input) return;
  try {
    const db = await pool();
    const existing = await fetchProfile(req.playerId);
    if (!existing) return res.status(404).json({ error: 'PLAYER_NOT_FOUND' });
    const displayName = input.displayName ?? existing.displayName;
    const avatarUrl = input.avatarUrl === '' ? null : (input.avatarUrl ?? existing.avatarUrl);
    const outfit = input.equippedOutfit ?? existing.equippedOutfit;
    await db.request()
      .input('playerId', sql.UniqueIdentifier, req.playerId)
      .input('displayName', sql.NVarChar(40), displayName)
      .input('avatarUrl', sql.NVarChar(1000), avatarUrl)
      .input('outfit', sql.NVarChar(sql.MAX), JSON.stringify(outfit || {}))
      .query(`UPDATE dbo.Players SET DisplayName=@displayName,AvatarUrl=@avatarUrl,EquippedOutfitJson=@outfit,UpdatedAt=SYSUTCDATETIME()
        WHERE PlayerId=@playerId AND IsActive=1`);
    res.json({ profile: await fetchProfile(req.playerId) });
  } catch (error) { next(error); }
});

app.post('/api/game/session/start', auth, async (req, res, next) => {
  const input = validate(sessionSchema, req.body, res); if (!input) return;
  try {
    const db = await pool();
    const sessionId = crypto.randomUUID();
    const result = await db.request()
      .input('sessionId', sql.UniqueIdentifier, sessionId)
      .input('playerId', sql.UniqueIdentifier, req.playerId)
      .input('platform', sql.NVarChar(20), input.platform)
      .input('metadata', sql.NVarChar(sql.MAX), JSON.stringify(input.metadata || {}))
      .query(`INSERT dbo.GameSessions(SessionId,PlayerId,Platform,MetadataJson,StartedAt,LastHeartbeatAt,ActiveSeconds,HeartbeatCount)
        OUTPUT inserted.SessionId,inserted.Platform,inserted.StartedAt,inserted.LastHeartbeatAt,inserted.ActiveSeconds,inserted.HeartbeatCount,inserted.EndedAt
        VALUES(@sessionId,@playerId,@platform,@metadata,SYSUTCDATETIME(),SYSUTCDATETIME(),0,0)`);
    res.status(201).json({ session: sessionPayload(result.recordset[0]) });
  } catch (error) { next(error); }
});
app.post('/api/game/session/heartbeat', auth, async (req, res, next) => {
  const input = validate(heartbeatSchema, req.body, res); if (!input) return;
  try {
    const db = await pool();
    const result = await db.request()
      .input('sessionId', sql.UniqueIdentifier, input.sessionId)
      .input('playerId', sql.UniqueIdentifier, req.playerId)
      .input('metadata', sql.NVarChar(sql.MAX), JSON.stringify(input.metadata || {}))
      .query(`UPDATE dbo.GameSessions SET
        ActiveSeconds=ActiveSeconds+CASE WHEN DATEDIFF(SECOND,LastHeartbeatAt,SYSUTCDATETIME()) BETWEEN 1 AND 75 THEN DATEDIFF(SECOND,LastHeartbeatAt,SYSUTCDATETIME()) ELSE 0 END,
        HeartbeatCount=HeartbeatCount+1,LastHeartbeatAt=SYSUTCDATETIME(),MetadataJson=@metadata
        OUTPUT inserted.SessionId,inserted.Platform,inserted.StartedAt,inserted.LastHeartbeatAt,inserted.ActiveSeconds,inserted.HeartbeatCount,inserted.EndedAt
        WHERE SessionId=@sessionId AND PlayerId=@playerId AND EndedAt IS NULL`);
    if (!result.recordset[0]) return res.status(404).json({ error: 'ACTIVE_SESSION_NOT_FOUND' });
    res.json({ session: sessionPayload(result.recordset[0]) });
  } catch (error) { next(error); }
});
app.post('/api/game/session/end', auth, async (req, res, next) => {
  const input = validate(heartbeatSchema, req.body, res); if (!input) return;
  try {
    const db = await pool();
    const result = await db.request()
      .input('sessionId', sql.UniqueIdentifier, input.sessionId)
      .input('playerId', sql.UniqueIdentifier, req.playerId)
      .input('metadata', sql.NVarChar(sql.MAX), JSON.stringify(input.metadata || {}))
      .query(`UPDATE dbo.GameSessions SET
        ActiveSeconds=ActiveSeconds+CASE WHEN DATEDIFF(SECOND,LastHeartbeatAt,SYSUTCDATETIME()) BETWEEN 1 AND 75 THEN DATEDIFF(SECOND,LastHeartbeatAt,SYSUTCDATETIME()) ELSE 0 END,
        LastHeartbeatAt=SYSUTCDATETIME(),EndedAt=SYSUTCDATETIME(),MetadataJson=@metadata
        OUTPUT inserted.SessionId,inserted.Platform,inserted.StartedAt,inserted.LastHeartbeatAt,inserted.ActiveSeconds,inserted.HeartbeatCount,inserted.EndedAt
        WHERE SessionId=@sessionId AND PlayerId=@playerId AND EndedAt IS NULL`);
    if (!result.recordset[0]) return res.status(404).json({ error: 'ACTIVE_SESSION_NOT_FOUND' });
    res.json({ session: sessionPayload(result.recordset[0]) });
  } catch (error) { next(error); }
});

async function activityStatus(playerId, executor = null) {
  const db = executor || await pool();
  const result = await db.request()
    .input('playerId', sql.UniqueIdentifier, playerId)
    .query(`DECLARE @today date=CONVERT(date,SYSUTCDATETIME());
      SELECT ISNULL(SUM(ActiveSeconds),0) ActiveSeconds,ISNULL(SUM(HeartbeatCount),0) HeartbeatCount
      FROM dbo.GameSessions WHERE PlayerId=@playerId AND StartedAt>=@today AND StartedAt<DATEADD(day,1,@today);
      SELECT TOP 1 RewardChips,CreatedAt FROM dbo.DailyRewardClaims WHERE PlayerId=@playerId AND RewardDate=@today;`);
  const activity = result.recordsets[0][0] || { ActiveSeconds: 0, HeartbeatCount: 0 };
  const claim = result.recordsets[1][0] || null;
  return {
    eligible: !claim && Number(activity.ActiveSeconds) >= REQUIRED_ACTIVE_SECONDS && Number(activity.HeartbeatCount) >= REQUIRED_HEARTBEATS,
    claimed: Boolean(claim),
    activeSeconds: Number(activity.ActiveSeconds || 0),
    heartbeatCount: Number(activity.HeartbeatCount || 0),
    requiredSeconds: REQUIRED_ACTIVE_SECONDS,
    requiredHeartbeats: REQUIRED_HEARTBEATS,
    rewardChips: claim ? Number(claim.RewardChips) : REWARD_CHIPS,
    claimedAt: claim?.CreatedAt || null
  };
}
app.get('/api/rewards/daily/status', auth, async (req, res, next) => {
  try { res.json(await activityStatus(req.playerId)); } catch (error) { next(error); }
});
app.post('/api/rewards/daily/claim', auth, async (req, res, next) => {
  const transaction = new sql.Transaction(await pool());
  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const status = await activityStatus(req.playerId, transaction);
    if (status.claimed) { await transaction.rollback(); return res.status(409).json({ error: 'REWARD_ALREADY_CLAIMED', ...status }); }
    if (!status.eligible) { await transaction.rollback(); return res.status(409).json({ error: 'MORE_ACTIVITY_REQUIRED', ...status }); }
    await transaction.request()
      .input('playerId', sql.UniqueIdentifier, req.playerId)
      .input('rewardChips', sql.Int, REWARD_CHIPS)
      .query(`DECLARE @today date=CONVERT(date,SYSUTCDATETIME());
        INSERT dbo.DailyRewardClaims(PlayerId,RewardDate,RewardChips,CreatedAt) VALUES(@playerId,@today,@rewardChips,SYSUTCDATETIME());
        UPDATE dbo.Players SET PlayMoney=PlayMoney+@rewardChips,
          DailyStreak=CASE WHEN CONVERT(date,LastRewardClaimAt)=DATEADD(day,-1,@today) THEN DailyStreak+1 ELSE 1 END,
          LastRewardClaimAt=SYSUTCDATETIME(),UpdatedAt=SYSUTCDATETIME() WHERE PlayerId=@playerId;`);
    await transaction.commit();
    res.json({ claimed: true, rewardChips: REWARD_CHIPS, profile: await fetchProfile(req.playerId) });
  } catch (error) {
    if (transaction._aborted !== true) await transaction.rollback().catch(() => undefined);
    if (Number(error?.number) === 2601 || Number(error?.number) === 2627) return res.status(409).json({ error: 'REWARD_ALREADY_CLAIMED' });
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const production = process.env.NODE_ENV === 'production';
  res.status(500).json({ error: 'SERVER_ERROR', message: production ? undefined : String(error?.message || error), build: BUILD });
});

app.listen(PORT, () => console.log(`${BUILD} listening on ${PORT}`));
