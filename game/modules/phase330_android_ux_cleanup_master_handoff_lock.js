import * as THREE from "three";

const BUILD = "PHASE-330-ANDROID-UX-CLEANUP-AND-MASTER-HANDOFF-LOCK";
const params = new URLSearchParams(location.search);
const ua = navigator.userAgent || "";
const isQuest = /Quest|Oculus|Meta Quest/i.test(ua);
const isAndroid = (/Android/i.test(ua) && !isQuest) || /\/game\/android\.html$/i.test(location.pathname) || params.get("channel") === "stable";
const isDirector = window.self !== window.top || params.has("preview") || params.has("embed") || params.get("cam") === "director" || params.has("autocam");

const TABLE_PRIORITY = [
  "PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED",
  "PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT",
  "PHASE326_ANDROID_TABLE_FALLBACK"
];

const LEGACY_CONTROL_SELECTORS = [
  "#svrAndroidGamePad",
  "#svrTapMovePanel",
  "#svrAndroidSafeBadge153",
  "#svrAndroidLiteHud",
  "#svrAndroidRecoverView"
];

const PREVIEW_DOM_SELECTORS = [
  "#hud",
  "#sceneNav",
  "#log",
  "#err",
  "#safeStage",
  "#bootFallback",
  "#svrPhaseBadge",
  ".phase-label",
  "#svr326Root",
  "#svrAndroidGamePad",
  "#svr327ReleaseBadge",
  "#svr329Info",
  "#svr329QA",
  "#svr329Toast",
  "#svr328PreviewBadge"
];

let installed = false;
let observer = null;
let enforceTimer = 0;
let monitorTimer = 0;
let wasSeated = false;
let lastSeatSignature = "";

function scene() {
  return window.__SVR_SCENE__ || null;
}

function camera() {
  return window.__SVR_RENDERER__?.xr?.isPresenting
    ? window.__SVR_RENDERER__.xr.getCamera(window.__SVR_CAMERA__)
    : window.__SVR_CAMERA__;
}

function rig() {
  return window.SVR_TELEPORT_RIG_REF || window.SVR_TELEPORT_RIG || null;
}

function worldRoot() {
  const value = scene();
  return value?.getObjectByName?.("PHASE200_ORDERED_GRAND_LOBBY_ROOT") || value;
}

function allTableCandidates() {
  const root = worldRoot();
  if (!root) return [];
  const values = [];
  for (const name of TABLE_PRIORITY) {
    const object = root.getObjectByName?.(name);
    if (object && !values.includes(object)) values.push(object);
  }
  return values;
}

function topLevelTableAuthorities() {
  const candidates = allTableCandidates();
  return candidates.filter((candidate) => {
    let parent = candidate.parent;
    while (parent) {
      if (candidates.includes(parent)) return false;
      parent = parent.parent;
    }
    return true;
  });
}

function enforceTableAuthority() {
  const roots = topLevelTableAuthorities();
  if (!roots.length) return { count: 0, authority: null, suppressed: [] };
  const authority = roots[0];
  authority.visible = true;
  const suppressed = [];
  for (const extra of roots.slice(1)) {
    extra.visible = false;
    extra.userData = { ...extra.userData, svrPhase330Suppressed: true };
    suppressed.push(extra.name || extra.uuid);
  }
  return {
    count: roots.length,
    authority: authority.name || authority.uuid,
    suppressed
  };
}

function tableBox() {
  const authority = topLevelTableAuthorities()[0] || allTableCandidates()[0];
  if (!authority) return null;
  authority.visible = true;
  authority.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(authority);
  if (box.isEmpty()) return null;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  return { object: authority, box, center, size, top: box.max.y };
}

function visible(element) {
  if (!element || !element.isConnected) return false;
  const style = getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0;
}

