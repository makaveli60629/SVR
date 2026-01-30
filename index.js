/**
 * /index.js — PERMANENT ROOT BOOT
 * Guarantees HUD buttons work + diagnostics + Spine.start().
 */

import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

function $(id){ return document.getElementById(id); }

function hardReload(){
  // cache-bust EVERYTHING (GitHub pages + Android WebView)
  const url = new URL(location.href);
  url.searchParams.set('v', String(Date.now()));
  location.replace(url.toString());
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch{
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand('copy'); }catch{}
    document.body.removeChild(ta);
    return true;
  }
}

function setHudHidden(hidden){
  const hud = $('hud');
  if(!hud) return;
  hud.classList.toggle('hud--hidden', !!hidden);
}

async function boot(){
  const diag = initDiagnostics({
    build: 'SCARLETT_ROOT_BOOT_V1',
    href: location.href,
    ua: navigator.userAgent
  });

  // If JS is running, you will see this instantly:
  diag.log('[boot] JS running ✅');

  // Button wiring
  $('btnEnterVR')?.addEventListener('click', async ()=>{
    diag.log('[ui] Enter VR pressed');
    try{ await Spine.enterVR(); } catch(e){ diag.error('[EnterVR] ' + (e?.message || e)); }
  });

  $('btnReset')?.addEventListener('click', ()=>{
    diag.log('[ui] Reset spawn pressed');
    try{ Spine.resetSpawn(); } catch(e){ diag.error('[Reset] ' + (e?.message || e)); }
  });

  $('btnHide')?.addEventListener('click', ()=>{
    const hidden = !$('hud')?.classList.contains('hud--hidden');
    setHudHidden(hidden);
    diag.log(hidden ? '[ui] HUD hidden' : '[ui] HUD shown');
  });

  $('btnHard')?.addEventListener('click', ()=>{
    diag.log('[ui] Hard reload…');
    hardReload();
  });

  $('btnCopy')?.addEventListener('click', async ()=>{
    const report = Spine.getReport();
    await copyText(report);
    diag.log('[ui] Report copied ✅');
  });

  // Boot Tools = force-start Spine (if it already started, it’ll log)
  $('btnBoot')?.addEventListener('click', async ()=>{
    diag.log('[ui] Boot Tools pressed');
    try{
      await Spine.start({ diag });
      diag.log('[boot] Spine started ✅');
    }catch(e){
      diag.error('[boot] Spine.start failed: ' + (e?.message || e));
      diag.log('[boot] trying hard reload…');
      hardReload();
    }
  });

  // Auto-start once at load:
  try{
    diag.log('[boot] auto-starting spine…');
    await Spine.start({ diag });
    diag.log('[boot] ready ✅');
  }catch(e){
    diag.error('[boot] auto-start failed: ' + (e?.message || e));
    diag.log('[boot] tap "Boot Tools" or "Hard Reload"');
  }
}

boot();
