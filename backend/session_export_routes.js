// SVR Phase 190 session export routes for an Express + mssql backend.
// Mount with: registerSessionExportRoutes(app, sqlPoolPromise)
function registerSessionExportRoutes(app, sqlPoolPromise) {
  app.post('/api/game/session-export', async (req, res) => {
    try {
      const payload = req.body || {};
      const pool = await sqlPoolPromise;
      await pool.request()
        .input('BuildLabel', payload.build || payload?.latest?.build || null)
        .input('EventCount', Array.isArray(payload.events) ? payload.events.length : 0)
        .input('Payload', JSON.stringify(payload))
        .query('INSERT INTO dbo.GameSessionExports (BuildLabel, EventCount, Payload) VALUES (@BuildLabel, @EventCount, @Payload)');
      res.json({ status: 'ok' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'session export save failed' });
    }
  });

  app.get('/api/game/session-export', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
      const pool = await sqlPoolPromise;
      const result = await pool.request()
        .input('Limit', limit)
        .query('SELECT TOP (@Limit) Id, BuildLabel, EventCount, CreatedAt FROM dbo.GameSessionExports ORDER BY CreatedAt DESC');
      res.json(result.recordset || []);
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'session export read failed' });
    }
  });
}
module.exports = { registerSessionExportRoutes };
