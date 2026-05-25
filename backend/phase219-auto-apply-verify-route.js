module.exports = function registerAutoApplyVerify(app) {
  app.post('/api/game/auto-apply-verify', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/auto-apply-verify', async (req, res) => res.json({ ok: true, items: [] }));
};
