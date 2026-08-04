import * as THREE from "three";

const LABEL = "PHASE-127-POKER-ROUND-FLOW-DEALER-PROMPT-LOCK";
const ROOT = "PHASE127_POKER_ROUND_FLOW_DEALER_PROMPT_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;
const PURPLE = 0x9b4dff;

const SEATS = [
  { key:"player", label:"YOU", x:0, z:1.12, color:CYAN },
  { key:"bot1", label:"BOT 1", x:-2.75, z:-.55, color:PURPLE },
  { key:"bot2", label:"BOT 2", x:-2.2, z:-3.25, color:GOLD },
  { key:"bot3", label:"BOT 3", x:0, z:-4.45, color:GREEN },
  { key:"bot4", label:"BOT 4", x:2.2, z:-3.25, color:GOLD },
  { key:"bot5", label:"BOT 5", x:2.75, z:-.55, color:PURPLE }
];
const ACTION_MESSAGES = {
  fold:"Player folded. Dealer advances the table.",
  check:"Player checked. Action continues.",
  call:"Player called. Pot display updated.",
  raise:"Player raised. Bots are thinking.",
  all_in:"Player is all-in. Table focus locked.",
  next:"Next hand. Dealer resets the visual round."
};

let state = {
  hand:1,
  street:"PRE-FLOP",
  activeSeat:0,
  lastAction:"READY",
  prompt:"Dealer ready. Select an action.",
  visualPot:0,
  winner:null,
  botThinking:false,
  pulse:0,
  actionCount:0,
  checkedAt:null
};
let promptCanvas, promptTexture, promptMesh, activeHalo, potFlow, winnerBanner;
const seatHalos = [];
const botDots = [];

