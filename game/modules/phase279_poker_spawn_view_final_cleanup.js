import * as THREE from "three";

/*
 * SVR Phase 279 — Poker Spawn View Final Cleanup
 * Purpose:
 * - Keep original lobby only.
 * - Remove duplicate/fallback/second lobby shells.
 * - Move hand history / showdown HUD higher.
 * - Raise and enlarge community cards.
 * - Clear spawn point view.
 * - Stop floor blinking / z-fighting.
 */

const BUILD = "PHASE-279-POKER-SPAWN-VIEW-FINAL-CLEANUP";
const CACHE_TAG = "phase279-poker-spawn-view-final-cleanup";

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
    obj?.userData?.kind,
    obj?.material?.name
  ].filter(Boolean).join(" "));
}

function has(text, words){
  return words.some(w => text.includes(w));
}

function boxFor(obj){
  try {
    const box = new THREE.Box3().setFromObject(obj);
    if (!box || box.isEmpty()) return null;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { box, size, center };
  } catch (_) {
    return null;
  }
}

function hideTree(obj, state, reason){
  if (!obj) return;

  obj.visible = false;
  obj.userData = obj.userData || {};
  obj.userData.svrPhase279Hidden = true;
  obj.userData.svrHiddenReason = reason;

  if (obj.traverse) {
    obj.traverse(child => {
      child.visible = false;
      child.userData = child.userData || {};
      child.userData.svrPhase279Hidden = true;
      child.userData.svrHiddenReason = reason;
    });
  }

  state.hiddenCount++;
  state.hiddenNames.push(obj.name || obj.type || "unnamed");
}

function protectedGameplay(obj){
  const t = textOf(obj);
  return has(t, [
    "camera",
    "light",
    "controller",
    "hand",
    "teleport",
    "ray",
    "pointer",
    "arc",
    "ring",
    "chip",
    "deck",
    "card_back",
    "community_card",
    "board_card",
    "hole_card",
    "flop",
    "turn",
    "river",
    "player",
    "avatar",
    "dealer",
    "bot",
    "moon",
    "mars",
    "sky",
    "skyline",
    "sun",
    "star",
    "plant",
    "table.glb"
  ]);
}

function duplicateLobbyShell(obj){
  if (protectedGameplay(obj)) return false;

  const t = textOf(obj);

  return has(t, [
    "second_lobby",
    "second lobby",
    "duplicate_lobby",
    "duplicate lobby",
    "lobby copy",
    "copy lobby",
    "lobby clone",
    "clone lobby",
    "fallback_lobby",
    "fallback lobby",
    "visible_lobby_shell",
    "phase265",
    "phase273",
    "phase274",
    "phase275",
    "phase276",
    "phase277",
    "phase278",
    "emergency_lobby",
    "emergency wall",
    "fallback wall",
    "blocking_fallback_wall",
    "hud wall",
    "status wall"
  ]);
}

function removeDuplicateLobby(scene, state){
  if (!scene?.traverse) return;

  scene.traverse(obj => {
    if (!obj || obj === scene || obj.visible === false) return;
    if (duplicateLobbyShell(obj)) {
      hideTree(obj, state, "phase279-remove-duplicate-or-fallback-lobby");
    }
  });
}

function scoreEnvironment(obj){
  const t = textOf(obj);
  let score = 0;

  if (has(t, ["original", "main", "casino", "poker", "loaded", "model", "glb", "gltf"])) score += 50;
  if (has(t, ["phase265", "phase273", "phase274", "phase275", "phase276", "phase277", "phase278"])) score -= 100;
  if (has(t, ["fallback", "duplicate", "copy", "clone", "second", "emergency"])) score -= 100;
  if (obj.visible !== false) score += 5;
  if (obj.children?.length) score += Math.min(obj.children.length, 35);

  return score;
}

function looksEnvironmentRoot(obj){
  if (!obj || obj.visible === false || protectedGameplay(obj)) return false;

  const t = textOf(obj);
  const b = boxFor(obj);
  if (!b) return false;

  const large = b.size.x > 5 && b.size.z > 5 && b.size.y > 1;
  const named = has(t, ["lobby", "casino", "room", "shell", "environment", "floor", "wall", "world"]);

  return large && named;
}

function similarEnvironment(a, b){
  if (!a?.info || !b?.info) return false;

  const A = a.info;
  const B = b.info;

  const centerClose =
    Math.abs(A.center.x - B.center.x) < Math.max(2.0, Math.min(A.size.x, B.size.x) * 0.55) &&
    Math.abs(A.center.z - B.center.z) < Math.max(2.0, Math.min(A.size.z, B.size.z) * 0.55);

  const sizeClose =
    Math.abs(A.size.x - B.size.x) < Math.max(3.0, Math.max(A.size.x, B.size.x) * 0.55) &&
    Math.abs(A.size.z - B.size.z) < Math.max(3.0, Math.max(A.size.z, B.size.z) * 0.55);

  return centerClose && sizeClose;
}

