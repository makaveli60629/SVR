/* PHASE-419-ADMIN-DATABASE-BOOTSTRAP-LOCK */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const BUILD='PHASE-419-ADMIN-DATABASE-BOOTSTRAP-LOCK';
const DATABASE_URL=process.env.DATABASE_URL||'';
const USERNAME=String(process.env.ADMIN_USERNAME||'admin').trim().toLowerCase();
const EMAIL=String(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
const DISPLAY_NAME=String(process.env.ADMIN_DISPLAY_NAME||'SVR Owner').trim().slice(0,100);
const PASSWORD=String(process.env.ADMIN_INITIAL_PASSWORD||'');
const NODE_ENV=String(process.env.NODE_ENV||'development').toLowerCase();
const SSL_REJECT_UNAUTHORIZED=process.env.DATABASE_SSL_REJECT_UNAUTHORIZED==null
  ? NODE_ENV==='production'
  : String(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED).toLowerCase()==='true';
const SCHEMA_SQL=fs.readFileSync(path.join(__dirname,'sql','001_site_admin_schema.sql'),'utf8');
function fail(message){console.error(`[${BUILD}] ${message}`);process.exitCode=1}
async function main(){
  if(!DATABASE_URL)return fail('DATABASE_URL is required. No database change was made.');
  if(!/^[a-z0-9._-]{3,64}$/.test(USERNAME))return fail('ADMIN_USERNAME must be 3-64 characters using letters, numbers, dot, underscore or dash.');
  if(!PASSWORD)return fail('ADMIN_INITIAL_PASSWORD is required as a private environment variable. No password is committed to GitHub.');
  if(NODE_ENV==='production'&&PASSWORD.length<12)return fail('Production bootstrap refuses passwords shorter than 12 characters. Use a stronger temporary password and change it after first login.');
  const pool=new Pool({connectionString:DATABASE_URL,ssl:{rejectUnauthorized:SSL_REJECT_UNAUTHORIZED},connectionTimeoutMillis:15000});
  try{
    await pool.query(SCHEMA_SQL);
    const existing=await pool.query('SELECT id, username, email, role, is_active, must_change_password FROM admin_users WHERE username=$1 LIMIT 1',[USERNAME]);
    if(existing.rows.length){
      console.log(JSON.stringify({ok:true,build:BUILD,created:false,admin:{username:existing.rows[0].username,email:existing.rows[0].email||null,role:existing.rows[0].role,isActive:existing.rows[0].is_active,mustChangePassword:existing.rows[0].must_change_password}},null,2));
      return;
    }
    const result=await pool.query(`
      INSERT INTO admin_users (username,email,display_name,password_hash,role,is_active,must_change_password)
      VALUES ($1,NULLIF($2,''),$3,crypt($4,gen_salt('bf',12)),'owner',TRUE,TRUE)
      RETURNING username,email,display_name,role,is_active,must_change_password,created_at
    `,[USERNAME,EMAIL,DISPLAY_NAME,PASSWORD]);
    const row=result.rows[0];
    console.log(JSON.stringify({ok:true,build:BUILD,created:true,admin:{username:row.username,email:row.email||null,displayName:row.display_name,role:row.role,isActive:row.is_active,mustChangePassword:row.must_change_password,createdAt:row.created_at},note:'Password hash stored in database. Plain password was not written to repository output.'},null,2));
  }finally{await pool.end().catch(()=>{})}
}
main().catch(error=>fail(error?.message||String(error)));
