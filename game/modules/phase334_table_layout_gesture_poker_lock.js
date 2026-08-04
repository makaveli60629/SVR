import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { assetUrls, loadFirstTexture } from "./asset_base.js";

const BUILD = "PHASE-334-TABLE-LAYOUT-GESTURE-POKER-LOCK";
const ROOT_NAME = "PHASE334_TABLE_LAYOUT_GESTURE_ROOT";
const SEAT_KEY = "SVR_PHASE334_SEAT_OFFSETS_V1";
const IS_QUEST = /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || "");
const TABLE_NAMES = [
  "PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED",
  "PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT",
  "PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED"
];

let scene;
let camera;
let renderer;
let root;
let tableInfo;
let passRoot;
let logoRoot;
let zonesRoot;
let calibrationGroup;
let burnRoot;
let botRoot;
let xrSession = null;
let installed = false;
let playerSign = 1;
let seatAnchor = null;
let seatLocked = false;
let lastHand = -1;
let lastPhase = "";
let lastPhysicalAt = 0;
let lastKnockAt = 0;
let lastAllInAt = 0;
let originalPokerAction = null;
let wrappedPokerAction = null;
let previousTick = 0;
let botMixers = [];

const seatOffsets = loadSeatOffsets();
const calibrationButtons = new Map();
const calibrationDown = { left: false, right: false };
const heldCard = { left: null, right: null };
const inputHistory = { left: [], right: [] };
const inputState = {
  left: { lastWrist: null, lastAt: 0, velocity: new THREE.Vector3() },
  right: { lastWrist: null, lastAt: 0, velocity: new THREE.Vector3() }
};
const dealAnimations = [];
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const raycaster = new THREE.Raycaster();

function loadSeatOffsets(){
  try {
    return { back: 0.0762, up: 0.127, ...JSON.parse(localStorage.getItem(SEAT_KEY) || "{}") };
  } catch {
    return { back: 0.0762, up: 0.127 };
  }
}

function saveSeatOffsets(){
  try { localStorage.setItem(SEAT_KEY, JSON.stringify(seatOffsets)); } catch {}
}

function sceneRoot(){
  return scene?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || scene;
}

function authoritativeTable(){
  const base = sceneRoot();
  for (const name of TABLE_NAMES){
    const object = base?.getObjectByName?.(name) || scene?.getObjectByName?.(name);
    if (object) return object;
  }
  return null;
}

function bounds(object){
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { box, size, center };
}

function materialNames(object){
  const materials = Array.isArray(object?.material) ? object.material : [object?.material];
  return materials.map(material=>material?.name || "").join(" ").toLowerCase();
}

function detectTable(){
  const table = authoritativeTable();
  if (!table) return null;
  const full = bounds(table);
  let felt = null;
  let score = -Infinity;
  table.traverse(object=>{
    if (!object.isMesh) return;
    let record;
    try { record = bounds(object); } catch { return; }
    const label = `${object.name || ""} ${materialNames(object)}`.toLowerCase();
    const flatness = Math.max(record.size.x, record.size.z) / Math.max(0.001, record.size.y);
    const current = (/polotno|felt|cloth|baize|surface|play/.test(label) ? 180 : 0)
      + record.size.x * record.size.z * 2
      + (flatness > 20 ? 35 : 0);
    if (current > score){ score = current; felt = { object, ...record }; }
  });
  const source = felt || { object: null, ...full };
  return {
    table,
    felt: felt?.object || null,
    full,
    center: source.center.clone(),
    surfaceY: source.box.max.y + 0.010,
    width: Math.max(2.2, Math.min(source.size.x * 0.94, full.size.x * 0.74, 4.1)),
    depth: Math.max(1.18, Math.min(source.size.z * 0.92, full.size.z * 0.70, 2.25))
  };
}

function activeCamera(){
  return renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
}

function cameraWorld(target = new THREE.Vector3()){
  activeCamera()?.getWorldPosition?.(target);
  return target;
}

function setWorldPosition(object, position){
  if (!object?.parent) return;
  const local = position.clone();
  object.parent.worldToLocal(local);
  object.position.copy(local);
}

function determinePlayerSide(){
  const position = cameraWorld(tmpA);
  const delta = position.z - tableInfo.center.z;
  playerSign = Math.abs(delta) > 0.25 ? Math.sign(delta) : 1;
  return playerSign;
}

function capsulePoints(halfWidth, halfDepth, y, segments = 54){
  const radius = Math.min(halfDepth, halfWidth * 0.48);
  const straight = Math.max(0.02, halfWidth - radius);
  const points = [];
  for (let i = 0; i <= segments; i++){
    const angle = -Math.PI / 2 + i / segments * Math.PI;
    points.push(new THREE.Vector3(
      tableInfo.center.x + straight + Math.cos(angle) * radius,
      y,
      tableInfo.center.z + Math.sin(angle) * radius
    ));
  }
  for (let i = 0; i <= segments; i++){
    const angle = Math.PI / 2 + i / segments * Math.PI;
    points.push(new THREE.Vector3(
      tableInfo.center.x - straight + Math.cos(angle) * radius,
      y,
      tableInfo.center.z + Math.sin(angle) * radius
    ));
  }
  return points;
}

function tube(points, color, radius, name){
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal", 0.5);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 160, radius, 8, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.94, depthWrite: false, toneMapped: false })
  );
  mesh.name = name;
  mesh.renderOrder = 3340;
  return mesh;
}

function buildPassLine(){
  scene.getObjectByName("PHASE332_PASS_LINE_ROOT")?.traverse?.(object=>{ object.visible = false; });
  passRoot?.parent?.remove(passRoot);
  passRoot = new THREE.Group();
  passRoot.name = "PHASE334_PROFESSIONAL_PASS_LINE_ROOT";
  root.add(passRoot);

  const outerW = tableInfo.width * 0.475;
  const outerD = tableInfo.depth * 0.455;
  const inset = 0.026;
  passRoot.add(tube(capsulePoints(outerW, outerD, tableInfo.surfaceY + 0.014), 0xffffff, 0.0062, "PHASE334_PASS_LINE_WHITE"));
  passRoot.add(tube(capsulePoints(outerW - inset, outerD - inset, tableInfo.surfaceY + 0.016), 0xd5a940, 0.0042, "PHASE334_PASS_LINE_GOLD"));
}

