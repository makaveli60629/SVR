/**
 * /index.js — PERMANENT ROOT BOOT (FIXED)
 * IMPORTANT:
 * - NO "three" package imports here (GitHub Pages can't resolve it)
 * - Spine already imports Three from CDN.
 */
import { initDiagnostics } from './diagnostics.js';
import { Spine } from './spine.js';

function $(id){ return document.getElementById(id); }

function hardReload(){
  const url = new URL(location.href);
  url.searchParams.set('v', String(Date.now()));
  location.replace(url.toString());
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch{
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
    build: 'SCARLETT_ROOT_BOOT_FIXED_NO_THREE',
    href: location.href,
    ua: navigator.userAgent
  });

  diag.log('[boot] module JS running ✅');
  diag.log('[boot] starting spine…');

  $('btnEnterVR')?.addEventListener('click', async ()=>{
    diag.log('[ui] Enter VR');
    try{ await Spine.enterVR(); } catch(e){ diag.error('[EnterVR] ' + (e?.message || e)); }
  });

  $('btnReset')?.addEventListener('click', ()=>{
    diag.log('[ui] Reset Spawn');
    try{ Spine.resetSpawn(); } catch(e){ diag.error('[Reset] ' + (e?.message || e)); }
  });

  $('btnHide')?.addEventListener('click', ()=>{
    const hidden = !$('hud')?.classList.contains('hud--hidden');
    setHudHidden(hidden);
    diag.log(hidden ? '[ui] HUD hidden' : '[ui] HUD shown');
  });

  $('btnHard')?.addEventListener('click', ()=>{
    diag.log('[ui] Hard Reload');
    hardReload();
  });

  $('btnCopy')?.addEventListener('click', async ()=>{
    const report = Spine.getReport();
    await copyText(report);
    diag.log('[ui] Report copied ✅');
  });

  $('btnBoot')?.addEventListener('click', async ()=>{
    diag.log('[ui] Boot Tools');
    try{
      await Spine.start({ diag });
      diag.log('[boot] Spine started ✅');
    }catch(e){
      diag.error('[boot] Spine.start failed: ' + (e?.message || e));
    }
  });

  // auto-start
  try{
    await Spine.start({ diag });
    diag.log('[boot] ready ✅');
  }catch(e){
    diag.error('[boot] auto-start failed: ' + (e?.message || e));
    diag.log('[boot] tap Boot Tools');
  }
}

boot();
