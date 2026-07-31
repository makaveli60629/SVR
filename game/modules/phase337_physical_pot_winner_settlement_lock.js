import * as THREE from "three";
import { state, players } from "./phase336_authoritative_engine.js";
import {
  blindSeats,
  buildProvisionalPots,
  splitAwards,
  visualChipPlan,
  validateVisualLedger,
  runPhase337ModelSelfTest
} from "./phase337_pot_visual_model.js";

const BUILD = "PHASE-337-PHYSICAL-POT-WINNER-SETTLEMENT-LOCK";
const ROOT_NAME = "PHASE337_PHYSICAL_POT_SETTLEMENT_ROOT";
const TABLE_NAMES = [
  "PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED",
  "PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT",
  "PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED"
];
const COLORS = new Map([
  [1, 0xeaf7ff],
  [5, 0xb51632],
  [25, 0x127646],
  [100, 0x171923]
]);

let scene = null;
let camera = null;
let root = null;
let tableInfo = null;
let markerRoot = null;
let potRoot = null;
let transientRoot = null;
let winnerRoot = null;
let installed = false;
let timer = null;
let lastHandNo = -1;
let lastPhase = "";
let lastSettlementKey = "";
let lastPotSignature = "";
let lastContributions = new Map();
let lastStateAt = performance.now();
let visualPotTotal = 0;
let settlementAnimations = 0;
let contributionAnimations = 0;
let physicalChipCollections = 0;
let completedSettlements = 0;
const animations = [];

const chipGeometry = new THREE.CylinderGeometry(0.034, 0.034, 0.008, 32);
const chipMaterials = new Map();

function getScene(){
  return window.__SVR_SCENE__ || null;
}

function getCamera(){
  return window.__SVR_CAMERA__ || null;
}

function sceneRoot(){
  return scene?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || scene;
}

function authoritativeTable(){
  const base = sceneRoot();
  for(const name of TABLE_NAMES){
    const table = base?.getObjectByName?.(name) || scene?.getObjectByName?.(name);
    if(table) return table;
  }
  return null;
}

function detectTable(){
  const table = authoritativeTable();
  if(!table) return null;
  table.updateWorldMatrix(true,true);
  const full = new THREE.Box3().setFromObject(table);
  let felt = null;
  let best = -Infinity;
  table.traverse(object=>{
    if(!object.isMesh) return;
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const label = `${object.name || ""} ${materials.map(material=>material?.name || "").join(" ")}`.toLowerCase();
    const score = (/polotno|felt|cloth|baize|surface|play/.test(label) ? 180 : 0)
      + size.x * size.z * 2
      + (Math.max(size.x,size.z) / Math.max(0.001,size.y) > 20 ? 30 : 0);
    if(score > best){
      best = score;
      felt = { box, size };
    }
  });
  const source = felt || { box: full, size: new THREE.Vector3() };
  if(!felt) full.getSize(source.size);
  const center = new THREE.Vector3();
  source.box.getCenter(center);
  return {
    table,
    center,
    top: source.box.max.y + 0.014,
    width: Math.max(2.2, Math.min(source.size.x * 0.94, 4.1)),
    depth: Math.max(1.18, Math.min(source.size.z * 0.92, 2.25))
  };
}

function activeCamera(){
  const renderer = window.__SVR_RENDERER__;
  return renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
}

function cameraWorld(){
  const position = new THREE.Vector3();
  activeCamera()?.getWorldPosition?.(position);
  return position;
}

function canvasTexture(width,height,draw){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"),canvas);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function roundedRect(context,x,y,width,height,radius){
  const r = Math.min(radius,width/2,height/2);
  context.beginPath();
  context.moveTo(x+r,y);
  context.lineTo(x+width-r,y);
  context.quadraticCurveTo(x+width,y,x+width,y+r);
  context.lineTo(x+width,y+height-r);
  context.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  context.lineTo(x+r,y+height);
  context.quadraticCurveTo(x,y+height,x,y+height-r);
  context.lineTo(x,y+r);
  context.quadraticCurveTo(x,y,x+r,y);
  context.closePath();
}

