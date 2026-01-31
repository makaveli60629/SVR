import { Spine } from './spine.js';

const diagEl = document.getElementById('diag');
const log = (s)=>{ diagEl.textContent += (diagEl.textContent.endsWith('\n')?'':'\n') + s; };

const $ = (id)=>document.getElementById(id);

function setDiagFont(px){
  const v = Math.max(12, Math.min(28, px|0));
  document.documentElement.style.setProperty('--diag-font', v + 'px');
  log(`[hud] diag font = ${v}px`);
}

async function purgeCaches(){
  log('== PURGE START ==');
  try{
    if ('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      log(`SW regs: ${regs.length}`);
      for (const r of regs) await r.unregister();
    }
    if ('caches' in window){
      const keys = await caches.keys();
      log(`caches: ${keys.length}`);
      for (const k of keys) await caches.delete(k);
    }
    log('== PURGE DONE ==');
  }catch(e){
    log('[purge] ' + (e?.message || e));
  }
}

log('[boot] JS LOADED ✅');

$('btnEnterVR')?.addEventListener('click', ()=> window.SCARLETT?.enterVR?.());
$('btnResetSpawn')?.addEventListener('click', ()=> window.SCARLETT?.resetSpawn?.());
$('btnToggleHUD')?.addEventListener('click', ()=>{
  const hud = $('hud');
  hud?.classList.toggle('hud--hidden');
  $('btnToggleHUD').textContent = hud?.classList.contains('hud--hidden') ? 'Show HUD' : 'Hide HUD';
});

let current = 16;
$('btnTextPlus')?.addEventListener('click', ()=> { current += 2; setDiagFont(current); });
$('btnTextMinus')?.addEventListener('click', ()=> { current -= 2; setDiagFont(current); });
setDiagFont(current);

$('btnPurge')?.addEventListener('click', async()=>{ await purgeCaches(); });
$('btnHardReload')?.addEventListener('click', ()=>{
  const u = new URL(location.href);
  u.searchParams.set('v', String(Date.now()));
  location.replace(u.toString());
});

try{
  await Spine.start({
    diag: {
      log,
      warn: (m)=>log('[warn] ' + m),
      error: (m)=>log('[err] ' + m),
    }
  });
  log('[boot] spine started ✅');
}catch(e){
  log('[boot] spine failed ❌');
  log(String(e?.stack || e?.message || e));
}