function removeDuplicateTable(scene){
  let removed = 0;
  let dup = scene?.getObjectByName?.(DUP);
  while(dup){ dup.parent?.remove(dup); removed++; dup = scene.getObjectByName(DUP); }
  return removed;
}
function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function glow(color, opacity=.24){ return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }); }
function delta(action){
  if(action === "call") return 250;
  if(action === "raise") return 500;
  if(action === "all_in") return 1500;
  return 0;
}
function advanceStreet(){
  const order=["PRE-FLOP","FLOP","TURN","RIVER","SHOWDOWN"];
  const i=order.indexOf(state.street);
  state.street=order[Math.min(order.length-1,i+1)] || "PRE-FLOP";
}
function resetHand(){
  state.hand++;
  state.street="PRE-FLOP";
  state.activeSeat=0;
  state.lastAction="NEXT";
  state.visualPot=0;
  state.winner=null;
  state.botThinking=false;
  state.prompt="Dealer shuffles. New hand is ready.";
  state.pulse=1;
}
function actionLabel(action){ return String(action||"READY").toUpperCase().replace("_","-"); }
function refreshPrompt(){
  if(!promptCanvas){ promptCanvas=document.createElement("canvas"); promptCanvas.width=1200; promptCanvas.height=520; }
  const c=promptCanvas, x=c.getContext("2d");
  const color = state.winner ? GREEN : (state.botThinking ? GOLD : CYAN);
  const hex=`#${color.toString(16).padStart(6,"0")}`;
  const bg=x.createLinearGradient(0,0,c.width,c.height); bg.addColorStop(0,"#02040a"); bg.addColorStop(.5,"#160713"); bg.addColorStop(1,"#02040a");
  x.fillStyle=bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle="rgba(255,217,138,.88)"; x.lineWidth=14; x.strokeRect(26,26,c.width-52,c.height-52);
  x.strokeStyle=hex; x.lineWidth=8; x.strokeRect(66,66,c.width-132,c.height-132);
  x.textAlign="center"; x.textBaseline="middle";
  x.shadowColor=hex; x.shadowBlur=22;
  x.fillStyle="#fff8df"; x.font="900 58px system-ui,Arial"; x.fillText("DEALER PROMPT",c.width/2,96,c.width-120);
  x.shadowBlur=8;
  x.fillStyle="#bffcff"; x.font="900 42px system-ui,Arial"; x.fillText(state.prompt,c.width/2,188,c.width-130);
  x.fillStyle="#ffd98a"; x.font="900 32px system-ui,Arial"; x.fillText(`HAND ${state.hand}  •  ${state.street}  •  LAST ${actionLabel(state.lastAction)}`,c.width/2,280,c.width-120);
  x.fillStyle="#ffffff"; x.font="800 28px system-ui,Arial"; x.fillText(`ACTIVE: ${SEATS[state.activeSeat]?.label || "TABLE"}  •  VISUAL POT $${state.visualPot.toLocaleString()}`,c.width/2,350,c.width-130);
  x.fillStyle=state.winner?"#8dffb4":"#cdefff"; x.font="800 24px system-ui,Arial"; x.fillText(state.winner ? `${state.winner} WINS THE VISUAL POT` : "VISUAL ROUND FLOW ONLY • POKER ENGINE PRESERVED",c.width/2,424,c.width-130);
  if(!promptTexture){ promptTexture=new THREE.CanvasTexture(c); promptTexture.colorSpace=THREE.SRGBColorSpace; promptTexture.anisotropy=4; }
  promptTexture.needsUpdate=true;
}
function makeTextSprite(name,label,color){
  const c=document.createElement("canvas"); c.width=512; c.height=220; const x=c.getContext("2d");
  const hex=`#${color.toString(16).padStart(6,"0")}`;
  x.fillStyle="rgba(0,0,0,.72)"; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=hex; x.lineWidth=8; x.strokeRect(18,18,c.width-36,c.height-36);
  x.textAlign="center"; x.textBaseline="middle"; x.shadowColor=hex; x.shadowBlur=16;
  x.fillStyle="#fff8df"; x.font="900 48px system-ui,Arial"; x.fillText(label,c.width/2,98,c.width-60);
  x.shadowBlur=6; x.fillStyle="#bffcff"; x.font="800 24px system-ui,Arial"; x.fillText("THINKING",c.width/2,152,c.width-60);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.45),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  m.name=name; m.renderOrder=870; return m;
}
function addVisuals(scene){
  const root=scene.getObjectByName(ROOT);
  refreshPrompt();
  promptMesh=new THREE.Mesh(new THREE.PlaneGeometry(4.9,2.12),new THREE.MeshBasicMaterial({map:promptTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  promptMesh.name="PHASE127_DEALER_PROMPT_ROUND_FLOW_PANEL";
  promptMesh.position.set(0,3.15,-3.78);
  promptMesh.renderOrder=860;
  promptMesh.userData.phase127RoundFlow=true;
  root.add(promptMesh);

  activeHalo=new THREE.Mesh(new THREE.RingGeometry(.58,.72,72),glow(CYAN,.52));
  activeHalo.name="PHASE127_ACTIVE_TURN_SEAT_HALO";
  activeHalo.position.set(SEATS[0].x,.31,SEATS[0].z);
  activeHalo.rotation.x=-Math.PI/2;
  activeHalo.renderOrder=855;
  activeHalo.userData.phase127RoundFlow=true;
  root.add(activeHalo);

  SEATS.forEach((s,i)=>{
    const halo=new THREE.Mesh(new THREE.RingGeometry(.38,.48,56),glow(s.color,.16));
    halo.name=`PHASE127_SEAT_STATUS_HALO_${s.key.toUpperCase()}`;
    halo.position.set(s.x,.285,s.z);
    halo.rotation.x=-Math.PI/2;
    halo.renderOrder=850;
    halo.userData.phase127RoundFlow=true;
    root.add(halo);
    seatHalos[i]=halo;
    if(i>0){
      const dot=makeTextSprite(`PHASE127_BOT_THINKING_DOT_${i}`,s.label,s.color);
      dot.position.set(s.x,1.95,s.z);
      dot.visible=false;
      dot.userData.phase127RoundFlow=true;
      root.add(dot);
      botDots[i]=dot;
    }
  });

  potFlow=new THREE.Mesh(new THREE.TorusGeometry(.32,.035,12,64),glow(GOLD,.42));
  potFlow.name="PHASE127_POT_MOTION_VISUAL_RING";
  potFlow.position.set(0,.46,-2.62);
  potFlow.rotation.x=Math.PI/2;
  potFlow.renderOrder=858;
  potFlow.userData.phase127RoundFlow=true;
  root.add(potFlow);

  winnerBanner=makeTextSprite("PHASE127_WINNER_VISUAL_BANNER","WINNER",GREEN);
  winnerBanner.position.set(0,3.15,-1.02);
  winnerBanner.visible=false;
  winnerBanner.userData.phase127RoundFlow=true;
  root.add(winnerBanner);
}
function updateStateFromAction(action){
  const a=String(action||"next").toLowerCase();
  state.lastAction=a;
  state.actionCount++;
  state.visualPot+=delta(a);
  state.pulse=1;
  state.checkedAt=new Date().toISOString();
  if(a==="next"){
    resetHand();
  }else{
    state.prompt=ACTION_MESSAGES[a] || "Action received. Dealer updates the table.";
    if(a==="fold") state.activeSeat=(state.activeSeat+1)%SEATS.length;
    if(a==="check" || a==="call") state.activeSeat=(state.activeSeat+1)%SEATS.length;
    if(a==="raise" || a==="all_in") state.botThinking=true;
    if(state.actionCount>0 && state.actionCount%4===0) advanceStreet();
    if(a==="all_in"){
      state.winner="PLAYER";
      state.botThinking=false;
      state.prompt="Showdown visual. Player takes the pot.";
    }
  }
  refreshPrompt();
  window.SVR_PHASE127_LAST_ROUND_FLOW = { action:a, hand:state.hand, street:state.street, activeSeat:SEATS[state.activeSeat]?.label, visualPot:state.visualPot, winner:state.winner, checkedAt:state.checkedAt };
}
function installEventListener(){
  if(window.SVR_PHASE127_ROUND_FLOW_LISTENER_INSTALLED) return;
  window.SVR_PHASE127_ROUND_FLOW_LISTENER_INSTALLED=true;
  window.addEventListener("svr-poker-player-action",(e)=>updateStateFromAction(e?.detail?.action || "next"));
}
function animate(){
  if(window.SVR_PHASE127_ANIMATION_LOOP_INSTALLED) return;
  window.SVR_PHASE127_ANIMATION_LOOP_INSTALLED=true;
  const tick=()=>{
    const t=performance.now()*.001;
    if(state.pulse>0) state.pulse=Math.max(0,state.pulse-.018);
    const amp=state.pulse;
    if(promptMesh){ promptMesh.lookAt(0,1.58,6.0); promptMesh.position.y=3.15+Math.sin(t*1.15)*.025; }
    if(activeHalo){
      const s=SEATS[state.activeSeat]||SEATS[0];
      activeHalo.position.x += (s.x-activeHalo.position.x)*.18;
      activeHalo.position.z += (s.z-activeHalo.position.z)*.18;
      activeHalo.scale.setScalar(1+Math.sin(t*4.2)*.08+amp*.22);
      activeHalo.material.color.setHex(s.color);
      activeHalo.material.opacity=.28+amp*.34;
    }
    seatHalos.forEach((h,i)=>{ if(h?.material){ h.material.opacity=i===state.activeSeat?.valueOf?.()? .36:.13; h.scale.setScalar(1+Math.sin(t*2+i)*.025); } });
    botDots.forEach((d,i)=>{ if(d){ d.visible=!!state.botThinking && (i===state.activeSeat || state.activeSeat===0); d.lookAt(0,1.58,6.0); d.position.y=1.95+Math.sin(t*3+i)*.06; } });
    if(potFlow){ potFlow.rotation.z+=.025+amp*.05; potFlow.scale.setScalar(1+amp*.35+Math.sin(t*2.1)*.04); potFlow.material.opacity=.2+amp*.38; }
    if(winnerBanner){ winnerBanner.visible=!!state.winner; winnerBanner.lookAt(0,1.58,6.0); winnerBanner.position.y=3.15+Math.sin(t*1.9)*.05; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function protectCore(scene){
  let protectedObjects=0;
  scene?.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|PHASE116|PHASE117|PHASE118|PHASE119|PHASE120|PHASE121|PHASE122|PHASE123|PHASE124|PHASE125|PHASE126|MOON|MARS|SECOND_FLOOR|BALCONY/i.test(n)){
      o.visible=true;
      o.userData.phase127CoreProtected=true;
      if(o.isMesh){ o.frustumCulled=false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function cleanUi(){
  document.title="Scarlett Poker VR";
  const s=document.getElementById("safeStatus"); if(s) s.textContent="Loading Scarlett Poker VR lobby...";
  document.querySelectorAll(".pill").forEach((el)=>{ el.textContent="SCARLETT POKER VR"; });
}
function qa(scene){
  return {
    oneTable: !scene?.getObjectByName?.(DUP),
    dealerPrompt: !!scene?.getObjectByName?.("PHASE127_DEALER_PROMPT_ROUND_FLOW_PANEL"),
    activeTurnHalo: !!scene?.getObjectByName?.("PHASE127_ACTIVE_TURN_SEAT_HALO"),
    seatHalos: count(scene,/PHASE127_SEAT_STATUS_HALO/i),
    botThinkingDots: count(scene,/PHASE127_BOT_THINKING_DOT/i),
    potMotion: !!scene?.getObjectByName?.("PHASE127_POT_MOTION_VISUAL_RING"),
    winnerBanner: !!scene?.getObjectByName?.("PHASE127_WINNER_VISUAL_BANNER"),
    eventListener: !!window.SVR_PHASE127_ROUND_FLOW_LISTENER_INSTALLED,
    roundState: {...state},
    phase122Feedback: !!window.SVR_PHASE122_POKER_TABLE_ACTION_FEEDBACK_FOCUS_LOCK,
    phase123Display: !!window.SVR_PHASE123_POKER_TURN_POT_DISPLAY_FEEDBACK_LOCK,
    phase125Hitboxes: !!window.SVR_PHASE125_QUEST_POKER_BUTTON_HITBOX_SELECTION_LOCK,
    phase126Qa: !!window.SVR_PHASE126_QUEST_LIVE_PLAYABILITY_AUDIT_FIX_LOCK,
    ready: !scene?.getObjectByName?.(DUP) && !!scene?.getObjectByName?.("PHASE127_DEALER_PROMPT_ROUND_FLOW_PANEL") && !!window.SVR_PHASE127_ROUND_FLOW_LISTENER_INSTALLED
  };
}
function install(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  cleanUi();
  const removedDuplicateTable=removeDuplicateTable(scene);
  addVisuals(scene);
  const protectedObjects=protectCore(scene);
  installEventListener();
  animate();
  const report=qa(scene);
  window.SVR_PHASE127_POKER_ROUND_FLOW_DEALER_PROMPT_LOCK={ build:LABEL, active:true, roundFlowVisual:true, dealerPrompt:true, visualOnly:true, removedDuplicateTable, protectedObjects, report, siteTouched:false, publicRootTouched:false, pokerLogicTouched:false, portalRoutesTouched:false, watchTouched:false, movementTouched:false, questSafe:true, checkedAt:new Date().toISOString() };
  window.SVR_RUN_PHASE127_ROUND_FLOW_QA=()=>qa(scene);
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
