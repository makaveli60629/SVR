import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const BUILD = "PHASE-333-QUEST-SHADER-GAMEPLAY-POLISH-LOCK";
const ROOT_NAME = "PHASE333_SHADER_GAMEPLAY_ROOT";
const TABLE_NAMES = [
  "PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED",
  "PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT",
  "PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED"
];
const IS_QUEST = /Quest|Oculus|Meta Quest/i.test(navigator.userAgent || "");

let scene;
let camera;
let renderer;
let root;
let tableInfo;
let hudGroup;
let hudPanel;
let hudCanvas;
let hudTexture;
let actionGroup;
let glowRing;
let xrSession = null;
let installed = false;
let lastHudPaint = 0;
let lastTurnKey = "";
let autoNextTimer = null;
let environmentTarget = null;

const actionButtons = new Map();
const sourceDown = { left: false, right: false };
const raycaster = new THREE.Raycaster();
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const materialCache = new Map();

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
  let feltScore = -Infinity;

  table.traverse(object=>{
    if (!object.isMesh) return;
    let record;
    try { record = bounds(object); } catch { return; }
    const label = `${object.name || ""} ${materialNames(object)}`.toLowerCase();
    const area = record.size.x * record.size.z;
    const flatness = Math.max(record.size.x, record.size.z) / Math.max(0.001, record.size.y);
    const score = (/polotno|felt|cloth|baize|surface|play/.test(label) ? 160 : 0) + area * 2 + (flatness > 20 ? 30 : 0);
    if (score > feltScore){
      feltScore = score;
      felt = { object, ...record };
    }
  });

  const source = felt || { object: null, ...full };
  return {
    table,
    felt: felt?.object || null,
    full,
    center: source.center.clone(),
    surfaceY: source.box.max.y + 0.008,
    width: Math.max(2.2, Math.min(source.size.x * 0.92, full.size.x * 0.72, 4.0)),
    depth: Math.max(1.15, Math.min(source.size.z * 0.90, full.size.z * 0.68, 2.15))
  };
}

function maxAnisotropy(){
  try { return Math.min(IS_QUEST ? 4 : 8, renderer.capabilities.getMaxAnisotropy()); }
  catch { return IS_QUEST ? 2 : 4; }
}

function physicalMaterial(source, kind){
  if (source?.userData?.phase333Kind === kind) return source;
  const key = `${source?.uuid || "material"}:${kind}`;
  if (materialCache.has(key)) return materialCache.get(key);

  const material = new THREE.MeshPhysicalMaterial({
    name: `${source?.name || kind}_PHASE333`,
    color: source?.color?.clone?.() || new THREE.Color(0xffffff),
    map: source?.map || null,
    alphaMap: source?.alphaMap || null,
    normalMap: source?.normalMap || null,
    normalScale: source?.normalScale?.clone?.() || new THREE.Vector2(1, 1),
    bumpMap: source?.bumpMap || null,
    bumpScale: source?.bumpScale ?? 1,
    roughnessMap: source?.roughnessMap || null,
    metalnessMap: source?.metalnessMap || null,
    emissiveMap: source?.emissiveMap || null,
    emissive: source?.emissive?.clone?.() || new THREE.Color(0x000000),
    emissiveIntensity: source?.emissiveIntensity ?? 1,
    transparent: !!source?.transparent,
    opacity: source?.opacity ?? 1,
    alphaTest: source?.alphaTest ?? 0,
    side: source?.side ?? THREE.FrontSide,
    depthWrite: source?.depthWrite ?? true,
    depthTest: source?.depthTest ?? true,
    vertexColors: !!source?.vertexColors,
    flatShading: !!source?.flatShading
  });

  for (const texture of [material.map, material.normalMap, material.bumpMap, material.roughnessMap, material.metalnessMap]){
    if (texture) texture.anisotropy = Math.max(texture.anisotropy || 1, maxAnisotropy());
  }

  if (kind === "felt"){
    material.color.setHex(0xffffff);
    material.roughness = 0.82;
    material.metalness = 0.01;
    material.clearcoat = 0.03;
    material.clearcoatRoughness = 0.92;
    material.envMapIntensity = 0.28;
    material.onBeforeCompile = shader=>{
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>\n#ifdef USE_UV\nfloat svrWeave = sin(vUv.x * 1180.0) * sin(vUv.y * 940.0);\nroughnessFactor = clamp(roughnessFactor + svrWeave * 0.035, 0.50, 0.98);\n#endif`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `#ifdef USE_UV\nfloat svrFiber = abs(sin(vUv.x * 620.0) * sin(vUv.y * 540.0));\ngl_FragColor.rgb *= 0.986 + 0.025 * svrFiber;\n#endif\n#include <dithering_fragment>`
      );
    };
    material.customProgramCacheKey = ()=>"svr-phase333-felt-weave-v1";
  } else if (kind === "rail"){
    material.color.setHex(0x08090d);
    material.roughness = 0.34;
    material.metalness = 0.04;
    material.clearcoat = 0.78;
    material.clearcoatRoughness = 0.22;
    material.sheen = 0.30;
    material.sheenColor.setHex(0x39303f);
    material.sheenRoughness = 0.54;
    material.envMapIntensity = 0.80;
  } else if (kind === "trim"){
    material.color.setHex(0xc5cbd4);
    material.roughness = 0.18;
    material.metalness = 0.92;
    material.clearcoat = 0.42;
    material.clearcoatRoughness = 0.16;
    material.envMapIntensity = 1.35;
  } else if (kind === "chip"){
    material.roughness = Math.min(source?.roughness ?? 0.42, 0.38);
    material.metalness = Math.max(source?.metalness ?? 0.08, 0.08);
    material.clearcoat = 0.52;
    material.clearcoatRoughness = 0.20;
    material.envMapIntensity = 0.92;
  } else if (kind === "card"){
    material.roughness = 0.52;
    material.metalness = 0.0;
    material.clearcoat = 0.20;
    material.clearcoatRoughness = 0.44;
    material.envMapIntensity = 0.34;
  }

  material.userData = { ...(source?.userData || {}), phase333Kind: kind, phase333Build: BUILD };
  material.needsUpdate = true;
  materialCache.set(key, material);
  return material;
}

