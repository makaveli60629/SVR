import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import { z } from 'zod';

const BUILD = 'PHASE-349-MULTIPLAYER-PRESENCE-SEAT-RECONNECT-LOCK';
const PORT = Number(process.env.PORT || 8081);
const JWT_SECRET = process.env.PLAYER_JWT_SECRET || '';
const SQL_CONNECTION = process.env.AZURE_SQL_CONNECTION_STRING || '';
const COOKIE_NAME = process.env.PLAYER_COOKIE_NAME || 'svr_player_session';
const COOKIE_DOMAIN = process.env.PLAYER_COOKIE_DOMAIN || undefined;
const LEASE_SECONDS = Math.max(8, Math.min(60, Number(process.env.PRESENCE_LEASE_SECONDS || 15)));
const ROOM_LIMIT = Math.max(6, Math.min(100, Number(process.env.PRESENCE_ROOM_LIMIT || 30)));
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
function originAllowed(origin) { return !origin || ALLOWED_ORIGINS.includes(origin); }
function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', domain: COOKIE_DOMAIN, path: '/' });
}
function parseJson(value, fallback = {}) { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
function validate(schema, body, res) {
  const result = schema.safeParse(body || {});
  if (!result.success) {
    res.status(400).json({ error: 'VALIDATION_FAILED', issues: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) });
    return null;
  }
  return result.data;
}
async function auth(req, res, next) {
  try {
    const bearer = String(req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const token = req.cookies[COOKIE_NAME] || bearer;
    if (!token) return res.status(401).json({ error: 'AUTH_REQUIRED' });
    const payload = jwt.verify(token, JWT_SECRET, { issuer: 'svrpoker.com', audience: 'svr-player-api' });
    req.playerId = payload.sub;
    req.playerRole = payload.role || 'player';
    next();
  } catch {
    clearSessionCookie(res);
    res.status(401).json({ error: 'SESSION_INVALID' });
  }
}

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin(origin, callback) { const allowed = originAllowed(origin); callback(allowed ? null : new Error('Origin not allowed'), allowed); },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-SVR-Client']
}));
app.use(express.json({ limit: '48kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.method === 'POST') {
    if (!originAllowed(req.get('origin'))) return res.status(403).json({ error: 'ORIGIN_NOT_ALLOWED' });
    if (!req.get('X-SVR-Client')) return res.status(400).json({ error: 'CLIENT_HEADER_REQUIRED' });
  }
  next();
});
app.use('/api', rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));

const roomId = z.string().trim().min(2).max(80).regex(/^[a-zA-Z0-9._:-]+$/);
const avatarSchema = z.object({
  modelId: z.string().trim().min(1).max(30).default('eric'),
  palette: z.string().trim().min(1).max(30).default('midnight'),
  top: z.string().trim().max(30).default('none'),
  headwear: z.string().trim().max(30).default('none')
}).default({ modelId: 'eric', palette: 'midnight', top: 'none', headwear: 'none' });
const poseSchema = z.object({
  x: z.number().finite().min(-100).max(100), y: z.number().finite().min(-20).max(50), z: z.number().finite().min(-100).max(100),
  yaw: z.number().finite().min(-13).max(13), pitch: z.number().finite().min(-1.4).max(1.4), seated: z.boolean().default(false)
});
const joinSchema = z.object({
  roomId, clientId: z.string().trim().min(8).max(100), platform: z.enum(['android', 'quest', 'desktop', 'web']),
  avatar: avatarSchema, pose: poseSchema.optional()
});
const heartbeatSchema = joinSchema.extend({ sessionId: z.string().uuid(), seatId: z.number().int().min(0).max(5).nullable().optional() });
const seatSchema = z.object({ roomId, sessionId: z.string().uuid(), seatId: z.number().int().min(0).max(5) });
const sessionSchema = z.object({ roomId, sessionId: z.string().uuid() });

