import * as THREE from "three";
import { assetUrls, loadFirstTexture } from "./asset_base.js";

const BUILD = "PHASE-331-QUEST-META-HANDS-TABLE-INTERACTION-LOCK";
const ROOT_NAME = "PHASE331_QUEST_TABLE_INTERACTION_ROOT";
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
let scene = null;
let camera = null;
let renderer = null;
let root = null;
let tableInfo = null;
let logo = null;
let potPanel = null;
let potCanvas = null;
let potTexture = null;
let lastPot = null;
let potChips = [];
let lastAlignAt = 0;
let installed = false;
const held = { left: null, right: null };
const wasDown = { left: false, right: false };
const fallbackParents = { left: null, right: null };

function sceneRoot(){ return scene?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || scene; }
function table(){
  const r = sceneRoot();
  return r?.getObjectByName?.("PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED")
    || r?.getObjectByName?.("PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT")
    || r?.getObjectByName?.("PHASE200_INTENDED_LOBBY_POKER_TABLE_LOCKED")
    || null;
}
function bounds(o){
  o.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(o);
  const s = new THREE.Vector3();
  const c = new THREE.Vector3();
  b.getSize(s); b.getCenter(c);
  return { b, s, c };
}
function detectSurfaceY(t, bb){
  let best = null;
  t.traverse?.(o=>{
    if (!o.isMesh) return;
    const name = String(o.name || "").toLowerCase();
    if (!/(felt|cloth|surface|inner|top|tabletop|play)/.test(name)) return;
    try{
      const q = bounds(o);
      if (q.s.x > .8 && q.s.z > .45){
        const candidate = q.b.max.y + .006;
        if (best === null || candidate < best) best = candidate;
      }
    }catch{}
  });
  if (Number.isFinite(window.SVR_TABLE_RESTING_POINT_STATE?.restY)) return window.SVR_TABLE_RESTING_POINT_STATE.restY;
  if (best !== null && Number.isFinite(best)) return best;
  return Math.max(bb.b.min.y + bb.s.y * .45, bb.b.max.y - .18);
}
function refreshTableInfo(){
  const t = table();
  if (!t) return null;
  const bb = bounds(t);
  const surfaceY = detectSurfaceY(t, bb);
  tableInfo = {
    table: t,
    bounds: bb,
    center: bb.c,
    surfaceY,
    playableW: Math.max(2.8, Math.min(bb.s.x * .54, 3.75)),
    playableD: Math.max(1.35, Math.min(bb.s.z * .46, 2.08))
  };
  return tableInfo;
}
function setWorldY(object, y){
  if (!object?.parent) return;
  object.updateMatrixWorld(true);
  object.getWorldPosition(tmp);
  tmp.y = y;
  object.parent.worldToLocal(tmp);
  object.position.copy(tmp);
}
function chipIndex(name){
  const match = String(name || "").match(/_(\d+)$/);
  return match ? Number(match[1]) : 0;
}
function isCard(o){ return !!(o?.isMesh && /(P85_COMM_|P85_HAND_|PHASE323_SURFACE_.*CARD|PHASE214_.*CARD|PHASE215_.*CARD)/i.test(o.name || "")); }
function isChip(o){ return !!(o?.isMesh && /(P85_STACK_|P85_POT_CHIP|PHASE331_POT_CHIP|PHASE323_SURFACE_.*CHIP|PHASE214_.*CHIP|PHASE215_.*CHIP)/i.test(o.name || "")); }
function effectivelyVisible(o){
  let cur = o;
  while (cur){ if (cur.visible === false) return false; cur = cur.parent; }
  return true;
}
function activeChips(){
  const out = [];
  sceneRoot()?.traverse?.(o=>{ if (isChip(o) && effectivelyVisible(o) && !o.userData?.svrHeld) out.push(o); });
  return out;
}
function alignSurfaceObjects(force = false){
  const now = performance.now();
  if (!force && now - lastAlignAt < 350) return;
  lastAlignAt = now;
  const info = refreshTableInfo();
  if (!info) return;
  enforceGameplayLayerAuthority();
  let cards = 0, chips = 0;
  sceneRoot()?.traverse?.(o=>{
    if (!effectivelyVisible(o) || o.userData?.svrHeld) return;
    if (isCard(o)){
      setWorldY(o, info.surfaceY + .010);
      o.rotation.x = -Math.PI / 2;
      cards++;
    } else if (isChip(o)){
      setWorldY(o, info.surfaceY + .008 + chipIndex(o.name) * .016);
      chips++;
    }
  });
  window.SVR_PHASE331_SURFACE_ALIGNMENT = { cards, chips, surfaceY: +info.surfaceY.toFixed(4), checkedAt: new Date().toISOString() };
}