function replaceMaterials(object, kind){
  if (!object?.material) return 0;
  const list = Array.isArray(object.material) ? object.material : [object.material];
  const next = list.map(material=>physicalMaterial(material, kind));
  object.material = Array.isArray(object.material) ? next : next[0];
  return next.length;
}

function applyMaterialPolish(){
  if (!tableInfo) return null;
  const counts = { felt: 0, rail: 0, trim: 0, chips: 0, cards: 0 };

  tableInfo.table.traverse(object=>{
    if (!object.isMesh || !object.material) return;
    const label = `${object.name || ""} ${materialNames(object)}`.toLowerCase();
    if (object === tableInfo.felt || /polotno|felt|cloth|baize/.test(label)) counts.felt += replaceMaterials(object, "felt");
    else if (/4carpaintblack|leather|rail|armrest|pad|cushion/.test(label)) counts.rail += replaceMaterials(object, "rail");
    else if (/1carpaintsilver|silver|chrome|metal|trim/.test(label)) counts.trim += replaceMaterials(object, "trim");
  });

  sceneRoot()?.traverse?.(object=>{
    if (!object.isMesh || !object.material) return;
    const name = String(object.name || "");
    if (object.userData?.svr332 || /PHASE332_.*CHIP|P85_STACK_|P85_POT_CHIP|PHASE331_POT_CHIP/i.test(name)) counts.chips += replaceMaterials(object, "chip");
    else if (/P85_COMM_|P85_HAND_|PHASE323_SURFACE_.*CARD|PHASE214_.*CARD|PHASE215_.*CARD/i.test(name)) counts.cards += replaceMaterials(object, "card");
  });

  window.SVR_PHASE333_MATERIAL_STATE = { build: BUILD, ...counts, checkedAt: new Date().toISOString() };
  return window.SVR_PHASE333_MATERIAL_STATE;
}

function installEnvironment(){
  if (!renderer || !scene || environmentTarget) return;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = IS_QUEST ? 1.0 : 1.07;

  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    environmentTarget = pmrem.fromScene(room, 0.035);
    scene.environment = environmentTarget.texture;
    room.dispose?.();
    pmrem.dispose();
  } catch (error){
    window.SVR_PHASE333_ENVIRONMENT_ERROR = String(error?.message || error);
  }
}