function labelTexture(lines,accent="#ffd98a",background="rgba(3,8,16,.90)"){
  return canvasTexture(768,256,(context,canvas)=>{
    context.clearRect(0,0,canvas.width,canvas.height);
    context.fillStyle = background;
    roundedRect(context,8,8,752,240,28);
    context.fill();
    context.strokeStyle = accent;
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    const clean = lines.slice(0,3);
    clean.forEach((line,index)=>{
      context.font = index === 0 ? "900 68px system-ui" : "800 38px system-ui";
      const y = clean.length === 1 ? 128 : 72 + index * 72;
      context.fillText(String(line),384,y,710);
    });
  });
}

function markerTexture(text,foreground="#fff",background="#111"){
  return canvasTexture(512,512,(context)=>{
    context.fillStyle = background;
    context.beginPath();
    context.arc(256,256,238,0,Math.PI*2);
    context.fill();
    context.strokeStyle = foreground;
    context.lineWidth = 24;
    context.stroke();
    context.fillStyle = foreground;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = text.length > 1 ? "900 170px system-ui" : "900 250px system-ui";
    context.fillText(text,256,270,420);
  });
}

function chipMaterial(value){
  if(chipMaterials.has(value)) return chipMaterials.get(value);
  const color = COLORS.get(value) || 0x7ffcff;
  const material = new THREE.MeshPhysicalMaterial({
    color,
    roughness:0.36,
    metalness:0.12,
    clearcoat:0.38,
    clearcoatRoughness:0.26
  });
  chipMaterials.set(value,material);
  return material;
}

function makeChip(value,name){
  const chip = new THREE.Mesh(chipGeometry,chipMaterial(value));
  chip.name = name;
  chip.rotation.x = Math.PI / 2;
  chip.userData.phase337 = true;
  chip.userData.value = value;
  return chip;
}

function ensureRoots(){
  scene = getScene();
  camera = getCamera();
  if(!scene || !camera) return false;
  tableInfo = detectTable();
  if(!tableInfo) return false;

  const old = scene.getObjectByName(ROOT_NAME);
  if(old && old !== root) old.removeFromParent();

  if(!root){
    root = new THREE.Group();
    root.name = ROOT_NAME;
    markerRoot = new THREE.Group();
    markerRoot.name = "PHASE337_DEALER_BLIND_MARKERS";
    potRoot = new THREE.Group();
    potRoot.name = "PHASE337_LEDGER_POT_STACKS";
    transientRoot = new THREE.Group();
    transientRoot.name = "PHASE337_TRANSIENT_CHIP_ANIMATIONS";
    winnerRoot = new THREE.Group();
    winnerRoot.name = "PHASE337_WINNER_PRESENTATION";
    root.add(markerRoot,potRoot,transientRoot,winnerRoot);
    scene.add(root);
  }else if(!root.parent){
    scene.add(root);
  }
  return true;
}

function seatPosition(id){
  const tag = scene?.getObjectByName?.(`P85_TAG_${id}`);
  if(tag){
    const point = new THREE.Vector3();
    tag.getWorldPosition(point);
    point.y = tableInfo.top + 0.022;
    const towardCenter = tableInfo.center.clone().sub(point).setY(0).multiplyScalar(0.18);
    point.add(towardCenter);
    return point;
  }
  const angle = -Math.PI / 2 + id * Math.PI * 2 / players.length;
  return new THREE.Vector3(
    tableInfo.center.x + Math.cos(angle) * tableInfo.width * 0.34,
    tableInfo.top + 0.022,
    tableInfo.center.z + Math.sin(angle) * tableInfo.depth * 0.43
  );
}

function potPosition(index,count){
  const spacing = Math.min(0.34,tableInfo.width * 0.095);
  const offset = (index - (count - 1) / 2) * spacing;
  return new THREE.Vector3(
    tableInfo.center.x + offset,
    tableInfo.top + 0.024,
    tableInfo.center.z - tableInfo.depth * 0.04
  );
}

