import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { getPool, sql } from './db.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const allowed = String(process.env.ALLOWED_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => !origin || allowed.length === 0 || allowed.includes(origin) ? cb(null,true) : cb(new Error('CORS blocked')) }));
app.use(express.json({ limit: '1mb' }));

function tokenFor(admin){ return jwt.sign({ sub: admin.Email, role: 'owner' }, process.env.ADMIN_JWT_SECRET || 'dev-secret', { expiresIn: '8h' }); }
function auth(req,res,next){
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  try{ req.user = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'dev-secret'); next(); }catch(_){ res.status(401).json({ ok:false, error:'Unauthorized' }); }
}

app.get('/api/health', async (_req,res)=>{
  try { await getPool(); res.json({ status:'ok', database:'connected', build:'PHASE-187-DECISION-AID-POT-ODDS-LOCK' }); }
  catch(err){ res.status(500).json({ status:'error', database:'failed', message:err.message }); }
});

app.get('/api/admin/status', async (_req,res)=>{
  try{
    const pool = await getPool();
    const result = await pool.request().query("SELECT TOP 1 IsOnline, DisplayName, UpdatedAt FROM AdminStatus ORDER BY Id DESC");
    const row = result.recordset[0];
    res.json({ online: !!row?.IsOnline, displayName: row?.DisplayName || 'Admin', updatedAt: row?.UpdatedAt || null });
  }catch(err){ res.json({ online:false, error:err.message }); }
});

app.post('/api/messages', async (req,res)=>{
  const { name='', email='', topic='general', message='' } = req.body || {};
  if (String(message).trim().length < 2) return res.status(400).json({ ok:false, error:'Message required' });
  const pool = await getPool();
  await pool.request()
    .input('Name', sql.NVarChar(120), name)
    .input('Email', sql.NVarChar(180), email)
    .input('Topic', sql.NVarChar(80), topic)
    .input('Message', sql.NVarChar(sql.MAX), message)
    .query('INSERT INTO SiteMessages(Name,Email,Topic,Message) VALUES(@Name,@Email,@Topic,@Message)');
  res.json({ ok:true });
});

app.post('/api/admin/login', async (req,res)=>{
  const { email, password } = req.body || {};
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return res.status(500).json({ ok:false, error:'Admin env not configured' });
  const ok = String(email).toLowerCase() === String(expectedEmail).toLowerCase() && String(password) === String(expectedPassword);
  if (!ok) return res.status(401).json({ ok:false, error:'Invalid login' });
  res.json({ ok:true, token: tokenFor({ Email: expectedEmail }) });
});

app.post('/api/admin/status', auth, async (req,res)=>{
  const online = !!req.body?.online;
  const displayName = req.body?.displayName || 'King';
  const pool = await getPool();
  await pool.request().input('IsOnline', sql.Bit, online).input('DisplayName', sql.NVarChar(120), displayName).query('INSERT INTO AdminStatus(IsOnline,DisplayName) VALUES(@IsOnline,@DisplayName)');
  res.json({ ok:true, online });
});

app.get('/api/admin/messages', auth, async (_req,res)=>{
  const pool = await getPool();
  const result = await pool.request().query('SELECT TOP 100 * FROM SiteMessages ORDER BY CreatedAt DESC');
  res.json({ ok:true, messages: result.recordset });
});

app.get('/api/store/products', async (_req,res)=>{
  const pool = await getPool();
  const result = await pool.request().query("SELECT * FROM StoreProducts WHERE IsVisible=1 ORDER BY SortOrder, Id");
  res.json({ ok:true, checkoutEnabled: process.env.STORE_CHECKOUT_ENABLED === 'true', products: result.recordset });
});

app.post('/api/stripe/create-checkout-session', async (req,res)=>{
  if (process.env.STORE_CHECKOUT_ENABLED !== 'true') return res.status(403).json({ ok:false, error:'Checkout disabled' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ ok:false, error:'Stripe key missing' });
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  res.status(501).json({ ok:false, error:'Stripe product mapping pending approval' });
});

app.post('/api/game/hand-results', async (req,res)=>{
  try{
    const pool = await getPool();
    await pool.request()
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(req.body || {}))
      .query('INSERT INTO GameHandResults(PayloadJson) VALUES(@PayloadJson)');
    res.json({ ok:true });
  }catch(err){ res.status(500).json({ ok:false, error:err.message }); }
});


