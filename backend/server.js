import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || true }));
app.use(express.json({ limit: '2mb' }));
const PORT = Number(process.env.PORT || 8080);
const BUILD = 'PHASE-194-PLAYTEST-WIZARD-LOCK';

async function pool() {
  const conn = process.env.AZURE_SQL_CONNECTION_STRING;
  if (!conn || conn.includes('PASTE_REAL')) throw new Error('Missing AZURE_SQL_CONNECTION_STRING');
  return sql.connect(conn);
}

app.get('/api/health', async (_req, res) => {
  try { await pool(); res.json({ status:'ok', database:'connected', build: BUILD }); }
  catch (error) { res.status(200).json({ status:'error', database:'failed', build: BUILD, message: String(error.message || error) }); }
});

app.post('/api/game/release-candidate', async (req, res) => {
  const body = req.body || {};
  try {
    const db = await pool();
    await db.request()
      .input('Build', sql.NVarChar(160), String(body.build || BUILD))
      .input('Pass', sql.Bit, !!body.pass)
      .input('FailedCount', sql.Int, Number(body.failedCount || 0))
      .input('Reason', sql.NVarChar(120), String(body.reason || 'runtime'))
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(body).slice(0, 20000))
      .query('INSERT INTO GameReleaseCandidateChecks (Build, Pass, FailedCount, Reason, PayloadJson) VALUES (@Build, @Pass, @FailedCount, @Reason, @PayloadJson)');
    res.json({ ok:true, build: BUILD });
  } catch(error) { res.status(200).json({ ok:false, build: BUILD, message:String(error.message || error) }); }
});

app.get('/api/game/release-candidate', async (req, res) => {
  try {
    const db = await pool();
    const limit = Math.min(Number(req.query.limit || 30), 100);
    const result = await db.request().input('Limit', sql.Int, limit).query('SELECT TOP (@Limit) * FROM GameReleaseCandidateChecks ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch(error) { res.status(200).json([]); }
});


app.post('/api/game/playtest-wizard', async (req, res) => {
  const body = req.body || {};
  try {
    const db = await pool();
    await db.request()
      .input('Build', sql.NVarChar(160), String(body.build || BUILD))
      .input('Pass', sql.Bit, body.pass === null || body.pass === undefined ? null : !!body.pass)
      .input('Reason', sql.NVarChar(140), String(body.reason || 'runtime'))
      .input('ChecklistJson', sql.NVarChar(sql.MAX), JSON.stringify(body.checks || []).slice(0, 12000))
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(body).slice(0, 20000))
      .query('INSERT INTO GamePlaytestWizardRuns (Build, Pass, Reason, ChecklistJson, PayloadJson) VALUES (@Build, @Pass, @Reason, @ChecklistJson, @PayloadJson)');
    res.json({ ok:true, build: BUILD });
  } catch(error) { res.status(200).json({ ok:false, build: BUILD, message:String(error.message || error) }); }
});

app.get('/api/game/playtest-wizard', async (req, res) => {
  try {
    const db = await pool();
    const limit = Math.min(Number(req.query.limit || 30), 100);
    const result = await db.request().input('Limit', sql.Int, limit).query('SELECT TOP (@Limit) * FROM GamePlaytestWizardRuns ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch(error) { res.status(200).json([]); }
});

app.listen(PORT, () => console.log(`SVR Phase 194 API running on port ${PORT}`));
