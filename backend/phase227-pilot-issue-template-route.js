module.exports = function registerPilotIssueTemplate(app) {
  app.post('/api/game/pilot-issue-template', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/pilot-issue-template', async (req, res) => res.json({ ok: true, items: [] }));
};
