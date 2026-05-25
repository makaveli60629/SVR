module.exports = function registerVrInputSpawnClear(app) {
  app.post('/api/game/vr-input-spawn-clear', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/vr-input-spawn-clear', async (req, res) => res.json({ ok: true, items: [] }));
};