function mapPresence(row) {
  return {
    roomId: row.RoomId,
    sessionId: row.SessionId,
    clientId: row.ClientId,
    playerId: row.PlayerId,
    displayName: row.DisplayName || 'Player',
    platform: row.Platform,
    avatar: parseJson(row.AvatarJson, {}),
    pose: parseJson(row.PoseJson, { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, seated: false }),
    seatId: row.SeatId == null ? null : Number(row.SeatId),
    connectedAt: row.ConnectedAt,
    heartbeatAt: row.LastHeartbeatAt,
    expiresAt: row.ExpiresAt,
    mode: 'api'
  };
}
async function cleanup(executor, room) {
  await executor.request().input('roomId', sql.NVarChar(80), room)
    .query(`DELETE dbo.PlayerSeatLeases WHERE RoomId=@roomId AND ExpiresAt<=SYSUTCDATETIME();
      UPDATE dbo.PlayerPresence SET IsActive=0,SeatId=NULL WHERE RoomId=@roomId AND IsActive=1 AND ExpiresAt<=SYSUTCDATETIME();`);
}
async function fetchPresence(executor, room, playerId) {
  const result = await executor.request()
    .input('roomId', sql.NVarChar(80), room)
    .input('playerId', sql.UniqueIdentifier, playerId)
    .query(`SELECT pp.RoomId,pp.SessionId,pp.ClientId,pp.PlayerId,p.DisplayName,pp.Platform,pp.AvatarJson,pp.PoseJson,pp.SeatId,
      pp.ConnectedAt,pp.LastHeartbeatAt,pp.ExpiresAt
      FROM dbo.PlayerPresence pp JOIN dbo.Players p ON p.PlayerId=pp.PlayerId
      WHERE pp.RoomId=@roomId AND pp.PlayerId=@playerId AND pp.IsActive=1`);
  return result.recordset[0] ? mapPresence(result.recordset[0]) : null;
}
async function event(executor, { room, playerId, sessionId = null, type, seatId = null, metadata = {} }) {
  await executor.request()
    .input('roomId', sql.NVarChar(80), room)
    .input('playerId', sql.UniqueIdentifier, playerId)
    .input('sessionId', sql.UniqueIdentifier, sessionId)
    .input('eventType', sql.NVarChar(40), type)
    .input('seatId', sql.TinyInt, seatId)
    .input('metadata', sql.NVarChar(sql.MAX), JSON.stringify(metadata || {}))
    .query(`INSERT dbo.PlayerPresenceEvents(RoomId,PlayerId,SessionId,EventType,SeatId,MetadataJson,CreatedAt)
      VALUES(@roomId,@playerId,@sessionId,@eventType,@seatId,@metadata,SYSUTCDATETIME())`);
}

app.get('/api/health', async (_req, res, next) => {
  try { const db = await pool(); await db.request().query('SELECT 1 ok'); res.json({ status: 'ok', build: BUILD, database: 'connected', leaseSeconds: LEASE_SECONDS, roomLimit: ROOM_LIMIT, time: new Date().toISOString() }); }
  catch (error) { next(error); }
});

app.post('/api/presence/join', auth, async (req, res, next) => {
  const input = validate(joinSchema, req.body, res); if (!input) return;
  const transaction = new sql.Transaction(await pool());
  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    await cleanup(transaction, input.roomId);
    const count = await transaction.request().input('roomId', sql.NVarChar(80), input.roomId)
      .query('SELECT COUNT_BIG(*) PlayerCount FROM dbo.PlayerPresence WITH(UPDLOCK,HOLDLOCK) WHERE RoomId=@roomId AND IsActive=1');
    const existing = await fetchPresence(transaction, input.roomId, req.playerId);
    if (!existing && Number(count.recordset[0]?.PlayerCount || 0) >= ROOM_LIMIT) {
      await transaction.rollback(); return res.status(409).json({ error: 'ROOM_FULL' });
    }
    const sessionId = crypto.randomUUID();
    await transaction.request()
      .input('roomId', sql.NVarChar(80), input.roomId)
      .input('playerId', sql.UniqueIdentifier, req.playerId)
      .input('sessionId', sql.UniqueIdentifier, sessionId)
      .input('clientId', sql.NVarChar(100), input.clientId)
      .input('platform', sql.NVarChar(20), input.platform)
      .input('avatar', sql.NVarChar(sql.MAX), JSON.stringify(input.avatar || {}))
      .input('pose', sql.NVarChar(sql.MAX), JSON.stringify(input.pose || { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, seated: false }))
      .input('leaseSeconds', sql.Int, LEASE_SECONDS)
      .query(`DELETE dbo.PlayerSeatLeases WHERE RoomId=@roomId AND PlayerId=@playerId;
        MERGE dbo.PlayerPresence WITH(HOLDLOCK) target
        USING(SELECT @roomId RoomId,@playerId PlayerId) source ON target.RoomId=source.RoomId AND target.PlayerId=source.PlayerId
        WHEN MATCHED THEN UPDATE SET SessionId=@sessionId,ClientId=@clientId,Platform=@platform,AvatarJson=@avatar,PoseJson=@pose,
          SeatId=NULL,ConnectedAt=SYSUTCDATETIME(),LastHeartbeatAt=SYSUTCDATETIME(),ExpiresAt=DATEADD(second,@leaseSeconds,SYSUTCDATETIME()),IsActive=1
        WHEN NOT MATCHED THEN INSERT(RoomId,PlayerId,SessionId,ClientId,Platform,AvatarJson,PoseJson,SeatId,ConnectedAt,LastHeartbeatAt,ExpiresAt,IsActive)
          VALUES(@roomId,@playerId,@sessionId,@clientId,@platform,@avatar,@pose,NULL,SYSUTCDATETIME(),SYSUTCDATETIME(),DATEADD(second,@leaseSeconds,SYSUTCDATETIME()),1);`);
    await event(transaction, { room: input.roomId, playerId: req.playerId, sessionId, type: existing ? 'reconnect' : 'join', metadata: { platform: input.platform } });
    await transaction.commit();
    res.status(201).json({ presence: await fetchPresence(await pool(), input.roomId, req.playerId), build: BUILD });
  } catch (error) { if (transaction._aborted !== true) await transaction.rollback().catch(() => undefined); next(error); }
});

