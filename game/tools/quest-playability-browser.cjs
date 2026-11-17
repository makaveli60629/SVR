const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.SVR_TEST_BASE||'http://127.0.0.1:8000';
const out=process.env.SVR_TEST_ARTIFACTS||'/tmp/svr-quest-browser';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.SVR_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const results={};
 try{
  const page=await browser.newPage({viewport:{width:960,height:640},ignoreHTTPSErrors:process.env.SVR_TEST_IGNORE_HTTPS_ERRORS==='1'});
  let errors=[];const httpErrors=[];results.errors=errors;results.httpErrors=httpErrors;
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('response',r=>{if(r.status()>=400)httpErrors.push(`${r.status()} ${r.url()}`)});
  await page.addInitScript(()=>{window.SVR_POKER_QA_PASSIVE_BOTS=true;window.addEventListener('svr:boot-progress',e=>console.log('BOOT',e.detail.percent,e.detail.message));});
  page.on('console',m=>{if(m.text().startsWith('BOOT'))console.log(m.text())});
  await page.goto(base+'/game/quest-lobby.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('lobby-ready'),null,{timeout:120000});
  results.lobby=await page.evaluate(()=>window.SVR_PHASE467_QUEST_LOBBY_QA());
  assert.equal(results.lobby.pass,true);
  const boneNames=await page.evaluate(()=>[...window.SVR_PHASE467_LOBBY_TABLE_DEALER.dealer.bones.keys()]);
  results.dealerBones=boneNames;
  await page.screenshot({path:path.join(out,'lobby.png')});
  console.log('PASS: lobby rendered, table/dealer/visibility QA and poker-room route.');
  await page.getByRole('link',{name:'POKER ROOM',exact:true}).click();
  await page.waitForFunction(()=>document.body.classList.contains('quest-ready')||document.body.classList.contains('boot-failed'),null,{timeout:180000});
  results.boot=await page.evaluate(()=>({classes:document.body.className,status:document.getElementById('safeStatus')?.textContent,qa:window.SVR_PHASE396_BOOT_QA?.()}));
  assert.ok(results.boot.classes.includes('quest-ready'),results.boot.status||JSON.stringify(results.boot.qa?.phase455TableFirst));
  for(let steps=0;steps<120;steps++){
   const s=await page.evaluate(()=>{const s=window.SVR_PHASE336_POKER_STATE;return {phase:s.phase,waiting:s.waitingHuman,hand:s.handNo}});
   if(s.phase==='showdown'){results.completedHand=s.hand;break;}
   if(s.waiting)assert.equal(await page.evaluate(()=>window.SVR_POKER_ACTION('checkcall')),true);
   await page.waitForTimeout(200);
  }
  assert.ok(results.completedHand,'one complete hand must reach showdown');
  results.settlement=await page.evaluate(()=>window.SVR_RUN_PHASE336_POKER_AUDIT());
  assert.equal(results.settlement.community.length,5);
  assert.equal(results.settlement.burnCount,3);
  assert.equal(await page.evaluate(()=>window.SVR_POKER_NEXT_HAND()),true);
  assert.equal(await page.evaluate(()=>window.SVR_PHASE336_POKER_STATE.handNo),results.completedHand+1);
  await page.waitForTimeout(1800);
  await page.screenshot({path:path.join(out,'poker-room.png')});
  console.log('PASS: poker room ready, full hand, showdown and next hand.');
  assert.deepEqual(errors,[],'normal lobby and room must have no page or console errors');
  assert.deepEqual(httpErrors.filter(x=>!x.endsWith('/favicon.ico')),[],'game assets must load');
  // An import failure must leave an actionable status and the poker route.
  await page.route('**/modules/quest_lobby_runtime.js*',r=>r.abort());
  await page.goto(base+'/game/quest-lobby.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('lobby-failed'));
  assert.equal(await page.locator('#retryBtn').isVisible(),true);
  assert.equal(await page.getByRole('link',{name:'POKER ROOM',exact:true}).isVisible(),true);
  results.failureRecovery=true;
  results.expectedRecoveryErrors=errors.slice();
  results.errors=[];
  results.passed=true;
  console.log('PASS: blocked lobby module exposes retry and Poker Room.');
  results.httpErrors=httpErrors;
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 }finally{await browser.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
