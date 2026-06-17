import * as THREE from "three";

const LABEL = "PHASE-309-SCORPION-SHOWDOWN-PAYOUT-LOCK";
const ROOT_NAME = "PHASE309_SCORPION_SHOWDOWN_PAYOUT_ROOT";
const PLAYERS = ["You", "Nova", "Claudia", "Eric", "Maya", "Atlas"];
let installed = false;
let payoutState = {
  build: LABEL,
  active: true,
  hand: 1,
  resolved: false,
  winner: "Pending",
  reason: "Waiting for showdown",
  potPaid: 0,
  playerStack: 1000,
  botStacks: { Nova:1000, Claudia:1000, Eric:1000, Maya:1000, Atlas:1000 },
  playMoneyOnly: true,
  siteTouched: false,
  publicRootTouched: false
};
function status(text){ const el=document.getElementById("status"); if(el) el.textContent=text; }
function score(name, hand){
  let s = hand * 17;
  for(let i=0;i<name.length;i++) s += name.charCodeAt(i) * (i+3);
  return s % 997;
}
function pickWinner(detail){
  const last = detail?.lastPlayerAction || "";
  const folded = /Fold/i.test(last);
  const allIn = /All-In/i.test(last);
  const showdown = /Showdown/i.test(detail?.street || "");
  if(folded){
    const activeBots = (detail?.responses || []).filter(r=>r.action !== "fold");
    return { winner:activeBots[0]?.bot || "Nova", reason:"Player folded" };
  }
  if(showdown || allIn){
    const candidates = ["You", ...(detail?.responses || []).filter(r=>r.action !== "fold").map(r=>r.bot)];
    const hand = Number(detail?.hand || payoutState.hand || 1);
    const winner = candidates.sort((a,b)=>score(b,hand)-score(a,hand))[0] || "You";
    return { winner, reason: allIn ? "All-in resolved" : "Showdown score resolved" };
  }
  return null;
}
function texture(){
  const c=document.createElement("canvas"); c.width=1024; c.height=460;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03040a"; ctx.fillRect(0,0,1024,460);
  ctx.strokeStyle=payoutState.resolved ? "#ffd98a" : "#7ffcff"; ctx.lineWidth=10; ctx.strokeRect(24,24,976,412);
  ctx.fillStyle="rgba(255,217,138,.10)"; ctx.fillRect(52,52,920,76);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 44px system-ui,Arial"; ctx.fillText("SCORPION SHOWDOWN / PAYOUT",512,90);
  ctx.fillStyle="#ffd98a"; ctx.font="900 36px system-ui,Arial"; ctx.fillText(`Winner: ${payoutState.winner}`,512,160);
  ctx.fillStyle="#e8f4ff"; ctx.font="800 29px system-ui,Arial"; ctx.fillText(`Pot paid: ${payoutState.potPaid} chips`,512,218);
  ctx.fillStyle="#7ffcff"; ctx.font="800 26px system-ui,Arial"; ctx.fillText(`Reason: ${payoutState.reason}`,512,274);
  ctx.fillStyle="#ffffff"; ctx.font="700 22px system-ui,Arial"; ctx.fillText(`Your stack: ${payoutState.playerStack} • Hand ${payoutState.hand} • play-money only`,512,334);
  ctx.fillStyle="#8dffb4"; ctx.font="700 20px system-ui,Arial"; ctx.fillText("Next Hand resets pot and keeps table session state",512,398);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function clearPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return;
  const old=scene.getObjectByName(ROOT_NAME); if(old) old.parent?.remove(old);
}
function showPanel(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  clearPanel();
  const root=new THREE.Group(); root.name=ROOT_NAME; root.position.set(12,0,-4.08); scene.add(root);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.85,1.72),new THREE.MeshBasicMaterial({map:texture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE309_SCORPION_SHOWDOWN_PAYOUT_PANEL"; panel.position.set(0,2.48,0); panel.renderOrder=335; root.add(panel);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.34,.55,80),new THREE.MeshBasicMaterial({color:payoutState.resolved?0xffd98a:0x7ffcff,transparent:true,opacity:.50,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.name="PHASE309_PAYOUT_RING"; ring.rotation.x=-Math.PI/2; ring.position.set(0,.08,.96); root.add(ring);
  return true;
}
function resetForNext(detail){
  payoutState.hand = Number(detail?.hand || payoutState.hand + 1);
  payoutState.resolved = false;
  payoutState.winner = "Pending";
  payoutState.reason = "New hand started";
  payoutState.potPaid = 0;
}
function applyPayout(detail){
  if(!detail) return null;
  if(/Next Hand/i.test(detail.lastPlayerAction || "")){
    resetForNext(detail);
  } else {
    const result = pickWinner(detail);
    if(result){
      const pot = Number(detail.pot || 0);
      payoutState.hand = Number(detail.hand || payoutState.hand || 1);
      payoutState.resolved = true;
      payoutState.winner = result.winner;
      payoutState.reason = result.reason;
      payoutState.potPaid = pot;
      if(result.winner === "You") payoutState.playerStack += pot;
      else if(payoutState.botStacks[result.winner] !== undefined) payoutState.botStacks[result.winner] += pot;
    } else {
      payoutState.hand = Number(detail.hand || payoutState.hand || 1);
      payoutState.resolved = false;
      payoutState.winner = "Pending";
      payoutState.reason = `${detail.street || "Street"} in progress`;
      payoutState.potPaid = Number(detail.pot || 0);
    }
  }
  payoutState.checkedAt = new Date().toISOString();
  window.SVR_PHASE309_SCORPION_SHOWDOWN_PAYOUT_STATE = {...payoutState};
  window.SVR_PHASE309_LAST_SHOWDOWN_PAYOUT = {...payoutState, source:"svr-scorpion-bot-response-complete"};
  try{ window.dispatchEvent(new CustomEvent("svr-scorpion-showdown-payout-complete",{detail:window.SVR_PHASE309_LAST_SHOWDOWN_PAYOUT})); }catch{}
  showPanel();
  status(`Scorpion payout: ${payoutState.winner} • ${payoutState.reason}`);
  return payoutState;
}
function install(){
  if(installed) return true;
  installed = true;
  window.addEventListener("svr-scorpion-bot-response-complete", e=>applyPayout(e.detail));
  window.SVR_PHASE309_SCORPION_SHOWDOWN_PAYOUT_LOCK={
    build:LABEL,
    active:true,
    listensFor:"svr-scorpion-bot-response-complete",
    emits:"svr-scorpion-showdown-payout-complete",
    players:PLAYERS,
    phase310Chained:true,
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
setInterval(()=>{install(); if(window.SVR_PHASE309_SCORPION_SHOWDOWN_PAYOUT_STATE) showPanel();},8000);
import("./phase310_scorpion_poker_loop_qa_lock.js?v=phase310-loop-qa").catch(e=>{window.SVR_PHASE310_IMPORT_ERROR=String(e?.message||e);});