async function buildLogo(){
  logoRoot?.parent?.remove(logoRoot);
  for (const name of ["PHASE331_QUEST_TABLE_INTERACTION_ROOT", "PHASE328_DIRECTOR_TABLE_LOGO_ROOT"]){
    scene.getObjectByName(name)?.traverse?.(object=>{
      if (/LOGO/i.test(object.name || "")) object.visible = false;
    });
  }
  sceneRoot()?.traverse?.(object=>{
    if (/PHASE331_SVR_TABLE_CENTER_LOGO|PHASE328_SURFACE_SVR_TABLE_LOGO|TABLE.*LOGO/i.test(object.name || "")) object.visible = false;
  });

  let texture = null;
  try { texture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace }); } catch {}
  if (!texture) return false;
  const aspect = texture.image?.width && texture.image?.height ? texture.image.width / texture.image.height : 1.7;
  const width = Math.min(0.82, tableInfo.width * 0.22);
  logoRoot = new THREE.Group();
  logoRoot.name = "PHASE334_CENTER_LOGO_ROOT";
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / Math.max(0.75, aspect)),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -3
    })
  );
  mesh.name = "PHASE334_PROPORTIONAL_CENTER_LOGO";
  mesh.position.copy(tableInfo.center).setY(tableInfo.surfaceY + 0.012);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 3342;
  logoRoot.add(mesh);
  root.add(logoRoot);
  return true;
}

function roundedRect(context, x, y, width, height, radius){
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function canvasTexture(width, height, draw){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"), canvas);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function labelTexture(title, value, accent = "#7ffcff"){
  return canvasTexture(768, 220, (context, canvas)=>{
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(2,7,15,.82)";
    roundedRect(context, 10, 10, 748, 200, 32);
    context.fill();
    context.strokeStyle = accent;
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = "rgba(255,255,255,.80)";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "800 38px system-ui";
    context.fillText(title, 384, 66, 690);
    context.fillStyle = "#ffffff";
    context.font = "900 68px system-ui";
    context.fillText(value, 384, 147, 700);
  });
}

function zoneOutline(width, depth, color, name){
  const points = [
    new THREE.Vector3(-width / 2, 0, -depth / 2),
    new THREE.Vector3(width / 2, 0, -depth / 2),
    new THREE.Vector3(width / 2, 0, depth / 2),
    new THREE.Vector3(-width / 2, 0, depth / 2)
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.58, depthWrite: false, toneMapped: false }));
  line.name = name;
  return line;
}

function pokerSnapshot(){
  const state = window.SVR_PHASE85_POKER_STATE || {};
  let audit = null;
  try { audit = window.SVR_RUN_PHASE85_POKER_AUDIT?.() || null; } catch {}
  const players = audit?.players || [];
  const you = players.find(player=>player.name === "YOU") || players[0] || { stack: 0, bet: 0, folded: false };
  const need = Math.max(0, Number(state.currentBet || 0) - Number(you.bet || 0));
  return {
    state,
    audit,
    players,
    you,
    need,
    phase: state.phase || audit?.phase || "idle",
    waitingHuman: !!state.waitingHuman,
    pot: Number(state.pot ?? audit?.pot ?? 0),
    currentBet: Number(state.currentBet || 0),
    handNo: Number(state.handNo || 0),
    lastAction: String(state.lastAction || "Ready")
  };
}

function buildZones(){
  zonesRoot?.parent?.remove(zonesRoot);
  zonesRoot = new THREE.Group();
  zonesRoot.name = "PHASE334_TWO_COLUMN_CHIP_ZONES";
  root.add(zonesRoot);

  const nearZ = tableInfo.center.z + playerSign * tableInfo.depth * 0.385;
  const leftX = tableInfo.center.x - tableInfo.width * 0.175;
  const rightX = tableInfo.center.x + tableInfo.width * 0.175;
  const zoneW = Math.min(0.76, tableInfo.width * 0.25);
  const zoneD = Math.min(0.42, tableInfo.depth * 0.22);

  const leftOutline = zoneOutline(zoneW, zoneD, 0x7ffcff, "PHASE334_STACK_ZONE_OUTLINE");
  leftOutline.position.set(leftX, tableInfo.surfaceY + 0.018, nearZ);
  zonesRoot.add(leftOutline);

  const rightOutline = zoneOutline(zoneW, zoneD, 0xffd98a, "PHASE334_BET_ZONE_OUTLINE");
  rightOutline.position.set(rightX, tableInfo.surfaceY + 0.018, nearZ - playerSign * tableInfo.depth * 0.11);
  zonesRoot.add(rightOutline);

  const leftLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.70, 0.20),
    new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  );
  leftLabel.name = "PHASE334_STACK_TOTAL_LABEL";
  leftLabel.position.set(leftX, tableInfo.surfaceY + 0.18, nearZ + playerSign * zoneD * 0.36);
  zonesRoot.add(leftLabel);

  const rightLabel = leftLabel.clone();
  rightLabel.material = leftLabel.material.clone();
  rightLabel.name = "PHASE334_BET_POT_LABEL";
  rightLabel.position.set(rightX, tableInfo.surfaceY + 0.18, nearZ - playerSign * tableInfo.depth * 0.11 + playerSign * zoneD * 0.36);
  zonesRoot.add(rightLabel);
  updateZoneLabels(true);
}

function updateZoneLabels(force = false){
  const snapshot = pokerSnapshot();
  const left = zonesRoot?.getObjectByName?.("PHASE334_STACK_TOTAL_LABEL");
  const right = zonesRoot?.getObjectByName?.("PHASE334_BET_POT_LABEL");
  if (!left || !right) return;
  const stackText = `$${Number(snapshot.you.stack || 0).toLocaleString()}`;
  const betText = `BET $${Number(snapshot.you.bet || 0).toLocaleString()}  •  POT $${snapshot.pot.toLocaleString()}`;
  if (force || left.userData.text !== stackText){
    left.material.map?.dispose?.();
    left.material.map = labelTexture("YOUR CHIP TOTAL", stackText, "#7ffcff");
    left.material.needsUpdate = true;
    left.userData.text = stackText;
  }
  if (force || right.userData.text !== betText){
    right.material.map?.dispose?.();
    right.material.map = labelTexture(snapshot.need > 0 ? `CALL $${snapshot.need}` : "BET / POT", betText, "#ffd98a");
    right.material.needsUpdate = true;
    right.userData.text = betText;
  }
  const cam = cameraWorld(tmpA);
  left.lookAt(cam);
  right.lookAt(cam);
}

