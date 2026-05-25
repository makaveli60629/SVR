module.exports = function registerPilotReadySummary(app) {
  app.post('/api/game/pilot-ready-summary', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/pilot-ready-summary', async (req, res) => res.json({ ok: true, items: [] }));
};
