import * as THREE from "three";

const LABEL = "PHASE-86-PLAYABLE-POKER-CORE-LOCK";
const ROOT = "PHASE86_PLAYABLE_POKER_CORE_ROOT";
const PLAYERS = [
  { id:"user", name:"YOU", seat:"SOUTH", stack:50000, isUser:true },
  { id:"bot1", name:"Nova", seat:"SW", stack:50000 },
  { id:"bot2", name:"Rook", seat:"W", stack:50000 },
  { id:"bot3", name:"Ace", seat:"N", stack:50000 },
  { id:"bot4", name:"Vega", seat:"E", stack:50000 },
  { id:"bot5", name:"Ivy", seat:"SE", stack:50000 }
];
const ACTIONS = [
  { key:"fold", label:"FOLD", code:"KeyF", color:0xff5b8c },
  { key:"check", label:"CHECK", code:"KeyC", color:0x7ffcff },
  { key:"call", label:"CALL", code:"KeyV", color:0x86ffb7 },
  { key:"raise", label:"RAISE", code:"KeyR", color:0xffd98a },
  { key:"all_in", label:"ALL-IN", code:"KeyA", color:0xffffff },
  { key:"next", label:"NEXT", code:"KeyH", color:0xbd7cff }
];
const PHASES = ["preflop","flop","turn","river","showdown"];
const RANKS = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
const SUITS = ["♠","♥","♦","♣"];
let state = null;
let pointerInstalled = false;
let keyInstalled = false;
let lastTexture = null;

