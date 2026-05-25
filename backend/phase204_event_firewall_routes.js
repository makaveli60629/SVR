// SVR Phase 204 event firewall starter routes.
// Wire into Express after authentication/admin policy is finalized.
const express = require('express');
const router = express.Router();

router.post('/api/game/event-firewall', async (req, res) => {
  res.json({ ok: true, stored: false, note: 'Phase 204 starter route. Wire to Azure SQL EventFirewallReports table.' });
});

router.get('/api/game/event-firewall', async (req, res) => {
  res.json({ ok: true, items: [], note: 'Phase 204 starter route.' });
});

module.exports = router;
