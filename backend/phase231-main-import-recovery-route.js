module.exports = function registerMainImportRecovery(app) {
  app.post('/api/game/main-import-recovery', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/main-import-recovery', async (req, res) => res.json({ ok: true, items: [] }));
};
