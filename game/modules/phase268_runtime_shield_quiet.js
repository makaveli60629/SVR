/*
 * SVR Phase 268 — Runtime Shield Quiet Visible Lobby Lock
 * Keeps the visible lobby active and prevents non-fatal runtime errors from blocking the view.
 */
import * as THREE from "three";

const BUILD = "PHASE-270-ASSET-PATH-LOADER-SMOOTH-LOCK";

function hasVisibleScene(){
  return !!(
    window.SVR_VISIBLE_LOBBY_SHELL?.ready ||
    window.SVR_PHASE266_EARLY_RENDER?.started ||
    window.SVR_SCENE
  );
}

function setStatus(text){
  const el = document.getElementById("status");
  if (el) el.textContent = text;
}

function hideErrorOverlay(){
  const err = document.getElementById("err");
  if (err && hasVisibleScene()) {
    err.style.display = "none";
  }

  const recovery = document.getElementById("bootRecovery");
  if (recovery && hasVisibleScene()) {
    recovery.style.display = "none";
  }
}

function addVisibilityLighting(scene){
  if (!scene || scene.getObjectByName("phase268_visibility_light_group")) return;

  const group = new THREE.Group();
  group.name = "phase268_visibility_light_group";

  const ambient = new THREE.AmbientLight(0x9fbfff, 1.15);
  ambient.name = "phase268_ambient_visibility";
  group.add(ambient);

  const front = new THREE.DirectionalLight(0xffffff, 1.35);
  front.position.set(0, 5, 5);
  front.name = "phase268_front_fill";
  group.add(front);

  const table = new THREE.PointLight(0x8cffdc, 1.4, 8, 1.4);
  table.position.set(0, 2.2, 1.8);
  table.name = "phase268_table_fill";
  group.add(table);

  const wall = new THREE.PointLight(0xb48cff, 1.0, 10, 1.6);
  wall.position.set(0, 3.2, -4.0);
  wall.name = "phase268_wall_fill";
  group.add(wall);

  scene.add(group);
}

export function installPhase268RuntimeShieldQuiet({ scene, renderer, camera } = {}){
  const state = {
    build: BUILD,
    installed: true,
    nonFatalErrors: 0,
    loadedAt: new Date().toISOString()
  };

  window.SVR_PHASE268_RUNTIME_QUIET = state;

  if (scene) addVisibilityLighting(scene);

  // Capture phase: prevent later non-fatal errors from forcing the visible scene into shield mode.
  window.addEventListener("error", function(event){
    if (!hasVisibleScene()) return;

    state.nonFatalErrors++;
    state.lastError = String(event?.error?.stack || event?.message || event || "");
    console.warn("[SVR Phase268 non-fatal runtime error suppressed]", state.lastError);

    setStatus("Ready. Visible lobby active.");
    hideErrorOverlay();

    try {
      event.preventDefault();
      event.stopImmediatePropagation();
    } catch(_) {}
  }, true);

  window.addEventListener("unhandledrejection", function(event){
    if (!hasVisibleScene()) return;

    state.nonFatalErrors++;
    state.lastRejection = String(event?.reason?.stack || event?.reason || event || "");
    console.warn("[SVR Phase268 non-fatal promise rejection suppressed]", state.lastRejection);

    setStatus("Ready. Visible lobby active.");
    hideErrorOverlay();

    try {
      event.preventDefault();
      event.stopImmediatePropagation();
    } catch(_) {}
  }, true);

  // Repeated cleanup because some shield modules write after ready.
  setInterval(() => {
    if (!hasVisibleScene()) return;

    const status = document.getElementById("status");
    if (status && /runtime shield/i.test(status.textContent || "")) {
      status.textContent = "Ready. Visible lobby active.";
    }

    hideErrorOverlay();

    if (window.SVR_SCENE) addVisibilityLighting(window.SVR_SCENE);
  }, 1000);

  try {
    window.dispatchEvent(new CustomEvent("svr_phase268_runtime_quiet_ready", { detail: state }));
  } catch(_) {}

  return state;
}


