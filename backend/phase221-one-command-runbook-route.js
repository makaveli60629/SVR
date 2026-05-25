module.exports = function registerOneCommandRunbook(app) {
  app.post('/api/game/one-command-runbook', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/one-command-runbook', async (req, res) => res.json({ ok: true, items: [] }));
};