function buildTableLighting(){
  const old = scene.getObjectByName("PHASE333_TABLE_LIGHTING_ROOT");
  old?.parent?.remove(old);

  const group = new THREE.Group();
  group.name = "PHASE333_TABLE_LIGHTING_ROOT";

  const warm = new THREE.PointLight(0xffdfbd, IS_QUEST ? 0.62 : 0.82, 7.5, 2.0);
  warm.name = "PHASE333_WARM_TABLE_KEY";
  warm.position.set(tableInfo.center.x - tableInfo.width * 0.25, tableInfo.surfaceY + 2.4, tableInfo.center.z + tableInfo.depth * 0.18);

  const cool = new THREE.PointLight(0x8fefff, IS_QUEST ? 0.34 : 0.50, 6.5, 2.0);
  cool.name = "PHASE333_COOL_TABLE_FILL";
  cool.position.set(tableInfo.center.x + tableInfo.width * 0.34, tableInfo.surfaceY + 1.55, tableInfo.center.z - tableInfo.depth * 0.24);

  group.add(warm, cool);
  scene.add(group);
  return group;
}

function canvasTexture(canvas){
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
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

function pokerSnapshot(){
  const state = window.SVR_PHASE85_POKER_STATE || {};
  let audit = null;
  try { audit = window.SVR_RUN_PHASE85_POKER_AUDIT?.() || null; } catch {}
  const players = audit?.players || [];
  const you = players.find(player=>player.name === "YOU") || players[0] || { stack: 0, bet: 0 };
  const current = audit?.current || state.current || "-";
  const need = Math.max(0, Number(state.currentBet || 0) - Number(you.bet || 0));
  return {
    state,
    audit,
    you,
    current,
    need,
    waitingHuman: !!state.waitingHuman,
    phase: state.phase || audit?.phase || "idle",
    pot: Number(state.pot ?? audit?.pot ?? 0),
    currentBet: Number(state.currentBet || 0),
    lastAction: state.lastAction || "Ready",
    winner: state.winner || audit?.winner || null,
    handNo: Number(state.handNo || 0)
  };
}

function buildHud(){
  const old = scene.getObjectByName(ROOT_NAME);
  old?.parent?.remove(old);

  root = new THREE.Group();
  root.name = ROOT_NAME;
  scene.add(root);

  hudGroup = new THREE.Group();
  hudGroup.name = "PHASE333_GAMEPLAY_STATUS_GROUP";
  hudCanvas = document.createElement("canvas");
  hudCanvas.width = 1024;
  hudCanvas.height = 320;
  hudTexture = canvasTexture(hudCanvas);
  hudPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.64, 0.51),
    new THREE.MeshBasicMaterial({ map: hudTexture, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })
  );
  hudPanel.name = "PHASE333_GAMEPLAY_STATUS_PANEL";
  hudPanel.renderOrder = 3335;
  hudGroup.add(hudPanel);

  glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.009, 8, 72),
    new THREE.MeshBasicMaterial({ color: 0x7ffcff, transparent: true, opacity: 0.30, depthWrite: false, toneMapped: false })
  );
  glowRing.name = "PHASE333_TURN_GLOW";
  glowRing.position.z = -0.01;
  glowRing.scale.y = 0.31;
  hudGroup.add(glowRing);

  hudGroup.position.set(tableInfo.center.x, tableInfo.surfaceY + 0.49, tableInfo.center.z + tableInfo.depth * 0.46);
  root.add(hudGroup);

  actionGroup = new THREE.Group();
  actionGroup.name = "PHASE333_XR_ACTION_BAR";
  actionGroup.position.set(tableInfo.center.x + tableInfo.width * 0.30, tableInfo.surfaceY + 0.27, tableInfo.center.z + tableInfo.depth * 0.47);
  root.add(actionGroup);

  createActionButton("fold", "FOLD", -0.23, 0.09);
  createActionButton("checkcall", "CHECK", 0.00, 0.09);
  createActionButton("raise", "RAISE", 0.23, 0.09);
  createActionButton("allin", "ALL IN", -0.12, -0.08);
  createActionButton("next", "NEXT HAND", 0.12, -0.08);

  paintHud(true);
  updateButtonState(true);
}

function buttonTexture(label, enabled, active = false){
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = enabled ? (active ? "rgba(22,84,90,.96)" : "rgba(5,20,31,.94)") : "rgba(18,18,23,.72)";
  roundedRect(context, 10, 10, 492, 172, 32);
  context.fill();
  context.strokeStyle = enabled ? (active ? "#ffffff" : "#7ffcff") : "rgba(150,150,160,.45)";
  context.lineWidth = 10;
  context.stroke();
  context.fillStyle = enabled ? "#ffffff" : "rgba(200,200,210,.55)";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = label.length > 8 ? "900 54px system-ui" : "900 66px system-ui";
  context.fillText(label, 256, 98, 450);
  return canvasTexture(canvas);
}

