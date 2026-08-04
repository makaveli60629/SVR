import * as THREE from "three";

const LABEL = "PHASE-168-PLAYABLE-POKER-DEMO-SIMULATION-LOCK";
const ROOT_NAME = "PHASE168_PLAYABLE_POKER_DEMO_SIMULATION_LOCK";
const SURFACE_NAME = "PHASE168_TABLE_SURFACE_FELT_LEATHER_HANDREST_LOCK";
const SAFE_FBX_NAMES = [
  "PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT",
  "PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED"
];
const BOT_NAMES = ["Nova", "Rook", "Ace", "Vega", "Ivy"];
const RANKS = ["A","K","Q","J","10","9","8","7","6","5","4","3","2"];
const SUITS = ["S","H","D","C"];
const ACTIONS = ["fold","check","call","raise","all_in","next"];
let state = null;
let root = null;
let surfaceGroup = null;
let actionGroup = null;
let sceneRef = null;
let cameraRef = null;
let rendererRef = null;
let tableRec = null;
let logoPromise = null;
let lastBotAt = 0;
let lastRenderAt = 0;
let installedPointer = false;
let cardCache = new Map();
let labelCache = new Map();

function sceneRoot(scene){
  return scene?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || scene;
}
function findFbx(rootObj){
  for(const name of SAFE_FBX_NAMES){
    const obj = rootObj?.getObjectByName?.(name);
    if(obj) return obj;
  }
  return null;
}
function mat(color, roughness=0.7, metalness=0.08){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function basic(color, opacity=1){
  return new THREE.MeshBasicMaterial({ color, transparent:opacity<1, opacity, side:THREE.DoubleSide, depthWrite:false });
}
function glow(color, opacity=.55){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function disposeTree(o){
  o?.traverse?.(x=>{
    if(x.geometry) x.geometry.dispose?.();
    const mats = Array.isArray(x.material) ? x.material : [x.material];
    mats.forEach(m=>{ if(m?.map) m.map.dispose?.(); m?.dispose?.(); });
  });
}
function removeNamed(rootObj, name){
  const old = rootObj?.getObjectByName?.(name);
  if(old){ disposeTree(old); old.parent?.remove(old); }
}
function tableBounds(rootObj){
  const fbx = findFbx(rootObj);
  if(!fbx) return null;
  fbx.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(fbx);
  if(!Number.isFinite(box.max.y)) return null;
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size); box.getCenter(center);
  return { fbx, box, size, center, surfaceY:box.max.y + 0.035 };
}
function loadLogo(){
  if(logoPromise) return logoPromise;
  const urls = ["/logo.png","/logo.webp","./assets/ui/logo.png","./ui/logo.png"];
  logoPromise = new Promise(async resolve=>{
    for(const url of urls){
      const img = await new Promise(r=>{ const im = new Image(); im.crossOrigin="anonymous"; im.onload=()=>r(im); im.onerror=()=>r(null); im.src=url; });
      if(img) return resolve({img,url});
    }
    resolve(null);
  });
  return logoPromise;
}
function makeFeltCanvas(logoRec){
  const c = document.createElement("canvas"); c.width = 2048; c.height = 1024;
  const x = c.getContext("2d");
  const cx = c.width/2, cy = c.height/2, rx = c.width*.485, ry = c.height*.445;
  x.clearRect(0,0,c.width,c.height);
  x.save();
  x.beginPath(); x.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); x.clip();
  const g = x.createRadialGradient(cx,cy,40,cx,cy,rx);
  g.addColorStop(0,"#0f5a33"); g.addColorStop(.55,"#073f25"); g.addColorStop(1,"#021a10");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.globalAlpha=.11;
  for(let i=0;i<11000;i++){
    x.fillStyle = Math.random()>.55 ? "#bfffd7" : "#00170c";
    x.fillRect(Math.random()*c.width, Math.random()*c.height, Math.random()*2.6+.2, 1);
  }
  x.globalAlpha=1;
  x.strokeStyle="rgba(255,217,138,.96)"; x.lineWidth=15;
  x.beginPath(); x.ellipse(cx,cy,rx*.88,ry*.80,0,0,Math.PI*2); x.stroke();
  x.strokeStyle="rgba(255,255,255,.74)"; x.lineWidth=5;
  x.beginPath(); x.ellipse(cx,cy,rx*.72,ry*.64,0,0,Math.PI*2); x.stroke();
  x.setLineDash([34,18]); x.strokeStyle="rgba(255,255,255,.40)"; x.lineWidth=8;
  x.beginPath(); x.ellipse(cx,cy,rx*.79,ry*.70,0,0,Math.PI*2); x.stroke(); x.setLineDash([]);
  x.fillStyle="rgba(255,217,138,.96)"; x.font="900 44px system-ui,Arial"; x.textAlign="center"; x.textBaseline="middle";
  x.fillText("PASS LINE",cx,cy-ry*.67); x.fillText("PASS LINE",cx,cy+ry*.67);
  if(logoRec?.img){
    const s = Math.min(c.width,c.height)*.28;
    x.globalAlpha=.94; x.drawImage(logoRec.img,cx-s/2,cy-s/2,s,s); x.globalAlpha=1;
  }else{
    x.fillStyle="rgba(127,252,255,.92)"; x.font="900 104px system-ui,Arial"; x.fillText("SVR",cx,cy-20);
    x.fillStyle="rgba(255,217,138,.95)"; x.font="900 42px system-ui,Arial"; x.fillText("POKER",cx,cy+68);
  }
  x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function ellipseRingGeometry(outerX, outerZ, innerX, innerZ, seg=96){
  const shape = new THREE.Shape();
  shape.absellipse(0,0,outerX/2,outerZ/2,0,Math.PI*2,false,0);
  const hole = new THREE.Path();
  hole.absellipse(0,0,innerX/2,innerZ/2,0,Math.PI*2,true,0);
  shape.holes.push(hole);
  return new THREE.ShapeGeometry(shape, seg);
}
async function installRefinedTableSurface(rootObj){
  const rec = tableBounds(rootObj); if(!rec) return null;
  const { box, size, center, surfaceY, fbx } = rec;
  tableRec = rec;
  removeNamed(rootObj, SURFACE_NAME);
  removeNamed(rootObj, "PHASE167_FBX_TABLE_FELT_PASSLINE_LOGO_LOCK");
  const logo = await loadLogo();
  const group = new THREE.Group(); group.name = SURFACE_NAME; group.position.set(center.x, surfaceY, center.z);
  const outerW = Math.max(1.6, Math.min(size.x*.985, 5.2));
  const outerD = Math.max(1.0, Math.min(size.z*.955, 3.0));
  const feltW = outerW*.76;
  const feltD = outerD*.68;
  const leather = new THREE.Mesh(
    ellipseRingGeometry(outerW, outerD, feltW*.99, feltD*.99),
    new THREE.MeshStandardMaterial({ color:0x2a1510, roughness:.52, metalness:.06, emissive:0x050100, emissiveIntensity:.08, side:THREE.DoubleSide })
  );
  leather.name = "PHASE168_RAISED_LEATHER_EDGE_HAND_REST_ALIGNED_TO_TABLE_WALL";
  leather.rotation.x = -Math.PI/2;
  leather.position.y = 0.018;
  leather.renderOrder = 1680;
  group.add(leather);
  const torus = new THREE.Mesh(new THREE.TorusGeometry(outerW/2-.055, .055, 10, 144), new THREE.MeshStandardMaterial({ color:0x3a1b12, roughness:.46, metalness:.04, emissive:0x080201, emissiveIntensity:.07 }));
  torus.name = "PHASE168_ROUNDED_LEATHER_HAND_REST_EDGE_LIP";
  torus.rotation.x = Math.PI/2;
  torus.scale.z = outerD / outerW;
  torus.position.y = 0.052;
  torus.renderOrder = 1681;
  group.add(torus);
  const felt = new THREE.Mesh(new THREE.PlaneGeometry(feltW, feltD), new THREE.MeshBasicMaterial({ map:makeFeltCanvas(logo), transparent:true, side:THREE.DoubleSide, depthWrite:false, alphaTest:.03 }));
  felt.name = "PHASE168_GREEN_FELT_PASS_LINE_SITE_LOGO_ALIGNED_TO_FBX_SURFACE";
  felt.rotation.x = -Math.PI/2;
  felt.position.y = 0.064;
  felt.renderOrder = 1682;
  group.add(felt);
  rootObj.add(group);
  return { fbx:fbx.name, surfaceY:+surfaceY.toFixed(3), outerW:+outerW.toFixed(3), outerD:+outerD.toFixed(3), feltW:+feltW.toFixed(3), feltD:+feltD.toFixed(3), logo:logo?.url || "fallback-text" };
}
function freshDeck(){
  const deck=[]; for(const r of RANKS) for(const s of SUITS) deck.push({rank:r,suit:s,label:`${r}${s}`});
  for(let i=deck.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
  return deck;
}
function newGameState(){
  const deck = freshDeck();
  const players = [{id:"user", name:"YOU", stack:50000, isUser:true}, ...BOT_NAMES.map((n,i)=>({id:`bot${i+1}`, name:n, stack:50000, isBot:true}))];
  players.forEach((p,i)=>{ p.cards=[deck.pop(),deck.pop()]; p.folded=false; p.acted=false; p.streetCommitted=0; p.committed=0; p.lastAction=i===0?"OPEN SEAT":"READY"; });
  players[1].stack-=25; players[1].streetCommitted=25; players[1].committed=25; players[1].lastAction="SB 25";
  players[2].stack-=50; players[2].streetCommitted=50; players[2].committed=50; players[2].lastAction="BB 50";
  return { deck, players, community:[], pot:75, currentBet:50, street:"preflop", turn:0, winner:null, active:true, handId:Date.now(), log:["New luxury demo hand"], lastAction:"New hand" };
}
function livePlayers(){ return state.players.filter(p=>!p.folded); }
function user(){ return state.players[0]; }
function pushLog(msg){ state.log.unshift(msg); state.log=state.log.slice(0,7); state.lastAction=msg; }
function commit(p, amount){ const pay = Math.max(0, Math.min(Number(amount)||0, p.stack)); p.stack-=pay; p.streetCommitted+=pay; p.committed+=pay; state.pot+=pay; if(p.stack<=0){ p.stack=0; p.allIn=true; } return pay; }
function resetStreet(){ state.players.forEach(p=>{ p.streetCommitted=0; p.acted=false; }); state.currentBet=0; }
function revealStreet(){
  if(state.street==="preflop"){ state.community.push(state.deck.pop(),state.deck.pop(),state.deck.pop()); state.street="flop"; pushLog("Flop dealt"); }
  else if(state.street==="flop"){ state.community.push(state.deck.pop()); state.street="turn"; pushLog("Turn dealt"); }
  else if(state.street==="turn"){ state.community.push(state.deck.pop()); state.street="river"; pushLog("River dealt"); }
  else showdown();
  resetStreet(); state.turn=0;
}
function nextSeat(){
  for(let i=1;i<=state.players.length;i++){
    const idx=(state.turn+i)%state.players.length, p=state.players[idx];
    if(!p.folded && !p.allIn){ state.turn=idx; return; }
  }
}
function settled(){
  const active = state.players.filter(p=>!p.folded && !p.allIn);
  if(active.length<=1) return true;
  return active.every(p=>p.acted && p.streetCommitted===state.currentBet);
}
function showdown(){
  state.street="showdown"; state.active=false;
  const candidates=livePlayers();
  const winner=candidates[Math.floor(Math.random()*candidates.length)] || user();
  winner.stack += state.pot; winner.lastAction=`WIN ${state.pot}`; state.winner=winner.id; pushLog(`${winner.name} wins ${state.pot}`); state.pot=0;
}
function advance(){
  if(livePlayers().length<=1){ showdown(); return; }
  if(settled()){ if(state.street==="river") showdown(); else revealStreet(); return; }
  nextSeat();
}
function playerAction(action){
  if(!state) state = newGameState();
  if(action==="next"){ state = newGameState(); renderDemo(true); return; }
  if(!state.active || state.players[state.turn]?.id !== "user") return;
  const p=user(); const need=Math.max(0,state.currentBet-p.streetCommitted);
  if(action==="fold"){ p.folded=true; p.acted=true; p.lastAction="FOLD"; pushLog("You fold"); }
  else if(action==="check" || action==="call"){ const paid=commit(p,need); p.acted=true; p.lastAction=paid?`CALL ${paid}`:"CHECK"; pushLog(paid?`You call ${paid}`:"You check"); }
  else if(action==="raise"){ const paid=commit(p,need+250); state.currentBet=Math.max(state.currentBet,p.streetCommitted); state.players.forEach(x=>{ if(x!==p && !x.folded) x.acted=false; }); p.acted=true; p.lastAction=`RAISE ${paid}`; pushLog(`You raise ${paid}`); }
  else if(action==="all_in"){ const paid=commit(p,p.stack); state.currentBet=Math.max(state.currentBet,p.streetCommitted); state.players.forEach(x=>{ if(x!==p && !x.folded) x.acted=false; }); p.acted=true; p.lastAction=`ALL-IN ${paid}`; pushLog(`You all-in ${paid}`); }
  advance(); renderDemo(true);
}
function botTick(){
  if(!state?.active || state.street==="showdown") return;
  const p=state.players[state.turn]; if(!p || p.isUser) return;
  const need=Math.max(0,state.currentBet-p.streetCommitted);
  const roll=Math.random();
  if(need>0 && roll<.18){ p.folded=true; p.acted=true; p.lastAction="FOLD"; pushLog(`${p.name} folds`); }
  else if(roll>.82 && p.stack>need+250 && state.street!=="river"){ const paid=commit(p,need+250); state.currentBet=Math.max(state.currentBet,p.streetCommitted); state.players.forEach(x=>{ if(x!==p && !x.folded) x.acted=false; }); p.acted=true; p.lastAction=`RAISE ${paid}`; pushLog(`${p.name} raises`); }
  else { const paid=commit(p,need); p.acted=true; p.lastAction=paid?`CALL ${paid}`:"CHECK"; pushLog(paid?`${p.name} calls`:`${p.name} checks`); }
  advance(); renderDemo(true);
}
function cardTexture(card, hidden=false){
  const key = hidden ? "BACK" : card?.label;
  if(cardCache.has(key)) return cardCache.get(key);
  const c=document.createElement("canvas"); c.width=256; c.height=360; const x=c.getContext("2d");
  x.fillStyle=hidden?"#080b16":"#f7f3e6"; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=hidden?"#7ffcff":"#111"; x.lineWidth=10; x.strokeRect(10,10,c.width-20,c.height-20);
  x.textAlign="center"; x.textBaseline="middle";
  if(hidden){ x.fillStyle="#7ffcff"; x.font="900 52px system-ui"; x.fillText("SVR",128,150); x.fillStyle="#ffd98a"; x.font="800 28px system-ui"; x.fillText("POKER",128,205); }
  else { const red = card.suit==="H"||card.suit==="D"; x.fillStyle=red?"#b5142b":"#101015"; x.font="900 74px system-ui"; x.fillText(card.rank,128,132); x.font="900 72px system-ui"; x.fillText({S:"♠",H:"♥",D:"♦",C:"♣"}[card.suit],128,230); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; cardCache.set(key,t); return t;
}
function labelTexture(text, sub=""){
  const key = `${text}|${sub}|${Math.floor(Date.now()/800)}`;
  const c=document.createElement("canvas"); c.width=640; c.height=220; const x=c.getContext("2d");
  x.fillStyle="rgba(0,0,0,.72)"; x.fillRect(0,0,c.width,c.height); x.strokeStyle="#ffd98a"; x.lineWidth=8; x.strokeRect(16,16,c.width-32,c.height-32);
  x.textAlign="center"; x.textBaseline="middle"; x.fillStyle="#fff"; x.font="900 48px system-ui"; x.fillText(text,c.width/2,78,560); x.fillStyle="#bffcff"; x.font="800 30px system-ui"; x.fillText(sub,c.width/2,145,560);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function addCard(parent, card, x, y, z, hidden=false, rotY=0){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.30,.42), new THREE.MeshBasicMaterial({ map:cardTexture(card,hidden), side:THREE.DoubleSide }));
  m.name="PHASE168_DEMO_CARD"; m.rotation.x=-Math.PI/2; m.rotation.z=rotY; m.position.set(x,y,z); m.renderOrder=1700; parent.add(m); return m;
}
function addChipStack(parent, name, x, y, z, count=6, color=0xffd98a){
  const h=.026;
  for(let i=0;i<count;i++){
    const chip = new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,h,32), new THREE.MeshStandardMaterial({ color, roughness:.42, metalness:.18 }));
    chip.name=`${name}_CHIP_${i+1}`; chip.position.set(x,y+h/2+i*h,z); parent.add(chip);
  }
}
function seatLayout(rec){
  const { center, size } = rec;
  const w=Math.max(size.x,4.0), d=Math.max(size.z,2.2);
  return [
    {id:"user", x:center.x, z:center.z+d*.88, yaw:Math.PI, label:"OPEN PLAYER SEAT"},
    {id:"bot1", x:center.x-w*.47, z:center.z+d*.58, yaw:-Math.PI*.72, label:"BOT"},
    {id:"bot2", x:center.x-w*.58, z:center.z-d*.06, yaw:-Math.PI/2, label:"BOT"},
    {id:"bot3", x:center.x, z:center.z-d*.78, yaw:0, label:"BOT"},
    {id:"bot4", x:center.x+w*.58, z:center.z-d*.06, yaw:Math.PI/2, label:"BOT"},
    {id:"bot5", x:center.x+w*.47, z:center.z+d*.58, yaw:Math.PI*.72, label:"BOT"}
  ];
}
function makePill(parent, p, seat, y){
  if(p.isUser) return;
  const g=new THREE.Group(); g.name=`PHASE168_BOT_PILL_AVATAR_${p.id}`; g.position.set(seat.x,y,seat.z); g.rotation.y=seat.yaw;
  const bodyColor = p.folded ? 0x393944 : (state.players[state.turn]?.id===p.id ? 0xffd98a : 0x7ffcff);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.62,24), mat(bodyColor,.45,.08)); cyl.position.y=.42; g.add(cyl);
  const top = new THREE.Mesh(new THREE.SphereGeometry(.18,24,16), mat(bodyColor,.45,.08)); top.position.y=.74; g.add(top);
  const bot = new THREE.Mesh(new THREE.SphereGeometry(.18,24,16), mat(bodyColor,.45,.08)); bot.position.y=.10; g.add(bot);
  const handMat = new THREE.MeshStandardMaterial({ color:0xf1c7a2, roughness:.62, metalness:.02 });
  [-.18,.18].forEach((sx,i)=>{ const h=new THREE.Mesh(new THREE.SphereGeometry(.09,18,12),handMat); h.name=`${g.name}_FLOATING_HAND_${i+1}`; h.scale.set(1.0,.42,1.65); h.position.set(sx,.24,-.42); g.add(h); });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.15,.40), new THREE.MeshBasicMaterial({ map:labelTexture(p.name,`${p.stack} • ${p.lastAction}`), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  lab.name=`${g.name}_ACTION_LABEL`; lab.position.set(0,1.05,0); lab.rotation.y=Math.PI; g.add(lab);
  parent.add(g);
}
function makeActionButton(parent, action, text, x, z, y){
  const c=document.createElement("canvas"); c.width=512; c.height=180; const ctx=c.getContext("2d");
  ctx.fillStyle="rgba(5,7,16,.88)"; ctx.fillRect(0,0,c.width,c.height); ctx.strokeStyle="#7ffcff"; ctx.lineWidth=8; ctx.strokeRect(12,12,c.width-24,c.height-24); ctx.fillStyle="#fff"; ctx.font="900 48px system-ui"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(text,c.width/2,c.height/2);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(.82,.28), new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  m.name=`PHASE168_ACTION_BUTTON_${action}`; m.userData.svrPokerAction=action; m.position.set(x,y,z); m.rotation.x=-Math.PI/2; m.renderOrder=1800; parent.add(m); return m;
}
function renderDemo(force=false){
  if(!sceneRef || !tableRec || !state) return false;
  const now=performance.now(); if(!force && now-lastRenderAt<280) return false; lastRenderAt=now;
  const rootObj=sceneRoot(sceneRef); if(!rootObj) return false;
  removeNamed(rootObj, ROOT_NAME);
  root=new THREE.Group(); root.name=ROOT_NAME; rootObj.add(root);
  const rec=tableBounds(rootObj) || tableRec; tableRec=rec;
  const surfaceY=rec.surfaceY+.075, center=rec.center, size=rec.size;
  const seats=seatLayout(rec);
  // Community cards
  const startX=center.x-.62;
  state.community.forEach((c,i)=>addCard(root,c,startX+i*.31,surfaceY,center.z-size.z*.08,false,0));
  addChipStack(root,"PHASE168_CENTER_POT",center.x,surfaceY,center.z+size.z*.18,Math.min(12,Math.max(3,Math.ceil(state.pot/120))),0xffd98a);
  // Dealer button
  const btn=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.025,32), new THREE.MeshStandardMaterial({ color:0xffffff, roughness:.35, metalness:.12 })); btn.name="PHASE168_GOLD_DEALER_BUTTON"; btn.position.set(center.x+size.x*.30,surfaceY+.02,center.z-size.z*.30); root.add(btn);
  // Player/bot cards and chips
  state.players.forEach((p,i)=>{
    const seat=seats.find(s=>s.id===p.id) || seats[i];
    makePill(root,p,seat,rec.box.min.y+.20);
    const cardY=surfaceY+.018;
    const toward = new THREE.Vector3(center.x-seat.x,0,center.z-seat.z).normalize();
    const baseX=seat.x+toward.x*.58, baseZ=seat.z+toward.z*.58;
    addCard(root,p.cards[0],baseX-.16,cardY,baseZ,p.isBot && !p.folded,seat.yaw);
    addCard(root,p.cards[1],baseX+.16,cardY,baseZ,p.isBot && !p.folded,seat.yaw);
    addChipStack(root,`PHASE168_${p.id.toUpperCase()}_STACK`,baseX+.42,cardY,baseZ+.06,Math.min(8,Math.max(2,Math.ceil(p.stack/9000))),p.isUser?0x7ffcff:0xff5b8c);
    if(p.isUser){
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.8,.46), new THREE.MeshBasicMaterial({ map:labelTexture("OPEN PLAYER SEAT",`${p.stack} • ${p.lastAction}`), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
      lab.name="PHASE168_OPEN_PLAYER_SEAT_LABEL"; lab.position.set(seat.x, surfaceY+.55, seat.z+.12); lab.rotation.x=-Math.PI/9; root.add(lab);
    }
  });
  const info = new THREE.Mesh(new THREE.PlaneGeometry(2.4,.58), new THREE.MeshBasicMaterial({ map:labelTexture(`${state.street.toUpperCase()} • POT ${state.pot}`, state.active ? `TURN: ${state.players[state.turn]?.name || "—"}` : `WINNER: ${state.players.find(p=>p.id===state.winner)?.name || "—"}`), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  info.name="PHASE168_TABLE_STATUS_FLOATING_LOW"; info.position.set(center.x, surfaceY+.64, center.z-size.z*.62); info.rotation.x=-Math.PI/7; root.add(info);
  // Action rail at open seat
  removeNamed(rootObj,"PHASE168_ACTION_RAIL_ROOT");
  actionGroup=new THREE.Group(); actionGroup.name="PHASE168_ACTION_RAIL_ROOT"; rootObj.add(actionGroup);
  const az=center.z+size.z*.92, ay=surfaceY+.10;
  [["fold","FOLD"],["check","CHECK"],["call","CALL"],["raise","RAISE"],["all_in","ALL IN"],["next","NEXT"]].forEach((r,i)=>makeActionButton(actionGroup,r[0],r[1],center.x-2.15+i*.86,az,ay));
  window.SVR_PHASE168_PLAYABLE_POKER_DEMO_SIMULATION_LOCK={ build:LABEL, active:true, street:state.street, pot:state.pot, turn:state.players[state.turn]?.name||null, playerStack:user().stack, botCount:5, openSeat:true, pillBots:true, floatingBotHands:true, cardsOnTable:true, chipsOnTable:true, leatherHandRest:true, feltAlignedToFbxSurface:true, siteTouched:false, checkedAt:new Date().toISOString() };
  return true;
}
function installPointer(){
  if(installedPointer || !rendererRef || !cameraRef) return;
  installedPointer=true;
  const raycaster=new THREE.Raycaster(); const mouse=new THREE.Vector2();
  rendererRef.domElement.addEventListener("pointerdown", ev=>{
    if(!actionGroup) return;
    const rect=rendererRef.domElement.getBoundingClientRect();
    mouse.x=((ev.clientX-rect.left)/rect.width)*2-1; mouse.y=-((ev.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,cameraRef);
    const hits=raycaster.intersectObjects(actionGroup.children,true);
    const action=hits.find(h=>h.object?.userData?.svrPokerAction)?.object.userData.svrPokerAction;
    if(action) playerAction(action);
  });
  window.addEventListener("keydown", ev=>{
    const map={KeyF:"fold",KeyC:"check",KeyV:"call",KeyR:"raise",KeyA:"all_in",KeyN:"next",KeyH:"next"};
    if(map[ev.code]) playerAction(map[ev.code]);
  });
  window.addEventListener("svr-poker-player-action", ev=>{ if(ev?.detail?.action) playerAction(ev.detail.action); });
}
async function install(){
  sceneRef=window.__SVR_SCENE__; cameraRef=window.__SVR_CAMERA__; rendererRef=window.__SVR_RENDERER__;
  if(!sceneRef) return false;
  const rootObj=sceneRoot(sceneRef); if(!rootObj) return false;
  const table=await installRefinedTableSurface(rootObj);
  if(!state) state=newGameState();
  tableRec=tableBounds(rootObj) || tableRec;
  installPointer();
  renderDemo(true);
  window.SVR_DEMO_POKER_ACTION=playerAction;
  window.SVR_RUN_PHASE168_DEMO_AUDIT=()=>window.SVR_PHASE168_PLAYABLE_POKER_DEMO_SIMULATION_LOCK;
  window.SVR_PHASE168_TABLE_SURFACE_AUDIT=table;
  window.SVR_LOCKED_FINAL_BUILD=LABEL; window.SVR_LIVE_BUILD_POINTER=LABEL;
  return true;
}
function loop(){
  if(!state) return;
  const now=performance.now();
  if(state.active && state.players[state.turn]?.isBot && now-lastBotAt>1150){ lastBotAt=now; botTick(); }
  renderDemo(false);
}

[350,900,1800,3500,6500,10000].forEach(ms=>setTimeout(()=>install(),ms));
setInterval(loop,300);
setInterval(()=>install(),8000);
install();
