// Phase 212 boot diagnostic API route starter. Merge into main server.js when ready.
app.post('/api/game/boot-diagnostic', async (req, res) => {
  try {
    const payload = JSON.stringify(req.body || {});
    await pool.request().input('Payload', sql.NVarChar(sql.MAX), payload).query(`
      INSERT INTO GameBootDiagnostics (PayloadJson) VALUES (@Payload)
    `);
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
app.get('/api/game/boot-diagnostic', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
  const result = await pool.request().input('Limit', sql.Int, limit).query(`
    SELECT TOP (@Limit) Id, CreatedAt, PayloadJson FROM GameBootDiagnostics ORDER BY Id DESC
  `);
  res.json({ status: 'ok', rows: result.recordset });
});
