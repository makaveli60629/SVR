import * as THREE from "three";

const LABEL = "PHASE-310-SCORPION-POKER-LOOP-QA-LOCK";
const ROOT_NAME = "PHASE310_SCORPION_POKER_LOOP_QA_ROOT";
const STEPS = [
  "table_selected",
  "join_flow",
  "seat_reserved",
  "seat_snap",
  "action_hud",
  "action_state",
  "bot_response",
  "showdown_payout"
];
let installed = false;
const qa = {
  build: LABEL,
  active: true,
  steps: Object.fromEntries(STEPS.map(k=>[k,false])),
  lastEvent: "Waiting",
  complete: false,
  readyForMultiplayerPrototype: false,
  playMoneyOnly: true,
  siteTouched: false,
  publicRootTouched: false
};
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function mark(step, label, detail){
  if(qa.steps[step] !== undefined) qa.steps[step] = true;
  qa.lastEvent = label;
  qa.lastDetail = detail ? { key:detail.key, action:detail.action, title:detail.title, winner:detail.winner, potPaid:detail.potPaid } : null;
  qa.complete = STEPS.every(k=>qa.steps[k]);
  qa.readyForMultiplayerPrototype = qa.complete;
  qa.checkedAt = new Date().toISOString();
  window.SVR_PHASE310_SCORPION_POKER_LOOP_QA_STATE = {...qa, steps:{...qa.steps}};
  showPanel();
  status(`Scorpion QA: ${label}${qa.complete ? " • loop complete" : ""}`);
}
function resetLoop(){
  STEPS.forEach(k=>qa.steps[k]=false);
  qa.lastEvent = "Loop reset";
  qa.complete = false;
  qa.readyForMultiplayerPrototype = false;
  qa.checkedAt = new Date().toISOString();
  window.SVR_PHASE310_SCORPION_POKER_LOOP_QA_STATE = {...qa, steps:{...qa.steps}};
  showPanel();
}
function texture(){
  const c=document.createElement("canvas"); c.width=1080; c.height=500;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03040a"; ctx.fillRect(0,0,1080,500);
  ctx.strokeStyle=qa.complete ? "#8dffb4" : "#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(24,24,1032,452);
  ctx.fillStyle="rgba(141,255,180,.10)"; ctx.fillRect(52,52,976,78);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 45px system-ui,Arial"; ctx.fillText("SCORPION POKER LOOP QA",540,92);
  ctx.fillStyle=qa.complete ? "#8dffb4" : "#ffd98a"; ctx.font="900 30px system-ui,Arial";
  ctx.fillText(qa.complete ? "FULL LOCAL LOOP COMPLETE" : "LOCAL LOOP IN PROGRESS",540,154);
  ctx.textAlign="left"; ctx.font="800 24px system-ui,Arial";
  const labels = {
    table_selected:"Table selected",
    join_flow:"Join / spectate flow",
    seat_reserved:"Seat reservation",
    seat_snap:"Seat snap",
    action_hud:"Action HUD",
    action_state:"Action state",
    bot_response:"Bot response",
    showdown_payout:"Showdown / payout"
  };
  STEPS.forEach((k,i)=>{
    const col = i < 4 ? 90 : 570;
    const row = i < 4 ? i : i-4;
    const y = 214 + row*45;
    ctx.fillStyle = qa.steps[k] ? "#8dffb4" : "#7a8196";
    ctx.fillText(`${qa.steps[k] ? "✓" : "○"} ${labels[k]}`,col,y);
  });
  ctx.textAlign="center";
  ctx.fillStyle="#e8f4ff"; ctx.font="700 22px system-ui,Arial"; ctx.fillText(`Last: ${qa.lastEvent}`,540,410);
  ctx.fillStyle="#ffffff"; ctx.font="700 20px system-ui,Arial"; ctx.fillText("Phase 311 local ghost multiplayer prototype is now chained",540,450);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function clearPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return;
  const old=scene.getObjectByName(ROOT_NAME); if(old) old.parent?.remove(old);
}
function showPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  clearPanel();
  const root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(12,0,-2.82); scene.add(root);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(4.05,1.88),new THREE.MeshBasicMaterial({map:texture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE310_SCORPION_POKER_LOOP_QA_PANEL"; panel.position.set(0,2.50,0); panel.renderOrder=350; root.add(panel);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.36,.58,90),new THREE.MeshBasicMaterial({color:qa.complete?0x8dffb4:0xffd98a,transparent:true,opacity:.52,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.name="PHASE310_QA_RING"; ring.rotation.x=-Math.PI/2; ring.position.set(0,.08,.92); root.add(ring);
  return true;
}
function install(){
  if(installed) return true;
  installed = true;
  window.addEventListener("svr-scorpion-table-selected", e=>mark("table_selected","table selected",e.detail));
  window.addEventListener("svr-scorpion-table-join", e=>mark("join_flow","join flow confirmed",e.detail));
  window.addEventListener("svr-scorpion-seat-reserved", e=>{ mark("seat_reserved","seat reserved",e.detail); mark("action_hud","action HUD armed",e.detail); });
  window.addEventListener("svr-scorpion-seat-snap-complete", e=>mark("seat_snap","seat snap complete",e.detail));
  window.addEventListener("svr-scorpion-player-action", e=>mark("action_hud","player action HUD used",e.detail));
  window.addEventListener("svr-scorpion-action-state-updated", e=>mark("action_state","action state updated",e.detail));
  window.addEventListener("svr-scorpion-bot-response-complete", e=>mark("bot_response","bot response complete",e.detail));
  window.addEventListener("svr-scorpion-showdown-payout-complete", e=>mark("showdown_payout","showdown payout complete",e.detail));
  window.SVR_PHASE310_RESET_SCORPION_QA = resetLoop;
  window.SVR_PHASE310_SCORPION_POKER_LOOP_QA_LOCK={
    build:LABEL,
    active:true,
    steps:STEPS,
    phase311Chained:true,
    nextRecommended:"PHASE-311-LOCAL-TWO-PLAYER-GHOST-MULTIPLAYER-PROTOTYPE",
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  window.SVR_PHASE310_SCORPION_POKER_LOOP_QA_STATE = {...qa, steps:{...qa.steps}};
  showPanel();
  return true;
}
install();
setInterval(()=>{install(); showPanel();},9000);
import("./phase311_local_two_player_ghost_multiplayer_prototype.js?v=phase311-local-ghost").catch(e=>{window.SVR_PHASE311_IMPORT_ERROR=String(e?.message||e);});
