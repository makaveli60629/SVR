import * as THREE from "three";

const LABEL = "PHASE-307-SCORPION-ACTION-STATE-FEEDBACK-LOCK";
const ROOT_NAME = "PHASE307_SCORPION_ACTION_STATE_ROOT";
let installed = false;
let state = {
  build: LABEL,
  active: true,
  hand: 1,
  street: "Preflop",
  pot: 0,
  currentBet: 50,
  playerChips: 1000,
  playerStatus: "Waiting",
  lastAction: "None",
  playMoneyOnly: true,
  siteTouched: false,
  publicRootTouched: false
};
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function clamp(v){ return Math.max(0, Number(v || 0)); }
function texture(){
  const c=document.createElement("canvas"); c.width=980; c.height=420;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03040a"; ctx.fillRect(0,0,980,420);
  ctx.strokeStyle="#7ffcff"; ctx.lineWidth=10; ctx.strokeRect(24,24,932,372);
  ctx.fillStyle="rgba(127,252,255,.10)"; ctx.fillRect(52,52,876,74);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#ffffff"; ctx.font="900 46px system-ui,Arial"; ctx.fillText("SCORPION ACTION STATE",490,88);
  ctx.fillStyle="#ffd98a"; ctx.font="900 34px system-ui,Arial"; ctx.fillText(`Hand ${state.hand} • ${state.street}`,490,154);
  ctx.fillStyle="#e8f4ff"; ctx.font="800 30px system-ui,Arial"; ctx.fillText(`Pot: ${state.pot} chips   Bet: ${state.currentBet}   Stack: ${state.playerChips}`,490,220);
  ctx.fillStyle="#7ffcff"; ctx.font="800 28px system-ui,Arial"; ctx.fillText(`Status: ${state.playerStatus}`,490,278);
  ctx.fillStyle="#ffffff"; ctx.font="700 23px system-ui,Arial"; ctx.fillText(`Last action: ${state.lastAction} • play-money demo only`,490,338);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function clearPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return;
  const old=scene.getObjectByName(ROOT_NAME); if(old) old.parent?.remove(old);
}
function showPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  clearPanel();
  const root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(12,0,-6.45); scene.add(root);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.55,1.52),new THREE.MeshBasicMaterial({map:texture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE307_SCORPION_ACTION_STATE_PANEL"; panel.position.set(0,2.48,0); panel.renderOrder=305; root.add(panel);
  const potRing=new THREE.Mesh(new THREE.RingGeometry(.36,.54,72),new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.50,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  potRing.name="PHASE307_ACTION_STATE_POT_RING"; potRing.rotation.x=-Math.PI/2; potRing.position.set(0,.08,1.08); root.add(potRing);
  return true;
}
function resetHand(){
  state.hand += 1;
  state.street = "Preflop";
  state.pot = 0;
  state.currentBet = 50;
  state.playerStatus = "New hand";
  state.lastAction = "Next Hand";
}
function applyAction(detail){
  if(!detail?.action) return null;
  const action = detail.action;
  if(action === "fold"){
    state.playerStatus = "Folded";
    state.lastAction = "Fold";
  } else if(action === "check_call"){
    const call = Math.min(state.currentBet, state.playerChips);
    state.playerChips = clamp(state.playerChips - call);
    state.pot += call;
    state.playerStatus = call > 0 ? "Called" : "Checked";
    state.lastAction = call > 0 ? `Call ${call}` : "Check";
    state.currentBet = 0;
  } else if(action === "raise"){
    const raise = Math.min(100, state.playerChips);
    state.playerChips = clamp(state.playerChips - raise);
    state.pot += raise;
    state.currentBet = 100;
    state.playerStatus = "Raised";
    state.lastAction = `Raise ${raise}`;
  } else if(action === "all_in"){
    const shove = state.playerChips;
    state.pot += shove;
    state.playerChips = 0;
    state.currentBet = shove;
    state.playerStatus = "All-In";
    state.lastAction = `All-In ${shove}`;
  } else if(action === "next_hand"){
    resetHand();
  }
  state.checkedAt = new Date().toISOString();
  window.SVR_PHASE307_SCORPION_ACTION_STATE = {...state};
  window.SVR_PHASE307_LAST_ACTION_STATE = {...state, source:detail.source || "unknown"};
  try{ window.dispatchEvent(new CustomEvent("svr-scorpion-action-state-updated",{detail:window.SVR_PHASE307_LAST_ACTION_STATE})); }catch{}
  showPanel();
  status(`Scorpion state: ${state.lastAction}`);
  return state;
}
function activate(){
  window.SVR_PHASE307_SCORPION_ACTION_STATE = {...state};
  showPanel();
}
function install(){
  if(installed) return true;
  installed = true;
  window.addEventListener("svr-scorpion-player-action", e=>applyAction(e.detail));
  window.addEventListener("svr-scorpion-seat-snap-complete", activate);
  window.addEventListener("svr-scorpion-seat-reserved", activate);
  window.SVR_PHASE307_SCORPION_ACTION_STATE_FEEDBACK_LOCK={
    build:LABEL,
    active:true,
    listensFor:"svr-scorpion-player-action",
    emits:"svr-scorpion-action-state-updated",
    phase308Chained:true,
    playMoneyOnly:true,
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
setInterval(()=>{install(); if(window.SVR_PHASE307_SCORPION_ACTION_STATE) showPanel();},6000);
import("./phase308_scorpion_bot_response_lock.js?v=phase308-bot-response").catch(e=>{window.SVR_PHASE308_IMPORT_ERROR=String(e?.message||e);});
