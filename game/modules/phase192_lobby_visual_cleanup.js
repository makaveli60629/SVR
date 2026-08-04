import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-192-LOBBY-VISUAL-CLEANUP-LOCK";

function canvasTexture(title, line1, line2, accent = "#7ffcff"){
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 520;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#050713");
  g.addColorStop(1, "#11051d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 14;
  ctx.strokeRect(30, 30, c.width - 60, c.height - 60);
  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.fillRect(68, 72, c.width - 136, 84);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = accent;
  ctx.font = "900 66px system-ui, Arial";
  ctx.fillText(title, c.width / 2, 118);
  ctx.fillStyle = "#fff";
  ctx.font = "800 40px system-ui, Arial";
  ctx.fillText(line1, c.width / 2, 270);
  ctx.fillStyle = "#dffcff";
  ctx.font = "700 30px system-ui, Arial";
  ctx.fillText(line2, c.width / 2, 368);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function addCleanPanel(root, name, title, line1, line2, x, z, y, rotY, accent){
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 2.05, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x10121f, roughness: 0.72, metalness: 0.06, emissive: 0x030512, emissiveIntensity: 0.18 })
  );
  frame.name = `${name}_FRAME`;
  frame.position.set(x, y, z);
  frame.rotation.y = rotY;
  root.add(frame);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(4.05, 1.72),
    new THREE.MeshBasicMaterial({ map: canvasTexture(title, line1, line2, accent), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  panel.name = name;
  panel.position.set(x, y + 0.03, z + Math.cos(rotY) * 0.09);
  panel.rotation.y = rotY;
  panel.renderOrder = 60;
  root.add(panel);
  return panel;
}

function hideClutter(scene){
  let hidden = 0;
  const hidePatterns = [
    /PHASE185_TALL_CURVED_ROMAN_WALL/i,
    /PHASE185_BLUE_GOLD_VERTICAL_BANNER/i,
    /PHASE185_UPPER_STOREFRONT_WALKWAY_RING/i,
    /PHASE185_ROMAN_BALCONY_BANISTER_RING/i,
    /PHASE185_UPPER_GOLD_CORNICE_RING/i,
    /PHASE185_CENTER_GOLD_SPECTATOR_RAIL/i,
    /PHASE185_RECESSED_PLAY_GAME_STAGE/i,
    /PHASE188_/i,
    /PHASE189_HARD_VISIBLE_SECOND_FLOOR/i,
    /PHASE189_HARD_SECOND_FLOOR/i,
    /PHASE189_REAL_STAIR/i,
    /PHASE189_UPPER_FLOOR/i,
    /PHASE189_UPPER_STORE/i,
    /PHASE189_ACCESS_PAD/i,
    /PHASE179_CENTERPIECE/i,
    /PHASE183_ROMAN_MEZZANINE/i,
    /PHASE184_LOBBY_EXPERIENCE/i
  ];

  scene.traverse(obj=>{
    const name = String(obj?.name || "");
    if (hidePatterns.some(rx=>rx.test(name))){
      if (obj.visible !== false) hidden++;
      obj.visible = false;
      obj.userData.svrPhase192HiddenClutter = true;
    }
  });
  return hidden;
}

function tuneLightingAndFloor(scene){
  let tuned = 0;
  scene.traverse(obj=>{
    const name = String(obj?.name || "");
    if (name === "PHASE185_OFFICIAL_POLISHED_MARBLE_FLOOR" && obj.material){
      obj.material.color?.setHex?.(0x11131d);
      if ("emissiveIntensity" in obj.material) obj.material.emissiveIntensity = 0.08;
      obj.material.roughness = 0.72;
      obj.material.metalness = 0.05;
      tuned++;
    }
    if (/PHASE185_WARM_ARCH_LIGHT|PHASE185_SOFT_LOBBY_HEMISPHERE|PHASE185_OFFICIAL_MOONLIGHT/i.test(name) && obj.isLight){
      obj.intensity = Math.min(obj.intensity || 0.35, 0.28);
      tuned++;
    }
  });
  return tuned;
}

function removeUnsupportedButtonText(){
  document.querySelectorAll("button, a, div").forEach(el=>{
    const text = (el.textContent || "").trim().toUpperCase();
    if (text === "VR NOT SUPPORTED"){
      el.textContent = "DESKTOP PREVIEW";
      el.style.opacity = "0.42";
      el.style.pointerEvents = "none";
      el.style.fontSize = "10px";
      el.style.padding = "5px 9px";
      el.style.bottom = "48px";
    }
  });
}

function compactHud(){
  document.body.classList.add("phase192-clean-view");
  const styleId = "phase192-clean-view-style";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    body.phase192-clean-view #hud{top:8px;left:8px;right:8px;justify-content:flex-end;gap:6px;opacity:.64;transform:scale(.88);transform-origin:top right;}
    body.phase192-clean-view #status{position:fixed;left:8px;top:8px;max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    body.phase192-clean-view #toggleLog,body.phase192-clean-view #toggleJoints{display:none!important;}
    body.phase192-clean-view #hud .pill{font-size:10px;padding:5px 8px;}
    body.phase192-clean-view #sceneNav{bottom:8px;gap:5px;opacity:.70;transform:scale(.82);transform-origin:bottom center;}
    body.phase192-clean-view #sceneNav .scene-btn{font-size:10px;padding:6px 9px;}
    body.phase192-clean-view .svr-vr-button{font-size:10px!important;opacity:.55!important;max-width:140px!important;}
  `;
  document.head.appendChild(style);
}

export function installPhase192LobbyVisualCleanup(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return null;

  let root = scene.getObjectByName("PHASE192_LOBBY_VISUAL_CLEANUP_ROOT");
  if (!root){
    root = new THREE.Group();
    root.name = "PHASE192_LOBBY_VISUAL_CLEANUP_ROOT";
    addCleanPanel(root, "PHASE192_CLEAN_PLAY_PANEL", "PLAY GAME", "Table Select", "Clean VR kiosk", 0, -10.85, 2.25, 0, "#ffdf8a");
    addCleanPanel(root, "PHASE192_CLEAN_WELLNESS_PANEL", "WELLNESS", "Reiki / Meditation", "Waiting for approval", -8.8, -5.2, 2.25, Math.PI / 3.6, "#a77cff");
    addCleanPanel(root, "PHASE192_CLEAN_PGA_PANEL", "PGA", "Golf Training", "Driving range portal", 8.8, -5.2, 2.25, -Math.PI / 3.6, "#7ffcff");
    addCleanPanel(root, "PHASE192_CLEAN_SCORPION_PANEL", "SCORPION", "Private Room", "VIP poker portal", 8.8, 5.0, 2.25, -Math.PI * 0.72, "#ff5b8c");
    addCleanPanel(root, "PHASE192_CLEAN_STORE_PANEL", "SVR STORE", "Merch / Sponsor", "Wall portal", -8.8, 5.0, 2.25, Math.PI * 0.72, "#8dffb4");
    scene.add(root);
  }

  const hidden = hideClutter(scene);
  const tuned = tuneLightingAndFloor(scene);
  compactHud();
  removeUnsupportedButtonText();
  setTimeout(removeUnsupportedButtonText, 400);
  setTimeout(removeUnsupportedButtonText, 1200);
  setInterval(()=>{ hideClutter(scene); tuneLightingAndFloor(scene); removeUnsupportedButtonText(); compactHud(); }, 1500);

  window.SVR_PHASE192_LOBBY_CLEANUP = {
    label: LABEL,
    locked: true,
    issue: 94,
    hiddenClutter: hidden,
    tunedObjects: tuned,
    cleanPanels: 5,
    vrUnsupportedRelabeled: true,
    checkedAt: new Date().toISOString()
  };
  console.log(`[Phase192] lobby visual cleanup active; hidden clutter=${hidden}`);
  return root;
}

export function autoInstallPhase192LobbyVisualCleanup(){
  const start = performance.now();
  const id = setInterval(()=>{
    if (window.__SVR_SCENE__){
      clearInterval(id);
      installPhase192LobbyVisualCleanup();
    } else if (performance.now() - start > 16000){
      clearInterval(id);
    }
  }, 350);
}
