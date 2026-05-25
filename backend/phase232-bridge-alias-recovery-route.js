module.exports = function registerBridgeAliasRecovery(app) {
  app.post('/api/game/bridge-alias-recovery', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/bridge-alias-recovery', async (req, res) => res.json({ ok: true, items: [] }));
};