function phase332Chips(){
  const chips = [];
  sceneRoot()?.traverse?.(object=>{
    if (object.isMesh && object.userData?.svr332 && /PHASE332_YOU_/i.test(object.name || "")) chips.push(object);
  });
  return chips;
}

function hideOldBankLabels(){
  const bank = scene.getObjectByName("PHASE332_PLAYER_BANK");
  bank?.traverse?.(object=>{
    if (object === bank || object.userData?.svr332) return;
    object.visible = false;
  });
}

function bankHomeFor(chip, order){
  const nearZ = tableInfo.center.z + playerSign * tableInfo.depth * 0.405;
  const leftX = tableInfo.center.x - tableInfo.width * 0.175;
  const denomination = Number(chip.userData?.value || 1);
  const denomOrder = [1, 5, 25, 100].indexOf(denomination);
  const column = Math.max(0, denomOrder) % 2;
  const row = Math.floor(Math.max(0, denomOrder) / 2);
  const sameValue = order;
  return new THREE.Vector3(
    leftX + (column - 0.5) * 0.12,
    tableInfo.surfaceY + 0.0045 + sameValue * 0.0087,
    nearZ - playerSign * (row - 0.5) * 0.12
  );
}

function betHomeFor(chip, order){
  const nearZ = tableInfo.center.z + playerSign * tableInfo.depth * 0.275;
  const rightX = tableInfo.center.x + tableInfo.width * 0.175;
  const denomination = Number(chip.userData?.value || 1);
  const denomOrder = [1, 5, 25, 100].indexOf(denomination);
  const column = Math.max(0, denomOrder) % 2;
  const row = Math.floor(Math.max(0, denomOrder) / 2);
  return new THREE.Vector3(
    rightX + (column - 0.5) * 0.105,
    tableInfo.surfaceY + 0.0045 + order * 0.0087,
    nearZ - playerSign * (row - 0.5) * 0.105
  );
}

function layoutChips(force = false){
  hideOldBankLabels();
  const chips = phase332Chips();
  const homeCounts = new Map();
  const betCounts = new Map();
  for (const chip of chips){
    if (chip.userData.held || chip.userData.dynamic){
      chip.userData.phase334Home = false;
      continue;
    }
    const value = Number(chip.userData.value || 1);
    if (chip.userData.locked || chip.userData.phase334AutoBet){
      const order = betCounts.get(value) || 0;
      betCounts.set(value, order + 1);
      if (!chip.userData.phase334BetPlaced || force){
        setWorldPosition(chip, betHomeFor(chip, order));
        chip.rotation.set(0, 0, 0);
        chip.userData.phase334BetPlaced = true;
      }
      continue;
    }
    if (chip.userData.phase334Home === false && !force) continue;
    const order = homeCounts.get(value) || 0;
    homeCounts.set(value, order + 1);
    setWorldPosition(chip, bankHomeFor(chip, order));
    chip.rotation.set(0, 0, 0);
    chip.userData.phase334Home = true;
    chip.userData.phase334BetPlaced = false;
  }
}

function chipsForAmount(amount){
  const candidates = phase332Chips().filter(chip=>!chip.userData.locked && !chip.userData.held && !chip.userData.dynamic);
  candidates.sort((a, b)=>Number(b.userData.value || 0) - Number(a.userData.value || 0));
  const picked = [];
  let remaining = Math.max(0, Math.floor(amount));
  for (const chip of candidates){
    const value = Number(chip.userData.value || 0);
    if (value <= remaining){ picked.push(chip); remaining -= value; }
    if (remaining <= 0) break;
  }
  if (remaining > 0){
    const extras = candidates.filter(chip=>!picked.includes(chip)).sort((a, b)=>Number(a.userData.value || 0) - Number(b.userData.value || 0));
    if (extras[0]) picked.push(extras[0]);
  }
  return picked;
}

function commitVisualChips(amount, all = false){
  const candidates = all
    ? phase332Chips().filter(chip=>!chip.userData.locked && !chip.userData.held)
    : chipsForAmount(amount);
  candidates.forEach(chip=>{
    chip.userData.locked = true;
    chip.userData.interactive = false;
    chip.userData.dynamic = false;
    chip.userData.phase334AutoBet = true;
    chip.userData.phase334Home = false;
    chip.userData.phase334BetPlaced = false;
  });
  layoutChips(true);
}

function wrapPokerAction(){
  const current = window.SVR_POKER_ACTION;
  if (typeof current !== "function" || current === wrappedPokerAction) return;
  originalPokerAction = current;
  wrappedPokerAction = function phase334PokerAction(action){
    const snapshot = pokerSnapshot();
    const physical = performance.now() - lastPhysicalAt < 1250;
    if (!physical){
      if (action === "call") commitVisualChips(snapshot.need);
      else if (action === "check" && snapshot.need > 0) commitVisualChips(snapshot.need);
      else if (action === "raise") commitVisualChips(snapshot.need + 50);
      else if (action === "allin") commitVisualChips(snapshot.you.stack || 0, true);
      else if (action === "fold") animateFoldCards();
    }
    return originalPokerAction(action);
  };
  wrappedPokerAction.__svrPhase334 = true;
  window.SVR_POKER_ACTION = wrappedPokerAction;
}

function hideFaceDisplays(){
  document.getElementById("svr-p85-poker-ui")?.style?.setProperty("display", "none", "important");
  for (const name of [
    "PHASE332_BET_STATUS",
    "PHASE331_UPRIGHT_TRANSLUCENT_POT_DISPLAY",
    "P85_POT_LABEL",
    "PHASE215_HIGH_TABLE_TAG",
    "PHASE214_TABLE_STATUS"
  ]){
    scene.getObjectByName(name)?.traverse?.(object=>{ object.visible = false; });
  }
}

function placeGameplayPanels(){
  const snapshot = pokerSnapshot();
  const hud = scene.getObjectByName("PHASE333_GAMEPLAY_STATUS_GROUP");
  const action = scene.getObjectByName("PHASE333_XR_ACTION_BAR");
  const cam = cameraWorld(tmpA);
  if (hud){
    hud.position.set(
      tableInfo.center.x,
      tableInfo.surfaceY + 0.94,
      tableInfo.center.z - playerSign * tableInfo.depth * 0.38
    );
    hud.scale.setScalar(0.72);
    hud.visible = snapshot.waitingHuman || snapshot.phase === "showdown";
    hud.lookAt(cam.x, hud.position.y, cam.z);
  }
  if (action){
    action.position.set(
      tableInfo.center.x,
      tableInfo.surfaceY + 0.22,
      tableInfo.center.z + playerSign * tableInfo.depth * 0.515
    );
    action.scale.setScalar(1.12);
    action.visible = snapshot.waitingHuman || ["showdown", "idle"].includes(snapshot.phase);
    action.lookAt(cam.x, action.position.y, cam.z);
  }
}