function freshDeck(){
  const deck=[];
  for (const r of RANKS) for (const s of SUITS) deck.push(`${r}${s}`);
  for (let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
  return deck;
}
function newHand(){
  const deck=freshDeck();
  const players=PLAYERS.map((p)=>({ ...p, cards:[deck.pop(), deck.pop()], folded:false, committed:0, lastAction:"WAIT" }));
  const sb=25, bb=50;
  players[1].stack-=sb; players[1].committed=sb; players[1].lastAction="SB 25";
  players[2].stack-=bb; players[2].committed=bb; players[2].lastAction="BB 50";
  return { build:LABEL, handId:Date.now(), deck, players, community:[], pot:sb+bb, currentBet:bb, phase:"preflop", turn:0, dealerButton:0, active:true, winner:null, log:["New hand started", "Blinds posted: 25 / 50"], updatedAt:new Date().toISOString() };
}
function user(){ return state.players.find(p=>p.isUser); }
function activePlayer(){ return state.players[state.turn % state.players.length]; }
function pushLog(text){ state.log.unshift(text); state.log = state.log.slice(0,7); state.updatedAt = new Date().toISOString(); }
function nextSeat(){
  for (let i=1;i<=state.players.length;i++){
    const idx=(state.turn+i)%state.players.length;
    const p=state.players[idx];
    if (!p.folded && p.stack>0) { state.turn=idx; return p; }
  }
  return null;
}
function livePlayers(){ return state.players.filter(p=>!p.folded); }
function revealPhase(){
  if (state.phase === "preflop") { state.community.push(state.deck.pop(), state.deck.pop(), state.deck.pop()); state.phase="flop"; pushLog("Flop dealt"); }
  else if (state.phase === "flop") { state.community.push(state.deck.pop()); state.phase="turn"; pushLog("Turn dealt"); }
  else if (state.phase === "turn") { state.community.push(state.deck.pop()); state.phase="river"; pushLog("River dealt"); }
  else { state.phase="showdown"; showdown(); }
}
function botDecision(p){
  if (state.phase === "showdown" || !state.active) return;
  const strength=Math.random();
  const need=Math.max(0,state.currentBet-p.committed);
  if (need>0 && strength<0.22){ p.folded=true; p.lastAction="FOLD"; pushLog(`${p.name} folds`); }
  else if (strength>.82 && p.stack>need+100){ const amt=need+100; p.stack-=amt; p.committed+=amt; state.pot+=amt; state.currentBet=Math.max(state.currentBet,p.committed); p.lastAction="RAISE 100"; pushLog(`${p.name} raises`); }
  else { const amt=Math.min(need,p.stack); p.stack-=amt; p.committed+=amt; state.pot+=amt; p.lastAction=need>0?"CALL":"CHECK"; pushLog(`${p.name} ${p.lastAction.toLowerCase()}`); }
}
function advanceAfterAction(){
  if (livePlayers().length<=1){ showdown(); return; }
  const p=nextSeat();
  if (!p){ revealPhase(); state.turn=0; return; }
  if (!p.isUser){
    let loops=0;
    while(activePlayer() && !activePlayer().isUser && loops<8 && state.active && state.phase!=="showdown"){
      botDecision(activePlayer());
      if (livePlayers().length<=1){ showdown(); break; }
      nextSeat(); loops++;
    }
    if (loops>=state.players.length-1) { revealPhase(); state.turn=0; }
  }
  renderHud();
}
function evaluateScore(p){
  const cards=[...p.cards,...state.community].join(" ");
  let score=0;
  if (/[AKQJ]/.test(cards)) score+=2;
  if ((cards.match(/♥|♦/g)||[]).length>=5 || (cards.match(/♠|♣/g)||[]).length>=5) score+=6;
  const ranks=RANKS.map(r=>(cards.match(new RegExp(r.replace("10","10"),"g"))||[]).length);
  score+=Math.max(...ranks)*4;
  score+=Math.random()*3;
  return score;
}
function showdown(){
  state.active=false; state.phase="showdown";
  const candidates=livePlayers();
  const winner=candidates.sort((a,b)=>evaluateScore(b)-evaluateScore(a))[0] || user();
  winner.stack+=state.pot; winner.lastAction=`WIN ${state.pot}`;
  state.winner={ id:winner.id, name:winner.name, pot:state.pot };
  pushLog(`${winner.name} wins ${state.pot}`);
  state.pot=0;
}
function playerAction(key, source="keyboard"){
  if (!state) state=newHand();
  if (key==="next"){ state=newHand(); renderHud(); publish(key, source); return; }
  if (state.phase==="showdown" || !state.active) { publish(key, source); return; }
  const p=user();
  const need=Math.max(0,state.currentBet-p.committed);
  if (key==="fold"){ p.folded=true; p.lastAction="FOLD"; pushLog("You fold"); }
  else if (key==="check"){ if (need>0){ const amt=Math.min(need,p.stack); p.stack-=amt; p.committed+=amt; state.pot+=amt; p.lastAction="CALL"; pushLog(`You call ${amt}`); } else { p.lastAction="CHECK"; pushLog("You check"); } }
  else if (key==="call"){ const amt=Math.min(need,p.stack); p.stack-=amt; p.committed+=amt; state.pot+=amt; p.lastAction=amt>0?`CALL ${amt}`:"CHECK"; pushLog(`You ${amt>0?`call ${amt}`:"check"}`); }
  else if (key==="raise"){ const amt=Math.min(need+250,p.stack); p.stack-=amt; p.committed+=amt; state.pot+=amt; state.currentBet=Math.max(state.currentBet,p.committed); p.lastAction="RAISE 250"; pushLog("You raise 250"); }
  else if (key==="all_in"){ const amt=p.stack; p.stack=0; p.committed+=amt; state.pot+=amt; state.currentBet=Math.max(state.currentBet,p.committed); p.lastAction="ALL-IN"; pushLog(`You all-in ${amt}`); }
  advanceAfterAction(); publish(key, source); renderHud();
}
function publish(action, source){
  window.SVR_PHASE86_POKER_STATE = { ...state, build:LABEL, action, source, checkedAt:new Date().toISOString() };
  try { window.dispatchEvent(new CustomEvent("svr-poker-core-action", { detail: window.SVR_PHASE86_POKER_STATE })); } catch {}
}
function makeTexture(){
  const c=document.createElement("canvas"); c.width=1400; c.height=680;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#03050b"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle="#ffd98a"; ctx.lineWidth=10; ctx.strokeRect(24,24,1352,632);
  ctx.fillStyle="rgba(127,252,255,.10)"; ctx.fillRect(48,48,1304,96);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#fff"; ctx.font="900 54px system-ui,Arial"; ctx.fillText("SVR PLAYABLE POKER",700,92);
  ctx.fillStyle="#ffd98a"; ctx.font="800 30px system-ui,Arial"; ctx.fillText(`${state.phase.toUpperCase()}  •  POT ${state.pot}  •  BET ${state.currentBet}`,700,160);
  ctx.fillStyle="#bffcff"; ctx.font="800 34px system-ui,Arial"; ctx.fillText(`YOUR CARDS: ${user().cards.join("   ")}     COMMUNITY: ${state.community.join("   ") || "—"}`,700,226);
  ctx.fillStyle="#fff"; ctx.font="700 24px system-ui,Arial";
  state.players.forEach((p,i)=>{ const x=170+(i%3)*520; const y=306+Math.floor(i/3)*82; ctx.fillStyle=p.isUser?"#ffd98a":p.folded?"#777":"#e8f4ff"; ctx.fillText(`${p.name}: ${p.stack} • ${p.lastAction}`,x,y); });
  ctx.fillStyle="#7ffcff"; ctx.font="800 24px system-ui,Arial"; ctx.fillText("F Fold • C Check/Call • V Call • R Raise • A All-In • H Next Hand",700,508);
  ctx.fillStyle="#fff"; ctx.font="700 22px system-ui,Arial"; ctx.fillText(state.log.slice(0,3).join("   •   "),700,566);
  ctx.fillStyle="#8dffb4"; ctx.font="800 22px system-ui,Arial"; ctx.fillText(state.winner?`WINNER: ${state.winner.name}`:"Play-money demo • dealer body remains hidden",700,618);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function renderHud(){
  const scene=window.__SVR_SCENE__; if(!scene || !state) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; root.position.set(0,0,-3.05); scene.add(root);
  lastTexture?.dispose?.(); lastTexture=makeTexture();
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(5.35,2.60), new THREE.MeshBasicMaterial({ map:lastTexture, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.name="PHASE86_PLAYABLE_POKER_STATUS_PANEL"; panel.position.set(0,2.35,0); panel.renderOrder=320; root.add(panel);
  ACTIONS.forEach((a,i)=>{ const x=-2.16+i*.86; const pad=new THREE.Mesh(new THREE.RingGeometry(.19,.30,44), new THREE.MeshBasicMaterial({ color:a.color, transparent:true, opacity:.62, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending })); pad.name=`PHASE86_ACTION_${a.key.toUpperCase()}`; pad.rotation.x=-Math.PI/2; pad.position.set(x,.10,1.15); pad.userData.phase86Action=a.key; root.add(pad); });
  return true;
}
function installPointer(scene,camera){
  if(pointerInstalled) return; pointerInstalled=true;
  const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
  window.addEventListener("pointerdown",e=>{
    const renderer=window.__SVR_RENDERER__, canvas=renderer?.domElement||document.querySelector("canvas"); if(!canvas||!camera) return;
    const r=canvas.getBoundingClientRect(); mouse.x=((e.clientX-r.left)/Math.max(r.width,1))*2-1; mouse.y=-((e.clientY-r.top)/Math.max(r.height,1))*2+1;
    ray.setFromCamera(mouse,camera); const hit=ray.intersectObjects(scene.children,true).find(h=>h.object?.userData?.phase86Action)?.object;
    if(hit?.userData?.phase86Action) playerAction(hit.userData.phase86Action,"pointer");
  },{passive:true});
}
function installKeys(){
  if(keyInstalled) return; keyInstalled=true;
  window.addEventListener("keydown",e=>{ const a=ACTIONS.find(x=>x.code===e.code); if(a) playerAction(a.key,"keyboard"); });
  window.addEventListener("svr-poker-player-action",e=>{ const key=e?.detail?.action; if(key) playerAction(key,"event"); });
}
function install(){
  const scene=window.__SVR_SCENE__; const camera=window.__SVR_CAMERA__||scene?.userData?._camera; if(!scene||!camera) return false;
  if(!state) state=newHand();
  installKeys(); installPointer(scene,camera); renderHud();
  window.SVR_PHASE86_PLAYABLE_POKER_CORE_LOCK={ build:LABEL, active:true, actions:ACTIONS.map(a=>a.key), phases:PHASES, playMoneyOnly:true, dealerBodyVisible:false, invisibleDealerLogicPreserved:true, siteTouched:false, lobbyRedesignTouched:false, checkedAt:new Date().toISOString() };
  window.SVR_LIVE_BUILD_POINTER=LABEL; window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>160) clearInterval(timer); },250);
[800,1800,3600,7200,12000].forEach(d=>setTimeout(install,d));