function createActionButton(id, label, x, y){
  const group = new THREE.Group();
  group.name = `PHASE333_ACTION_${id.toUpperCase()}`;
  group.position.set(x, y, 0);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.205, 0.125, 0.026),
    new THREE.MeshPhysicalMaterial({ color: 0x07131f, roughness: 0.30, metalness: 0.12, clearcoat: 0.65, clearcoatRoughness: 0.22, emissive: 0x001419, emissiveIntensity: 0.65 })
  );
  body.name = `PHASE333_ACTION_HIT_${id.toUpperCase()}`;
  body.userData.phase333Action = id;
  group.add(body);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.196, 0.116),
    new THREE.MeshBasicMaterial({ map: buttonTexture(label, true), transparent: true, depthWrite: false, toneMapped: false })
  );
  face.name = `PHASE333_ACTION_LABEL_${id.toUpperCase()}`;
  face.position.z = 0.014;
  face.userData.phase333Action = id;
  group.add(face);

  actionGroup.add(group);
  actionButtons.set(id, { id, group, body, face, label, enabled: true, activeUntil: 0 });
}

function setButton(id, label, enabled){
  const button = actionButtons.get(id);
  if (!button) return;
  const changed = button.label !== label || button.enabled !== enabled;
  button.label = label;
  button.enabled = enabled;
  button.body.userData.disabled = !enabled;
  if (!changed) return;
  button.face.material.map?.dispose?.();
  button.face.material.map = buttonTexture(label, enabled);
  button.face.material.needsUpdate = true;
  button.body.material.emissiveIntensity = enabled ? 0.65 : 0.08;
  button.body.material.opacity = enabled ? 1 : 0.55;
  button.body.material.transparent = !enabled;
}

function updateButtonState(force = false){
  const snapshot = pokerSnapshot();
  const playable = snapshot.waitingHuman && !["showdown", "idle"].includes(snapshot.phase);
  setButton("fold", "FOLD", playable);
  setButton("checkcall", snapshot.need > 0 ? `CALL $${snapshot.need}` : "CHECK", playable);
  setButton("raise", "RAISE", playable);
  setButton("allin", "ALL IN", playable);
  setButton("next", "NEXT HAND", ["showdown", "idle"].includes(snapshot.phase));
  if (force) actionButtons.forEach(button=>button.face.material.needsUpdate = true);
}

function paintHud(force = false){
  if (!hudCanvas || !hudTexture) return;
  const now = performance.now();
  if (!force && now - lastHudPaint < 110) return;
  lastHudPaint = now;

  const snapshot = pokerSnapshot();
  const context = hudCanvas.getContext("2d");
  context.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

  const yourTurn = snapshot.waitingHuman;
  const title = snapshot.phase === "showdown" && snapshot.winner
    ? `${snapshot.winner.name || "PLAYER"} WINS`
    : yourTurn ? "YOUR TURN" : `${String(snapshot.current || "TABLE").toUpperCase()} TURN`;

  const gradient = context.createLinearGradient(0, 0, 1024, 320);
  gradient.addColorStop(0, yourTurn ? "rgba(5,45,52,.94)" : "rgba(4,8,18,.91)");
  gradient.addColorStop(1, "rgba(18,5,34,.88)");
  context.fillStyle = gradient;
  roundedRect(context, 12, 12, 1000, 296, 36);
  context.fill();

  context.strokeStyle = yourTurn ? "#7ffcff" : "rgba(185,132,255,.82)";
  context.lineWidth = 10;
  context.stroke();

  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 68px system-ui";
  context.fillText(title, 512, 78, 920);

  context.fillStyle = "#ffd98a";
  context.font = "900 38px system-ui";
  context.fillText(`POT $${snapshot.pot}   •   BET $${snapshot.currentBet}   •   STACK $${snapshot.you.stack || 0}`, 512, 150, 930);

  context.fillStyle = "#dffeff";
  context.font = "800 31px system-ui";
  const instruction = yourTurn
    ? (snapshot.need > 0 ? `Call $${snapshot.need}, raise, fold, or move chips past the pass line.` : "Check, raise, fold, or move chips past the pass line.")
    : snapshot.phase === "showdown" ? "Next hand begins automatically after the winner display." : snapshot.lastAction;
  context.fillText(instruction, 512, 216, 930);

  context.fillStyle = "rgba(255,255,255,.68)";
  context.font = "700 24px system-ui";
  context.fillText(`HAND ${snapshot.handNo}   •   ${String(snapshot.phase).toUpperCase()}   •   ${snapshot.lastAction}`, 512, 270, 940);

  hudTexture.needsUpdate = true;
  if (glowRing?.material){
    glowRing.material.color.setHex(yourTurn ? 0x7ffcff : 0xb184ff);
    glowRing.material.opacity = yourTurn ? 0.62 : 0.22;
  }

  updateButtonState();
  processTurnEvents(snapshot);
}

