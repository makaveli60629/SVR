// PHASE-199-DEMO-CERTIFICATION-LOCK
// Express wiring helper. Mount from server.js after auth/rate-limit middleware as needed.
export function registerPhase199DemoCertification(app, sqlPool) {
  app.post('/api/game/demo-certification', async (req, res) => {
    try {
      const payload = JSON.stringify(req.body || {});
      if (sqlPool?.request) {
        await sqlPool.request().input('PayloadJson', payload).query('INSERT INTO DemoCertificationReports (PayloadJson) VALUES (@PayloadJson)');
      }
      res.json({ ok: true, build: 'PHASE-199-DEMO-CERTIFICATION-LOCK' });
    } catch (error) { res.status(500).json({ ok:false, error: error.message }); }
  });
  app.get('/api/game/demo-certification', async (_req, res) => {
    try {
      if (!sqlPool?.request) return res.json([]);
      const result = await sqlPool.request().query('SELECT TOP 30 * FROM DemoCertificationReports ORDER BY CreatedAt DESC');
      res.json(result.recordset || []);
    } catch (error) { res.status(500).json({ ok:false, error: error.message }); }
  });
}
