module.exports = function registerPilotFeedbackExport(app) {
  app.post('/api/game/pilot-feedback-export', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/pilot-feedback-export', async (req, res) => res.json({ ok: true, items: [] }));
};
