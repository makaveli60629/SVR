module.exports = function registerOptionalModuleLoader(app) {
  app.post('/api/game/optional-module-loader', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/optional-module-loader', async (req, res) => res.json({ ok: true, items: [] }));
};
