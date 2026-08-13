const crypto = require('crypto');
const express = require('express');
const app = express();
const BUILD = 'PHASE-422-PRODUCTION-BACKEND-HEALTH-HARDENING-LOCK';
const port = Number(process.env.PORT || 8080);
const memory = [];
const origins = String(process.env.ALLOWED_ORIGINS || 'https://svrpoker.com,https://www.svrpoker.com').split(',').map(v=>v.trim()).filter(Boolean);
app.disable('x-powered-by');
app.use((req,res,next)=>{
  const requestId=String(req.headers['x-request-id']||crypto.randomUUID()).slice(0,128);
  req.requestId=requestId;
  res.setHeader('X-Request-ID',requestId);
  const origin=String(req.headers.origin||'');
  if(origin&&origins.includes(origin)){
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Access-Control-Allow-Credentials','true');
    res.setHeader('Vary','Origin');
  }else if(origin){
    console.warn(JSON.stringify({at:new Date().toISOString(),requestId,event:'origin_denied'}));
    return res.status(403).json({ok:false,error:'origin_not_allowed',requestId});
  }
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  if(req.method==='OPTIONS'){
    res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type,X-SVR-Client,X-Request-ID');
    return res.status(204).end();
  }
  next();
});
app.use(express.json({ limit: '256kb' }));
app.get('/api/health', (req,res)=>{
  const payload={status:'ok',build:BUILD,service:'svr-backend-health',time:new Date().toISOString(),requestId:req.requestId,databaseConfigured:Boolean(process.env.DATABASE_URL||process.env.DB_SERVER),databaseVerified:false,accountApiConfigured:Boolean(process.env.PLAYER_ACCOUNT_API_BASE),tournamentApiConfigured:Boolean(process.env.TOURNAMENT_API_BASE)};
  console.info(JSON.stringify({at:payload.time,requestId:req.requestId,event:'health',status:payload.status}));
  res.json(payload);
});
app.post('/api/game/marker-health', (req,res)=>{memory.unshift({at:new Date().toISOString(),requestId:req.requestId,body:req.body||{}});if(memory.length>500)memory.length=500;res.status(202).json({ok:true,stored:true,requestId:req.requestId});});
app.get('/api/game/marker-health', (req,res)=>{const raw=Number.parseInt(String(req.query.limit||30),10),limit=Number.isFinite(raw)?Math.max(1,Math.min(100,raw)):30;res.json({ok:true,count:Math.min(memory.length,limit),markers:memory.slice(0,limit),requestId:req.requestId});});
app.use((req,res)=>res.status(404).json({ok:false,error:'not_found',requestId:req.requestId}));
app.use((err,req,res,_next)=>{console.error(JSON.stringify({at:new Date().toISOString(),requestId:req.requestId,event:'internal_error'}));res.status(500).json({ok:false,error:'internal_error',requestId:req.requestId});});
const server=app.listen(port, ()=>console.log(`${BUILD} running on ${port}`));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