function enforceOneControlSet() {
  for (const selector of LEGACY_CONTROL_SELECTORS) {
    document.querySelectorAll(selector).forEach((element) => element.remove());
  }

  const roots = [...document.querySelectorAll("#svr326Root")];
  roots.slice(1).forEach((element) => element.remove());

  const sticks = [...document.querySelectorAll(".svr-stick")];
  for (const stick of sticks) {
    if (stick.id !== "svr326Move" && stick.id !== "svr326Look") stick.remove();
  }

  const rootCount = document.querySelectorAll("#svr326Root").length;
  const moveCount = document.querySelectorAll("#svr326Move").length;
  const lookCount = document.querySelectorAll("#svr326Look").length;
  const totalVisibleControlRoots = [...document.querySelectorAll("#svr326Root,#svrAndroidGamePad,#svrTapMovePanel,#svrAndroidLiteHud")].filter(visible).length;

  return {
    rootCount,
    moveCount,
    lookCount,
    totalVisibleControlRoots,
    oneControlSet: rootCount === 1 && moveCount === 1 && lookCount === 1 && totalVisibleControlRoots === 1
  };
}

function installCss() {
  if (document.getElementById("svr-phase330-style")) return;
  const style = document.createElement("style");
  style.id = "svr-phase330-style";
  style.textContent = `
    body.svr-phase330-android #svr329Info,
    body.svr-phase330-android #svr329QA,
    body.svr-phase330-android #svr327ReleaseBadge { display:none!important; }

    body.svr-phase330-android #svr326Cards {
      left:auto!important;
      right:14px!important;
      bottom:352px!important;
      transform:none!important;
      width:177px!important;
      min-height:78px!important;
      justify-content:center!important;
      padding:7px 8px!important;
      gap:6px!important;
      background:rgba(0,0,0,.70)!important;
    }

    body.svr-phase330-android #svr326Cards > span {
      position:absolute!important;
      top:-22px!important;
      right:0!important;
      font-size:10px!important;
      letter-spacing:.08em!important;
    }

    body.svr-phase330-android .svr326Card {
      width:43px!important;
      height:61px!important;
      font-size:19px!important;
    }

    body.svr-phase330-android .svr326Actions {
      right:14px!important;
      bottom:180px!important;
    }

    body.svr-phase330-android #svr326Turn {
      top:max(12px,env(safe-area-inset-top))!important;
      max-width:72vw!important;
      white-space:nowrap!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
    }

    body.svr-phase330-director #hud,
    body.svr-phase330-director #sceneNav,
    body.svr-phase330-director #log,
    body.svr-phase330-director #err,
    body.svr-phase330-director #safeStage,
    body.svr-phase330-director #bootFallback,
    body.svr-phase330-director #svrPhaseBadge,
    body.svr-phase330-director .phase-label,
    body.svr-phase330-director #svr326Root,
    body.svr-phase330-director #svrAndroidGamePad,
    body.svr-phase330-director #svr327ReleaseBadge,
    body.svr-phase330-director #svr329Info,
    body.svr-phase330-director #svr329QA,
    body.svr-phase330-director #svr329Toast,
    body.svr-phase330-director #svr328PreviewBadge {
      display:none!important;
      visibility:hidden!important;
      opacity:0!important;
      pointer-events:none!important;
    }

    @media (max-width:760px) {
      body.svr-phase330-android #svr326Cards { bottom:348px!important; }
      body.svr-phase330-android #svr326Move,
      body.svr-phase330-android #svr326Look { width:116px!important; height:116px!important; }
      body.svr-phase330-android #svr326Move { left:16px!important; }
      body.svr-phase330-android #svr326Look { right:16px!important; }
    }
  `;
  document.head.appendChild(style);
}