function clearGroup(group){
  while(group?.children?.length){
    const child = group.children[group.children.length-1];
    group.remove(child);
    child.traverse?.(object=>{
      if(object.geometry && object.geometry !== chipGeometry) object.geometry.dispose?.();
      if(object.material){
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for(const material of materials){
          material.map?.dispose?.();
          if(![...chipMaterials.values()].includes(material)) material.dispose?.();
        }
      }
    });
  }
}

function markerMesh(text,color,background,name){
  const material = new THREE.MeshBasicMaterial({
    map:markerTexture(text,color,background),
    transparent:true,
    depthWrite:false,
    side:THREE.DoubleSide,
    toneMapped:false
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(0.075,48),material);
  mesh.name = name;
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 3375;
  return mesh;
}

function syncMarkers(){
  clearGroup(markerRoot);
  const blinds = blindSeats(players,state.dealer,players.length);
  const definitions = [
    { id:blinds.dealer, text:"D", color:"#111", background:"#f5f5f5", name:"PHASE337_DEALER_BUTTON" },
    { id:blinds.smallBlind, text:"SB", color:"#7ffcff", background:"#071018", name:"PHASE337_SMALL_BLIND_BUTTON" },
    { id:blinds.bigBlind, text:"BB", color:"#ffd98a", background:"#171109", name:"PHASE337_BIG_BLIND_BUTTON" }
  ];
  definitions.forEach((definition,index)=>{
    if(definition.id < 0) return;
    const marker = markerMesh(definition.text,definition.color,definition.background,definition.name);
    const base = seatPosition(definition.id);
    const tangent = base.clone().sub(tableInfo.center).setY(0).normalize();
    const lateral = new THREE.Vector3(-tangent.z,0,tangent.x).multiplyScalar((index-1)*0.088);
    marker.position.copy(base).addScaledVector(tangent,-0.12).add(lateral);
    marker.position.y = tableInfo.top + 0.026 + index * 0.002;
    marker.userData.seatId = definition.id;
    markerRoot.add(marker);
  });

  const current = players[state.current];
  if(current && state.phase !== "showdown" && state.phase !== "idle"){
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.095,0.009,10,48),
      new THREE.MeshBasicMaterial({color:current.human?0x7ffcff:0xffd98a,transparent:true,opacity:0.9,depthWrite:false,toneMapped:false})
    );
    ring.name = "PHASE337_CURRENT_TURN_RING";
    ring.position.copy(seatPosition(current.id));
    ring.position.y = tableInfo.top + 0.034;
    ring.rotation.x = Math.PI / 2;
    ring.userData.pulse = true;
    markerRoot.add(ring);
  }
}

function potLabel(index,pot){
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.40,0.13),
    new THREE.MeshBasicMaterial({
      map:labelTexture([
        index === 0 ? "MAIN POT" : `SIDE POT ${index}`,
        `$${Number(pot.amount || 0).toLocaleString()}`
      ],index === 0 ? "#ffd98a" : "#7ffcff"),
      transparent:true,
      depthWrite:false,
      side:THREE.DoubleSide,
      toneMapped:false
    })
  );
  label.name = `PHASE337_POT_${index}_LABEL`;
  label.rotation.x = -Math.PI / 2;
  label.renderOrder = 3377;
  return label;
}

function buildPotGroup(index,pot,count){
  const group = new THREE.Group();
  group.name = `PHASE337_${index === 0 ? "MAIN" : `SIDE_${index}`}_POT`;
  group.position.copy(potPosition(index,count));
  group.userData.amount = Number(pot.amount || 0);
  group.userData.eligible = [...(pot.eligible || [])];
  group.userData.winners = [...(pot.winners || [])];

  const plan = visualChipPlan(pot.amount,24);
  const columns = 4;
  plan.forEach((value,chipIndex)=>{
    const chip = makeChip(value,`PHASE337_POT_${index}_CHIP_${chipIndex}`);
    const column = chipIndex % columns;
    const row = Math.floor(chipIndex / columns) % 2;
    const stack = Math.floor(chipIndex / (columns * 2));
    chip.position.set(
      (column - (columns-1)/2) * 0.074,
      0.006 + stack * 0.009,
      (row - 0.5) * 0.072
    );
    group.add(chip);
  });

  const label = potLabel(index,pot);
  label.position.set(0,0.025,0.16);
  group.add(label);
  return group;
}