app.post('/api/presence/heartbeat', auth, async (req, res, next) => {
  const input = validate(heartbeatSchema, req.body, res); if (!input) return;
  try {
    const db = await pool();
    const result = await db.request()
      .input('roomId', sql.NVarChar(80), input.roomId)
      .input('playerId', sql.UniqueIdentifier, req.playerId)
      .input('sessionId', sql.UniqueIdentifier, input.sessionId)
      .input('platform', sql.NVarChar(20), input.platform)
      .input('avatar', sql.NVarChar(sql.MAX), JSON.stringify(input.avatar || {}))
      .input('pose', sql.NVarChar(sql.MAX), JSON.stringify(input.pose || {}))
      .input('leaseSeconds', sql.Int, LEASE_SECONDS)
      .query(`UPDATE dbo.PlayerPresence SET Platform=@platform,AvatarJson=@avatar,PoseJson=@pose,LastHeartbeatAt=SYSUTCDATETIME(),
          ExpiresAt=DATEADD(second,@leaseSeconds,SYSUTCDATETIME()),IsActive=1
        WHERE RoomId=@roomId AND PlayerId=@playerId AND SessionId=@sessionId;
        UPDATE dbo.PlayerSeatLeases SET ExpiresAt=DATEADD(second,@leaseSeconds,SYSUTCDATETIME())
        WHERE RoomId=@roomId AND PlayerId=@playerId AND SessionId=@sessionId;
        SELECT @@ROWCOUNT UpdatedSeatLease;`);
    const presence = await fetchPresence(db, input.roomId, req.playerId);
    if (!presence || String(presence.sessionId) !== input.sessionId) return res.status(404).json({ error: 'PRESENCE_SESSION_NOT_FOUND' });
    res.json({ presence, build: BUILD });
  } catch (error) { next(error); }
});

app.get('/api/presence/room/:roomId', auth, async (req, res, next) => {
  const parsed = roomId.safeParse(req.params.roomId);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_ROOM' });
  try {
    const db = await pool(); await cleanup(db, parsed.data);
    const result = await db.request().input('roomId', sql.NVarChar(80), parsed.data).input('limit', sql.Int, ROOM_LIMIT)
      .query(`SELECT TOP(@limit) pp.RoomId,pp.SessionId,pp.ClientId,pp.PlayerId,p.DisplayName,pp.Platform,pp.AvatarJson,pp.PoseJson,pp.SeatId,
        pp.ConnectedAt,pp.LastHeartbeatAt,pp.ExpiresAt
        FROM dbo.PlayerPresence pp JOIN dbo.Players p ON p.PlayerId=pp.PlayerId
        WHERE pp.RoomId=@roomId AND pp.IsActive=1 AND pp.ExpiresAt>SYSUTCDATETIME()
        ORDER BY pp.LastHeartbeatAt DESC`);
    res.json({ roomId: parsed.data, presence: result.recordset.map(mapPresence), build: BUILD });
  } catch (error) { next(error); }
});