function alignSeatedView(force = false) {
  const state = window.SVR_PHASE329_ANDROID_UX_STATE?.state || window.SVR_PHASE326_ANDROID_PLAY_STATE || {};
  if (!state.seated) {
    wasSeated = false;
    lastSeatSignature = "";
    return false;
  }

  const table = tableBox();
  if (!table) return false;
  const signature = [
    table.object.uuid,
    table.center.x.toFixed(3),
    table.center.z.toFixed(3),
    table.size.x.toFixed(3),
    table.size.z.toFixed(3)
  ].join(":");
  if (!force && wasSeated && signature === lastSeatSignature) return true;

  const x = table.center.x;
  const z = table.center.z + Math.max(2.12, table.size.z * 0.78);
  const targetY = table.top + 0.18;
  const activeRig = rig();
  const activeCamera = camera();

  try {
    if (activeRig?.setPlayerPose) activeRig.setPlayerPose(x, 0, z);
    else if (activeCamera) activeCamera.position.set(x, 1.55, z);
    activeCamera?.lookAt?.(table.center.x, targetY, table.center.z);
  } catch (error) {
    window.SVR_PHASE330_LAST_SEAT_ERROR = String(error?.message || error);
    return false;
  }

  wasSeated = true;
  lastSeatSignature = signature;
  return true;
}

function hideDirectorSceneOverlays() {
  const currentScene = scene();
  if (!currentScene) return 0;
  const block = /(HUD|STATUS|BADGE|HITBOX|RAYCAST|FEEDBACK|TIMER|PANEL|MARKER|ANDROID.*ROOT|CONTROL|DEBUG|PHASE.*LABEL)/i;
  let hidden = 0;
  currentScene.traverse((object) => {
    const name = String(object.name || "");
    if (!name || !block.test(name)) return;
    if (/TABLE|CARD|CHIP|POT|FELT|LOGO/i.test(name)) return;
    if (object.visible) hidden += 1;
    object.visible = false;
  });
  return hidden;
}

function visibleDirectorDomOverlays() {
  const values = [];
  for (const selector of PREVIEW_DOM_SELECTORS) {
    document.querySelectorAll(selector).forEach((element) => {
      if (visible(element)) values.push(selector);
    });
  }
  return [...new Set(values)];
}

function visibleDirectorSceneOverlays() {
  const currentScene = scene();
  if (!currentScene) return [];
  const block = /(HUD|STATUS|BADGE|HITBOX|RAYCAST|FEEDBACK|TIMER|PANEL|MARKER|ANDROID.*ROOT|CONTROL|DEBUG|PHASE.*LABEL)/i;
  const values = [];
  currentScene.traverse((object) => {
    const name = String(object.name || "");
    if (!name || !object.visible || !block.test(name)) return;
    if (/TABLE|CARD|CHIP|POT|FELT|LOGO/i.test(name)) return;
    values.push(name);
  });
  return values;
}

function sanitizeDirector() {
  for (const selector of PREVIEW_DOM_SELECTORS) {
    document.querySelectorAll(selector).forEach((element) => {
      if (selector === "#svr328PreviewBadge") element.remove();
    });
  }
  const hiddenScene = hideDirectorSceneOverlays();
  return { hiddenScene };
}

function androidQa() {
  const controls = enforceOneControlSet();
  const tables = enforceTableAuthority();
  const release = window.SVR_ANDROID_APK_RELEASE_POLICY || window.SVR_APK_UPDATE_POLICY || window.SVR_ANDROID_RELEASE_CANDIDATE || {};
  const cardTrayCount = document.querySelectorAll("#svr326Cards").length;
  const result = {
    build: BUILD,
    active: isAndroid,
    controls,
    tables,
    cardTrayCount,
    cardTrayNearActions: cardTrayCount === 1,
    seatedAligned: alignSeatedView(false),
    releasePolicy: {
      apkVersionName: release.apkVersionName || release.currentVersionName || "0.1.0-rc1",
      apkVersionCode: release.apkVersionCode || release.currentVersionCode || 1,
      forceUpdate: false,
      showUpdatePrompt: false,
      webEntry: release.webEntry || release.stableWebEntry || "/game/android.html?channel=stable"
    },
    workflow: {
      path: ".github/workflows/deploy.yml",
      trigger: "push to main",
      updateMarker: "game/docs/UPDATE_3_1_AUTO_DEPLOY_MARKER.md"
    },
    checkedAt: new Date().toISOString()
  };
  result.pass = controls.oneControlSet && tables.count <= 1 && cardTrayCount === 1 && result.releasePolicy.forceUpdate === false && result.releasePolicy.showUpdatePrompt === false;
  window.SVR_PHASE330_ANDROID_UX_STATE = result;
  return result;
}

