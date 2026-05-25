module.exports = function registerPowerDeployWaitLog(app) {
  app.post('/api/game/power-deploy-wait-log', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/power-deploy-wait-log', async (req, res) => res.json({ ok: true, items: [] }));
};