function currentPots(){
  if(state.phase === "showdown" && Array.isArray(state.pots) && state.pots.length){
    return state.pots.map(pot=>({
      amount:Number(pot.amount || 0),
      cap:Number(pot.cap || 0),
      eligible:[...(pot.eligible || [])],
      winners:[...(pot.winners || [])],
      hand:pot.hand || ""
    }));
  }
  return buildProvisionalPots(players);
}

function potSignature(pots){
  return JSON.stringify(pots.map(pot=>[
    Number(pot.amount || 0),
    [...(pot.eligible || [])],
    [...(pot.winners || [])]
  ]));
}

function rebuildPots(force=false){
  const pots = currentPots();
  const signature = potSignature(pots);
  if(!force && signature === lastPotSignature) return pots;
  lastPotSignature = signature;
  clearGroup(potRoot);
  pots.forEach((pot,index)=>potRoot.add(buildPotGroup(index,pot,pots.length)));
  visualPotTotal = pots.reduce((sum,pot)=>sum + Number(pot.amount || 0),0);
  return pots;
}

function makePacket(amount,start,end,color=0xffd98a,delay=0,duration=900){
  const group = new THREE.Group();
  group.name = "PHASE337_CHIP_PACKET";
  const plan = visualChipPlan(amount,6);
  plan.forEach((value,index)=>{
    const chip = makeChip(value,`PHASE337_PACKET_CHIP_${index}`);
    chip.position.set((index%3-1)*0.052,Math.floor(index/3)*0.009,(index%2-.5)*0.035);
    group.add(chip);
  });
  if(!plan.length){
    const chip = new THREE.Mesh(
      chipGeometry,
      new THREE.MeshPhysicalMaterial({color,roughness:.4,metalness:.12,clearcoat:.25})
    );
    chip.rotation.x = Math.PI/2;
    group.add(chip);
  }
  group.position.copy(start);
  transientRoot.add(group);
  animations.push({
    group,
    start:start.clone(),
    end:end.clone(),
    amount:Number(amount || 0),
    delay,
    duration,
    started:performance.now(),
    settlement:false
  });
  return group;
}

function animateContribution(id,delta,potCount){
  if(delta <= 0) return;
  const start = seatPosition(id);
  start.y += 0.08;
  const end = potPosition(0,Math.max(1,potCount));
  end.y += 0.05;
  makePacket(delta,start,end,players[id]?.human?0x7ffcff:0xffd98a,0,760);
  contributionAnimations++;
}

function consumePhysicalChips(amount){
  const candidates = [];
  sceneRoot()?.traverse?.(object=>{
    if(
      object.isMesh &&
      object.userData?.svr332 &&
      object.userData?.locked &&
      !object.userData?.phase337Consumed &&
      object.visible
    ) candidates.push(object);
  });
  let remaining = Math.max(0,Number(amount || 0));
  candidates.sort((a,b)=>Number(b.userData?.value || 0)-Number(a.userData?.value || 0));
  const destination = potPosition(0,Math.max(1,currentPots().length));
  candidates.forEach((chip,index)=>{
    if(remaining <= 0 && index > 0) return;
    const value = Number(chip.userData?.value || 1);
    const start = new THREE.Vector3();
    chip.getWorldPosition(start);
    const clone = makePacket(value,start,destination,0x7ffcff,index*35,650);
    clone.name = "PHASE337_PHYSICAL_CHIP_COLLECTION_PACKET";
    chip.userData.phase337Consumed = true;
    chip.visible = false;
    remaining -= value;
  });
  physicalChipCollections += candidates.length ? 1 : 0;
}

