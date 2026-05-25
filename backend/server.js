import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors({ origin: process.env.ALLOWED_ORIGIN === '*' ? true : (process.env.ALLOWED_ORIGIN || true) }));
app.use(express.json({ limit: '1mb' }));
let pool;
async function getPool(){ if(!process.env.AZURE_SQL_CONNECTION_STRING) throw new Error('Missing AZURE_SQL_CONNECTION_STRING'); if(!pool) pool = await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING); return pool; }
app.get('/api/health', async (_req,res)=>{ try{ await getPool(); res.json({status:'ok', database:'connected', phase:196}); } catch(err){ res.status(200).json({status:'error', database:'failed', phase:196, message:err.message}); }});
app.post('/api/game/tester-feedback', async (req,res)=>{ try{ const db=await getPool(); const body=JSON.stringify(req.body||{}); await db.request().input('Payload', sql.NVarChar(sql.MAX), body).query("INSERT INTO GameTesterFeedback(PayloadJson) VALUES(@Payload)"); res.json({ok:true}); } catch(err){ res.status(500).json({ok:false, error:err.message}); }});
app.get('/api/game/tester-feedback', async (req,res)=>{ try{ const db=await getPool(); const limit=Math.min(parseInt(req.query.limit||'30',10)||30,100); const result=await db.request().input('Limit', sql.Int, limit).query("SELECT TOP (@Limit) Id, CreatedAt, PayloadJson FROM GameTesterFeedback ORDER BY Id DESC"); res.json({ok:true, items:result.recordset}); } catch(err){ res.status(500).json({ok:false, error:err.message}); }});
app.listen(PORT, ()=> console.log(`SVR Phase 196 backend starter running on ${PORT}`));