app.post('/api/game/telemetry', async (req,res)=>{
  try{
    const events = Array.isArray(req.body?.events) ? req.body.events : [];
    if (events.length === 0) return res.json({ ok:true, inserted:0 });
    const pool = await getPool();
    for (const event of events.slice(0, 50)) {
      await pool.request()
        .input('EventType', sql.NVarChar(80), event.type || 'unknown')
        .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(event))
        .query('INSERT INTO GameTelemetry(EventType, PayloadJson) VALUES(@EventType, @PayloadJson)');
    }
    res.json({ ok:true, inserted: Math.min(events.length, 50) });
  }catch(err){ res.status(500).json({ ok:false, error:err.message }); }
});

app.get('/api/game/hand-history', async (req,res)=>{
  try{
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const pool = await getPool();
    const result = await pool.request()
      .input('Limit', sql.Int, limit)
      .query('SELECT TOP (@Limit) Id, PayloadJson, CreatedAt FROM GameHandResults ORDER BY CreatedAt DESC');
    res.json({ ok:true, hands: result.recordset.map(row => ({ id: row.Id, createdAt: row.CreatedAt, payload: JSON.parse(row.PayloadJson || '{}') })) });
  }catch(err){ res.status(500).json({ ok:false, error:err.message }); }
});


app.post('/api/game/action-log', async (req,res)=>{
  try{
    const pool = await getPool();
    await pool.request()
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(req.body || {}))
      .query('INSERT INTO GameActionLog(PayloadJson) VALUES(@PayloadJson)');
    res.json({ ok:true });
  }catch(err){ res.status(500).json({ ok:false, error:err.message }); }
});

app.get('/api/game/action-log', async (req,res)=>{
  try{
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 30)));
    const pool = await getPool();
    const result = await pool.request()
      .input('Limit', sql.Int, limit)
      .query('SELECT TOP (@Limit) Id, PayloadJson, CreatedAt FROM GameActionLog ORDER BY CreatedAt DESC');
    res.json({ ok:true, actions: result.recordset.map(row => ({ id: row.Id, createdAt: row.CreatedAt, payload: JSON.parse(row.PayloadJson || '{}') })) });
  }catch(err){ res.status(500).json({ ok:false, error:err.message }); }
});


app.post('/api/game/legal-actions', async (req,res)=>{
  try{
    const body = req.body || {};
    const legal = body.legal || body;
    const pool = await getPool();
    await pool.request()
      .input('HandNumber', sql.Int, body.handNumber || null)
      .input('Stage', sql.NVarChar(80), legal.stage || body.stage || null)
      .input('CallAmount', sql.Int, Number(legal.callAmount || body.callAmount || 0))
      .input('OptionsJson', sql.NVarChar(sql.MAX), JSON.stringify(legal.options || []))
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(body))
      .query('INSERT INTO GameLegalActions(HandNumber, Stage, CallAmount, OptionsJson, PayloadJson) VALUES(@HandNumber, @Stage, @CallAmount, @OptionsJson, @PayloadJson)');
    res.json({ ok:true });
  }catch(err){ res.status(500).json({ ok:false, error:err.message }); }
});

app.get('/api/game/legal-actions', async (req,res)=>{
  try{
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 30)));
    const pool = await getPool();
    const result = await pool.request()
      .input('Limit', sql.Int, limit)
      .query('SELECT TOP (@Limit) Id, HandNumber, Stage, CallAmount, OptionsJson, PayloadJson, CreatedAt FROM GameLegalActions ORDER BY CreatedAt DESC');
    res.json({ ok:true, legalActions: result.recordset.map(row => ({ id: row.Id, handNumber: row.HandNumber, stage: row.Stage, callAmount: row.CallAmount, options: JSON.parse(row.OptionsJson || '[]'), createdAt: row.CreatedAt, payload: JSON.parse(row.PayloadJson || '{}') })) });
  }catch(err){ res.status(500).json({ ok:false, error:err.message }); }
});


