const LABEL="PHASE-253-INTERACTION-VALIDATION-LOCK";
const FINISH_LAYERS=[
"./phase241_single_lobby_layer_cleanup_lock.js?v=253a",
"./phase244_finished_palace_lobby_build_lock.js?v=253b",
"./phase245_lobby_organization_texture_cleanup_lock.js?v=253c",
"./phase246_pillar_storefront_alignment_lock.js?v=253d",
"./phase247_material_texture_lock.js?v=253e",
"./phase248_quest_performance_readability_lock.js?v=253f",
"./phase249_geometry_smoothness_lock.js?v=253g",
"./phase250_lobby_final_table_seat_lock.js?v=253h",
"./phase251_portal_final_routing_lock.js?v=253i",
"./phase252_final_lobby_audit_cleanup_lock.js?v=253j",
"./phase253_interaction_validation_lock.js?v=253k"
];
function setText(t){const a=document.getElementById("svr-phase-label");if(a)a.textContent=t;const b=document.getElementById("status");if(b)b.textContent=t;}
function ready(){return !!(window.__SVR_GAME_READY__||window.__SVR_SCENE__||window.__SVR_RENDERER__||document.querySelector("canvas"));}
function hideBoot(){const b=document.getElementById("bootFallback");if(b){b.style.opacity="0";b.style.pointerEvents="none";setTimeout(()=>b.style.display="none",420);}}
async function boot(){window.SVR_PHASE253={build:LABEL,active:true,siteTouched:false};window.SVR_LOCKED_FINAL_BUILD=LABEL;try{document.title=`SVR Poker • ${LABEL}`;}catch{} setText("PHASE 253 ACTIVE • INTERACTION VALIDATION"); const loaded=[]; for(const u of FINISH_LAYERS){try{await import(u);loaded.push(u);}catch(e){console.warn("SVR phase253 import skipped",u,e);}} window.SVR_PHASE253.loadedFinishLayers=loaded; let n=0; const timer=setInterval(()=>{n++; if(ready()||n>100){if(ready()){window.__SVR_GAME_READY__=true;setText("PHASE 253 ACTIVE • INTERACTION READY");hideBoot();}else setText("PHASE 253 ACTIVE • SAFE ENTRY WAITING"); clearInterval(timer);}},200);}
boot();