function captureSeatAnchor(force = false){
  if (seatAnchor && !force) return seatAnchor;
  const rig = window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null;
  const camPos = cameraWorld(new THREE.Vector3());
  const direction = camPos.clone().sub(tableInfo.center).setY(0);
  if (direction.lengthSq() < 0.05) direction.set(0, 0, playerSign);
  direction.normalize();
  const rigPosition = new THREE.Vector3();
  if (rig?.getWorldPosition) rig.getWorldPosition(rigPosition);
  else rigPosition.copy(camPos).setY(0);
  seatAnchor = { rig, position: rigPosition, direction, cameraPosition: camPos };
  return seatAnchor;
}

function applySeatPosition(force = false){
  if (seatLocked && !force) return false;
  const anchor = captureSeatAnchor(force && !seatAnchor);
  if (!anchor) return false;
  const target = anchor.position.clone()
    .addScaledVector(anchor.direction, seatOffsets.back)
    .add(new THREE.Vector3(0, seatOffsets.up, 0));
  try {
    if (anchor.rig?.setPlayerPose) anchor.rig.setPlayerPose(target.x, target.y, target.z);
    else if (anchor.rig?.parent){
      const local = target.clone();
      anchor.rig.parent.worldToLocal(local);
      anchor.rig.position.copy(local);
    } else if (camera){
      camera.position.addScaledVector(anchor.direction, seatOffsets.back);
      camera.position.y += seatOffsets.up;
    }
    activeCamera()?.lookAt?.(tableInfo.center.x, tableInfo.surfaceY + 0.18, tableInfo.center.z);
    return true;
  } catch (error){
    window.SVR_PHASE334_SEAT_ERROR = String(error?.message || error);
    return false;
  }
}

function buttonTexture(label, accent = "#7ffcff"){
  return canvasTexture(512, 180, (context, canvas)=>{
    context.fillStyle = "rgba(3,10,18,.94)";
    roundedRect(context, 8, 8, canvas.width - 16, canvas.height - 16, 28);
    context.fill();
    context.strokeStyle = accent;
    context.lineWidth = 8;
    context.stroke();
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "900 58px system-ui";
    context.fillText(label, canvas.width / 2, canvas.height / 2, canvas.width - 50);
  });
}

function calibrationButton(id, label, x, accent = "#7ffcff"){
  const group = new THREE.Group();
  group.name = `PHASE334_CAL_${id.toUpperCase()}`;
  group.position.x = x;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.09, 0.025),
    new THREE.MeshPhysicalMaterial({ color: 0x07131f, roughness: 0.38, metalness: 0.10, clearcoat: 0.55, emissive: 0x001419, emissiveIntensity: 0.45 })
  );
  body.name = `PHASE334_CAL_HIT_${id.toUpperCase()}`;
  body.userData.phase334Calibration = id;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.174, 0.084),
    new THREE.MeshBasicMaterial({ map: buttonTexture(label, accent), transparent: true, depthWrite: false, toneMapped: false })
  );
  face.position.z = 0.014;
  face.userData.phase334Calibration = id;
  group.add(body, face);
  calibrationGroup.add(group);
  calibrationButtons.set(id, { group, body, face });
}

function buildCalibration(){
  calibrationGroup?.parent?.remove(calibrationGroup);
  calibrationButtons.clear();
  calibrationGroup = new THREE.Group();
  calibrationGroup.name = "PHASE334_SEAT_CALIBRATION_BAR";
  calibrationGroup.position.set(
    tableInfo.center.x,
    tableInfo.surfaceY + 0.10,
    tableInfo.center.z + playerSign * tableInfo.depth * 0.59
  );
  calibrationGroup.scale.setScalar(0.92);
  root.add(calibrationGroup);
  calibrationButton("back", "BACK", -0.40);
  calibrationButton("forward", "FWD", -0.20);
  calibrationButton("up", "UP", 0);
  calibrationButton("down", "DOWN", 0.20);
  calibrationButton("lock", "LOCK", 0.40, "#ffd98a");
}

function calibrationAction(id){
  if (id === "back") seatOffsets.back = THREE.MathUtils.clamp(seatOffsets.back + 0.0254, -0.15, 0.35);
  if (id === "forward") seatOffsets.back = THREE.MathUtils.clamp(seatOffsets.back - 0.0254, -0.15, 0.35);
  if (id === "up") seatOffsets.up = THREE.MathUtils.clamp(seatOffsets.up + 0.0254, -0.20, 0.35);
  if (id === "down") seatOffsets.up = THREE.MathUtils.clamp(seatOffsets.up - 0.0254, -0.20, 0.35);
  if (id === "lock"){
    seatLocked = !seatLocked;
    const button = calibrationButtons.get("lock");
    if (button){
      button.face.material.map?.dispose?.();
      button.face.material.map = buttonTexture(seatLocked ? "ADJUST" : "LOCK", "#ffd98a");
      button.face.material.needsUpdate = true;
    }
    calibrationButtons.forEach((button, key)=>{
      if (key !== "lock") button.group.visible = !seatLocked;
    });
  } else {
    seatLocked = false;
    applySeatPosition(true);
  }
  saveSeatOffsets();
  return { ...seatOffsets, locked: seatLocked };
}

function sourceForSide(side, kind){
  const getter = kind === "hand" ? "getHand" : "getController";
  for (let index = 0; index < 2; index++){
    const source = renderer?.xr?.[getter]?.(index);
    if (!source) continue;
    const handedness = source.userData?.handedness || source.inputSource?.handedness || source.userData?.inputSource?.handedness;
    if (handedness === side) return source;
  }
  return renderer?.xr?.[getter]?.(side === "left" ? 0 : 1) || null;
}