function enforceGameplayLayerAuthority(){
  const r = sceneRoot();
  const gameplay = r?.getObjectByName?.("PHASE85_POKER_TRUTH_TABLE_LAYER");
  if (!gameplay) return false;
  for (const name of ["PHASE323_TABLE_RESTING_POINT_ROOT", "PHASE214_STATIC_CARDS_CHIPS_LIGHTS_ROOT", "PHASE215_TABLE_GEOMETRY_CONTROLLER_WATCH_PANEL_ROOT", "PHASE212_STABLE_POKER_LABELS_CHIPS_ROOT"]){
    const old = r.getObjectByName?.(name);
    if (old) old.visible = false;
  }
  gameplay.visible = true;
  return true;
}
function ensurePotChips(value = 0){
  const info = tableInfo || refreshTableInfo();
  if (!info || !root) return;
  const desired = Math.max(1, Math.min(12, Math.ceil(Math.max(1, value) / 25)));
  while (potChips.length < desired){
    const index = potChips.length;
    const chip = new THREE.Mesh(
      new THREE.CylinderGeometry(.062, .062, .015, 28),
      new THREE.MeshStandardMaterial({ color: index % 3 === 0 ? 0xffd98a : index % 3 === 1 ? 0x7ffcff : 0xff5b8c, roughness: .5, metalness: .16 })
    );
    chip.name = `PHASE331_POT_CHIP_${index}`;
    chip.renderOrder = 3312;
    root.add(chip);
    potChips.push(chip);
  }
  potChips.forEach((chip, index)=>{
    chip.visible = index < desired && !chip.userData?.svrHeld;
    if (!chip.userData?.svrHeld) chip.position.set(info.center.x, info.surfaceY + .008 + index * .016, info.center.z + info.playableD * .13);
  });
}

