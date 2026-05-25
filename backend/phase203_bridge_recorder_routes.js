// Phase 203 optional Express routes. Mount from server.js if desired.
// No secrets in this file.
module.exports = function registerPhase203BridgeRecorderRoutes(app, sqlPool) {
  app.post('/api/game/bridge-recorder', async (req, res) => {
    try {
      const body = req.body || {};
      const build = String(body.build || 'PHASE-203-ENTERPRISE-BRIDGE-RECORDER-FIX-LOCK');
      const eventType = String(body.type || 'bridge-recorder');
      if (sqlPool && sqlPool.request) {
        await sqlPool.request()
          .input('BuildLabel', build)
          .input('EventType', eventType)
          .input('Payload', JSON.stringify(body.payload || body))
          .query('INSERT INTO dbo.GameBridgeRecorderEvents(BuildLabel, EventType, Payload) VALUES(@BuildLabel, @EventType, @Payload)');
      }
      res.json({ ok: true, build, eventType });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
};