function pointerPose(side){
  const hand = sourceForSide(side, "hand");
  const active = window.SVR_HAND_INPUT_STATE?.[side]?.native || hand?.joints?.wrist || hand?.joints?.["index-finger-tip"];
  if (active && hand?.joints){
    const thumb = hand.joints["thumb-tip"];
    const index = hand.joints["index-finger-tip"];
    const wrist = hand.joints.wrist;
    if (!thumb || !index || !wrist) return null;
    thumb.getWorldPosition(tmpA);
    index.getWorldPosition(tmpB);
    wrist.getWorldPosition(tmpC);
    return {
      kind: "hand",
      anchor: tmpA.clone().add(tmpB).multiplyScalar(0.5),
      wrist: tmpC.clone(),
      direction: tmpB.clone().sub(tmpC).normalize(),
      down: tmpA.distanceTo(tmpB) < 0.039
    };
  }
  const controller = sourceForSide(side, "controller");
  if (!controller) return null;
  controller.updateWorldMatrix(true, false);
  controller.getWorldPosition(tmpA);
  controller.getWorldQuaternion(tmpQ);
  const gamepad = controller.inputSource?.gamepad || controller.userData?.inputSource?.gamepad;
  return {
    kind: "controller",
    anchor: tmpA.clone().add(new THREE.Vector3(0, -0.014, -0.055).applyQuaternion(tmpQ)),
    wrist: tmpA.clone(),
    direction: new THREE.Vector3(0, 0, -1).applyQuaternion(tmpQ).normalize(),
    down: (gamepad?.buttons?.[0]?.value || 0) > 0.55
  };
}

function calibrationHit(pointer){
  const targets = [...calibrationButtons.values()].filter(button=>button.group.visible).map(button=>button.body);
  raycaster.set(pointer.anchor, pointer.direction);
  raycaster.near = 0.01;
  raycaster.far = 1.6;
  return raycaster.intersectObjects(targets, false)[0]?.object?.userData?.phase334Calibration || null;
}

function humanCards(){
  const cards = [];
  sceneRoot()?.traverse?.(object=>{
    if (object.isMesh && /^P85_HAND_0_[01]$/i.test(object.name || "")) cards.push(object);
  });
  return cards.sort((a, b)=>a.name.localeCompare(b.name));
}

function communityCards(){
  const cards = [];
  sceneRoot()?.traverse?.(object=>{
    if (object.isMesh && /^P85_COMM_\d+$/i.test(object.name || "")) cards.push(object);
  });
  return cards.sort((a, b)=>a.name.localeCompare(b.name));
}

function nearestHumanCard(position, radius = 0.14){
  let best = null;
  let distance = radius;
  for (const card of humanCards()){
    if (!card.visible || card.userData.phase334Held) continue;
    card.getWorldPosition(tmpA);
    const current = tmpA.distanceTo(position);
    if (current < distance){ distance = current; best = card; }
  }
  return best;
}

function rememberInput(side, position){
  const history = inputHistory[side];
  history.push({ position: position.clone(), at: performance.now() });
  while (history.length > 8) history.shift();
}

function releaseVelocity(side){
  const history = inputHistory[side];
  if (history.length < 2) return new THREE.Vector3();
  const end = history[history.length - 1];
  const start = history.find(record=>end.at - record.at >= 55) || history[0];
  const seconds = Math.max(0.018, (end.at - start.at) / 1000);
  return end.position.clone().sub(start.position).divideScalar(seconds);
}

function grabCard(side, card, pointer){
  scene.attach(card);
  card.userData.phase334Held = side;
  heldCard[side] = card;
  inputHistory[side] = [];
  rememberInput(side, pointer.anchor);
}

function foldThreshold(position, velocity){
  const towardCenterVelocity = -playerSign * velocity.z;
  const towardCenterPosition = playerSign * (position.z - tableInfo.center.z);
  return towardCenterVelocity > 0.42 || towardCenterPosition < tableInfo.depth * 0.19;
}

function releaseCard(side){
  const card = heldCard[side];
  if (!card) return;
  card.getWorldPosition(tmpA);
  const velocity = releaseVelocity(side);
  card.userData.phase334Held = null;
  heldCard[side] = null;
  inputHistory[side] = [];
  if (foldThreshold(tmpA, velocity)){
    window.SVR_POKER_ACTION?.("fold");
  } else {
    layoutCards(true);
  }
}

function animateFoldCards(){
  const cards = humanCards();
  const target = tableInfo.center.clone().add(new THREE.Vector3(0, 0.05, -playerSign * tableInfo.depth * 0.05));
  const start = performance.now();
  cards.forEach((card, index)=>{
    card.getWorldPosition(tmpA);
    dealAnimations.push({
      object: card,
      from: tmpA.clone(),
      to: target.clone().add(new THREE.Vector3((index - 0.5) * 0.08, index * 0.008, 0)),
      start: start + index * 70,
      duration: 360,
      remove: false,
      hideAtEnd: true
    });
  });
}

function updateWristVelocity(side, pointer, now){
  const record = inputState[side];
  if (record.lastWrist && record.lastAt){
    const dt = Math.max(0.008, (now - record.lastAt) / 1000);
    record.velocity.copy(pointer.wrist).sub(record.lastWrist).divideScalar(dt);
  }
  record.lastWrist = pointer.wrist.clone();
  record.lastAt = now;
}

function tryTableKnock(side, pointer, now){
  if (pointer.down || heldCard[side]) return;
  const velocity = inputState[side].velocity;
  const nearSurface = pointer.anchor.y > tableInfo.surfaceY - 0.015 && pointer.anchor.y < tableInfo.surfaceY + 0.115;
  const inPlayerZone = playerSign * (pointer.anchor.z - tableInfo.center.z) > tableInfo.depth * 0.16;
  if (!nearSurface || !inPlayerZone || velocity.y > -0.42 || now - lastKnockAt < 750) return;
  lastKnockAt = now;
  const snapshot = pokerSnapshot();
  if (["showdown", "idle"].includes(snapshot.phase)) window.SVR_POKER_NEXT_HAND?.();
  else if (snapshot.waitingHuman) window.SVR_POKER_ACTION?.(snapshot.need > 0 ? "call" : "check");
}

function tryAllInPush(now){
  if (now - lastAllInAt < 1600) return;
  const left = inputState.left;
  const right = inputState.right;
  if (!left.lastWrist || !right.lastWrist || heldCard.left || heldCard.right) return;
  const leftForward = -playerSign * left.velocity.z;
  const rightForward = -playerSign * right.velocity.z;
  const leftNear = Math.abs(left.lastWrist.y - tableInfo.surfaceY) < 0.36 && playerSign * (left.lastWrist.z - tableInfo.center.z) > tableInfo.depth * 0.10;
  const rightNear = Math.abs(right.lastWrist.y - tableInfo.surfaceY) < 0.36 && playerSign * (right.lastWrist.z - tableInfo.center.z) > tableInfo.depth * 0.10;
  const spread = Math.abs(left.lastWrist.x - right.lastWrist.x) > 0.16;
  if (leftForward > 0.48 && rightForward > 0.48 && leftNear && rightNear && spread){
    const snapshot = pokerSnapshot();
    if (snapshot.waitingHuman){
      lastAllInAt = now;
      window.SVR_POKER_ACTION?.("allin");
    }
  }
}

