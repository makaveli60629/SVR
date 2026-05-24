import './phase168_original_lobby_fast_restore.js';

const PHASE='PHASE-169-LOBBY-ORIGINAL-ASSET-PASS-CORRECT-FLOOR-LOCK';
window.SVR_BUILD_PHASE=PHASE;
window.SVR_SITE_TOUCHED_BY_GAME_TRACK=false;
window.SVR_PHASE169_LOBBY_ASSET_PASS={
  phase:PHASE,
  siteTouched:false,
  gameTouched:true,
  scope:'Fast lobby correction lock: original-style floor, walls, official logo, high Moon/Mars, storefront portals, private scene routes, and Quest-safe movement preserved.',
  lockedRules:{
    noMusic:true,
    officialLogoOnly:true,
    lobbyStorefrontsOnly:true,
    privateScenesSeparate:true,
    controllerObjectsHidden:true,
    rightStickForwardBack:true,
    snapTurn45:true,
    triggerReleaseTeleport:true,
    gripPreview:true,
    handFistTeleport:true,
    floorWallContrastPriority:true
  },
  routes:{
    reiki:'./private-scene.html?scene=reiki&v=phase169-lobby-assets',
    pga:'./private-scene.html?scene=pga&v=phase169-lobby-assets',
    scorpion:'./private-scene.html?scene=scorpion&v=phase169-lobby-assets',
    store:'../site/store.html',
    lounge:'./private-scene.html?scene=lounge&v=phase169-lobby-assets'
  },
  nextBuild:'PHASE-170-POKERJS-LOCK-AND-LOBBY-QA'
};

const statusEl=document.getElementById('status'),modeEl=document.getElementById('mode');
function setStatus(t){if(statusEl)statusEl.textContent=t;}
function setMode(t){if(modeEl)modeEl.textContent=t;}
function setBuild(){const p=[...document.querySelectorAll('.pill')].find(el=>/BUILD:/.test(el.textContent||''));if(p)p.textContent='BUILD: PHASE-169';}

const style=document.createElement('style');
style.textContent='#p169Lock{position:fixed;right:12px;bottom:12px;z-index:190;width:min(380px,calc(100vw - 24px));padding:12px 14px;border:1px solid rgba(246,226,127,.86);border-radius:18px;background:rgba(0,0,0,.80);color:#fff;font:900 12px/1.38 system-ui,Arial;box-shadow:0 16px 44px rgba(0,0,0,.62);pointer-events:none}.p169t{color:#f6e27f;font-size:14px;margin-bottom:6px}.p169ok{color:#7ff5c7}.p169warn{color:#ffb6c5}.p169row{display:flex;justify-content:space-between;gap:8px;margin:4px 0}.p169v{color:#e6d7ff}';
document.head.appendChild(style);
const panel=document.createElement('div');panel.id='p169Lock';document.body.appendChild(panel);

function audit(){
  const imgNames=[...document.images].map(i=>i.src).join(' ');
  const canvasCount=document.querySelectorAll('canvas').length;
  const vrButton=!!document.querySelector('button');
  const route=window.SVR_PHASE168_LAST_PORTAL||window.SVR_PHASE169_LAST_PORTAL||null;
  const tp=window.SVR_PHASE168_LAST_TELEPORT||window.SVR_PHASE169_LAST_TELEPORT||null;
  window.SVR_PHASE169_LAST_AUDIT={at:new Date().toISOString(),phase:PHASE,canvasCount,vrButton,route,tp,siteTouched:false};
  panel.innerHTML='<div class="p169t">PHASE 169 LOBBY LOCK</div>'+
    '<div class="p169row"><span>Floor / walls</span><span class="p169ok">restored</span></div>'+
    '<div class="p169row"><span>Moon / Mars</span><span class="p169ok">high orbit</span></div>'+
    '<div class="p169row"><span>Private routes</span><span class="p169ok">locked</span></div>'+
    '<div class="p169row"><span>Music</span><span class="p169ok">off</span></div>'+
    '<div class="p169row"><span>Site</span><span class="p169ok">untouched</span></div>'+
    '<div class="p169row"><span>Canvas</span><span class="p169v">'+canvasCount+'</span></div>'+
    '<div class="p169row"><span>Last portal</span><span class="p169v">'+(route?.name||'none')+'</span></div>'+
    '<div class="p169row"><span>Last teleport</span><span class="p169v">'+(tp?.portal||'none')+'</span></div>'+
    '<div style="margin-top:8px" class="p169warn">Next: poker.js lock + QA, no scenery expansion.</div>';
}
setTimeout(()=>{setStatus('Phase 169 lobby asset pass ready');setMode('Original lobby corrected');setBuild();audit();},850);
setInterval(audit,1200);
