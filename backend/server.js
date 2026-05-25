import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || true }));
app.use(express.json({ limit: '2mb' }));
const PORT = Number(process.env.PORT || 8080);
const BUILD = 'PHASE-195-BUG-REPORT-CAPTURE-LOCK';

async function pool() {
  const conn = process.env.AZURE_SQL_CONNECTION_STRING;
  if (!conn || conn.includes('PASTE_REAL')) throw new Error('Missing AZURE_SQL_CONNECTION_STRING');
  return sql.connect(conn);
}

app.get('/api/health', async (_req, res) => {
  try { await pool(); res.json({ status:'ok', database:'connected', build: BUILD }); }
  catch (error) { res.status(200).json({ status:'error', database:'failed', build: BUILD, message: String(error.message || error) }); }
});

app.post('/api/game/bug-report', async (req, res) => {
  const body = req.body || {};
  const report = body.report || {};
  try {
    const db = await pool();
    await db.request()
      .input('Build', sql.NVarChar(160), String(body.build || report.build || BUILD))
      .input('Phase', sql.Int, Number(body.phase || report.phase || 195))
      .input('Reason', sql.NVarChar(140), String(body.reason || 'runtime'))
      .input('Area', sql.NVarChar(120), String(report.area || 'unspecified'))
      .input('Severity', sql.NVarChar(80), String(report.severity || 'unspecified'))
      .input('Device', sql.NVarChar(240), String(report.device || ''))
      .input('Notes', sql.NVarChar(sql.MAX), String(report.notes || '').slice(0, 4000))
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(body).slice(0, 24000))
      .query('INSERT INTO GameBugReports (Build, Phase, Reason, Area, Severity, Device, Notes, PayloadJson) VALUES (@Build, @Phase, @Reason, @Area, @Severity, @Device, @Notes, @PayloadJson)');
    res.json({ ok:true, build: BUILD });
  } catch(error) { res.status(200).json({ ok:false, build: BUILD, message:String(error.message || error) }); }
});

app.get('/api/game/bug-report', async (req, res) => {
  try {
    const db = await pool();
    const limit = Math.min(Number(req.query.limit || 30), 100);
    const result = await db.request().input('Limit', sql.Int, limit).query('SELECT TOP (@Limit) * FROM GameBugReports ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch(error) { res.status(200).json([]); }
});

app.listen(PORT, () => console.log(`SVR Phase 195 API running on port ${PORT}`));
