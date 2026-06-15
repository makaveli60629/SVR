const LABEL="PHASE-250-LOBBY-FINAL-TABLE-SEAT-LOCK";
const FINISH_LAYERS=[
"./phase241_single_lobby_layer_cleanup_lock.js?v=250a",
"./phase244_finished_palace_lobby_build_lock.js?v=250b",
"./phase245_lobby_organization_texture_cleanup_lock.js?v=250c",
"./phase246_pillar_storefront_alignment_lock.js?v=250d",
"./phase247_material_texture_lock.js?v=250e",
"./phase248_quest_performance_readability_lock.js?v=250f",
"./phase249_geometry_smoothness_lock.js?v=250g",
"./phase250_lobby_final_table_seat_lock.js?v=250h"
];
function setText(t){const a=document.getElementById("svr-phase-label");if(a)a.textContent=t;const b=document.getElementById("status");if(b)b.textContent=t;}
function ready(){return !!(window.__SVR_GAME_READY__||window.__SVR_SCENE__||window.__SVR_RENDERER__||document.querySelector("canvas"));}
function hideBoot(){const b=document.getElementById("bootFallback");if(b){b.style.opacity="0";b.style.pointerEvents="none";setTimeout(()=>b.style.display="none",420);}}
async function boot(){window.SVR_PHASE250={build:LABEL,active:true,siteTouched:false};window.SVR_LOCKED_FINAL_BUILD=LABEL;try{document.title=`SVR Poker • ${LABEL}`;}catch{} setText("PHASE 250 ACTIVE • FINISHED LOBBY TABLE"); const loaded=[]; for(const u of FINISH_LAYERS){try{await import(u);loaded.push(u);}catch(e){console.warn("SVR phase250 import skipped",u,e);}} window.SVR_PHASE250.loadedFinishLayers=loaded; let n=0; const timer=setInterval(()=>{n++; if(ready()||n>100){if(ready()){window.__SVR_GAME_READY__=true;setText("PHASE 250 ACTIVE • FINISHED LOBBY READY");hideBoot();}else setText("PHASE 250 ACTIVE • SAFE ENTRY WAITING"); clearInterval(timer);}},200);}
boot();
