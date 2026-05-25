module.exports = function registerMainRuntimeCatchFix(app) {
  app.post('/api/game/main-runtime-catch-fix', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/main-runtime-catch-fix', async (req, res) => res.json({ ok: true, items: [] }));
};
