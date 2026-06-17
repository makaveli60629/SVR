const LABEL = "PHASE-285-LIVE-DEPLOY-AND-QUEST-QA-LOCK";
const QA_CHECKS = [
  "page-loaded",
  "canvas-present",
  "scene-present",
  "renderer-present",
  "pillar-lock-present",
  "moon-present",
  "mars-present"
];

function q(id){ return document.querySelector(id); }
function exists(obj){ return !!obj; }
function sceneObject(name){ return window.__SVR_SCENE__?.getObjectByName?.(name) || null; }
function countRearDoorObstructions(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return null;
  const centers = [-12,-6,0,6,12];
  let count = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "").toUpperCase();
    if (!n.includes("COLUMN") || !obj.position || obj.position.z > -10.8 || obj.visible === false) return;
    const x = Number(obj.position.x || 0);
    if (centers.some((c)=>Math.abs(x-c)<1.05)) count += 1;
  });
  return count;
}
function snapshot(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const pillarLock = window.SVR_PHASE284_PILLAR_OBSTRUCTION_SCAN_LOCK || window.SVR_PHASE283_PILLAR_MATRIX_APPLY_LOCK || window.SVR_PHASE281_PILLAR_FINAL_WALL_FLUSH_LOCK;
  const canvas = q("canvas");
  const moon = sceneObject("PHASE200_SINGLE_VISIBLE_MOON_LOCKED");
  const mars = sceneObject("PHASE200_SINGLE_VISIBLE_MARS_LOCKED");
  const result = {
    build: LABEL,
    active: true,
    siteTouched: false,
    checkedAt: new Date().toISOString(),
    url: String(location.href),
    title: String(document.title || ""),
    bodyBuild: String(document.body?.getAttribute("data-build") || ""),
    checks: {
      pageLoaded: document.readyState === "complete" || document.readyState === "interactive",
      canvasPresent: exists(canvas),
      scenePresent: exists(scene),
      rendererPresent: exists(renderer),
      pillarLockPresent: exists(pillarLock),
      moonPresent: exists(moon),
      marsPresent: exists(mars),
      rearDoorObstructionCount: countRearDoorObstructions()
    },
    scene: {
      objectCount: scene?.children?.length ?? null,
      moonPosition: moon ? [moon.position.x, moon.position.y, moon.position.z] : null,
      marsPosition: mars ? [mars.position.x, mars.position.y, mars.position.z] : null
    },
    expectedManualQuestChecks: [
      "rear pillars clear storefront signs",
      "teleport ray aims forward",
      "forward stick follows headset direction",
      "moon and mars visible high in sky",
      "no old Trueitive or old lobby content"
    ]
  };
  window.SVR_PHASE285_LIVE_DEPLOY_AND_QUEST_QA_LOCK = result;
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  try { document.body?.setAttribute("data-qa-build", LABEL); } catch {}
  return result;
}
function install(){
  const snap = snapshot();
  const status = document.getElementById("status");
  if (status) status.textContent = `QA armed. ${LABEL}`;
  console.info("[SVR QA]", snap);
  return snap;
}
install();
[500,1200,2400,4800,8000,12000,18000,24000].forEach((delay)=>setTimeout(install, delay));
