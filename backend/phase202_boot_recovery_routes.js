// Phase 202 boot recovery route scaffold
// Mount inside Express: app.use('/api/game', require('./phase202_boot_recovery_routes'))
const express = require('express');
const router = express.Router();
const reports = [];
router.post('/boot-recovery', (req, res) => { const row = { id: reports.length + 1, at: new Date().toISOString(), body: req.body || {} }; reports.unshift(row); res.json({ ok: true, id: row.id }); });
router.get('/boot-recovery', (req, res) => res.json(reports.slice(0, Number(req.query.limit || 30))));
module.exports = router;
