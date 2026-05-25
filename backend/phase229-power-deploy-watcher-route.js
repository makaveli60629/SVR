module.exports = function registerPowerDeployWatcher(app) {
  app.post('/api/game/power-deploy-watcher', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/power-deploy-watcher', async (req, res) => res.json({ ok: true, items: [] }));
};
