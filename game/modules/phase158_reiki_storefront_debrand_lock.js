import * as THREE from "three";

function canvasTexture(width, height, draw){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function signTexture(title, subtitle, accent = "#58fff4"){
  return canvasTexture(1400, 360, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#02070b");
    g.addColorStop(.55, "#071417");
    g.addColorStop(1, "#020306");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.strokeStyle = "rgba(255,255,255,.24)";
    ctx.lineWidth = 5;
    ctx.strokeRect(44, 44, w - 88, h - 88);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 98px system-ui, Arial";
    ctx.fillText(title, w / 2, 140, w - 120);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#bffcff";
    ctx.font = "800 46px system-ui, Arial";
    ctx.fillText(subtitle, w / 2, 250, w - 120);
  });
}

function panelTexture(title, lines, accent = "#58fff4"){
  return canvasTexture(900, 1200, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#030a0d");
    g.addColorStop(.62, "#071117");
    g.addColorStop(1, "#08030c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 72px system-ui, Arial";
    ctx.fillText(title, w / 2, 118, w - 90);
    ctx.fillStyle = "#dffcff";
    ctx.font = "800 38px system-ui, Arial";
    let y = 260;
    lines.forEach((line)=>{
      ctx.fillText(line, w / 2, y, w - 120);
      y += 76;
    });
    ctx.fillStyle = "rgba(88,255,244,.12)";
    ctx.fillRect(90, h - 190, w - 180, 104);
    ctx.strokeStyle = "rgba(88,255,244,.62)";
    ctx.lineWidth = 7;
    ctx.strokeRect(90, h - 190, w - 180, 104);
    ctx.fillStyle = "#fff";
    ctx.font = "900 34px system-ui, Arial";
    ctx.fillText("REGISTRY CONTROLLED", w / 2, h - 137, w - 140);
  });
}

