module.exports = function registerHandTeleportPinchDestination(app) {
  app.post('/api/game/hand-teleport-pinch-destination', async (req, res) => res.json({ ok: true, accepted: true }));
  app.get('/api/game/hand-teleport-pinch-destination', async (req, res) => res.json({ ok: true, items: [] }));
};
