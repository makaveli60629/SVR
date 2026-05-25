module.exports = function registerPowerDeploySmokeProbe(app) {
  app.post('/api/game/power-deploy-smoke-probe', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/power-deploy-smoke-probe', async (req, res) => res.json({ ok: true, items: [] }));
};
