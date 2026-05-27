import * as THREE from "three";

/*
 * SVR Phase 276 — Original Lobby Only Freeze Fix
 * Keeps the original lobby and hides duplicate/fallback/second lobby shells.
 * Also reduces floor blinking caused by overlapping floor geometry.
 */

const BUILD = "PHASE-276-ORIGINAL-LOBBY-ONLY-FREEZE-FIX";
const CACHE_TAG = "phase276-original-lobby-only-freeze-fix";

function low(v){ return String(v || "").toLowerCase(); }

function textOf(obj){
  return low([
    obj?.name,
    obj?.type,
    obj?.userData?.name,
    obj?.userData?.tag,
    obj?.userData?.role,
    obj?.userData?.phase,
    obj?.userData?.build,
    obj?.userData?.source,
    obj?.userData?.svrHiddenReason
  ].filter(Boolean).join(" "));
}

function has(text, words){
  return words.some(w => text.includes(w));
}

function isBadDuplicateLobby(obj){
  const t = textOf(obj);
  return has(t, [
    "second_lobby",
    "second lobby",
    "duplicate_lobby",
    "duplicate lobby",
    "copy lobby",
    "lobby copy",
    "clone lobby",
    "lobby clone",
    "fallback_lobby",
    "fallback lobby",
    "visible_lobby_shell",
    "phase265_visible_lobby_shell",
    "phase265",
    "emergency_lobby",
    "emergency wall",
    "blocking_fallback_wall",
    "fallback wall"
  ]);
}

function isLobbyLike(obj){
  const t = textOf(obj);
  if (has(t, ["hud", "status wall", "teleport", "controller", "hand", "button", "ui"])) return false;
  return has(t, ["lobby", "casino", "poker room", "room shell", "visible shell"]);
}

function keepScore(obj){
  const t = textOf(obj);
  let score = 0;
  if (has(t, ["original", "main", "casino", "poker", "loaded", "model", "glb", "gltf"])) score += 20;
  if (has(t, ["phase265", "fallback", "duplicate", "copy", "clone", "second", "emergency"])) score -= 50;
  if (obj?.visible !== false) score += 5;
  if (obj?.children?.length) score += Math.min(obj.children.length, 20);
  return score;
}

function hideTree(obj, state, reason){
  if (!obj || obj === state.scene) return;
  if (obj.traverse) {
    obj.traverse(child => {
      child.visible = false;
      child.userData = child.userData || {};
      child.userData.svrPhase276Hidden = true;
      child.userData.svrHiddenReason = reason;
    });
  } else {
    obj.visible = false;
    obj.userData = obj.userData || {};
    obj.userData.svrPhase276Hidden = true;
    obj.userData.svrHiddenReason = reason;
  }

  state.hiddenObjects++;
  state.hiddenNames.push(obj.name || obj.type || "unnamed");
}

function boxFor(obj){
  try {
    const box = new THREE.Box3().setFromObject(obj);
    if (!box || box.isEmpty()) return null;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { box, size, center, volume: Math.max(0.001, size.x * size.y * size.z) };
  } catch(_) {
    return null;
  }
}

function boxesOverlap(a,b){
  if (!a || !b) return false;
  const centerClose =
    Math.abs(a.center.x - b.center.x) < Math.max(2, Math.min(a.size.x, b.size.x) * 0.35) &&
    Math.abs(a.center.z - b.center.z) < Math.max(2, Math.min(a.size.z, b.size.z) * 0.35);

  const similarSize =
    Math.abs(a.size.x - b.size.x) < Math.max(2, Math.max(a.size.x, b.size.x) * 0.35) &&
    Math.abs(a.size.z - b.size.z) < Math.max(2, Math.max(a.size.z, b.size.z) * 0.35);

  return centerClose && similarSize;
}

function removeDuplicateLobby(scene, state){
  if (!scene?.traverse) return;

  const candidates = [];
  scene.traverse(obj => {
    if (!obj || obj === scene) return;

    const t = textOf(obj);

    if (isBadDuplicateLobby(obj)) {
      candidates.push({
        obj,
        bad: true,
        score: keepScore(obj),
        box: boxFor(obj)
      });
      return;
    }

    if (isLobbyLike(obj)) {
      const parentText = textOf(obj.parent);
      if (obj.parent && obj.parent !== scene && has(parentText, ["lobby", "casino", "poker room"]) && !isBadDuplicateLobby(obj)) {
        return;
      }

      candidates.push({
        obj,
        bad: false,
        score: keepScore(obj),
        box: boxFor(obj)
      });
    }
  });

  state.lobbyCandidates = candidates.map(c => ({
    name: c.obj.name || c.obj.type || "unnamed",
    bad: c.bad,
    score: c.score
  }));

  if (!candidates.length) return;

  const good = candidates.filter(c => !c.bad);
  const keep = (good.length ? good : candidates).sort((a,b) => b.score - a.score)[0];

  state.keptLobby = keep?.obj?.name || keep?.obj?.type || "unknown";

  candidates.forEach(c => {
    if (c.obj === keep.obj) return;

    if (c.bad) {
      hideTree(c.obj, state, "phase276-hide-known-second-or-fallback-lobby");
      return;
    }

    if (boxesOverlap(keep.box, c.box) && c.score <= keep.score) {
      hideTree(c.obj, state, "phase276-hide-overlapping-duplicate-lobby");
    }
  });
}