function winnerBanner(){
  clearGroup(winnerRoot);
  if(state.phase !== "showdown" || !state.winners?.length) return;
  const lines = state.winners.slice(0,2).map(winner=>`${winner.name} +$${winner.amount} ${winner.label || ""}`);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.20,0.30),
    new THREE.MeshBasicMaterial({
      map:labelTexture(["WINNER",...lines],"#ffd98a","rgba(18,8,2,.92)"),
      transparent:true,
      depthWrite:false,
      side:THREE.DoubleSide,
      toneMapped:false
    })
  );
  panel.name = "PHASE337_WINNER_BANNER";
  const cam = cameraWorld();
  const away = tableInfo.center.clone().sub(cam).setY(0);
  if(away.lengthSq() < 0.05) away.set(0,0,-1);
  away.normalize();
  panel.position.copy(tableInfo.center).addScaledVector(away,tableInfo.depth * 0.55);
  panel.position.y = tableInfo.top + 0.88;
  panel.lookAt(cam.x,panel.position.y,cam.z);
  panel.renderOrder = 3382;
  winnerRoot.add(panel);
}

function settlementKey(){
  if(state.phase !== "showdown") return "";
  return JSON.stringify([
    state.handNo,
    state.pots?.map(pot=>[pot.amount,pot.winners]),
    state.winners?.map(winner=>[winner.id,winner.amount])
  ]);
}

function animateSettlement(){
  const key = settlementKey();
  if(!key || key === lastSettlementKey) return;
  lastSettlementKey = key;
  const pots = currentPots();
  let finalDelay = 0;
  pots.forEach((pot,index)=>{
    const start = potPosition(index,pots.length);
    start.y += 0.08;
    const awards = splitAwards(pot,state.dealer,players.length);
    awards.forEach((award,winnerIndex)=>{
      const end = seatPosition(award.id);
      end.y += 0.11;
      const delay = index * 540 + winnerIndex * 190;
      const packet = makePacket(award.amount,start,end,0xffd98a,delay,1150);
      const animation = animations[animations.length-1];
      animation.settlement = true;
      animation.potIndex = index;
      animation.winnerId = award.id;
      finalDelay = Math.max(finalDelay,delay+1150);
      settlementAnimations++;
      packet.userData.award = award;
    });
  });
  setTimeout(()=>{
    potRoot.visible = false;
    winnerBanner();
    completedSettlements++;
    window.dispatchEvent(new CustomEvent("svr:pot-settlement-visual-complete",{
      detail:{
        build:BUILD,
        handNo:state.handNo,
        pots:state.pots,
        winners:state.winners,
        completedAt:new Date().toISOString()
      }
    }));
  },Math.max(900,finalDelay+120));
}

function resetForNewHand(){
  potRoot.visible = true;
  clearGroup(winnerRoot);
  lastSettlementKey = "";
  lastPotSignature = "";
  lastContributions = new Map(players.map(player=>[player.id,0]));
  animations.splice(0).forEach(animation=>animation.group?.removeFromParent?.());
}

function syncState(force=false){
  if(!ensureRoots()) return false;
  if(state.handNo !== lastHandNo){
    lastHandNo = state.handNo;
    resetForNewHand();
  }

  const pots = rebuildPots(force);
  syncMarkers();

  for(const player of players){
    const current = Number(player.contributed || 0);
    const previous = Number(lastContributions.get(player.id) || 0);
    if(current > previous && state.phase !== "showdown"){
      animateContribution(player.id,current-previous,pots.length);
    }
    lastContributions.set(player.id,current);
  }

  if(state.phase === "showdown") animateSettlement();
  else if(lastPhase === "showdown"){
    potRoot.visible = true;
    clearGroup(winnerRoot);
  }

  lastPhase = state.phase;
  lastStateAt = performance.now();
  window.SVR_PHASE337_LEDGER_SNAPSHOT = {
    build:BUILD,
    handNo:state.handNo,
    phase:state.phase,
    ledgerPot:Number(state.pot || 0),
    visualPot:visualPotTotal,
    difference:Number(state.pot || 0)-visualPotTotal,
    pots:pots.map((pot,index)=>({
      index,
      amount:Number(pot.amount || 0),
      eligible:[...(pot.eligible || [])],
      winners:[...(pot.winners || [])]
    })),
    dealer:state.dealer,
    blinds:blindSeats(players,state.dealer,players.length),
    syncedAt:new Date().toISOString()
  };
  return true;
}

