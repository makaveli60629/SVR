import * as THREE from "three";

const LABEL = "PHASE-97-LOBBY-DECLUTTER-OPEN-FLOOR-LOCK";
const ROOT = "PHASE97_LOBBY_DECLUTTER_OPEN_FLOOR_ROOT";
const KEEP_RE = /WATCH|PORTAL|POKER|TABLE|CARD|CHIP|ACTION|MOON|MARS|HAND|PLAYER|BOT|TELEPORT|RAY|ARC|TARGET|SVR_STORE|PGA|WELLNESS|SCORPION/i;
const CROWD_RE = /PHASE90_RELEASE_CANDIDATE_AUDIT_PANEL|PHASE91_HEADSET_QA_PANEL|PHASE91_TABLE_COMFORT_MARKERS|PHASE92_SOFT_CASINO_CEILING_GLOW|PHASE92_UNIFIED_PORTAL_SIGN|PHASE92_PORTAL_SIGN_BACKPLATE|PHASE92_ARCH_TOP_GOLD_DEPTH_TRIM|PHASE92_TABLE_CYAN_FOCUS_RING|PHASE93_PORTAL_FLOOR_GUIDE|PHASE93_TABLE_AREA_GOLD_ROPE|PHASE93_TABLE_AREA_POST_TOP_GLOW|PHASE93_TABLE_AREA_SUBTLE_GOLD_ROPE|PHASE93_HIGH_MOON_VISIBILITY_HALO_REFERENCE|PHASE93_HIGH_MARS_VISIBILITY_HALO_REFERENCE|PHASE94_SUBTLE_CENTERLINE|PHASE94_SUBTLE_LOBBY_FLOW_EDGE|PHASE94_CEILING_REFLECTION_RIM|PHASE95_SUBTLE_SIGHTLINE_RAIL|PHASE95_READABLE_LOCATOR_SIGN|PHASE95_LOCATOR_SIGN_BACKPLATE|PHASE95_CEILING_WARMTH_LIGHT_BAR|UPDATE4_DAILY_PICK_SHOWCASE_TABLE|UPDATE4_DAILY_PICK|UPDATE4_SPATIAL_WALLET_GATEWAY_HOLOGRAM|UPDATE4_WALLET_GATEWAY_HOLOGRAM_FRAME/i;
const EXCESS_ROOT_RE = /PHASE90_RELEASE_CANDIDATE_AUDIT_ROOT|PHASE91_HEADSET_QA_FIX_PASS_ROOT|PHASE95_LOBBY_LIGHTING_SIGHTLINE_POLISH_ROOT/i;
const TRIM_KEEP_RE = /UPDATE4_CONTINUOUS_NEON_PURPLE_TRIM|UPDATE4_TRIM_SOFT_HALO|UPDATE4_CANOPY|UPDATE4_QUAD_SQUARE_GRADIENT_COLUMN|UPDATE4_QUAD_COLUMN/i;
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
let installed = false;

