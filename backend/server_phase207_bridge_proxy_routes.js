// Phase 207 bridge proxy route patch for SVR backend.
// Mount inside Express after JSON middleware.
const bridgeProxyReports = [];
function installPhase207BridgeProxyRoutes(app) {
  app.post('/api/game/bridge-proxy', (req, res) => {
    const row = { id: Date.now(), at: new Date().toISOString(), body: req.body || {} };
    bridgeProxyReports.unshift(row);
    bridgeProxyReports.splice(100);
    res.json({ ok: true, row });
  });
  app.get('/api/game/bridge-proxy', (req, res) => {
    const limit = Math.min(Number(req.query.limit || 30), 100);
    res.json({ ok: true, items: bridgeProxyReports.slice(0, limit) });
  });
}
module.exports = { installPhase207BridgeProxyRoutes };