function stabilizeFloors(scene, state){
  if (!scene?.traverse) return;

  const floors = [];

  scene.traverse(obj => {
    if (!obj?.isMesh || obj.visible === false) return;
    const t = textOf(obj) + " " + low(obj.material?.name);
    if (has(t, ["floor", "ground", "tile", "carpet", "lobby_floor"])) {
      floors.push(obj);
    }
  });

  const groups = new Map();

  floors.forEach(obj => {
    const box = boxFor(obj);
    const y = obj.position ? Math.round(obj.position.y * 1000) / 1000 : 0;
    const sx = box ? Math.round(box.size.x * 10) / 10 : 0;
    const sz = box ? Math.round(box.size.z * 10) / 10 : 0;
    const key = `${y}:${sx}:${sz}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(obj);
  });

  groups.forEach(items => {
    if (items.length <= 1) return;

    items.sort((a,b) => keepScore(b) - keepScore(a));
    const keep = items[0];

    items.slice(1).forEach(obj => {
      if (isBadDuplicateLobby(obj) || keepScore(obj) <= keepScore(keep)) {
        hideTree(obj, state, "phase276-hide-duplicate-floor-zfight");
        state.hiddenDuplicateFloors++;
      }
    });
  });

  floors.forEach((obj, idx) => {
    if (obj.visible === false || !obj.material) return;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

    mats.forEach(mat => {
      if (!mat) return;
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = 2 + idx * 0.05;
      mat.polygonOffsetUnits = 2 + idx * 0.05;
      mat.depthWrite = true;
      mat.needsUpdate = true;
    });

    obj.userData = obj.userData || {};
    obj.userData.svrPhase276FloorStable = true;
  });
}

function tuneRenderer(renderer, camera, state){
  try {
    if (renderer?.setPixelRatio) {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      renderer.setPixelRatio(dpr);
      state.pixelRatio = dpr;
    }

    if (renderer?.shadowMap) {
      renderer.shadowMap.autoUpdate = false;
      state.shadowAutoUpdate = false;
    }

    if (camera) {
      camera.near = Math.max(camera.near || 0.1, 0.08);
      camera.far = Math.min(camera.far || 1000, 450);
      if (camera.updateProjectionMatrix) camera.updateProjectionMatrix();
      state.cameraNear = camera.near;
      state.cameraFar = camera.far;
    }
  } catch (err) {
    state.tuneError = String(err?.message || err);
  }
}

function publish(state){
  state.updatedAt = new Date().toISOString();
  window.SVR_PHASE276_ORIGINAL_LOBBY_ONLY = state;
  window.SVR_PHASE276_REMOVE_DUPLICATE = state;
  window.SVR_BUILD_PHASE = 276;
  window.SVR_CACHE_TAG = CACHE_TAG;
}

export function installPhase276OriginalLobbyOnly(options = {}){
  const state = {
    build: BUILD,
    cacheTag: CACHE_TAG,
    installedAt: new Date().toISOString(),
    sceneFound: false,
    checks: 0,
    hiddenObjects: 0,
    hiddenNames: [],
    hiddenDuplicateFloors: 0,
    lobbyCandidates: [],
    keptLobby: "unknown"
  };

  function run(){
    const scene = options.scene || window.SVR_SCENE || window.scene || window.g_scene || null;
    const renderer = options.renderer || window.SVR_RENDERER || window.renderer || null;
    const camera = options.camera || window.SVR_CAMERA || window.camera || null;

    state.scene = scene;
    state.sceneFound = !!scene;
    state.checks++;
    state.hiddenObjects = 0;
    state.hiddenNames = [];
    state.hiddenDuplicateFloors = 0;

    if (scene) {
      removeDuplicateLobby(scene, state);
      stabilizeFloors(scene, state);
    }

    tuneRenderer(renderer, camera, state);
    delete state.scene;
    publish(state);
    return state;
  }

  run();
  setTimeout(run, 350);
  setTimeout(run, 1200);
  setTimeout(run, 3000);
  setTimeout(run, 7000);
  setTimeout(run, 12000);

  return state;
}

function autoInstall(){
  if (window.SVR_PHASE276_AUTO_INSTALLED) return;
  window.SVR_PHASE276_AUTO_INSTALLED = true;
  installPhase276OriginalLobbyOnly({
    scene: window.SVR_SCENE || window.scene || window.g_scene,
    renderer: window.SVR_RENDERER || window.renderer,
    camera: window.SVR_CAMERA || window.camera
  });
}

setTimeout(autoInstall, 0);
setTimeout(autoInstall, 1000);
setTimeout(autoInstall, 3000);

export default installPhase276OriginalLobbyOnly;
