// Phase 213 optional Express route helper
export function registerBootRouteRecoveryRoutes(app, pool){
  app.post('/api/game/boot-route-recovery', async (req,res)=>{
    const payload = JSON.stringify(req.body || {});
    try {
      if (pool) await pool.request().input('payload', payload).query("INSERT INTO BootRouteRecoveryReports (Payload) VALUES (@payload)");
      res.json({ ok:true });
    } catch(error){ res.status(500).json({ ok:false, error:error.message }); }
  });
  app.get('/api/game/boot-route-recovery', async (req,res)=>{
    res.json({ ok:true, message:'Boot route recovery endpoint placeholder. Wire to Azure SQL pool in production.' });
  });
}