function floorTexture(){
  return canvasTexture(1024, 1024, (ctx, w, h)=>{
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w/2, h/2, 60, w/2, h/2, 420);
    g.addColorStop(0, "rgba(88,255,244,.80)");
    g.addColorStop(.52, "rgba(181,88,255,.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(88,255,244,.92)";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(w/2, h/2, 245, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 78px system-ui, Arial";
    ctx.fillText("REIKI HUB", w/2, h/2 + 120, w - 130);
    ctx.fillStyle = "#bffcff";
    ctx.font = "800 38px system-ui, Arial";
    ctx.fillText("PLACEHOLDER", w/2, h/2 + 184, w - 130);
  });
}

function nearReiki(obj, targets){
  const p = new THREE.Vector3();
  obj.getWorldPosition(p);
  if (p.y < -0.05 || p.y > 6.4) return false;
  return targets.some((t)=>t && Math.hypot(p.x - t.x, p.z - t.z) < 12.0);
}

function hideOldPanels(scene, targets){
  scene.traverse((obj)=>{
    if (!obj?.isMesh || obj.userData?.phase158CleanReiki) return;
    if (!nearReiki(obj, targets)) return;
    const type = obj.geometry?.type || "";
    const isPanel = type.includes("Plane") || type.includes("Circle");
    if (!isPanel) return;
    obj.visible = false;
    obj.userData.phase158HiddenLegacyReiki = true;
  });
}

function addCleanStorefront(scene, sceneTargets){
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  if (!rec?.pos || !rec?.look || scene.userData._phase158CleanReikiStorefront) return null;
  const center = rec.look.clone();
  center.y = 0;
  const dir = new THREE.Vector3().subVectors(rec.look, rec.pos);
  dir.y = 0;
  if (dir.lengthSq() < .001) dir.set(1, 0, 0);
  dir.normalize();
  const group = new THREE.Group();
  group.name = "PHASE158 CLEAN REIKI STOREFRONT NO RETIRED SPONSOR TEXT";
  group.position.copy(center).addScaledVector(dir, -2.0);
  group.lookAt(rec.pos.x, 1.6, rec.pos.z);

  const backMat = new THREE.MeshStandardMaterial({ color: 0x050b0e, roughness: .78, metalness: .12, emissive: 0x06171b, emissiveIntensity: .28 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x85fff0, roughness: .18, metalness: .56, emissive: 0x1ba98f, emissiveIntensity: .78 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(10.2, 5.45, .18), backMat);
  wall.position.set(0, 2.75, -.18);
  wall.userData.phase158CleanReiki = true;
  group.add(wall);
  [[0,5.52,0,10.5,.14,.22],[-5.18,2.75,0,.14,5.35,.22],[5.18,2.75,0,.14,5.35,.22]].forEach((v)=>{
    const trim = new THREE.Mesh(new THREE.BoxGeometry(v[3], v[4], v[5]), trimMat);
    trim.position.set(v[0], v[1], v[2]);
    trim.userData.phase158CleanReiki = true;
    group.add(trim);
  });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(7.65, .94), new THREE.MeshBasicMaterial({ map: signTexture("REIKI HUB", "SPONSOR PLACEHOLDER"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  top.position.set(0, 5.08, .04);
  top.userData.phase158CleanReiki = true;
  group.add(top);
  const mid = new THREE.Mesh(new THREE.PlaneGeometry(6.42, .72), new THREE.MeshBasicMaterial({ map: signTexture("PLACEHOLDER", "AWAITING OWNER APPROVAL", "#b58cff"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  mid.position.set(0, 4.24, .05);
  mid.userData.phase158CleanReiki = true;
  group.add(mid);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 3.65), new THREE.MeshBasicMaterial({ map: panelTexture("SPONSOR SLOT", ["Provider unassigned", "Website blank", "Logo blank", "Media removed", "Booking disabled"], "#58fff4"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  left.position.set(-3.45, 2.25, .06);
  left.userData.phase158CleanReiki = true;
  group.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 3.65), new THREE.MeshBasicMaterial({ map: panelTexture("REIKI STORE", ["Store stays open", "Sponsor placeholder", "Registry controlled", "No retired branding", "Approval required"], "#7dffb2"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  right.position.set(3.45, 2.25, .06);
  right.userData.phase158CleanReiki = true;
  group.add(right);
  const centerPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 3.65), new THREE.MeshBasicMaterial({ map: panelTexture("HUB READY", ["Add sponsor", "Remove sponsor", "Swap media", "Update site", "One registry"], "#ffd56e"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  centerPanel.position.set(0, 2.25, .07);
  centerPanel.userData.phase158CleanReiki = true;
  group.add(centerPanel);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.12, 64), new THREE.MeshBasicMaterial({ map: floorTexture(), transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  floor.rotation.x = -Math.PI * .5;
  floor.position.set(0, .035, 1.05);
  floor.userData.phase158CleanReiki = true;
  group.add(floor);
  scene.add(group);
  scene.userData._phase158CleanReikiStorefront = group;
  return group;
}

export function applyPhase158ReikiStorefrontDebrandLock(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase158ReikiDebrandLock) return result;
  const sceneTargets = args.sceneTargets || {};
  const targets = [];
  if (sceneTargets.reiki?.pos) targets.push(sceneTargets.reiki.pos);
  if (sceneTargets.reiki?.look) targets.push(sceneTargets.reiki.look);
  if (sceneTargets.reikiRoom?.pos) targets.push(sceneTargets.reikiRoom.pos);
  if (sceneTargets.reikiRoom?.look) targets.push(sceneTargets.reikiRoom.look);
  hideOldPanels(scene, targets);
  addCleanStorefront(scene, sceneTargets);
  scene.userData._phase158ReikiDebrandLock = true;
  window.SVR_PHASE158_REIKI_DEBRAND_LOCK = true;
  args.log?.("Phase 158 Reiki storefront debrand lock active");
  args.setStatus?.("Phase 158: Reiki storefront debranded; placeholder-only signs active", { force: true });
  return result;
}