function makePotTexture(){
  potCanvas = document.createElement("canvas");
  potCanvas.width = 768; potCanvas.height = 240;
  potTexture = new THREE.CanvasTexture(potCanvas);
  potTexture.colorSpace = THREE.SRGBColorSpace;
  return potTexture;
}
function paintPot(value){
  if (!potCanvas || !potTexture) return;
  const g = potCanvas.getContext("2d");
  g.clearRect(0, 0, potCanvas.width, potCanvas.height);
  g.fillStyle = "rgba(2,8,18,.48)";
  g.fillRect(10, 10, 748, 220);
  g.strokeStyle = "rgba(127,252,255,.88)";
  g.lineWidth = 8;
  g.strokeRect(14, 14, 740, 212);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "rgba(255,255,255,.96)";
  g.font = "900 88px system-ui, Arial";
  g.fillText(`POT ${value}`, 384, 105, 700);
  g.fillStyle = "rgba(255,223,138,.94)";
  g.font = "800 34px system-ui, Arial";
  g.fillText("CENTER POT", 384, 182, 700);
  potTexture.needsUpdate = true;
}
function ensurePotDisplay(){
  const info = tableInfo || refreshTableInfo();
  if (!info || !root) return;
  if (!potPanel){
    potPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(.96, .30),
      new THREE.MeshBasicMaterial({ map: makePotTexture(), transparent: true, opacity: .82, depthWrite: false, side: THREE.DoubleSide })
    );
    potPanel.name = "PHASE331_UPRIGHT_TRANSLUCENT_POT_DISPLAY";
    potPanel.renderOrder = 3315;
    root.add(potPanel);
  }
  potPanel.position.set(info.center.x, info.surfaceY + .48, info.center.z + info.playableD * .02);
  const activeCamera = renderer?.xr?.isPresenting ? renderer.xr.getCamera(camera) : camera;
  activeCamera?.getWorldPosition(tmp);
  potPanel.lookAt(tmp.x, potPanel.position.y, tmp.z);
  sceneRoot()?.traverse?.(o=>{ if (o !== potPanel && /P85_POT_LABEL|PHASE214_TABLE_STATUS|PHASE215_HIGH_TABLE_TAG|PHASE323_RESTING_POINT_LABEL/i.test(o.name || "")) o.visible = false; });
  const value = window.SVR_PHASE85_POKER_STATE?.pot ?? 0;
  ensurePotChips(value);
  if (value !== lastPot){ lastPot = value; paintPot(value); }
}
async function ensureLogo(){
  const info = tableInfo || refreshTableInfo();
  if (!info || !root || logo) return;
  let texture = null;
  try{ texture = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace }); }catch{}
  if (!texture) return;
  sceneRoot()?.traverse?.(o=>{ if (/TABLE.*LOGO|SVR.*TABLE.*LOGO|PHASE328_SURFACE_LOGO/i.test(o.name || "")) o.visible = false; });
  const aspect = texture.image?.width && texture.image?.height ? texture.image.width / texture.image.height : 1.7;
  const width = .92;
  logo = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width / Math.max(.75, aspect)),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: .96, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 })
  );
  logo.name = "PHASE331_SVR_TABLE_CENTER_LOGO";
  logo.position.set(info.center.x, info.surfaceY + .004, info.center.z);
  logo.rotation.x = -Math.PI / 2;
  logo.renderOrder = 3310;
  root.add(logo);
}
function jointWorld(source, name, target){
  const joint = source?.joints?.[name];
  if (!joint) return false;
  joint.getWorldPosition(target);
  return true;
}
function inputPose(hand, controller){
  if (hand?.joints){
    const thumb = new THREE.Vector3();
    const index = new THREE.Vector3();
    if (!jointWorld(hand, "thumb-tip", thumb) || !jointWorld(hand, "index-finger-tip", index)) return null;
    return { down: thumb.distanceTo(index) < .038, anchor: thumb.add(index).multiplyScalar(.5), maxDistance: .13, kind: "hand" };
  }
  if (controller){
    controller.updateWorldMatrix(true, false);
    const anchor = new THREE.Vector3();
    controller.getWorldPosition(anchor);
    const q = new THREE.Quaternion();
    controller.getWorldQuaternion(q);
    anchor.add(new THREE.Vector3(0, -.015, -.075).applyQuaternion(q));
    const trigger = controller.userData?.trigger ?? controller.userData?.gamepad?.buttons?.[0]?.value ?? controller.inputSource?.gamepad?.buttons?.[0]?.value ?? 0;
    return { down: trigger > .55, anchor, maxDistance: .18, kind: "controller" };
  }
  return null;
}
function nearestChip(anchor, maxDistance){
  let best = null, bestDistance = maxDistance;
  for (const chip of activeChips()){
    chip.getWorldPosition(tmp2);
    const d = tmp2.distanceTo(anchor);
    if (d < bestDistance){ best = chip; bestDistance = d; }
  }
  return best;
}
function beginGrab(side, pose){
  const chip = nearestChip(pose.anchor, pose.maxDistance);
  if (!chip) return;
  scene.attach(chip);
  chip.userData.svrHeld = side;
  chip.userData.svrGrabbedAt = new Date().toISOString();
  chip.material = chip.material?.clone?.() || chip.material;
  if (chip.material?.emissive) chip.material.emissive.setHex(0x163f45);
  held[side] = chip;
}
function releaseGrab(side){
  const chip = held[side];
  if (!chip) return;
  const info = tableInfo || refreshTableInfo();
  chip.getWorldPosition(tmp);
  let x = tmp.x, z = tmp.z;
  let y = info ? info.surfaceY + .008 : tmp.y;
  let nearest = null, nearestDistance = .16;
  for (const other of activeChips()){
    if (other === chip) continue;
    other.getWorldPosition(tmp2);
    const d = Math.hypot(tmp2.x - x, tmp2.z - z);
    if (d < nearestDistance){ nearest = other; nearestDistance = d; }
  }
  if (nearest){
    nearest.getWorldPosition(tmp2);
    x = tmp2.x; z = tmp2.z; y = Math.max(y, tmp2.y + .016);
  } else if (info){
    x = THREE.MathUtils.clamp(x, info.center.x - info.playableW * .46, info.center.x + info.playableW * .46);
    z = THREE.MathUtils.clamp(z, info.center.z - info.playableD * .46, info.center.z + info.playableD * .46);
  }
  chip.position.set(x, y, z);
  chip.rotation.set(0, 0, 0);
  chip.userData.svrHeld = null;
  if (chip.material?.emissive) chip.material.emissive.setHex(0x000000);
  held[side] = null;
}
function updateSide(side, hand, controller){
  const pose = inputPose(hand, controller);
  if (!pose){ if (held[side]) releaseGrab(side); wasDown[side] = false; return; }
  if (pose.down && !wasDown[side] && !held[side]) beginGrab(side, pose);
  if (pose.down && held[side]) held[side].position.copy(pose.anchor);
  if (!pose.down && wasDown[side] && held[side]) releaseGrab(side);
  wasDown[side] = pose.down;
}
function sourceForSide(side, kind){
  const getter = kind === "hand" ? "getHand" : "getController";
  for (let i = 0; i < 2; i++){
    const source = renderer?.xr?.[getter]?.(i);
    if (!source) continue;
    const handed = source.userData?.handedness || source.inputSource?.handedness || source.userData?.inputSource?.handedness;
    if (handed === side) return source;
  }
  return renderer?.xr?.[getter]?.(side === "left" ? 0 : 1) || null;
}
function nativeActive(hand){
  if (!hand?.joints) return false;
  const handed = hand.userData?.handedness || hand.userData?.inputSource?.handedness;
  return !!handed && !!(hand.joints["wrist"] || hand.joints["index-finger-tip"]);
}
function arbitrateHands(){
  const r = sceneRoot();
  const state = { mode: "none", duplicateHandsPrevented: true, left: {}, right: {}, checkedAt: new Date().toISOString() };
  for (const side of ["left", "right"]){
    const hand = sourceForSide(side, "hand");
    const controller = sourceForSide(side, "controller");
    const native = nativeActive(hand);
    const controllerConnected = !!(controller?.inputSource?.gamepad || controller?.userData?.inputSource?.gamepad);
    const fakeName = `PHASE281_VISIBLE_${side.toUpperCase()}_HAND`;
    let fake = r?.getObjectByName?.(fakeName) || scene?.getObjectByName?.(fakeName) || null;
    if (!fake && fallbackParents[side]?.object) fake = fallbackParents[side].object;
    if (fake){
      if (native && fake.parent){ fallbackParents[side] = { object: fake, parent: fake.parent }; fake.parent.remove(fake); }
      if (!native && !fake.parent && fallbackParents[side]?.parent){ fallbackParents[side].parent.add(fake); }
    }
    state[side] = { native, controller: controllerConnected, controllerVisualAllowed: controllerConnected && !native };
  }
  const nativeCount = Number(state.left.native) + Number(state.right.native);
  const controllerCount = Number(state.left.controller) + Number(state.right.controller);
  state.mode = nativeCount === 2 ? "meta-hands" : nativeCount > 0 ? "mixed" : controllerCount > 0 ? "controllers" : "none";
  window.SVR_META_HANDS_ACTIVE = nativeCount > 0;
  window.SVR_HAND_INPUT_STATE = state;
  return state;
}
function update({ leftHand = null, rightHand = null, leftController = null, rightController = null } = {}){
  if (!installed || !renderer?.xr?.isPresenting) return;
  alignSurfaceObjects();
  ensurePotDisplay();
  updateSide("left", leftHand, leftController);
  updateSide("right", rightHand, rightController);
}
function qa(){
  const info = tableInfo || refreshTableInfo();
  const handState = window.SVR_HAND_INPUT_STATE || {};
  const chips = activeChips();
  let maxSurfaceError = 0;
  if (info){
    for (const chip of chips){ chip.getWorldPosition(tmp); maxSurfaceError = Math.max(maxSurfaceError, Math.abs(tmp.y - info.surfaceY)); }
  }
  return {
    build: BUILD,
    active: installed,
    inputMode: handState.mode || "unknown",
    duplicateHandsPrevented: !!handState.duplicateHandsPrevented,
    left: handState.left || null,
    right: handState.right || null,
    table: info?.table?.name || null,
    surfaceY: info ? +info.surfaceY.toFixed(4) : null,
    visibleChipCount: chips.length,
    potDisplay: !!potPanel,
    tableLogo: !!logo,
    held: { left: held.left?.name || null, right: held.right?.name || null },
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
  installed = true;
  root = sceneRoot().getObjectByName?.(ROOT_NAME);
  if (!root){ root = new THREE.Group(); root.name = ROOT_NAME; sceneRoot().add(root); }
  alignSurfaceObjects(true);
  ensurePotDisplay();
  await ensureLogo();
  window.SVR_PHASE331_QUEST_TABLE_INTERACTION = { build: BUILD, update, qa, align: ()=>alignSurfaceObjects(true), siteTouched: false };
  window.SVR_PHASE331_QUEST_QA = qa;
  window.SVR_REBUILD_PHASE331_TABLE = ()=>{ alignSurfaceObjects(true); ensurePotDisplay(); ensureLogo(); return qa(); };
  window.SVR_LOCKED_FINAL_BUILD = BUILD;
  let activeSession = null;
  const startXRLoop = ()=>{
    const session = renderer.xr.getSession?.();
    if (!session || activeSession === session) return;
    activeSession = session;
    const tick = ()=>{
      if (renderer.xr.getSession?.() !== session){ activeSession = null; return; }
      const state = arbitrateHands();
      update({
        leftHand: state.left.native ? sourceForSide("left", "hand") : null,
        rightHand: state.right.native ? sourceForSide("right", "hand") : null,
        leftController: state.left.native ? null : sourceForSide("left", "controller"),
        rightController: state.right.native ? null : sourceForSide("right", "controller")
      });
      session.requestAnimationFrame(tick);
    };
    session.requestAnimationFrame(tick);
  };
  renderer.xr.addEventListener("sessionstart", ()=>{
    setTimeout(startXRLoop, 100);
    const session = renderer.xr.getSession?.();
    session?.addEventListener?.("inputsourceschange", arbitrateHands);
  });
  window.SVR_ENABLE_META_HANDS = ()=>arbitrateHands();
  if (renderer.xr.isPresenting) startXRLoop();
  setInterval(()=>{ alignSurfaceObjects(); ensurePotDisplay(); if (renderer.xr.isPresenting) arbitrateHands(); }, 400);
}

[350, 900, 1800, 3200, 6000].forEach(ms=>setTimeout(install, ms));
install();