function tick(){
  const now = performance.now();
  for(let index=animations.length-1;index>=0;index--){
    const animation = animations[index];
    const elapsed = now-animation.started-animation.delay;
    if(elapsed < 0) continue;
    const t = Math.min(1,elapsed/animation.duration);
    const smooth = t*t*(3-2*t);
    animation.group.position.lerpVectors(animation.start,animation.end,smooth);
    animation.group.position.y += Math.sin(Math.PI*t)*0.22;
    animation.group.rotation.y += 0.10;
    if(t >= 1){
      animation.group.removeFromParent();
      animations.splice(index,1);
    }
  }

  const turnRing = markerRoot?.getObjectByName?.("PHASE337_CURRENT_TURN_RING");
  if(turnRing){
    const pulse = 1 + Math.sin(now*0.007)*0.12;
    turnRing.scale.setScalar(pulse);
  }

  const banner = winnerRoot?.getObjectByName?.("PHASE337_WINNER_BANNER");
  if(banner){
    const cam = cameraWorld();
    banner.lookAt(cam.x,banner.position.y,cam.z);
  }
}

function qa(){
  const pots = currentPots();
  const ledger = validateVisualLedger(players,pots);
  const blind = blindSeats(players,state.dealer,players.length);
  return {
    build:BUILD,
    active:installed,
    handNo:state.handNo,
    phase:state.phase,
    ledgerPot:Number(state.pot || 0),
    visualPot:visualPotTotal,
    exactPotMatch:Number(state.pot || 0) === visualPotTotal,
    provisionalLedger:ledger,
    potCount:pots.length,
    dealer:blind.dealer,
    smallBlind:blind.smallBlind,
    bigBlind:blind.bigBlind,
    markers:markerRoot?.children?.map(child=>child.name) || [],
    contributionAnimations,
    settlementAnimations,
    completedSettlements,
    physicalChipCollections,
    activeAnimations:animations.length,
    winnerBannerVisible:!!winnerRoot?.getObjectByName?.("PHASE337_WINNER_BANNER"),
    publicSiteTouched:false,
    checkedAt:new Date().toISOString()
  };
}

function demoSettlement(){
  if(!ensureRoots()) return false;
  const pots = [
    {amount:400,winners:[0],eligible:[0,1,3]},
    {amount:450,winners:[1,3],eligible:[1,3]},
    {amount:150,winners:[3],eligible:[3]}
  ];
  clearGroup(potRoot);
  potRoot.visible = true;
  pots.forEach((pot,index)=>potRoot.add(buildPotGroup(index,pot,pots.length)));
  pots.forEach((pot,index)=>{
    splitAwards(pot,state.dealer < 0 ? 0 : state.dealer,players.length).forEach((award,winnerIndex)=>{
      const start = potPosition(index,pots.length);
      start.y += 0.08;
      const end = seatPosition(award.id);
      end.y += 0.11;
      makePacket(award.amount,start,end,0xffd98a,index*450+winnerIndex*180,1050);
    });
  });
  return true;
}

function install(){
  if(installed) return true;
  if(!ensureRoots()) return false;
  installed = true;
  window.addEventListener("svr:poker-state",()=>syncState(false));
  window.addEventListener("svr:physical-bet-committed",event=>{
    consumePhysicalChips(Number(event.detail?.total ?? event.detail?.value ?? 0));
  });
  window.SVR_PHASE337_QA = qa;
  window.SVR_PHASE337_REBUILD = ()=>syncState(true);
  window.SVR_PHASE337_AUTOMATED_QA = runPhase337ModelSelfTest;
  window.SVR_PHASE337_DEMO_SETTLEMENT = demoSettlement;
  window.SVR_PHASE337_STATE = {
    build:BUILD,
    authoritativePotVisuals:true,
    sidePotStacks:true,
    splitWinnerAnimation:true,
    dealerBlindMarkers:true,
    exactLedgerSync:true,
    siteTouched:false
  };
  syncState(true);
  timer = setInterval(()=>{
    tick();
    if(performance.now()-lastStateAt > 1500) syncState(false);
  },33);
  return true;
}

install();
[500,1200,2400,5000].forEach(delay=>setTimeout(install,delay));
