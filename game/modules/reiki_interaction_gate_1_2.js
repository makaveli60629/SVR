import * as THREE from "three";
import { applyEspressoDailyCashStore12 } from "./espresso_daily_cash_store_1_2.js";
import { applyReikiSymbolsPlaceholder12 } from "./reiki_symbols_placeholder_1_2.js";
import { applyPortalRouteAuditCleanup13 } from "./portal_route_audit_cleanup_1_3.js";

const BUILD = "LOBBY-ORG-1-4E-REIKI-VIDEO-AUDIO-OPEN";

function makePanelTexture(title, lines) {
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 300;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#04110b");
  g.addColorStop(1, "#05261a");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = "rgba(54,255,136,.88)";
  x.lineWidth = 8;
  x.strokeRect(18, 18, c.width - 36, c.height - 36);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(54,255,136,.55)";
  x.shadowBlur = 14;
  x.fillStyle = "#ffffff";
  x.font = "900 46px system-ui,Arial";
  x.fillText(title, c.width / 2, 80, c.width - 70);
  x.shadowBlur = 4;
  x.fillStyle = "#dffff0";
  x.font = "800 28px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, 155 + i * 44, c.width - 80));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function getVideo() {
  return window.SVR_REIKI_HOLOGRAM_VIDEO?.element || document.getElementById("svr-reiki-hologram-video");
}

function stopVideo(reset = false) {
  const video = getVideo();
  if (!video) return false;
  video.muted = true;
  video.volume = 0;
  video.pause?.();
  if (reset) {
    try { video.currentTime = 0; } catch (_) {}
  }
  window.SVR_REIKI_VIDEO_STATE = "off";
  return true;
}

function playVideoWithOpenAudio() {
  const video = getVideo();
  if (!video) return false;
  video.preload = "auto";
  video.muted = false;
  video.defaultMuted = false;
  video.volume = 1.0;
  video.playsInline = true;
  const p = video.play?.();
  if (p?.catch) {
    p.catch(() => {
      video.muted = false;
      video.volume = 1.0;
      window.SVR_REIKI_VIDEO_STATE = "audio-blocked-needs-user-action";
    });
  }
  window.SVR_REIKI_VIDEO_STATE = "playing-audio-open-volume-1";
  window.SVR_REIKI_VIDEO_VOLUME_LOCK = { muted: video.muted, volume: video.volume, build: BUILD };
  return true;
}

export function applyReikiInteractionGate12(scene, { log = console.log } = {}) {
  applyEspressoDailyCashStore12?.(scene, { log });
  applyReikiSymbolsPlaceholder12?.(scene, { log });
  applyPortalRouteAuditCleanup13?.(scene, { log });
  const root = scene?.getObjectByName("SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK");
  if (!root || root.getObjectByName("SVR_REIKI_INTERACTION_GATE_12_LOCK")) return null;

  const lock = new THREE.Group();
  lock.name = "SVR_REIKI_INTERACTION_GATE_12_LOCK";
  root.add(lock);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.08, 1.25, 96),
    new THREE.MeshBasicMaterial({ color: 0x36ff88, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
  );
  ring.name = "SVR_REIKI_GREEN_INTERACTION_RING";
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.09, -1.18);
  ring.renderOrder = 390;
  lock.add(ring);

  const hint = new THREE.Mesh(
    new THREE.PlaneGeometry(2.55, 0.72),
    new THREE.MeshBasicMaterial({ map: makePanelTexture("INTERACTION ZONE", ["stand here", "slide/action controls appear"]), transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })
  );
  hint.name = "SVR_REIKI_GREEN_INTERACTION_HINT";
  hint.position.set(0, 0.76, -1.2);
  hint.renderOrder = 391;
  lock.add(hint);

  stopVideo(true);

  const camPos = new THREE.Vector3();
  const local = new THREE.Vector3();
  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this, args);
    const cam = scene.userData?._camera || window.SVR_CAMERA || window.SVR_MAIN_CAMERA;
    if (cam?.getWorldPosition) {
      cam.getWorldPosition(camPos);
      local.copy(root.worldToLocal(camPos.clone()));
      const dx = local.x - ring.position.x;
      const dz = local.z - ring.position.z;
      window.SVR_REIKI_INTERACTION_ACTIVE = Math.hypot(dx, dz) < 2.35;
    } else {
      window.SVR_REIKI_INTERACTION_ACTIVE = false;
    }

    ring.rotation.z += 0.0017;
    ring.material.opacity = window.SVR_REIKI_INTERACTION_ACTIVE ? 0.58 : 0.28;
    hint.visible = !!window.SVR_REIKI_INTERACTION_ACTIVE;

    const activeCard = window.SVR_REIKI_CAROUSEL_12_ACTIVE?.card || window.SVR_RICI_UPDATE_101_CAROUSEL?.getActiveCard?.();
    if (!activeCard || activeCard.type !== "video") stopVideo(false);
    else playVideoWithOpenAudio();
  };

  window.SVR_REIKI_INTERACTION_GATE_12 = {
    build: BUILD,
    activeFlag: "SVR_REIKI_INTERACTION_ACTIVE",
    videoOnlyOnCard: true,
    androidControlsGate: true,
    videoAudioOpen: true,
    videoVolume: 1.0,
    espressoBridge: !!window.SVR_ESPRESSO_DAILY_CASH_STORE_12,
    symbolsBridge: !!window.SVR_REIKI_SYMBOLS_PLACEHOLDER_12,
    portalRouteAuditBridge: !!window.SVR_PORTAL_ROUTE_AUDIT_CLEANUP_13
  };
  log?.("Reiki interaction gate audio-open loaded", window.SVR_REIKI_INTERACTION_GATE_12);
  return lock;
}