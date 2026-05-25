module.exports = function registerVrInputDiagnostic(app) {
  app.post('/api/game/vr-input-diagnostic', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/vr-input-diagnostic', async (req, res) => res.json({ ok: true, items: [] }));
};