function removeOverlappingLobbyRoots(scene, state){
  if (!scene?.children) return;

  const roots = scene.children
    .filter(looksEnvironmentRoot)
    .map(obj => ({
      obj,
      name: obj.name || obj.type || "unnamed",
      score: scoreEnvironment(obj),
      info: boxFor(obj)
    }))
    .filter(x => x.info);

  state.environmentRoots = roots.map(r => ({
    name: r.name,
    score: r.score,
    size: {
      x: Number(r.info.size.x.toFixed(2)),
      y: Number(r.info.size.y.toFixed(2)),
      z: Number(r.info.size.z.toFixed(2))
    }
  }));

  for (let i = 0; i < roots.length; i++) {
    for (let j = i + 1; j < roots.length; j++) {
      const a = roots[i];
      const b = roots[j];

      if (!a.obj.visible || !b.obj.visible) continue;
      if (!similarEnvironment(a, b)) continue;

      const keep = a.score >= b.score ? a : b;
      const kill = a.score >= b.score ? b : a;

      state.keptEnvironment = keep.name;
      hideTree(kill.obj, state, "phase279-remove-overlapping-second-lobby");
    }
  }
}

function handHistoryOrShowdown(obj){
  const t = textOf(obj);

  return has(t, [
    "hand_history",
    "hand history",
    "handhistory",
    "history hud",
    "previous hands",
    "last hands",
    "showdown",
    "poker showdown",
    "ranking",
    "winner",
    "winner hud",
    "sidepot",
    "side pot",
    "payout",
    "pot hud"
  ]);
}

function moveHandHistoryHigher(scene, state){
  if (!scene?.traverse) return;

  let i = 0;

  scene.traverse(obj => {
    if (!obj || obj.visible === false || !obj.position) return;
    if (!handHistoryOrShowdown(obj)) return;

    obj.position.set(-6.4, 5.85 + i * 0.26, -10.8);
    obj.rotation.set(0, 0.34, 0);

    if (!obj.userData.svrPhase279HistoryScaled) {
      obj.scale.multiplyScalar(0.95);
      obj.userData.svrPhase279HistoryScaled = true;
    }

    obj.userData.svrPhase279MovedHandHistoryHigher = true;
    state.movedHandHistory++;
    i++;
  });
}

function communityCard(obj){
  const t = textOf(obj);

  if (has(t, ["community_card", "community card", "board_card", "board card", "flop", "turn", "river"])) return true;
  if (has(t, ["card"]) && has(t, ["community", "board", "table"])) return true;

  return false;
}

function raiseCommunityCards(scene, state){
  if (!scene?.traverse) return;

  const cards = [];

  scene.traverse(obj => {
    if (!obj || obj.visible === false || !obj.position) return;
    if (communityCard(obj)) cards.push(obj);
  });

  cards.forEach((obj, i) => {
    obj.position.y = Math.max(obj.position.y + 0.22, 1.24);
    obj.position.z = obj.position.z - 0.045;

    if (!obj.userData.svrPhase279CommunityScaled) {
      obj.scale.multiplyScalar(1.38);
      obj.userData.svrPhase279CommunityScaled = true;
    }

    obj.userData.svrPhase279CommunityRaised = true;
    state.communityCardsMoved++;
  });
}

function clearSpawnView(scene, state){
  if (!scene?.traverse) return;

  scene.traverse(obj => {
    if (!obj || obj.visible === false || !obj.position) return;
    if (protectedGameplay(obj)) return;

    const t = textOf(obj);

    const clutter = has(t, [
      "hud",
      "status",
      "debug",
      "panel",
      "wall panel",
      "history",
      "showdown",
      "ranking",
      "winner",
      "phase273",
      "phase274",
      "phase275",
      "phase276",
      "phase277",
      "phase278"
    ]);

    if (!clutter) return;

    const inSpawnView =
      obj.position.x > -3.2 &&
      obj.position.x < 3.2 &&
      obj.position.y > 0.7 &&
      obj.position.y < 6.2 &&
      obj.position.z < -1.0 &&
      obj.position.z > -17.0;

    if (inSpawnView) {
      obj.position.x = obj.position.x < 0 ? -6.6 : 6.6;
      obj.position.y = Math.max(obj.position.y, 5.1);
      obj.position.z = -11.2;
      obj.userData.svrPhase279MovedOutOfSpawnView = true;
      state.clearedSpawnView++;
    }
  });

  if (typeof document !== "undefined") {
    const selectors = [
      "#svr-phase273-hud",
      "#svr-phase274-hud",
      "#svr-phase275-hud",
      "#svr-phase276-hud",
      "#svr-phase277-hud",
      "#svr-phase278-hud",
      "#svr-debug-hud",
      "#svr-status-hud",
      "#svr-hud",
      ".svr-hud",
      ".debug-hud"
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.left = "auto";
        el.style.right = "14px";
        el.style.top = "14px";
        el.style.bottom = "auto";
        el.style.opacity = "0.14";
        el.style.transform = "scale(0.68)";
        el.style.transformOrigin = "top right";
        el.style.pointerEvents = "none";
        el.dataset.svrPhase279Docked = "true";
        state.dockedDomHuds++;
      });
    });
  }
}

