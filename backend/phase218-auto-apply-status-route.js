module.exports = function registerAutoApplyStatus(app) {
  app.post('/api/game/auto-apply-status', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/auto-apply-status', async (req, res) => res.json({ ok: true, items: [] }));
};