function processTurnEvents(snapshot){
  const key = `${snapshot.handNo}:${snapshot.phase}:${snapshot.current}:${snapshot.waitingHuman}`;
  if (key !== lastTurnKey){
    lastTurnKey = key;
    window.dispatchEvent(new CustomEvent("svr:turn-changed", {
      detail: {
        handNo: snapshot.handNo,
        phase: snapshot.phase,
        current: snapshot.current,
        yourTurn: snapshot.waitingHuman,
        pot: snapshot.pot,
        currentBet: snapshot.currentBet
      }
    }));
  }

  if (snapshot.phase === "showdown" && window.SVR_PHASE333_AUTO_NEXT !== false){
    if (!autoNextTimer){
      autoNextTimer = setTimeout(()=>{
        autoNextTimer = null;
        const current = pokerSnapshot();
        if (current.phase === "showdown") window.SVR_POKER_NEXT_HAND?.();
      }, 6200);
    }
  } else if (autoNextTimer){
    clearTimeout(autoNextTimer);
    autoNextTimer = null;
  }
}

function pulseButton(id){
  const button = actionButtons.get(id);
  if (!button) return;
  button.activeUntil = performance.now() + 260;
}

function performAction(id){
  const snapshot = pokerSnapshot();
  if (id === "next"){
    if (!["showdown", "idle"].includes(snapshot.phase)) return false;
    window.SVR_POKER_NEXT_HAND?.();
    pulseButton(id);
    return true;
  }

  if (!snapshot.waitingHuman) return false;
  const action = id === "checkcall" ? (snapshot.need > 0 ? "call" : "check") : id;
  window.SVR_POKER_ACTION?.(action);
  pulseButton(id);
  return true;
}

function inputSource(side, kind){
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
  const hand = inputSource(side, "hand");
  const handActive = window.SVR_HAND_INPUT_STATE?.[side]?.native || hand?.joints?.wrist || hand?.joints?.["index-finger-tip"];
  if (handActive && hand?.joints){
    const tip = hand.joints["index-finger-tip"];
    const wrist = hand.joints.wrist;
    const thumb = hand.joints["thumb-tip"];
    if (!tip || !wrist || !thumb) return null;
    tip.getWorldPosition(tmpA);
    wrist.getWorldPosition(tmpB);
    thumb.getWorldPosition(tmpC);
    const origin = tmpA.clone();
    const direction = tmpA.clone().sub(tmpB).normalize();
    return { origin, direction, down: tmpA.distanceTo(tmpC) < 0.039, kind: "hand" };
  }

  const controller = inputSource(side, "controller");
  if (!controller) return null;
  controller.updateWorldMatrix(true, false);
  controller.getWorldPosition(tmpA);
  controller.getWorldQuaternion(tmpQ);
  const origin = tmpA.clone().add(new THREE.Vector3(0, -0.012, -0.045).applyQuaternion(tmpQ));
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(tmpQ).normalize();
  const gamepad = controller.inputSource?.gamepad || controller.userData?.inputSource?.gamepad;
  return { origin, direction, down: (gamepad?.buttons?.[0]?.value || 0) > 0.55, kind: "controller" };
}

function buttonFromPointer(pointer){
  const enabledMeshes = [...actionButtons.values()].filter(button=>button.enabled).map(button=>button.body);
  raycaster.set(pointer.origin, pointer.direction);
  raycaster.near = 0.01;
  raycaster.far = 2.0;
  const hit = raycaster.intersectObjects(enabledMeshes, false)[0];
  if (hit?.object?.userData?.phase333Action) return hit.object.userData.phase333Action;

  if (pointer.kind === "hand"){
    let closest = null;
    let distance = 0.15;
    for (const button of actionButtons.values()){
      if (!button.enabled) continue;
      button.body.getWorldPosition(tmpB);
      const current = tmpB.distanceTo(pointer.origin);
      if (current < distance){ distance = current; closest = button.id; }
    }
    return closest;
  }
  return null;
}

