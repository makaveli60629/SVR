module.exports = function registerTesterLaunchCard(app) {
  app.post('/api/game/tester-launch-card', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/tester-launch-card', async (req, res) => res.json({ ok: true, items: [] }));
};
