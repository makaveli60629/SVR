// Phase 206 route patch for existing Express API
// Add after app/mssql pool initialization.
app.post('/api/game/bridge-health', async (req, res) => {
  try {
    const payload = JSON.stringify(req.body || {});
    await pool.request().input('PayloadJson', sql.NVarChar(sql.MAX), payload).query('INSERT INTO BridgeHealthReports (PayloadJson) VALUES (@PayloadJson)');
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok:false, error: err.message }); }
});
app.get('/api/game/bridge-health', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 30), 100);
    const result = await pool.request().input('Limit', sql.Int, limit).query('SELECT TOP (@Limit) Id, CreatedAt, PayloadJson FROM BridgeHealthReports ORDER BY Id DESC');
    res.json({ ok:true, rows: result.recordset });
  } catch (err) { res.status(500).json({ ok:false, error: err.message }); }
});
