// Phase 200 pilot-ready endpoint patch for the SVR backend.
// Mount inside the existing Express server after JSON middleware is configured.
app.post('/api/game/pilot-ready', async (req, res) => {
  const payload = req.body || {};
  try {
    await sql.query`
      INSERT INTO dbo.GamePilotReadyReports (BuildLabel, Readiness, ScorePercent, Payload)
      VALUES (${payload.build || 'unknown'}, ${payload.readiness || null}, ${payload.score?.pct ?? null}, ${JSON.stringify(payload)})
    `;
    res.json({ ok: true });
  } catch (err) {
    console.error('pilot-ready insert failed', err);
    res.status(500).json({ ok: false, error: 'pilot-ready insert failed' });
  }
});

app.get('/api/game/pilot-ready', async (req, res) => {
  try {
    const result = await sql.query`SELECT TOP (30) * FROM dbo.GamePilotReadyReports ORDER BY CreatedAt DESC`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'pilot-ready read failed' });
  }
});