function glow(color, opacity=.16){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function hideObject(obj, reason){
  obj.visible = false;
  obj.userData.phase97DeclutterHidden = true;
  obj.userData.phase97DeclutterReason = reason;
  return 1;
}
function dimObject(obj, opacity=.10){
  let changed = 0;
  const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
  mats.forEach((m)=>{
    if(!m) return;
    if(typeof m.opacity === "number" && m.opacity > opacity){
      m.transparent = true;
      m.opacity = opacity;
      m.depthWrite = false;
      m.needsUpdate = true;
      changed++;
    }
    if(typeof m.emissiveIntensity === "number" && m.emissiveIntensity > .12){
      m.emissiveIntensity = .12;
      m.needsUpdate = true;
      changed++;
    }
  });
  obj.userData.phase97DeclutterDimmed = true;
  return changed;
}
function declutter(scene){
  let hidden = 0, dimmed = 0, kept = 0, rootsCollapsed = 0;
  const toHide = [];
  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if(!name) return;
    if(EXCESS_ROOT_RE.test(name)){ toHide.push([obj,"excess-qa-or-sightline-root"]); return; }
    if(CROWD_RE.test(name)){ toHide.push([obj,"visual-clutter"]); return; }
    if(/PHASE9[2-6]|UPDATE4/i.test(name)){
      if(TRIM_KEEP_RE.test(name) || KEEP_RE.test(name)){ kept++; return; }
      if(/GUIDE|RAIL|HALO|LOCATOR|COMFORT|DAILY|WALLET|QA|AUDIT|RING|ROPE|POST|SIGN_BACKPLATE|CEILING_GLOW|LIGHT_BAR/i.test(name)){
        toHide.push([obj,"crowded-decorative-layer"]);
        return;
      }
      if(/SKYLINE_WINDOW|DISTANT_SKYLINE/i.test(name)){
        dimmed += dimObject(obj,.08);
        return;
      }
    }
    if(/DUST|FOG|SPRITE|STAR/i.test(name)) dimmed += dimObject(obj,.08);
  });
  toHide.forEach(([obj,reason])=>{ hidden += hideObject(obj, reason); if(obj.parent?.name && EXCESS_ROOT_RE.test(obj.parent.name)) rootsCollapsed++; });
  return { hidden, dimmed, kept, rootsCollapsed };
}
function addOpenFloor(root){
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.25,96), glow(0x050814,.22));
  floor.name = "PHASE97_OPEN_CENTER_FLOOR_CLEAR_ZONE";
  floor.rotation.x = -Math.PI/2;
  floor.position.set(0,.115,.25);
  floor.renderOrder = 395;
  root.add(floor);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.55,10.8), glow(GOLD,.10));
  path.name = "PHASE97_SINGLE_CLEAN_MAIN_WALKWAY";
  path.rotation.x = -Math.PI/2;
  path.position.set(0,.12,.55);
  path.renderOrder = 396;
  root.add(path);
  [-1.42,1.42].forEach((x,i)=>{
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.035,.022,10.9), glow(CYAN,.14));
    rail.name = `PHASE97_MINIMAL_WALKWAY_EDGE_${i}`;
    rail.position.set(x,.14,.55);
    rail.renderOrder = 397;
    root.add(rail);
  });
}
function compressWorldLayer(scene){
  let moved = 0, scaled = 0;
  const daily = scene.getObjectByName("UPDATE4_DAILY_PICK_SHOWCASE_TABLE");
  if(daily){ daily.position.set(-8.35,0,4.75); daily.scale.setScalar(.62); daily.visible = true; daily.userData.phase97MovedToSide = true; moved++; scaled++; }
  const wallet = scene.getObjectByName("UPDATE4_SPATIAL_WALLET_GATEWAY_HOLOGRAM");
  if(wallet){ wallet.position.set(2.85,1.55,1.25); wallet.scale.setScalar(.68); wallet.visible = true; wallet.userData.phase97MovedToSide = true; moved++; scaled++; }
  const frame = scene.getObjectByName("UPDATE4_WALLET_GATEWAY_HOLOGRAM_FRAME");
  if(frame){ frame.position.set(2.85,1.55,1.23); frame.scale.setScalar(.58); frame.visible = true; frame.userData.phase97MovedToSide = true; moved++; scaled++; }
  const canopy = scene.getObjectByName("UPDATE4_OVERHEAD_GEOMETRIC_RING_CANOPY_LIGHT");
  if(canopy){ canopy.scale.setScalar(.82); canopy.position.set(0,4.62,-2.55); scaled++; }
  return { moved, scaled };
}
function protectCore(scene){
  let protectedCore = 0;
  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if(KEEP_RE.test(name)){
      obj.visible = true;
      obj.userData.phase97CoreProtected = true;
      obj.renderOrder = Math.max(obj.renderOrder || 0, 420);
      if(obj.material){
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m)=>{ if(m){ m.depthWrite = false; m.needsUpdate = true; }});
      }
      protectedCore++;
    }
  });
  return protectedCore;
}
function install(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old = scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root = new THREE.Group(); root.name = ROOT; scene.add(root);
  const cleanup = declutter(scene);
  const compressed = compressWorldLayer(scene);
  addOpenFloor(root);
  const protectedCore = protectCore(scene);
  renderer.setClearColor?.(0x010208,1);
  renderer.toneMappingExposure = Math.min(renderer.toneMappingExposure || 1, .96);
  renderer.shadowMap.enabled = false;
  installed = true;
  window.SVR_PHASE97_LOBBY_DECLUTTER_OPEN_FLOOR_LOCK = {
    build: LABEL,
    active: true,
    reason: "Lobby was too crowded; collapsed decorative QA/guide layers and reopened center floor.",
    cleanup,
    compressed,
    protectedCore,
    keptVisualLanguage: ["purple crown/base trim", "quad gradient columns", "central canopy", "core portals", "poker table", "watch/cards/chips", "Moon/Mars"],
    removedVisualNoise: ["extra QA panels", "locator signs", "guide rings", "sightline rails", "comfort markers", "excess floor glows", "large daily/wallet center clutter"],
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    watchTouched:false,
    movementTouched:false,
    privateScenesTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}

install();
let tries = 0;
const timer = setInterval(()=>{ tries++; if(install() || tries > 180) clearInterval(timer); }, 300);
[1200,3200,6800,12000,19000].forEach((d)=>setTimeout(install,d));