function updateInput(side, now){
  const pointer = pointerPose(side);
  if (!pointer){
    if (heldCard[side]) releaseCard(side);
    calibrationDown[side] = false;
    return;
  }
  updateWristVelocity(side, pointer, now);
  tryTableKnock(side, pointer, now);

  if (pointer.down && !calibrationDown[side]){
    const calibration = calibrationHit(pointer);
    if (calibration) calibrationAction(calibration);
    else {
      const card = nearestHumanCard(pointer.anchor);
      if (card) grabCard(side, card, pointer);
    }
  }
  if (pointer.down && heldCard[side]){
    heldCard[side].position.copy(pointer.anchor);
    rememberInput(side, pointer.anchor);
  }
  if (!pointer.down && calibrationDown[side] && heldCard[side]) releaseCard(side);
  calibrationDown[side] = pointer.down;
}

function layoutCards(force = false){
  const snapshot = pokerSnapshot();
  const cam = cameraWorld(tmpA);
  const human = humanCards();
  human.forEach((card, index)=>{
    if (card.userData.phase334Held) return;
    card.visible = !snapshot.you.folded;
    if (!card.visible) return;
    const position = new THREE.Vector3(
      tableInfo.center.x + (index - 0.5) * 0.20,
      tableInfo.surfaceY + 0.13,
      tableInfo.center.z + playerSign * tableInfo.depth * 0.43
    );
    setWorldPosition(card, position);
    card.lookAt(cam);
    card.renderOrder = 3345;
  });

  communityCards().forEach((card, index)=>{
    card.visible = true;
    const position = new THREE.Vector3(
      tableInfo.center.x + (index - 2) * 0.245,
      tableInfo.surfaceY + 0.18,
      tableInfo.center.z - playerSign * tableInfo.depth * 0.055
    );
    setWorldPosition(card, position);
    card.lookAt(cam);
    card.renderOrder = 3344;
  });

  const winner = scene.getObjectByName("P85_WINNER_BANNER");
  if (winner){
    setWorldPosition(winner, new THREE.Vector3(tableInfo.center.x, tableInfo.surfaceY + 1.05, tableInfo.center.z - playerSign * tableInfo.depth * 0.40));
    winner.lookAt(cam);
  }
}

function cardBackTexture(){
  return canvasTexture(384, 540, (context, canvas)=>{
    context.fillStyle = "#13051f";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#ffd98a";
    context.lineWidth = 18;
    context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    context.strokeStyle = "#7ffcff";
    context.lineWidth = 8;
    context.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "900 82px system-ui";
    context.fillText("SVR", canvas.width / 2, canvas.height / 2 - 20);
    context.fillStyle = "#ffd98a";
    context.font = "900 34px system-ui";
    context.fillText("POKER", canvas.width / 2, canvas.height / 2 + 60);
  });
}

let sharedCardBack = null;
function dealCardMesh(){
  sharedCardBack ||= cardBackTexture();
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.26),
    new THREE.MeshBasicMaterial({ map: sharedCardBack, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  );
  mesh.renderOrder = 3346;
  return mesh;
}

function seatPosition(index){
  const angles = [90, 150, 210, 270, 330, 30].map(value=>value * Math.PI / 180);
  const angle = angles[index] * playerSign;
  return new THREE.Vector3(
    tableInfo.center.x + Math.cos(angle) * tableInfo.width * 0.49,
    tableInfo.surfaceY + 0.12,
    tableInfo.center.z + Math.sin(angle) * tableInfo.depth * 0.52
  );
}

function startLeftToRightDeal(){
  const now = performance.now();
  const dealer = new THREE.Vector3(
    tableInfo.center.x,
    tableInfo.surfaceY + 0.42,
    tableInfo.center.z - playerSign * tableInfo.depth * 0.60
  );
  const order = [1, 2, 3, 4, 5, 0];
  let sequence = 0;
  for (let round = 0; round < 2; round++){
    for (const seat of order){
      const mesh = dealCardMesh();
      mesh.name = `PHASE334_LEFT_TO_RIGHT_DEAL_${round}_${seat}`;
      mesh.position.copy(dealer);
      mesh.lookAt(cameraWorld(tmpA));
      root.add(mesh);
      const target = seatPosition(seat).add(new THREE.Vector3((round - 0.5) * 0.10, 0, -playerSign * round * 0.035));
      dealAnimations.push({ object: mesh, from: dealer.clone(), to: target, start: now + sequence * 105, duration: 300, remove: true });
      sequence++;
    }
  }
}

function updateDealAnimations(now){
  for (let index = dealAnimations.length - 1; index >= 0; index--){
    const animation = dealAnimations[index];
    if (now < animation.start) continue;
    const t = THREE.MathUtils.clamp((now - animation.start) / animation.duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const position = animation.from.clone().lerp(animation.to, eased);
    position.y += Math.sin(Math.PI * t) * 0.18;
    setWorldPosition(animation.object, position);
    animation.object.rotation.z += 0.035;
    if (t >= 1){
      if (animation.hideAtEnd) animation.object.visible = false;
      if (animation.remove) animation.object.parent?.remove(animation.object);
      dealAnimations.splice(index, 1);
    }
  }
}

function burnCount(phase){
  if (phase === "flop") return 1;
  if (phase === "turn") return 2;
  if (phase === "river" || phase === "showdown") return 3;
  return 0;
}

function buildBurnPile(){
  burnRoot?.parent?.remove(burnRoot);
  burnRoot = new THREE.Group();
  burnRoot.name = "PHASE334_BURN_AND_TURN_PILE";
  root.add(burnRoot);
  const count = burnCount(pokerSnapshot().phase);
  sharedCardBack ||= cardBackTexture();
  for (let index = 0; index < count; index++){
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.23),
      new THREE.MeshBasicMaterial({ map: sharedCardBack, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
    );
    mesh.name = `PHASE334_BURN_CARD_${index + 1}`;
    mesh.position.set(
      tableInfo.center.x + tableInfo.width * 0.29,
      tableInfo.surfaceY + 0.014 + index * 0.006,
      tableInfo.center.z - playerSign * tableInfo.depth * 0.12
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = index * 0.05;
    burnRoot.add(mesh);
  }
}

function fallbackBot(index, position){
  const group = new THREE.Group();
  group.name = `PHASE334_ERIC_FALLBACK_${index}`;
  const material = new THREE.MeshStandardMaterial({ color: 0x253044, roughness: 0.72, metalness: 0.04 });
  const skin = new THREE.MeshStandardMaterial({ color: 0x8d5f48, roughness: 0.78 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.20, 0.48, 4, 10), material);
  torso.position.y = 0.70;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), skin);
  head.position.y = 1.12;
  group.add(torso, head);
  group.position.copy(position).setY(tableInfo.surfaceY - 0.40);
  group.lookAt(tableInfo.center.x, group.position.y + 0.75, tableInfo.center.z);
  group.rotateY(Math.PI);
  return group;
}

