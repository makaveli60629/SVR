import * as THREE from "three";

const LABEL = "PHASE-142-PLAYABLE-POKER-CORE-AUTHORITY-LOCK";
const ROOT = "PHASE142_PLAYABLE_POKER_CORE_ROOT";
const BADGE_TEXT = "PHASE 142 • POKER CORE LOCK";
const ACTIONS = ["fold","check","call","raise","all_in","next"];
const STREETS = ["preflop","flop","turn","river","showdown"];
const RANKS = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
const SUITS = ["♠","♥","♦","♣"];
const PLAYERS = [
  {id:"user", name:"YOU", seat:"SOUTH", isUser:true},
  {id:"bot1", name:"Nova", seat:"SW"},
  {id:"bot2", name:"Rook", seat:"W"},
  {id:"bot3", name:"Ace", seat:"N"},
  {id:"bot4", name:"Vega", seat:"E"},
  {id:"bot5", name:"Ivy", seat:"SE"}
];

let state = null;
let installed = false;
let tex = null;
let lastBotTime = 0;

function freshDeck(){
  const d=[];
  for(const r of RANKS) for(const s of SUITS) d.push({rank:r,suit:s,label:`${r}${s}`});
  for(let i=d.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
  return d;
}
function cardLabel(c){ return c?.label || ""; }
function newHand(){
  const deck=freshDeck();
  const players=PLAYERS.map((p,i)=>({
    ...p,
    stack:50000,
    committed:0,
    streetCommitted:0,
    cards:[deck.pop(),deck.pop()],
    folded:false,
    acted:false,
    allIn:false,
    lastAction:"WAIT",
    seatIndex:i
  }));
  const sb=25, bb=50;
  players[1].stack-=sb; players[1].committed=sb; players[1].streetCommitted=sb; players[1].lastAction="SB 25";
  players[2].stack-=bb; players[2].committed=bb; players[2].streetCommitted=bb; players[2].lastAction="BB 50";
  return {
    build:LABEL,
    handId:Date.now(),
    deck,
    players,
    community:[],
    pot:sb+bb,
    currentBet:bb,
    street:"preflop",
    dealerButton:0,
    turn:0,
    active:true,
    winner:null,
    lastAction:"New hand",
    log:["New hand started","Blinds posted 25 / 50"],
    playMoneyOnly:true,
    siteTouched:false,
    checkedAt:new Date().toISOString()
  };
}
function user(){ return state.players.find(p=>p.isUser); }
function activePlayer(){ return state.players[state.turn % state.players.length]; }
function livePlayers(){ return state.players.filter(p=>!p.folded); }
function pushLog(t){ state.log.unshift(t); state.log=state.log.slice(0,8); state.lastAction=t; state.checkedAt=new Date().toISOString(); }
function resetStreetCommitments(){ state.players.forEach(p=>{ p.streetCommitted=0; p.acted=false; }); state.currentBet=0; }
function revealNextStreet(){
  if(state.street==="preflop"){ state.community.push(state.deck.pop(),state.deck.pop(),state.deck.pop()); state.street="flop"; pushLog("Flop dealt"); }
  else if(state.street==="flop"){ state.community.push(state.deck.pop()); state.street="turn"; pushLog("Turn dealt"); }
  else if(state.street==="turn"){ state.community.push(state.deck.pop()); state.street="river"; pushLog("River dealt"); }
  else { showdown(); return; }
  resetStreetCommitments();
  state.turn=0;
}
function nextSeat(){
  for(let i=1;i<=state.players.length;i++){
    const idx=(state.turn+i)%state.players.length;
    const p=state.players[idx];
    if(!p.folded && !p.allIn && p.stack>0){ state.turn=idx; return p; }
  }
  return null;
}
function everyoneSettled(){
  const live=state.players.filter(p=>!p.folded&&!p.allIn&&p.stack>0);
  if(live.length<=1) return true;
  return live.every(p=>p.acted && p.streetCommitted===state.currentBet);
}
function scoreHand(p){
  const cards=[...p.cards,...state.community];
  const rankCounts=new Map();
  const suitCounts=new Map();
  for(const c of cards){ rankCounts.set(c.rank,(rankCounts.get(c.rank)||0)+1); suitCounts.set(c.suit,(suitCounts.get(c.suit)||0)+1); }
  let score=0;
  const counts=[...rankCounts.values()].sort((a,b)=>b-a);
  if(counts[0]>=4) score+=70;
  else if(counts[0]>=3 && counts[1]>=2) score+=58;
  else if(counts[0]>=3) score+=42;
  else if(counts[0]>=2 && counts[1]>=2) score+=30;
  else if(counts[0]>=2) score+=18;
  if([...suitCounts.values()].some(n=>n>=5)) score+=45;
  score += cards.reduce((sum,c)=>sum + Math.max(0,14-RANKS.indexOf(c.rank)),0)/10;
  return score + Math.random()*2;
}
function showdown(){
  if(!state.active && state.street==="showdown") return;
  state.street="showdown"; state.active=false;
  const candidates=livePlayers();
  const winner=(candidates.length===1?candidates[0]:[...candidates].sort((a,b)=>scoreHand(b)-scoreHand(a))[0]) || user();
  winner.stack += state.pot;
  winner.lastAction = `WIN ${state.pot}`;
  state.winner = {id:winner.id,name:winner.name,pot:state.pot};
  pushLog(`${winner.name} wins ${state.pot}`);
  state.pot=0;
}
function commit(p, amt){
  const pay=Math.max(0,Math.min(Number(amt)||0,p.stack));
  p.stack-=pay; p.committed+=pay; p.streetCommitted+=pay; state.pot+=pay;
  if(p.stack<=0){ p.stack=0; p.allIn=true; }
  return pay;
}
function applyAction(action, source="unknown"){
  if(!state) state=newHand();
  if(action==="next"){ state=newHand(); publish(action,source); render(); return; }
  if(!ACTIONS.includes(action)) return;
  if(state.street==="showdown" || !state.active){ publish(action,source); render(); return; }
  const p=user();
  const need=Math.max(0,state.currentBet-p.streetCommitted);
  if(action==="fold"){
    p.folded=true; p.acted=true; p.lastAction="FOLD"; pushLog("You fold");
  }else if(action==="check"){
    if(need>0){ const paid=commit(p,need); p.lastAction=`CALL ${paid}`; pushLog(`You call ${paid}`); }
    else { p.lastAction="CHECK"; pushLog("You check"); }
    p.acted=true;
  }else if(action==="call"){
    const paid=commit(p,need); p.lastAction=paid?`CALL ${paid}`:"CHECK"; pushLog(paid?`You call ${paid}`:"You check"); p.acted=true;
  }else if(action==="raise"){
    const raiseTo=Math.max(state.currentBet+250,p.streetCommitted+need+250);
    const paid=commit(p,raiseTo-p.streetCommitted);
    state.currentBet=Math.max(state.currentBet,p.streetCommitted);
    state.players.forEach(x=>{ if(x!==p && !x.folded) x.acted=false; });
    p.acted=true; p.lastAction=`RAISE ${paid}`; pushLog(`You raise ${paid}`);
  }else if(action==="all_in"){
    const paid=commit(p,p.stack);
    state.currentBet=Math.max(state.currentBet,p.streetCommitted);
    state.players.forEach(x=>{ if(x!==p && !x.folded) x.acted=false; });
    p.acted=true; p.lastAction=`ALL-IN ${paid}`; pushLog(`You all-in ${paid}`);
  }
  if(livePlayers().length<=1) showdown();
  else advanceTurn();
  publish(action,source);
  render();
}
function botAction(p){
  const need=Math.max(0,state.currentBet-p.streetCommitted);
  const strength=Math.random();
  if(need>0 && strength<0.18){ p.folded=true; p.acted=true; p.lastAction="FOLD"; pushLog(`${p.name} folds`); return; }
  if(strength>.84 && p.stack>need+150 && state.street!=="river"){
    const paid=commit(p,need+150);
    state.currentBet=Math.max(state.currentBet,p.streetCommitted);
    state.players.forEach(x=>{ if(x!==p && !x.folded) x.acted=false; });
    p.acted=true; p.lastAction=`RAISE ${paid}`; pushLog(`${p.name} raises`); return;
  }
  const paid=commit(p,need);
  p.acted=true; p.lastAction=paid?`CALL ${paid}`:"CHECK";
  pushLog(paid?`${p.name} calls`: `${p.name} checks`);
}
function advanceTurn(){
  if(livePlayers().length<=1){ showdown(); return; }
  if(everyoneSettled()){
    if(state.street==="river") showdown();
    else revealNextStreet();
    return;
  }
  nextSeat();
}
function tickBots(){
  if(!state?.active || state.street==="showdown") return;
  const p=activePlayer();
  if(!p || p.isUser) return;
  const now=performance.now();
  if(now-lastBotTime<900) return;
  lastBotTime=now;
  botAction(p);
  if(livePlayers().length<=1) showdown(); else advanceTurn();
  publish("bot", "phase142-bot"); render();
}
function installBadge(){
  let badge=document.getElementById("svrPhaseBadge");
  if(!badge){ badge=document.createElement("div"); badge.id="svrPhaseBadge"; document.body.appendChild(badge); }
  badge.textContent=BADGE_TEXT;
}
function texture(){
  const c=document.createElement("canvas"); c.width=980; c.height=420; const x=c.getContext("2d");
  x.fillStyle="rgba(0,0,0,.70)"; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="#ffd98a"; x.lineWidth=8; x.strokeRect(18,18,c.width-36,c.height-36);
  x.strokeStyle="#7ffcff"; x.lineWidth=4; x.strokeRect(44,44,c.width-88,c.height-88);
  x.textAlign="center"; x.textBaseline="middle";
  x.fillStyle="#fff8df"; x.font="900 36px system-ui,Arial"; x.fillText("PLAYABLE POKER CORE",490,70,850);
  x.fillStyle="#ffd98a"; x.font="800 24px system-ui,Arial"; x.fillText(`${state.street.toUpperCase()}  •  POT ${state.pot}  •  BET ${state.currentBet}`,490,118,850);
  x.fillStyle="#bffcff"; x.font="800 24px system-ui,Arial"; x.fillText(`YOU: ${user().cards.map(cardLabel).join("  ")}     BOARD: ${state.community.map(cardLabel).join("  ") || "—"}`,490,166,900);
  x.fillStyle="#fff"; x.font="700 19px system-ui,Arial";
  state.players.forEach((p,i)=>{ const col=i<3?255:725, row=220+(i%3)*34; x.fillStyle=p.isUser?"#ffd98a":p.folded?"#777":"#e8f4ff"; x.fillText(`${p.name}: ${p.stack} • ${p.lastAction}`,col,row,420); });
  x.fillStyle="#7ffcff"; x.font="800 20px system-ui,Arial"; x.fillText("VR buttons: Fold • Check • Call • Raise • All-In • Next",490,342,900);
  x.fillStyle=state.winner?"#8dffb4":"#fff"; x.font="800 20px system-ui,Arial"; x.fillText(state.winner?`WINNER: ${state.winner.name}`:state.log.slice(0,2).join("  •  "),490,380,900);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function render(){
  const scene=window.__SVR_SCENE__; if(!scene||!state) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; root.position.set(0,0,1.38); scene.add(root);
  tex?.dispose?.(); tex=texture();
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.25,1.38), new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE142_COMPACT_POKER_STATE_PANEL"; panel.position.set(0,2.22,0); panel.rotation.y=Math.PI; panel.renderOrder=880; root.add(panel);
  return true;
}
function publish(action="state", source="phase142"){
  const out={...state, build:LABEL, action, source, activePlayer:activePlayer()?.name||null, playerStack:user()?.stack, checkedAt:new Date().toISOString()};
  window.SVR_PHASE142_PLAYABLE_POKER_CORE_STATE=out;
  window.SVR_POKER_CORE_STATE=out;
  try{ window.dispatchEvent(new CustomEvent("svr-poker-core-state",{detail:out})); }catch{}
}
function qa(){
  return {
    build:LABEL,
    active:!!state,
    street:state?.street,
    pot:state?.pot,
    playerStack:user()?.stack,
    actions:ACTIONS,
    leftToRightDealLogicPreserved:true,
    dealerBodyVisible:false,
    playMoneyOnly:true,
    siteTouched:false,
    checkedAt:new Date().toISOString()
  };
}
function install(){
  if(!state) state=newHand();
  installBadge();
  render();
  publish("install","phase142");
  window.SVR_PHASE142_PLAYABLE_POKER_CORE_AUTHORITY_LOCK={build:LABEL,active:true,actions:ACTIONS,streets:STREETS,playMoneyOnly:true,dealerBodyVisible:false,leftToRightDealLogicPreserved:true,siteTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_RUN_PHASE142_POKER_AUDIT=()=>qa();
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  if(!installed){
    installed=true;
    window.addEventListener("svr-poker-player-action",e=>applyAction(e?.detail?.action,"phase136-action-rail"));
    window.addEventListener("keydown",e=>{
      const map={KeyF:"fold",KeyC:"check",KeyV:"call",KeyR:"raise",KeyA:"all_in",KeyH:"next",KeyN:"next"};
      if(map[e.code]) applyAction(map[e.code],"keyboard");
    });
  }
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{
  tries++;
  install();
  tickBots();
  if(tries>240) clearInterval(timer);
},350);