app.post('/api/presence/seat/claim', auth, async (req, res, next) => {
  const input = validate(seatSchema, req.body, res); if (!input) return;
  const transaction = new sql.Transaction(await pool());
  try {
    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE); await cleanup(transaction, input.roomId);
    const active = await transaction.request().input('roomId', sql.NVarChar(80), input.roomId).input('playerId', sql.UniqueIdentifier, req.playerId).input('sessionId', sql.UniqueIdentifier, input.sessionId)
      .query('SELECT SessionId FROM dbo.PlayerPresence WITH(UPDLOCK,HOLDLOCK) WHERE RoomId=@roomId AND PlayerId=@playerId AND SessionId=@sessionId AND IsActive=1 AND ExpiresAt>SYSUTCDATETIME()');
    if (!active.recordset[0]) { await transaction.rollback(); return res.status(404).json({ error: 'PRESENCE_SESSION_NOT_FOUND' }); }
    const occupied = await transaction.request().input('roomId', sql.NVarChar(80), input.roomId).input('seatId', sql.TinyInt, input.seatId)
      .query('SELECT PlayerId FROM dbo.PlayerSeatLeases WITH(UPDLOCK,HOLDLOCK) WHERE RoomId=@roomId AND SeatId=@seatId AND ExpiresAt>SYSUTCDATETIME()');
    if (occupied.recordset[0] && String(occupied.recordset[0].PlayerId) !== String(req.playerId)) {
      await transaction.rollback(); return res.status(409).json({ error: 'SEAT_OCCUPIED', seatId: input.seatId });
    }
    await transaction.request()
      .input('roomId', sql.NVarChar(80), input.roomId).input('seatId', sql.TinyInt, input.seatId)
      .input('playerId', sql.UniqueIdentifier, req.playerId).input('sessionId', sql.UniqueIdentifier, input.sessionId).input('leaseSeconds', sql.Int, LEASE_SECONDS)
      .query(`DELETE dbo.PlayerSeatLeases WHERE RoomId=@roomId AND PlayerId=@playerId;
        MERGE dbo.PlayerSeatLeases WITH(HOLDLOCK) target USING(SELECT @roomId RoomId,@seatId SeatId) source
        ON target.RoomId=source.RoomId AND target.SeatId=source.SeatId
        WHEN MATCHED THEN UPDATE SET PlayerId=@playerId,SessionId=@sessionId,ClaimedAt=SYSUTCDATETIME(),ExpiresAt=DATEADD(second,@leaseSeconds,SYSUTCDATETIME())
        WHEN NOT MATCHED THEN INSERT(RoomId,SeatId,PlayerId,SessionId,ClaimedAt,ExpiresAt)
          VALUES(@roomId,@seatId,@playerId,@sessionId,SYSUTCDATETIME(),DATEADD(second,@leaseSeconds,SYSUTCDATETIME()));
        UPDATE dbo.PlayerPresence SET SeatId=@seatId WHERE RoomId=@roomId AND PlayerId=@playerId AND SessionId=@sessionId;`);
    await event(transaction, { room: input.roomId, playerId: req.playerId, sessionId: input.sessionId, type: 'seat-claim', seatId: input.seatId });
    await transaction.commit();
    res.json({ presence: await fetchPresence(await pool(), input.roomId, req.playerId), build: BUILD });
  } catch (error) { if (transaction._aborted !== true) await transaction.rollback().catch(() => undefined); next(error); }
});

app.post('/api/presence/seat/release', auth, async (req, res, next) => {
  const input = validate(sessionSchema, req.body, res); if (!input) return;
  try {
    const db = await pool();
    await db.request().input('roomId', sql.NVarChar(80), input.roomId).input('playerId', sql.UniqueIdentifier, req.playerId).input('sessionId', sql.UniqueIdentifier, input.sessionId)
      .query(`DELETE dbo.PlayerSeatLeases WHERE RoomId=@roomId AND PlayerId=@playerId AND SessionId=@sessionId;
        UPDATE dbo.PlayerPresence SET SeatId=NULL WHERE RoomId=@roomId AND PlayerId=@playerId AND SessionId=@sessionId;`);
    res.json({ presence: await fetchPresence(db, input.roomId, req.playerId), build: BUILD });
  } catch (error) { next(error); }
});

app.post('/api/presence/leave', auth, async (req, res, next) => {
  const input = validate(sessionSchema, req.body, res); if (!input) return;
  try {
    const db = await pool();
    await db.request().input('roomId', sql.NVarChar(80), input.roomId).input('playerId', sql.UniqueIdentifier, req.playerId).input('sessionId', sql.UniqueIdentifier, input.sessionId)
      .query(`DELETE dbo.PlayerSeatLeases WHERE RoomId=@roomId AND PlayerId=@playerId AND SessionId=@sessionId;
        UPDATE dbo.PlayerPresence SET IsActive=0,SeatId=NULL,ExpiresAt=SYSUTCDATETIME(),LastHeartbeatAt=SYSUTCDATETIME()
        WHERE RoomId=@roomId AND PlayerId=@playerId AND SessionId=@sessionId;`);
    await event(db, { room: input.roomId, playerId: req.playerId, sessionId: input.sessionId, type: 'leave' });
    res.json({ left: true, build: BUILD });
  } catch (error) { next(error); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const production = process.env.NODE_ENV === 'production';
  res.status(500).json({ error: 'SERVER_ERROR', message: production ? undefined : String(error?.message || error), build: BUILD });
});

app.listen(PORT, () => console.log(`${BUILD} listening on ${PORT}`));
