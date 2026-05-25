// SVR Phase 197 Test Queue API starter
// Merge these routes into the existing Express backend.
app.post('/api/game/test-queue', async (req, res) => {
  try {
    const payload = req.body || {};
    await pool.request()
      .input('Build', sql.NVarChar(120), payload.build || 'PHASE-197-TEST-QUEUE-DASHBOARD-LOCK')
      .input('Phase', sql.Int, payload.phase || 197)
      .input('Priority', sql.NVarChar(40), payload.counts?.BLOCKER ? 'BLOCKER' : payload.counts?.BUG ? 'BUG' : 'REVIEW')
      .input('PayloadJson', sql.NVarChar(sql.MAX), JSON.stringify(payload))
      .query('INSERT INTO GameTestQueue (Build, Phase, Priority, PayloadJson) VALUES (@Build, @Phase, @Priority, @PayloadJson)');
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/game/test-queue', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
    const result = await pool.request().input('Limit', sql.Int, limit).query('SELECT TOP (@Limit) * FROM GameTestQueue ORDER BY CreatedAt DESC');
    res.json({ ok: true, items: result.recordset });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