function floorLike(obj){
  if (!obj?.isMesh || obj.visible === false) return false;

  const t = textOf(obj);

  if (has(t, ["floor", "ground", "tile", "carpet", "lobby_floor"])) return true;

  const b = boxFor(obj);
  if (!b) return false;

  const flatLarge = b.size.x > 5 && b.size.z > 5 && b.size.y < 0.45;
  const lowInWorld = b.center.y > -0.4 && b.center.y < 1.0;

  return flatLarge && lowInWorld;
}

function stabilizeFloor(scene, state){
  if (!scene?.traverse) return;

  const floors = [];

  scene.traverse(obj => {
    if (!floorLike(obj)) return;
    floors.push({
      obj,
      info: boxFor(obj),
      score: scoreEnvironment(obj)
    });
  });

  const groups = new Map();

  floors.forEach(item => {
    if (!item.info) return;

    const y = Math.round(item.info.center.y * 100) / 100;
    const x = Math.round(item.info.size.x * 10) / 10;
    const z = Math.round(item.info.size.z * 10) / 10;
    const key = `${y}:${x}:${z}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  groups.forEach(items => {
    if (items.length <= 1) return;

    items.sort((a,b) => b.score - a.score);

    items.slice(1).forEach(item => {
      hideTree(item.obj, state, "phase279-remove-duplicate-floor-blink");
      state.hiddenDuplicateFloors++;
    });
  });

  floors.forEach((item, idx) => {
    const obj = item.obj;
    if (!obj.material || obj.visible === false) return;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];

    mats.forEach(mat => {
      if (!mat) return;

      mat.polygonOffset = true;
      mat.polygonOffsetFactor = 5 + idx * 0.05;
      mat.polygonOffsetUnits = 5 + idx * 0.05;
      mat.depthWrite = true;
      mat.needsUpdate = true;
    });

    obj.userData.svrPhase279FloorStable = true;
  });
}

function publish(state){
  state.updatedAt = new Date().toISOString();
  window.SVR_PHASE279_POKER_SPAWN_VIEW = state;
  window.SVR_BUILD_PHASE = 279;
  window.SVR_CACHE_TAG = CACHE_TAG;
}

export function installPhase279PokerSpawnViewFinalCleanup(options = {}){
  const state = {
    build: BUILD,
    cacheTag: CACHE_TAG,
    installedAt: new Date().toISOString(),
    checks: 0,
    sceneFound: false,
    hiddenCount: 0,
    hiddenNames: [],
    hiddenDuplicateFloors: 0,
    environmentRoots: [],
    keptEnvironment: "unknown",
    movedHandHistory: 0,
    communityCardsMoved: 0,
    clearedSpawnView: 0,
    dockedDomHuds: 0
  };

  function run(){
    const scene = options.scene || window.SVR_SCENE || window.scene || window.g_scene || null;

    state.checks++;
    state.sceneFound = !!scene;
    state.hiddenCount = 0;
    state.hiddenNames = [];
    state.hiddenDuplicateFloors = 0;
    state.environmentRoots = [];
    state.movedHandHistory = 0;
    state.communityCardsMoved = 0;
    state.clearedSpawnView = 0;
    state.dockedDomHuds = 0;

    if (scene) {
      removeDuplicateLobby(scene, state);
      removeOverlappingLobbyRoots(scene, state);
      moveHandHistoryHigher(scene, state);
      raiseCommunityCards(scene, state);
      clearSpawnView(scene, state);
      stabilizeFloor(scene, state);
    }

    publish(state);
    return state;
  }

  run();
  setTimeout(run, 250);
  setTimeout(run, 900);
  setTimeout(run, 2200);
  setTimeout(run, 5000);
  setTimeout(run, 10000);
  setTimeout(run, 16000);

  return state;
}

export default installPhase279PokerSpawnViewFinalCleanup;
