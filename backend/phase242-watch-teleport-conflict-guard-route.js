module.exports = function registerWatchTeleportConflictGuard(app) {
  app.post('/api/game/watch-teleport-conflict-guard', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/watch-teleport-conflict-guard', async (req, res) => res.json({ ok: true, items: [] }));
};