function previewQa() {
  sanitizeDirector();
  const domOverlays = visibleDirectorDomOverlays();
  const sceneOverlays = visibleDirectorSceneOverlays();
  const controls = [...document.querySelectorAll("#svr326Root,#svrAndroidGamePad,#svrTapMovePanel,.svr-stick")].filter(visible).length;
  const tables = enforceTableAuthority();
  const result = {
    build: BUILD,
    active: isDirector,
    domOverlayCount: domOverlays.length,
    sceneOverlayCount: sceneOverlays.length,
    overlayCount: domOverlays.length + sceneOverlays.length,
    androidControlCount: controls,
    tableAuthorityCount: tables.count,
    domOverlays,
    sceneOverlays,
    pass: domOverlays.length === 0 && sceneOverlays.length === 0 && controls === 0 && tables.count <= 1,
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE330_DIRECTOR_PREVIEW_STATE = result;
  return result;
}

function enforce() {
  if (isAndroid) {
    enforceOneControlSet();
    enforceTableAuthority();
    alignSeatedView(false);
  }
  if (isDirector) sanitizeDirector();
}

function scheduleEnforce() {
  clearTimeout(enforceTimer);
  enforceTimer = setTimeout(enforce, 80);
}

function install() {
  if (installed || (!isAndroid && !isDirector)) return;
  installed = true;
  installCss();

  if (isAndroid) {
    document.body.classList.add("svr-phase330-android");
    window.SVR_ANDROID_APK_RELEASE_POLICY = {
      apkVersionName: "0.1.0-rc1",
      apkVersionCode: 1,
      forceUpdate: false,
      showUpdatePrompt: false,
      webEntry: "/game/android.html?channel=stable",
      build: BUILD
    };
    const previousSit = window.SVR_ANDROID_SIT_TO_TABLE;
    if (typeof previousSit === "function" && !previousSit.__svrPhase330Wrapped) {
      const wrapped = (...args) => {
        const result = previousSit(...args);
        setTimeout(() => alignSeatedView(true), 40);
        return result;
      };
      wrapped.__svrPhase330Wrapped = true;
      window.SVR_ANDROID_SIT_TO_TABLE = wrapped;
    }
  }

  if (isDirector) document.body.classList.add("svr-phase330-director");

  observer = new MutationObserver(scheduleEnforce);
  observer.observe(document.body, { childList: true, subtree: true });
  enforce();

  clearInterval(monitorTimer);
  monitorTimer = setInterval(() => {
    if (isAndroid) androidQa();
    if (isDirector) previewQa();
  }, 1800);

  window.SVR_PHASE330_ANDROID_QA = androidQa;
  window.SVR_ANDROID_MASTER_QA = androidQa;
  window.SVR_DIRECTOR_PREVIEW_QA = previewQa;
  window.SVR_PHASE330_MASTER_STATE = {
    build: BUILD,
    android: isAndroid,
    director: isDirector,
    siteTouched: false,
    sponsorContentTouched: false,
    apkPolicyLocked: true,
    tableAssetAuthorityLocked: true,
    installedAt: new Date().toISOString()
  };

  setTimeout(() => {
    if (isAndroid) androidQa();
    if (isDirector) previewQa();
  }, 650);
}

setTimeout(install, 160);
setTimeout(install, 850);