function updateInput(side){
  const pointer = pointerPose(side);
  if (!pointer){ sourceDown[side] = false; return; }
  if (pointer.down && !sourceDown[side]){
    const action = buttonFromPointer(pointer);
    if (action) performAction(action);
  }
  sourceDown[side] = pointer.down;
}

function facePlayer(){
  const activeCamera = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  if (!activeCamera) return;
  activeCamera.getWorldPosition(tmpA);
  hudGroup?.lookAt(tmpA.x, hudGroup.position.y, tmpA.z);
  actionGroup?.lookAt(tmpA.x, actionGroup.position.y, tmpA.z);
}

function animateButtons(now){
  for (const button of actionButtons.values()){
    const active = now < button.activeUntil;
    const scale = active ? 0.92 : 1.0;
    button.group.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.28);
    button.body.material.emissiveIntensity = button.enabled ? (active ? 1.8 : 0.65) : 0.08;
  }
  if (glowRing){
    const yourTurn = pokerSnapshot().waitingHuman;
    const pulse = yourTurn ? 0.48 + Math.sin(now * 0.006) * 0.14 : 0.22;
    glowRing.material.opacity = pulse;
  }
}

function xrTick(time){
  const session = renderer?.xr?.getSession?.();
  if (!session || session !== xrSession) return;
  updateInput("left");
  updateInput("right");
  paintHud();
  facePlayer();
  animateButtons(time || performance.now());
  session.requestAnimationFrame(xrTick);
}

function startXRLoop(){
  const session = renderer?.xr?.getSession?.();
  if (!session || session === xrSession) return;
  xrSession = session;
  session.requestAnimationFrame(xrTick);
}

function qa(){
  const snapshot = pokerSnapshot();
  return {
    build: BUILD,
    active: installed,
    quest: IS_QUEST,
    table: tableInfo?.table?.name || null,
    felt: tableInfo?.felt?.name || null,
    environment: !!scene?.environment,
    toneMapping: renderer?.toneMapping ?? null,
    exposure: renderer?.toneMappingExposure ?? null,
    materials: window.SVR_PHASE333_MATERIAL_STATE || null,
    tableLights: scene?.getObjectByName?.("PHASE333_TABLE_LIGHTING_ROOT")?.children?.length || 0,
    hud: !!hudPanel,
    actionButtons: actionButtons.size,
    yourTurn: snapshot.waitingHuman,
    phase: snapshot.phase,
    pot: snapshot.pot,
    autoNext: window.SVR_PHASE333_AUTO_NEXT !== false,
    passLine: !!scene?.getObjectByName?.("PHASE332_PASS_LINE_ROOT"),
    chipPhysics: !!window.SVR_PHASE332_TABLE_SYSTEM,
    storeHook: !!window.SVR_PHASE333_STORE_HOOK,
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

  installEnvironment();
  applyMaterialPolish();
  buildTableLighting();
  buildHud();

  window.SVR_PHASE333_AUTO_NEXT = window.SVR_PHASE333_AUTO_NEXT ?? true;
  window.SVR_PHASE333_ACTION = performAction;
  window.SVR_PHASE333_TABLE_QA = qa;
  window.SVR_PHASE333_REPOLISH = ()=>{
    tableInfo = detectTable();
    applyMaterialPolish();
    buildTableLighting();
    buildHud();
    return qa();
  };
  window.SVR_PHASE333_STORE_HOOK = {
    ready: true,
    route: "/site/store.html",
    open: ()=>window.open("/site/store.html", "_blank", "noopener,noreferrer")
  };
  window.SVR_PHASE333_GAMEPLAY_POLISH = {
    build: BUILD,
    performAction,
    qa,
    autoNext: true,
    multiplayerTurnEvent: "svr:turn-changed",
    physicalBetEvent: "svr:physical-bet-committed",
    siteTouched: false
  };
  window.SVR_LOCKED_FINAL_BUILD = BUILD;

  renderer.xr.addEventListener("sessionstart", ()=>setTimeout(startXRLoop, 120));
  renderer.xr.addEventListener("sessionend", ()=>{ xrSession = null; sourceDown.left = sourceDown.right = false; });
  if (renderer.xr.isPresenting) startXRLoop();

  setInterval(()=>{
    paintHud();
    facePlayer();
    if (!renderer.xr.isPresenting) animateButtons(performance.now());
  }, 120);

  setInterval(()=>{
    applyMaterialPolish();
    window.SVR_PHASE331_QUEST_TABLE_INTERACTION?.align?.();
  }, 2400);
}

install();
