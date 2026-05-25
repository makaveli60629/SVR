module.exports = function registerPostDeployChecklist(app) {
  app.post('/api/game/post-deploy-checklist', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/post-deploy-checklist', async (req, res) => res.json({ ok: true, items: [] }));
};
