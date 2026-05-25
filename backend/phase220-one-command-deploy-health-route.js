module.exports = function registerOneCommandDeployHealth(app) {
  app.post('/api/game/one-command-deploy-health', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/one-command-deploy-health', async (req, res) => res.json({ ok: true, items: [] }));
};
