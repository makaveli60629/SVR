// SVR Phase 198 test report bundle routes. Import into server.js when backend wiring is ready.
// No secrets included.
function registerPhase198TestReportBundleRoutes(app, sql, poolPromise) {
  app.post('/api/game/test-report-bundle', async (req, res) => {
    try {
      const payload = req.body || {};
      const pool = await poolPromise;
      await pool.request()
        .input('Build', sql.NVarChar(120), payload.build || 'PHASE-198-TEST-REPORT-BUNDLE-LOCK')
        .input('ReportJson', sql.NVarChar(sql.MAX), JSON.stringify(payload))
        .query('INSERT INTO GameTestReportBundles (Build, ReportJson) VALUES (@Build, @ReportJson)');
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ ok:false, error:'test_report_bundle_insert_failed' }); }
  });
  app.get('/api/game/test-report-bundle', async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '30', 10), 100);
      const pool = await poolPromise;
      const result = await pool.request().input('Limit', sql.Int, limit)
        .query('SELECT TOP (@Limit) * FROM GameTestReportBundles ORDER BY CreatedAt DESC');
      res.json(result.recordset || []);
    } catch (err) { res.status(500).json({ ok:false, error:'test_report_bundle_query_failed' }); }
  });
}
module.exports = { registerPhase198TestReportBundleRoutes };
