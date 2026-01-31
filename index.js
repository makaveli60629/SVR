import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

const diag = initDiagnostics({
  build: 'SCARLETT_PERMANENT_NOBOOT_SPAWNLOCK_V1',
  href: location.href,
  ua: navigator.userAgent,
});

const $ = (id)=>document.getElementById(id);

function setDiagFont(px){
  const v = Math.max(12, Math.min(26, px|0));
  document.documentElement.style.setProperty('--diag-font', v + 'px');
  diag.log(`[hud] diag font = ${v}px`);
}

async function purgeCaches(){
  diag.warn('== PURGE START ==');
  try{
    if ('serviceWorker' in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      diag.log(`SW regs: ${regs.length}`);
      for (const r of regs) await r.unregister();
    }
    if ('caches' in window){
      const keys = await caches.keys();
      diag.log(`caches: ${keys.length}`);
      for (const k of keys) await caches.delete(k);
    }
    diag.warn('== PURGE DONE ==');
  }catch(e){
    diag.error('[purge] ' + (e?.message || e));
  }
}

(async()=>{
  diag.log('[boot] js running ✅');

  $('btnEnterVR')?.addEventListener('click', ()=> window.SCARLETT?.enterVR?.());
  $('btnResetSpawn')?.addEventListener('click', ()=> window.SCARLETT?.resetSpawn?.());
  $('btnToggleHUD')?.addEventListener('click', ()=>{
    const hud = $('hud');
    hud?.classList.toggle('hud--hidden');
    $('btnToggleHUD').textContent = hud?.classList.contains('hud--hidden') ? 'Show HUD' : 'Hide HUD';
  });

  let current = 16;
  $('btnTextPlus')?.addEventListener('click', ()=> { current+=2; setDiagFont(current); });
  $('btnTextMinus')?.addEventListener('click', ()=> { current-=2; setDiagFont(current); });
  setDiagFont(current);

  $('btnPurge')?.addEventListener('click', async()=>{
    await purgeCaches();
  });

  $('btnHardReload')?.addEventListener('click', ()=>{
    const u = new URL(location.href);
    u.searchParams.set('v', String(Date.now()));
    location.replace(u.toString());
  });

  try{
    await Spine.start({ diag });
    diag.log('[boot] spine started ✅');
    diag.render(window.SCARLETT?.getReport?.() || '(report unavailable)');
  }catch(e){
    diag.error('[boot] spine failed: ' + (e?.stack || e?.message || e));
  }
})();
