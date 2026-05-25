const express = require('express');
const app = express();
app.use(express.json({limit:'1mb'}));
const rows=[];
app.get('/api/health',(req,res)=>res.json({status:'ok', build:'PHASE-210-BOOT-CACHE-MARKER-ALIGNMENT-LOCK'}));
app.post('/api/game/boot-cache-health',(req,res)=>{rows.push({...req.body, at:new Date().toISOString()}); res.json({ok:true,count:rows.length});});
app.get('/api/game/boot-cache-health',(req,res)=>res.json(rows.slice(-30).reverse()));
app.listen(process.env.PORT||8080,()=>console.log('SVR Phase 210 backend starter running'));