function botLabel(index){
  const texture = labelTexture("BOT", `ERIC ${index}`, "#ffd98a");
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.18),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  );
  mesh.name = `PHASE334_ERIC_LABEL_${index}`;
  return mesh;
}

async function loadBots(){
  botRoot?.parent?.remove(botRoot);
  botRoot = new THREE.Group();
  botRoot.name = "PHASE334_ERIC_BOT_ROOT";
  root.add(botRoot);
  sceneRoot()?.traverse?.(object=>{
    if (/^P85_TAG_[1-5]$|^P85_STACK_[1-5]_/i.test(object.name || "")) object.visible = false;
  });

  const positions = [1, 2, 3, 4, 5].map(seatPosition);
  let model = null;
  let idle = null;
  try {
    const loader = new FBXLoader();
    model = await loader.loadAsync(new URL("../assets/models/eric/eric.fbx", import.meta.url).href);
    try { idle = await loader.loadAsync(new URL("../assets/models/anims/eric_idle.fbx", import.meta.url).href); } catch {}
  } catch (error){
    window.SVR_PHASE334_ERIC_LOAD_ERROR = String(error?.message || error);
  }

  if (!model){
    positions.forEach((position, index)=>{
      const bot = fallbackBot(index + 1, position);
      const label = botLabel(index + 1);
      label.position.set(0, 1.45, 0);
      bot.add(label);
      botRoot.add(bot);
    });
    return;
  }

  model.updateWorldMatrix(true, true);
  const modelBounds = new THREE.Box3().setFromObject(model);
  const modelSize = new THREE.Vector3();
  modelBounds.getSize(modelSize);
  const scale = 1.58 / Math.max(0.1, modelSize.y);
  positions.forEach((position, index)=>{
    const bot = cloneSkeleton(model);
    bot.name = `PHASE334_ERIC_BOT_${index + 1}`;
    bot.scale.setScalar(scale);
    bot.traverse(object=>{
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      object.frustumCulled = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material=>{
        if (!material) return;
        material.roughness = Math.max(material.roughness ?? 0.6, 0.48);
        material.metalness = Math.min(material.metalness ?? 0.05, 0.12);
      });
    });
    bot.position.copy(position);
    bot.position.y = tableInfo.surfaceY - modelBounds.min.y * scale - 0.62;
    bot.lookAt(tableInfo.center.x, bot.position.y + 0.85, tableInfo.center.z);
    bot.rotateY(Math.PI);
    const label = botLabel(index + 1);
    label.position.set(0, 1.72 / scale, 0);
    label.scale.setScalar(1 / scale);
    bot.add(label);
    botRoot.add(bot);
    if (idle?.animations?.[0]){
      try {
        const mixer = new THREE.AnimationMixer(bot);
        mixer.clipAction(idle.animations[0]).play();
        botMixers.push(mixer);
      } catch {}
    }
  });
}

function faceLowPanels(){
  const cam = cameraWorld(tmpA);
  calibrationGroup?.lookAt(cam.x, calibrationGroup.position.y, cam.z);
  zonesRoot?.children?.forEach(object=>{
    if (/LABEL/.test(object.name || "")) object.lookAt(cam);
  });
  botRoot?.traverse?.(object=>{
    if (/PHASE334_ERIC_LABEL/.test(object.name || "")) object.lookAt(cam);
  });
}

function ensureBurnCard(snapshot){
  const state = snapshot.state;
  if (!state || !["flop", "turn", "river"].includes(snapshot.phase)) return;
  if (!Array.isArray(state.phase334BurnCards)) state.phase334BurnCards = [];
  if (!state.phase334BurnedPhases || typeof state.phase334BurnedPhases !== "object") state.phase334BurnedPhases = {};
  if (state.phase334BurnedPhases[snapshot.phase]) return;
  const burned = Array.isArray(state.deck) && state.deck.length ? state.deck.pop() : null;
  state.phase334BurnedPhases[snapshot.phase] = true;
  if (burned) state.phase334BurnCards.push(burned);
}

function onPhaseChange(snapshot){
  if (snapshot.handNo !== lastHand){
    lastHand = snapshot.handNo;
    if (snapshot.state){
      snapshot.state.phase334BurnCards = [];
      snapshot.state.phase334BurnedPhases = {};
    }
    layoutChips(true);
    startLeftToRightDeal();
  }
  if (snapshot.phase !== lastPhase){
    lastPhase = snapshot.phase;
    ensureBurnCard(snapshot);
    buildBurnPile();
  }
}

function update(time){
  const now = time || performance.now();
  const dt = previousTick ? Math.min(0.05, (now - previousTick) / 1000) : 0.016;
  previousTick = now;
  botMixers.forEach(mixer=>mixer.update(dt));
  updateDealAnimations(now);
  updateInput("left", now);
  updateInput("right", now);
  tryAllInPush(now);
  const snapshot = pokerSnapshot();
  onPhaseChange(snapshot);
  layoutCards();
  placeGameplayPanels();
  faceLowPanels();
  updateZoneLabels();
  wrapPokerAction();
  hideFaceDisplays();
}

function xrTick(time){
  const session = renderer?.xr?.getSession?.();
  if (!session || session !== xrSession) return;
  update(time);
  session.requestAnimationFrame(xrTick);
}