app.post('/api/game/showdown', async (req,res)=>{
  try{
    const body = req.body || {};
    const pool = await getPool();
    await pool.request()
      .input('HandNumber', sql.Int, body.hand || body.handNumber || null)
      .input('Winner', sql.NVarChar(120), body.winner || null)
      .input('HandName', sql.NVarChar(120), body.handName || null)
      .input('WinningCards', sql.NVarChar(80), body.winningCards || null)
      .input('Board', sql.NVarChar(80), body.board || null)
      .input('Pot', sql.Int, Number(body.pot || 0))
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(body))
      .query('INSERT INTO GameShowdowns(HandNumber, Winner, HandName, WinningCards, Board, Pot, PayloadJson) VALUES(@HandNumber, @Winner, @HandName, @WinningCards, @Board, @Pot, @PayloadJson)');
    res.json({ ok:true });
  }catch(err){ res.status(500).json({ ok:false, error:err.message }); }
});

app.get('/api/game/showdowns', async (req,res)=>{
  try{
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 30)));
    const pool = await getPool();
    const result = await pool.request()
      .input('Limit', sql.Int, limit)
      .query('SELECT TOP (@Limit) Id, HandNumber, Winner, HandName, WinningCards, Board, Pot, PayloadJson, CreatedAt FROM GameShowdowns ORDER BY CreatedAt DESC');
    res.json({ ok:true, showdowns: result.recordset.map(row => ({ id: row.Id, handNumber: row.HandNumber, winner: row.Winner, handName: row.HandName, winningCards: row.WinningCards, board: row.Board, pot: row.Pot, createdAt: row.CreatedAt, payload: JSON.parse(row.PayloadJson || '{}') })) });
  }catch(err){ res.status(500).json({ ok:false, error:err.message }); }
});



app.post('/api/game/bot-action-safety', async (req, res) => {
  try {
    const payload = req.body || {};
    const pool = await getPool();
    await pool.request()
      .input('HandNumber', sql.Int, payload.handNumber || null)
      .input('Stage', sql.NVarChar(80), payload.stage || null)
      .input('SeatIndex', sql.Int, payload.seatIndex ?? null)
      .input('ActorName', sql.NVarChar(120), payload.actor || null)
      .input('ActionName', sql.NVarChar(80), payload.action || null)
      .input('RequestedAmount', sql.Int, payload.requested ?? null)
      .input('PaidAmount', sql.Int, payload.paid ?? null)
      .input('PotAmount', sql.Int, payload.pot ?? null)
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(payload))
      .query(`INSERT INTO GameBotActionSafety (HandNumber, Stage, SeatIndex, ActorName, ActionName, RequestedAmount, PaidAmount, PotAmount, PayloadJson)
              VALUES (@HandNumber, @Stage, @SeatIndex, @ActorName, @ActionName, @RequestedAmount, @PaidAmount, @PotAmount, @PayloadJson)`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'bot_action_safety_failed' });
  }
});

app.post('/api/game/runtime-recovery', async (req, res) => {
  try {
    const payload = req.body || {};
    const pool = await getPool();
    await pool.request()
      .input('HandNumber', sql.Int, payload.handNumber || null)
      .input('Stage', sql.NVarChar(80), payload.stage || null)
      .input('Message', sql.NVarChar(400), String(payload.message || '').slice(0, 400))
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(payload))
      .query('INSERT INTO GameRuntimeRecovery (HandNumber, Stage, Message, PayloadJson) VALUES (@HandNumber, @Stage, @Message, @PayloadJson)');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || 'runtime_recovery_failed' });
  }
});

app.post('/api/game/turn-indicator', async (req, res) => {
  try {
    const body = req.body || {};
    const pool = await getPool();
    await pool.request()
      .input('HandNumber', sql.Int, body.handNumber || null)
      .input('SeatIndex', sql.Int, body.seatIndex ?? null)
      .input('ActorName', sql.NVarChar(120), body.actor || null)
      .input('Stage', sql.NVarChar(80), body.stage || null)
      .input('ActionName', sql.NVarChar(80), body.action || null)
      .input('RemainingSeconds', sql.Int, body.remaining ?? null)
      .input('PotAmount', sql.Int, body.pot ?? null)
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(body))
      .query('INSERT INTO GameTurnIndicators (HandNumber, SeatIndex, ActorName, Stage, ActionName, RemainingSeconds, PotAmount, PayloadJson) VALUES (@HandNumber, @SeatIndex, @ActorName, @Stage, @ActionName, @RemainingSeconds, @PotAmount, @PayloadJson)');
    res.json({ ok:true });
  } catch (err) {
    res.status(500).json({ ok:false, error:err.message });
  }
});

