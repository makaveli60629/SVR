import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-3F-PORTAL-ROUTE-AUDIT-CLEANUP";

const ROUTE_MAP = {
  reikiRoom: "./reiki.html?v=route-audit-13f",
  reikiTalk: "./reiki.html?mode=hologram&v=route-audit-13f",
  pgaDrive: "./pga.html?v=route-audit-13f",
  chipPutt: "./pga.html?mode=chip-putt&v=route-audit-13f",
  vrStore: "./site/store.html?v=route-audit-13f",
  smokerLounge: "./site/lounge.html?v=route-audit-13f",
  scorpionRoom: "./scorpion.html?v=route-audit-13f"
};

const LOCAL_ALIASES = {
  scorpionRoom: "scorpion",
  scorpion: "scorpion",
  store: "vrStore",
  svrStore: "vrStore",
  reikiForest: "reikiRoom",
  trainingForest: "reikiRoom",
  privateReiki: "reikiRoom"
};

function hideByName(scene, re) {
  let count = 0;
  const list = [];
  scene.traverse((obj) => {
    if (!obj || obj === scene) return;
    const n = String(obj.name || "");
    if (re.test(n)) list.push(obj);
  });
  list.forEach((obj) => {
    obj.visible = false;
    obj.traverse?.((child) => { child.visible = false; count++; });
    count++;
  });
  return count;
}

function cleanDuplicateSky(scene) {
  const hiddenPhase101 = hideByName(scene, /SVR_PHASE101_HIGH_MOON_MARS_SHOWCASE_LOCK|SVR_PHASE101_HIGH_TEXTURED_MOON|SVR_PHASE101_HIGH_TEXTURED_MARS/i);
  const highSky = scene.getObjectByName("SVR_PHASE121_HIGH_SKY_LOCK");
  if (highSky) highSky.visible = true;
  return { hiddenPhase101, highSkyPresent: !!highSky };
}

function ensureButtons() {
  const nav = document.getElementById("sceneNav");
  if (!nav) return [];
  const defs = [
    ["lobby", "Lobby"], ["seat", "Seat"], ["reiki", "Reiki"], ["reikiRoom", "Reiki Room"], ["reikiTalk", "Reiki Talk"],
    ["pgaDrive", "PGA Drive"], ["chipPutt", "Chip/Putt"], ["vrStore", "VR Store"], ["scorpion", "Scorpion"], ["scorpionRoom", "Scorpion Room"]
  ];
  const added = [];
  defs.forEach(([key, label]) => {
    if (nav.querySelector(`[data-scene="${key}"]`)) return;
    const b = document.createElement("button");
    b.className = "scene-btn";
    b.dataset.scene = key;
    b.textContent = label;
    nav.appendChild(b);
    added.push(key);
  });
  return added;
}

function installRouteInterceptor() {
  if (window.SVR_PORTAL_ROUTE_AUDIT_INTERCEPTOR) return false;
  window.SVR_PORTAL_ROUTE_AUDIT_INTERCEPTOR = true;
  document.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("#sceneNav .scene-btn");
    if (!btn) return;
    const key = btn.dataset.scene;
    const alias = LOCAL_ALIASES[key] || key;
    if (ROUTE_MAP[key] && !["scorpionRoom"].includes(key)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.href = ROUTE_MAP[key];
      return;
    }
    if (key !== alias) {
      const localBtn = document.querySelector(`#sceneNav .scene-btn[data-scene="${alias}"]`);
      if (localBtn && localBtn !== btn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        localBtn.click();
      }
    }
  }, true);
  return true;
}

function patchPortalCardActivators(scene) {
  let patched = 0;
  scene.traverse((obj) => {
    const n = String(obj.name || "");
    if (!/SVR_PORTAL_BUTTON_|SVR_UPDATE3_PORTAL_/i.test(n)) return;
    const keyMatch = n.match(/_(reikiRoom|reikiTalk|pgaDrive|chipPutt|vrStore|smokerLounge|scorpionRoom|scorpion|reiki|pga|sponsor|legends|table|seat)\b/i);
    const key = keyMatch?.[1];
    if (!key) return;
    obj.userData.activate = () => {
      const alias = LOCAL_ALIASES[key] || key;
      if (ROUTE_MAP[key] && !["scorpionRoom"].includes(key)) { window.location.href = ROUTE_MAP[key]; return true; }
      const btn = document.querySelector(`#sceneNav .scene-btn[data-scene="${alias}"]`);
      if (btn) { btn.click(); return true; }
      return false;
    };
    patched++;
  });
  return patched;
}

function addAuditBadge(scene) {
  if (scene.getObjectByName("SVR_PORTAL_ROUTE_AUDIT_BADGE_13F")) return null;
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 260;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(0,8,12,.90)";
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(120,255,186,.88)";
  x.lineWidth = 8;
  x.strokeRect(14,14,c.width-28,c.height-28);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#eafff4";
  x.font = "900 44px system-ui,Arial";
  x.fillText("PORTAL ROUTES AUDITED", c.width/2, 86, c.width-80);
  x.fillStyle = "#baffd0";
  x.font = "800 27px system-ui,Arial";
  x.fillText("broken scene buttons rerouted • duplicate sky fallback hidden", c.width/2, 160, c.width-80);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .98), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  badge.name = "SVR_PORTAL_ROUTE_AUDIT_BADGE_13F";
  badge.position.set(0, 3.75, 6.8);
  badge.lookAt(0, 3.75, 0);
  badge.renderOrder = 700;
  scene.add(badge);
  return badge;
}

export function applyPortalRouteAuditCleanup13(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PORTAL_ROUTE_AUDIT_CLEANUP_13_LOCK")) return null;
  const lock = new THREE.Group();
  lock.name = "SVR_PORTAL_ROUTE_AUDIT_CLEANUP_13_LOCK";
  scene.add(lock);

  const sky = cleanDuplicateSky(scene);
  const buttonsAdded = ensureButtons();
  const interceptorInstalled = installRouteInterceptor();
  const patchedPortals = patchPortalCardActivators(scene);
  addAuditBadge(scene);

  window.SVR_PORTAL_ROUTE_AUDIT_CLEANUP_13 = {
    build: BUILD,
    sky,
    buttonsAdded,
    interceptorInstalled,
    patchedPortals,
    routeMap: ROUTE_MAP,
    localAliases: LOCAL_ALIASES
  };
  scene.userData.SVR_PORTAL_ROUTE_AUDIT_CLEANUP_13 = window.SVR_PORTAL_ROUTE_AUDIT_CLEANUP_13;
  log?.("Portal route audit cleanup 1.3F loaded", window.SVR_PORTAL_ROUTE_AUDIT_CLEANUP_13);
  return lock;
}