function startXRLoop(){
  const session = renderer?.xr?.getSession?.();
  if (!session || session === xrSession) return;
  xrSession = session;
  seatAnchor = null;
  setTimeout(()=>{
    determinePlayerSide();
    captureSeatAnchor(true);
    applySeatPosition(true);
  }, 450);
  session.requestAnimationFrame(xrTick);
}

function installCss(){
  if (document.getElementById("svr-phase334-style")) return;
  const style = document.createElement("style");
  style.id = "svr-phase334-style";
  style.textContent = `
    body.svr-phase334-table #svr-p85-poker-ui,
    body.svr-phase334-table #svr329Info,
    body.svr-phase334-table #svr329QA {
      display:none!important;
      opacity:0!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("svr-phase334-table");
}

function qa(){
  const snapshot = pokerSnapshot();
  const chips = phase332Chips();
  return {
    build: BUILD,
    active: installed,
    quest: IS_QUEST,
    table: tableInfo?.table?.name || null,
    felt: tableInfo?.felt?.name || null,
    playerSide: playerSign,
    seatOffsets: { ...seatOffsets, locked: seatLocked },
    passLine: !!passRoot,
    centerLogo: !!logoRoot,
    statusPanelMoved: !!scene?.getObjectByName?.("PHASE333_GAMEPLAY_STATUS_GROUP"),
    actionBarMoved: !!scene?.getObjectByName?.("PHASE333_XR_ACTION_BAR"),
    oldFaceDisplaysHidden: ["PHASE332_BET_STATUS", "PHASE331_UPRIGHT_TRANSLUCENT_POT_DISPLAY"].every(name=>!scene?.getObjectByName?.(name)?.visible),
    humanCards: humanCards().length,
    communityCards: communityCards().length,
    burnCards: burnRoot?.children?.length || 0,
    ericBots: botRoot?.children?.filter?.(object=>/ERIC_(BOT|FALLBACK)/.test(object.name || ""))?.length || 0,
    chipCount: chips.length,
    homeChips: chips.filter(chip=>chip.userData.phase334Home).length,
    betChips: chips.filter(chip=>chip.userData.phase334BetPlaced).length,
    twoColumnZones: !!zonesRoot,
    calibrationButtons: calibrationButtons.size,
    gestures: {
      tableKnockCheckCall: true,
      twoHandPushAllIn: true,
      cardThrowFold: true,
      pinchCardPickup: true
    },
    dealDirection: "LEFT_TO_RIGHT",
    phase: snapshot.phase,
    yourTurn: snapshot.waitingHuman,
    siteTouched: false,
    checkedAt: new Date().toISOString()
  };
}

async function install(){
  if (installed) return;
  scene = window.__SVR_SCENE__;
  camera = window.__SVR_CAMERA__;
  renderer = window.__SVR_RENDERER__;
  if (!scene || !camera || !renderer){ setTimeout(install, 250); return; }
  tableInfo = detectTable();
  if (!tableInfo){ setTimeout(install, 350); return; }
  installed = true;
  determinePlayerSide();
  root = scene.getObjectByName(ROOT_NAME) || new THREE.Group();
  if (!root.parent){ root.name = ROOT_NAME; scene.add(root); }
  installCss();
  buildPassLine();
  await buildLogo();
  buildZones();
  buildCalibration();
  layoutChips(true);
  layoutCards(true);
  buildBurnPile();
  hideFaceDisplays();
  placeGameplayPanels();
  captureSeatAnchor(true);
  applySeatPosition(true);
  loadBots();
  wrapPokerAction();

  window.addEventListener("svr:physical-bet-committed", ()=>{
    lastPhysicalAt = performance.now();
    setTimeout(()=>layoutChips(true), 120);
  });
  renderer.xr.addEventListener("sessionstart", ()=>setTimeout(startXRLoop, 120));
  renderer.xr.addEventListener("sessionend", ()=>{
    xrSession = null;
    calibrationDown.left = calibrationDown.right = false;
    heldCard.left = heldCard.right = null;
  });
  if (renderer.xr.isPresenting) startXRLoop();

  setInterval(()=>{
    if (!renderer.xr.isPresenting) update(performance.now());
    else {
      layoutChips();
      hideFaceDisplays();
      updateZoneLabels();
      wrapPokerAction();
    }
  }, 220);

  window.SVR_PHASE334_TABLE_QA = qa;
  window.SVR_PHASE334_REAPPLY_LAYOUT = ()=>{
    tableInfo = detectTable();
    determinePlayerSide();
    buildPassLine();
    buildLogo();
    buildZones();
    buildCalibration();
    layoutChips(true);
    layoutCards(true);
    placeGameplayPanels();
    return qa();
  };
  window.SVR_PHASE334_SEAT_ADJUST = ({ backInches = 0, upInches = 0, lock = false } = {})=>{
    seatOffsets.back = THREE.MathUtils.clamp(seatOffsets.back + Number(backInches || 0) * 0.0254, -0.15, 0.35);
    seatOffsets.up = THREE.MathUtils.clamp(seatOffsets.up + Number(upInches || 0) * 0.0254, -0.20, 0.35);
    seatLocked = !!lock;
    saveSeatOffsets();
    applySeatPosition(true);
    return { ...seatOffsets, locked: seatLocked };
  };
  window.SVR_PHASE334_SHOW_CALIBRATION = ()=>{
    seatLocked = false;
    calibrationButtons.forEach(button=>{ button.group.visible = true; });
    return true;
  };
  window.SVR_PHASE334_GESTURE_ACTION = action=>{
    const snapshot = pokerSnapshot();
    if (action === "knock") return ["showdown", "idle"].includes(snapshot.phase) ? window.SVR_POKER_NEXT_HAND?.() : window.SVR_POKER_ACTION?.(snapshot.need > 0 ? "call" : "check");
    if (action === "push-all-in") return window.SVR_POKER_ACTION?.("allin");
    if (action === "throw-fold") return window.SVR_POKER_ACTION?.("fold");
    return false;
  };
  window.SVR_PHASE334_STATE = {
    build: BUILD,
    professionalPassLine: true,
    proportionalLogo: true,
    twoColumnChips: true,
    seatedCalibration: true,
    turnOnlyHud: true,
    reachableActionBar: true,
    ericBots: true,
    leftToRightDeal: true,
    burnAndTurnDeckRemoval: true,
    gesturePoker: true,
    siteTouched: false
  };
  window.SVR_LOCKED_FINAL_BUILD = BUILD;
}

install();
[500, 1200, 2600, 5200].forEach(delay=>setTimeout(install, delay));
