import * as THREE from "three";

const LABEL = "PHASE-308-SCORPION-BOT-RESPONSE-LOCK";
const ROOT_NAME = "PHASE308_SCORPION_BOT_RESPONSE_ROOT";
const BOTS = ["Nova", "Claudia", "Eric", "Maya", "Atlas"];
let installed = false;
let botState = {
  build: LABEL,
  active: true,
  hand: 1,
  street: "Preflop",
  pot: 0,
  responses: [],
  lastPlayerAction: "None",
  playMoneyOnly: true,
  siteTouched: false,
  publicRootTouched: false
};
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function nextStreet(street){
  if(street === "Preflop") return "Flop";
  if(street === "Flop") return "Turn";
  if(street === "Turn") return "River";
  if(street === "River") return "Showdown";
  return "Preflop";
}
function botDecision(bot, idx, actionState){
  const playerAction = actionState?.lastAction || "None";
  if(/Fold/i.test(playerAction)) return { bot, action:"check", chips:0, note:"player folded" };
  if(/All-In/i.test(playerAction)) return { bot, action:idx < 2 ? "call" : "fold", chips:idx < 2 ? 100 : 0, note:"all-in pressure" };
  if(/Raise/i.test(playerAction)) return { bot, action:idx % 2 === 0 ? "call" : "fold", chips:idx % 2 === 0 ? 100 : 0, note:"respond to raise" };
  if(/Call|Check/i.test(playerAction)) return { bot, action:idx === 4 ? "raise" : "check", chips:idx === 4 ? 75 : 0, note:"tempo response" };
  return { bot, action:"check", chips:0, note:"default" };
}
function texture(){
  const c=document.createElement("canvas"); c.width=1024; c.height=460;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03040a"; ctx.fillRect(0,0,1024,460);
  ctx.strokeStyle="#8dffb4"; ctx.lineWidth=10; ctx.strokeRect(24,24,976,412);
  ctx.fillStyle="rgba(141,255,180,.10)"; ctx.fillRect(52,52,920,76);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 46px system-ui,Arial"; ctx.fillText("SCORPION BOT RESPONSE",512,90);
  ctx.fillStyle="#ffd98a"; ctx.font="900 32px system-ui,Arial"; ctx.fillText(`Hand ${botState.hand} • ${botState.street} • Pot ${botState.pot}`,512,154);
  ctx.fillStyle="#e8f4ff"; ctx.font="700 24px system-ui,Arial";
  ctx.fillText(`Player: ${botState.lastPlayerAction}`,512,202);
  ctx.textAlign="left";
  ctx.font="700 24px system-ui,Arial";
  const rows = botState.responses.slice(0,5);
  rows.forEach((r,i)=>{
    const y=252+i*35;
    ctx.fillStyle = r.action === "fold" ? "#ff8cab" : r.action === "raise" ? "#ffd98a" : "#7ffcff";
    ctx.fillText(`${r.bot}: ${r.action.toUpperCase()}${r.chips ? " " + r.chips : ""}  — ${r.note}`,92,y);
  });
  ctx.textAlign="center";
  ctx.fillStyle="#ffffff"; ctx.font="700 21px system-ui,Arial"; ctx.fillText("Deterministic bot demo state • play-money only",512,414);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function clearPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return;
  const old=scene.getObjectByName(ROOT_NAME); if(old) old.parent?.remove(old);
}
function showPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  clearPanel();
  const root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(12,0,-5.28); scene.add(root);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.72,1.68),new THREE.MeshBasicMaterial({map:texture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE308_SCORPION_BOT_RESPONSE_PANEL"; panel.position.set(0,2.48,0); panel.renderOrder=320; root.add(panel);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.32,.48,72),new THREE.MeshBasicMaterial({color:0x8dffb4,transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.name="PHASE308_BOT_RESPONSE_RING"; ring.rotation.x=-Math.PI/2; ring.position.set(0,.08,1.0); root.add(ring);
  return true;
}
function applyBotResponse(actionState){
  if(!actionState) return null;
  const playerAction = actionState.lastAction || actionState.action || "None";
  if(/Next Hand/i.test(playerAction)){
    botState.hand += 1;
    botState.street = "Preflop";
    botState.pot = 0;
    botState.responses = BOTS.map(bot=>({bot, action:"ready", chips:0, note:"new hand"}));
  } else {
    const responses = BOTS.map((bot,idx)=>botDecision(bot,idx,actionState));
    const botChips = responses.reduce((sum,r)=>sum + Number(r.chips || 0),0);
    botState.hand = actionState.hand || botState.hand;
    botState.street = /Showdown/i.test(actionState.street || "") ? "Showdown" : nextStreet(actionState.street || botState.street);
    botState.pot = Number(actionState.pot || botState.pot || 0) + botChips;
    botState.responses = responses;
  }
  botState.lastPlayerAction = playerAction;
  botState.checkedAt = new Date().toISOString();
  window.SVR_PHASE308_SCORPION_BOT_RESPONSE_STATE = {...botState};
  window.SVR_PHASE308_LAST_BOT_RESPONSE = {...botState, source:"svr-scorpion-action-state-updated"};
  try{ window.dispatchEvent(new CustomEvent("svr-scorpion-bot-response-complete",{detail:window.SVR_PHASE308_LAST_BOT_RESPONSE})); }catch{}
  showPanel();
  status(`Scorpion bots responded to ${playerAction}`);
  return botState;
}
function install(){
  if(installed) return true;
  installed = true;
  window.addEventListener("svr-scorpion-action-state-updated", e=>applyBotResponse(e.detail));
  window.SVR_PHASE308_SCORPION_BOT_RESPONSE_LOCK={
    build:LABEL,
    active:true,
    listensFor:"svr-scorpion-action-state-updated",
    emits:"svr-scorpion-bot-response-complete",
    botCount:BOTS.length,
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
setInterval(()=>{install(); if(window.SVR_PHASE308_SCORPION_BOT_RESPONSE_STATE) showPanel();},7000);
