module.exports = function registerPilotHandoffCard(app) {
  app.post('/api/game/pilot-handoff-card', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/pilot-handoff-card', async (req, res) => res.json({ ok: true, items: [] }));
};
