const LABEL="PHASE-254-JOIN-TABLE-FLOW-LOCK";
const FINISH_LAYERS=[
"./phase241_single_lobby_layer_cleanup_lock.js?v=254a",
"./phase244_finished_palace_lobby_build_lock.js?v=254b",
"./phase245_lobby_organization_texture_cleanup_lock.js?v=254c",
"./phase246_pillar_storefront_alignment_lock.js?v=254d",
"./phase247_material_texture_lock.js?v=254e",
"./phase248_quest_performance_readability_lock.js?v=254f",
"./phase249_geometry_smoothness_lock.js?v=254g",
"./phase250_lobby_final_table_seat_lock.js?v=254h",
"./phase251_portal_final_routing_lock.js?v=254i",
"./phase252_final_lobby_audit_cleanup_lock.js?v=254j",
"./phase253_interaction_validation_lock.js?v=254k",
"./phase254_join_table_flow_lock.js?v=254l"
];
function setText(t){const a=document.getElementById("svr-phase-label");if(a)a.textContent=t;const b=document.getElementById("status");if(b)b.textContent=t;}
function ready(){return !!(window.__SVR_GAME_READY__||window.__SVR_SCENE__||window.__SVR_RENDERER__||document.querySelector("canvas"));}
function hideBoot(){const b=document.getElementById("bootFallback");if(b){b.style.opacity="0";b.style.pointerEvents="none";setTimeout(()=>b.style.display="none",420);}}
async function boot(){window.SVR_PHASE254={build:LABEL,active:true,siteTouched:false};window.SVR_LOCKED_FINAL_BUILD=LABEL;try{document.title=`SVR Poker • ${LABEL}`;}catch{} setText("PHASE 254 ACTIVE • JOIN TABLE FLOW"); const loaded=[]; for(const u of FINISH_LAYERS){try{await import(u);loaded.push(u);}catch(e){console.warn("SVR phase254 import skipped",u,e);}} window.SVR_PHASE254.loadedFinishLayers=loaded; let n=0; const timer=setInterval(()=>{n++; if(ready()||n>100){if(ready()){window.__SVR_GAME_READY__=true;setText("PHASE 254 ACTIVE • TABLE JOIN READY");hideBoot();}else setText("PHASE 254 ACTIVE • SAFE ENTRY WAITING"); clearInterval(timer);}},200);}
boot();