app.get('/api/game/turn-indicators', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 30)));
    const pool = await getPool();
    const result = await pool.request()
      .input('Limit', sql.Int, limit)
      .query('SELECT TOP (@Limit) Id, HandNumber, SeatIndex, ActorName, Stage, ActionName, RemainingSeconds, PotAmount, PayloadJson, CreatedAt FROM GameTurnIndicators ORDER BY CreatedAt DESC');
    res.json({ ok:true, turnIndicators: result.recordset.map(row => ({ id: row.Id, handNumber: row.HandNumber, seatIndex: row.SeatIndex, actor: row.ActorName, stage: row.Stage, action: row.ActionName, remaining: row.RemainingSeconds, pot: row.PotAmount, createdAt: row.CreatedAt, payload: JSON.parse(row.PayloadJson || '{}') })) });
  } catch (err) {
    res.status(500).json({ ok:false, error:err.message });
  }
});



app.post('/api/game/decision-aid', async (req, res) => {
  try {
    const body = req.body || {};
    const aid = body.decisionAid || body;
    const pool = await getPool();
    await pool.request()
      .input('HandNumber', sql.Int, Number(body.handNumber || body.hand || 0))
      .input('Stage', sql.NVarChar(80), aid.stage || body.stage || null)
      .input('CallAmount', sql.Int, Number(aid.callAmount || 0))
      .input('PotAmount', sql.Int, Number(aid.pot || body.pot || 0))
      .input('PotOddsPct', sql.Int, Number(aid.potOddsPct || 0))
      .input('PressureLabel', sql.NVarChar(80), aid.pressure || null)
      .input('HintText', sql.NVarChar(255), aid.hint || null)
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(body))
      .query('INSERT INTO GameDecisionAid(HandNumber, Stage, CallAmount, PotAmount, PotOddsPct, PressureLabel, HintText, PayloadJson) VALUES(@HandNumber, @Stage, @CallAmount, @PotAmount, @PotOddsPct, @PressureLabel, @HintText, @PayloadJson)');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/game/decision-aid', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
    const pool = await getPool();
    const result = await pool.request().input('Limit', sql.Int, limit)
      .query('SELECT TOP (@Limit) Id, HandNumber, Stage, CallAmount, PotAmount, PotOddsPct, PressureLabel, HintText, PayloadJson, CreatedAt FROM GameDecisionAid ORDER BY Id DESC');
    res.json({ ok: true, rows: result.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(port, () => console.log(`SVR Enterprise API running on port ${port}`));


app.post('/api/game/side-pots', async (req,res)=>{
  const payload = req.body || {};
  const pool = await getPool();
  await pool.request()
    .input('HandNumber', sql.Int, Number(payload.handNumber || payload.hand || 0))
    .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(payload))
    .query('INSERT INTO GameSidePotResolutions(HandNumber, PayloadJson) VALUES(@HandNumber, @PayloadJson)');
  res.json({ ok:true });
});

app.get('/api/game/side-pots', async (req,res)=>{
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
  const pool = await getPool();
  const result = await pool.request().input('Limit', sql.Int, limit)
    .query('SELECT TOP (@Limit) Id, HandNumber, PayloadJson, CreatedAt FROM GameSidePotResolutions ORDER BY Id DESC');
  res.json({ ok:true, rows: result.recordset });
});


app.post('/api/game/fold-eligibility', async (req,res)=>{
  const payload = req.body || {};
  const folded = payload.foldedPlayers || payload.folded || [];
  const pool = await getPool();
  await pool.request()
    .input('HandNumber', sql.Int, Number(payload.handNumber || payload.hand || 0))
    .input('FoldedPlayersJson', sql.NVarChar(sql.MAX), JSON.stringify(folded))
    .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(payload))
    .query('INSERT INTO GameFoldEligibility(HandNumber, FoldedPlayersJson, PayloadJson) VALUES(@HandNumber, @FoldedPlayersJson, @PayloadJson)');
  res.json({ ok:true });
});

app.get('/api/game/fold-eligibility', async (req,res)=>{
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
  const pool = await getPool();
  const result = await pool.request().input('Limit', sql.Int, limit)
    .query('SELECT TOP (@Limit) Id, HandNumber, FoldedPlayersJson, PayloadJson, CreatedAt FROM GameFoldEligibility ORDER BY Id DESC');
  res.json({ ok:true, rows: result.recordset });
});
