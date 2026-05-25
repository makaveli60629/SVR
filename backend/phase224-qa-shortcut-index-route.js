module.exports = function registerQaShortcutIndex(app) {
  app.post('/api/game/qa-shortcut-index', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/qa-shortcut-index', async (req, res) => res.json({ ok: true, items: [] }));
};
