import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));
const PORT = Number(process.env.PORT || 8080);
const BUILD = 'PHASE-192-SMOKE-TEST-AUTOMATION-LOCK';

async function pool() {
  const conn = process.env.AZURE_SQL_CONNECTION_STRING;
  if (!conn || conn.includes('PASTE_REAL')) throw new Error('Missing AZURE_SQL_CONNECTION_STRING');
  return sql.connect(conn);
}

app.get('/api/health', async (_req, res) => {
  try { await pool(); res.json({ status:'ok', database:'connected', build: BUILD }); }
  catch (error) { res.status(200).json({ status:'error', database:'failed', build: BUILD, message: String(error.message || error) }); }
});

app.post('/api/game/smoke-test', async (req, res) => {
  const body = req.body || {};
  try {
    const db = await pool();
    await db.request()
      .input('Build', sql.NVarChar(120), String(body.build || BUILD))
      .input('Pass', sql.Bit, !!body.pass)
      .input('FailedCount', sql.Int, Number(body.failedCount || 0))
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(body).slice(0, 12000))
      .query('INSERT INTO GameSmokeTests (Build, Pass, FailedCount, PayloadJson) VALUES (@Build, @Pass, @FailedCount, @PayloadJson)');
    res.json({ ok:true, build: BUILD });
  } catch(error) { res.status(200).json({ ok:false, build: BUILD, message:String(error.message || error) }); }
});

app.get('/api/game/smoke-test', async (req, res) => {
  try {
    const db = await pool();
    const limit = Math.min(Number(req.query.limit || 30), 100);
    const result = await db.request().input('Limit', sql.Int, limit).query('SELECT TOP (@Limit) * FROM GameSmokeTests ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch(error) { res.status(200).json([]); }
});

app.listen(PORT, () => console.log(`SVR Phase 192 API running on port ${PORT}`));
