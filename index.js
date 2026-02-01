// SVR root index.js (stable)
const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');

function log(msg){
  const s = String(msg);
  if (logEl){
    logEl.textContent += (logEl.textContent.endsWith('\n') ? '' : '\n') + s + '\n';
    logEl.scrollTop = logEl.scrollHeight;
  }
  console.log(s);
}
function setStatus(ok, text){
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.style.background = ok ? 'rgba(0,128,0,.35)' : 'rgba(180,0,0,.35)';
}

window.__SVR_LOG__ = log;

async function probe(){
  const paths = [
    './index.js',
    './js/runtime/spine.js',
    './js/runtime/input.js',
    './js/scarlett1/world.js',
  ];
  log('\n— PROBE PATHS —');
  for (const p of paths){
    try{
      const r = await fetch(p, {cache:'no-store'});
      log(`${p} status=${r.status}`);
    }catch(e){
      log(`${p} fetch error: ${e?.message||e}`);
    }
  }
  log('— END PROBE —\n');
}

async function nuke(){
  log('🧨 NUKE CACHE…');
  try{
    if ('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
      log(`serviceWorker: unregistered ${regs.length}`);
    }
    if ('caches' in window){
      const keys = await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
      log(`caches: deleted ${keys.length}`);
    }
  }catch(e){
    log('NUKE ERROR: ' + (e?.message||e));
  }
  log('✅ NUKE DONE');
}

function hardReload(){
  location.reload(true);
}

function wireButtons(){
  document.getElementById('probePaths')?.addEventListener('click', probe);
  document.getElementById('nukeCache')?.addEventListener('click', async ()=>{
    await nuke();
  });
  document.getElementById('hardReload')?.addEventListener('click', hardReload);
  document.getElementById('resetSpawn')?.addEventListener('click', ()=>window.resetSpawn?.());
  document.getElementById('enterVr')?.addEventListener('click', ()=>window.enterVR?.());

  document.getElementById('avMale')?.addEventListener('click', ()=>window.spawnAvatar?.('male'));
  document.getElementById('avFemale')?.addEventListener('click', ()=>window.spawnAvatar?.('female'));
  document.getElementById('avNinja')?.addEventListener('click', ()=>window.spawnAvatar?.('ninja'));
  document.getElementById('avCombat')?.addEventListener('click', ()=>window.spawnAvatar?.('combat'));
  document.getElementById('avClear')?.addEventListener('click', ()=>window.clearAvatar?.());
}

window.addEventListener('error', (e)=>{
  log(`❌ window error: ${e?.message||e}`);
});
window.addEventListener('unhandledrejection', (e)=>{
  log(`❌ promise rejection: ${e?.reason?.message||e?.reason||e}`);
});

async function boot(){
  wireButtons();

  log('=== SCARLETT DIAGNOSTICS (INLINE BOOT) ===');
  log('href=' + location.href);
  log('origin=' + location.origin);
  log('path=' + location.pathname);
  log('ua=' + navigator.userAgent);
  log('secureContext=' + (window.isSecureContext?'true':'false'));
  log('navigator.xr=' + (!!navigator.xr));

  setStatus(true,'booting…');

  try{
    log('… importing ./js/runtime/spine.js');
    const mod = await import('./js/runtime/spine.js');
    if (!mod?.Spine?.start) throw new Error('Spine.start missing');
    await mod.Spine.start({ log, setStatus });
    setStatus(true,'ready ✅ (VR available)');
    log('✅ boot ok');
  }catch(e){
    setStatus(false,'boot failed ✖');
    log('❌ boot failed: ' + (e?.message||e));
    await probe();
  }
}

if (document.readyState === 'loading'){
  window.addEventListener('DOMContentLoaded', boot, { once:true });
} else {
  boot();
}
