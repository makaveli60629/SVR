const express = require('express');
const app = express();
const BUILD = 'PHASE-422-PRODUCTION-BACKEND-HEALTH-HARDENING-LOCK';
const port = Number(process.env.PORT || 8080);
const memory = [];
const origins = String(process.env.ALLOWED_ORIGINS || 'https://svrpoker.com,https://www.svrpoker.com').split(',').map(v=>v.trim()).filter(Boolean);
app.disable('x-powered-by');
app.use((req,res,next)=>{
  const origin=String(req.headers.origin||'');
  if(origin&&origins.includes(origin)){
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Access-Control-Allow-Credentials','true');
    res.setHeader('Vary','Origin');
  }else if(origin){
    return res.status(403).json({ok:false,error:'origin_not_allowed'});
  }
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  if(req.method==='OPTIONS'){
    res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type,X-SVR-Client');
    return res.status(204).end();
  }
  next();
});
app.use(express.json({ limit: '256kb' }));
app.get('/api/health', (_req,res)=>res.json({status:'ok',build:BUILD,service:'svr-backend-health',time:new Date().toISOString(),databaseConfigured:Boolean(process.env.DATABASE_URL||process.env.DB_SERVER),databaseVerified:false,accountApiConfigured:Boolean(process.env.PLAYER_ACCOUNT_API_BASE),tournamentApiConfigured:Boolean(process.env.TOURNAMENT_API_BASE)}));
app.post('/api/game/marker-health', (req,res)=>{memory.unshift({at:new Date().toISOString(),body:req.body||{}});if(memory.length>500)memory.length=500;res.status(202).json({ok:true,stored:true});});
app.get('/api/game/marker-health', (req,res)=>{const raw=Number.parseInt(String(req.query.limit||30),10),limit=Number.isFinite(raw)?Math.max(1,Math.min(100,raw)):30;res.json({ok:true,count:Math.min(memory.length,limit),markers:memory.slice(0,limit)});});
app.use((_req,res)=>res.status(404).json({ok:false,error:'not_found'}));
app.use((_err,_req,res,_next)=>res.status(500).json({ok:false,error:'internal_error'}));
const server=app.listen(port, ()=>console.log(`${BUILD} running on ${port}`));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
