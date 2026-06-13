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

function rounded(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function signTexture(title, subtitle, accent = "#7dffcc", gold = "#ffd56e"){
  return canvasTexture(1800, 480, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#020708");
    bg.addColorStop(.50, "#071514");
    bg.addColorStop(1, "#020304");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, w*.58);
    glow.addColorStop(0, "rgba(125,255,204,.24)");
    glow.addColorStop(.42, "rgba(88,255,244,.12)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 18;
    rounded(ctx, 28, 28, w - 56, h - 56, 38);
    ctx.stroke();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 8;
    rounded(ctx, 68, 68, w - 136, h - 136, 28);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 26;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 132px system-ui, Arial";
    ctx.fillText(title, w / 2, 178, w - 180);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#dffcf2";
    ctx.font = "900 58px system-ui, Arial";
    ctx.fillText(subtitle, w / 2, 326, w - 190);
  });
}

function panelTexture(title, lines, accent = "#7dffcc"){
  return canvasTexture(950, 1280, (ctx, w, h)=>{
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#03100f");
    bg.addColorStop(.62, "#081514");
    bg.addColorStop(1, "#05070a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 14;
    rounded(ctx, 30, 30, w - 60, h - 60, 42);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,213,110,.70)";
    ctx.lineWidth = 5;
    rounded(ctx, 70, 70, w - 140, h - 140, 28);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 76px system-ui, Arial";
    ctx.fillText(title, w/2, 130, w - 100);
    ctx.fillStyle = "#dffcf2";
    ctx.font = "800 39px system-ui, Arial";
    let y = 300;
    lines.forEach((line)=>{ ctx.fillText(line, w/2, y, w - 130); y += 82; });
    ctx.fillStyle = "rgba(125,255,204,.13)";
    rounded(ctx, 110, h - 230, w - 220, 124, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,213,110,.70)";
    ctx.lineWidth = 6;
    rounded(ctx, 110, h - 230, w - 220, 124, 28);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 38px system-ui, Arial";
    ctx.fillText("SPONSOR REGISTRY READY", w/2, h - 166, w - 180);
  });
}

function portalTexture(){
  return canvasTexture(1024, 1024, (ctx, w, h)=>{
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w/2, h/2, 40, w/2, h/2, 450);
    g.addColorStop(0, "rgba(255,213,110,.86)");
    g.addColorStop(.32, "rgba(125,255,204,.55)");
    g.addColorStop(.70, "rgba(88,255,244,.20)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,213,110,.95)";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(w/2, h/2, 278, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(125,255,204,.88)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(w/2, h/2, 214, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 78px system-ui, Arial";
    ctx.fillText("WELLNESS", w/2, h/2 + 104, w - 130);
    ctx.fillStyle = "#dffcf2";
    ctx.font = "900 44px system-ui, Arial";
    ctx.fillText("HUB", w/2, h/2 + 174, w - 130);
  });
}

function hologramTexture(title, lines, accent = "#7dffcc"){
  return canvasTexture(900, 900, (ctx, w, h)=>{
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, w/2);
    g.addColorStop(0, "rgba(125,255,204,.32)");
    g.addColorStop(.60, "rgba(88,255,244,.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    rounded(ctx, 82, 76, w - 164, h - 152, 54);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,12,13,.72)";
    rounded(ctx, 98, 92, w - 196, h - 184, 42);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 62px system-ui, Arial";
    ctx.fillText(title, w/2, 180, w - 180);
    ctx.fillStyle = "#dffcf2";
    ctx.font = "800 34px system-ui, Arial";
    let y = 320;
    lines.forEach((line)=>{ ctx.fillText(line, w/2, y, w - 190); y += 66; });
  });
}

function makeMat(color, emissive, intensity, metalness = .32, roughness = .34){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: intensity });
}

function hideLegacyWellnessArea(scene, targets){
  const p = new THREE.Vector3();
  scene.traverse((obj)=>{
    if (!obj || obj.userData?.phase161Wellness) return;
    const name = String(obj.name || "").toLowerCase();
    obj.getWorldPosition?.(p);
    const inZone = targets.some((t)=>t && Math.hypot(p.x - t.x, p.z - t.z) < 15.5 && p.y > -0.2 && p.y < 7.5);
    if (!inZone) return;
    const isOldReiki = name.includes("reiki") || name.includes("wellness") || name.includes("phase158") || name.includes("stanchion") || name.includes("rope") || name.includes("red carpet") || name.includes("sponsor slot") || name.includes("hub ready");
    const isLegacyPanel = obj.isMesh && (obj.geometry?.type || "").includes("Plane");
    if (isOldReiki || isLegacyPanel){
      obj.visible = false;
      obj.userData.phase161HiddenLegacyWellness = true;
    }
  });
}

function buildLuxuryWellnessHub(scene, args){
  const sceneTargets = args.sceneTargets || {};
  const rec = sceneTargets.reiki || sceneTargets.reikiRoom;
  if (!rec?.pos || !rec?.look || scene.userData._phase161LuxuryWellnessHub) return scene.userData._phase161LuxuryWellnessHub;
  const targets = [rec.pos, rec.look, sceneTargets.reikiRoom?.pos, sceneTargets.reikiRoom?.look].filter(Boolean);
  hideLegacyWellnessArea(scene, targets);

  const center = rec.look.clone(); center.y = 0;
  const dir = new THREE.Vector3().subVectors(rec.pos, rec.look); dir.y = 0;
  if (dir.lengthSq() < .001) dir.set(0, 0, 1); else dir.normalize();
  const group = new THREE.Group();
  group.name = "PHASE161 WELLNESS HUB LUXURY GEOMETRY STOREFRONT";
  group.position.copy(center).addScaledVector(dir, .28);
  group.lookAt(rec.pos.x, 1.65, rec.pos.z);

  const black = makeMat(0x020909, 0x061615, .34, .20, .78);
  const glass = new THREE.MeshStandardMaterial({ color: 0xa8fff1, transparent: true, opacity: .115, roughness: .03, metalness: .18, emissive: 0x0e4e47, emissiveIntensity: .18, side: THREE.DoubleSide, depthWrite: false });
  const cyan = makeMat(0x7dffcc, 0x1fcf9b, .90, .62, .18);
  const aqua = makeMat(0x58fff4, 0x18d3c2, .82, .58, .18);
  const gold = makeMat(0xffd56e, 0x9a5f0a, .66, .74, .24);
  const stone = makeMat(0x121a18, 0x07130f, .18, .14, .84);

  const base = new THREE.Mesh(new THREE.BoxGeometry(13.8, 5.95, .22), black); base.position.set(0, 3.02, -.34); base.userData.phase161Wellness = true; group.add(base);
  const inset = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 5.35), glass); inset.position.set(0, 3.02, -.18); inset.userData.phase161Wellness = true; group.add(inset);

  [[0,6.06,0,14.05,.18,.42],[0,.24,0,13.55,.14,.34],[-6.95,3.08,0,.18,5.76,.38],[6.95,3.08,0,.18,5.76,.38]].forEach((v)=>{
    const m = new THREE.Mesh(new THREE.BoxGeometry(v[3], v[4], v[5]), cyan); m.position.set(v[0], v[1], v[2]); m.userData.phase161Wellness = true; group.add(m);
  });
  [[-5.55,3.08,.08,.12,5.25,.30],[5.55,3.08,.08,.12,5.25,.30],[-2.78,3.08,.10,.10,4.62,.26],[2.78,3.08,.10,.10,4.62,.26]].forEach((v)=>{
    const m = new THREE.Mesh(new THREE.BoxGeometry(v[3], v[4], v[5]), gold); m.position.set(v[0], v[1], v[2]); m.userData.phase161Wellness = true; group.add(m);
  });

  const archOuter = new THREE.Mesh(new THREE.TorusGeometry(3.35, .055, 14, 128, Math.PI), new THREE.MeshBasicMaterial({ color: 0x7dffcc, transparent: true, opacity: .88, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  archOuter.name = "PHASE161 WELLNESS LUXURY ARCH";
  archOuter.position.set(0, 3.78, .18);
  archOuter.rotation.z = Math.PI;
  archOuter.scale.y = .56;
  archOuter.userData.phase161Wellness = true;
  group.add(archOuter);
  const archGold = archOuter.clone(); archGold.material = new THREE.MeshBasicMaterial({ color: 0xffd56e, transparent: true, opacity: .54, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }); archGold.scale.set(1.08, .62, 1); archGold.position.z = .19; group.add(archGold);

  const topSign = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 1.05), new THREE.MeshBasicMaterial({ map: signTexture("WELLNESS HUB", "LUXURY PLACEHOLDER", "#7dffcc"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  topSign.position.set(0, 5.45, .22); topSign.userData.phase161Wellness = true; group.add(topSign);
  const subSign = new THREE.Mesh(new THREE.PlaneGeometry(7.2, .78), new THREE.MeshBasicMaterial({ map: signTexture("SPONSOR PLACEHOLDER", "REGISTRY CONTROLLED", "#ffd56e"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  subSign.position.set(0, 4.54, .24); subSign.userData.phase161Wellness = true; group.add(subSign);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(2.65, 3.35), new THREE.MeshBasicMaterial({ map: panelTexture("ABOUT", ["Calm hub design", "No sponsor active", "No video media", "Registry only", "Owner approval"], "#7dffcc"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  left.position.set(-4.55, 2.45, .25); left.userData.phase161Wellness = true; group.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(2.65, 3.35), new THREE.MeshBasicMaterial({ map: panelTexture("STORE", ["Wellness store", "Placeholder products", "Booking disabled", "Sponsor slot blank", "Approval required"], "#ffd56e"), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  right.position.set(4.55, 2.45, .25); right.userData.phase161Wellness = true; group.add(right);

  const podBase = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, .26, 72), stone); podBase.position.set(0, .26, 1.38); podBase.userData.phase161Wellness = true; group.add(podBase);
  const podRing = new THREE.Mesh(new THREE.TorusGeometry(1.28, .035, 16, 128), new THREE.MeshBasicMaterial({ color: 0xffd56e, transparent: true, opacity: .82, blending: THREE.AdditiveBlending, depthWrite: false }));
  podRing.position.set(0, .48, 1.38); podRing.rotation.x = Math.PI * .5; podRing.userData.phase161Wellness = true; group.add(podRing);
  const podHalo = new THREE.Mesh(new THREE.CircleGeometry(1.45, 96), new THREE.MeshBasicMaterial({ map: portalTexture(), transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false }));
  podHalo.rotation.x = -Math.PI * .5; podHalo.position.set(0, .045, 1.38); podHalo.userData.phase161Wellness = true; group.add(podHalo);

  const holoSlides = [
    hologramTexture("WELCOME", ["Wellness Hub", "Luxury placeholder", "No sponsor active"]),
    hologramTexture("SPONSOR", ["Registry controlled", "Add/remove fast", "Owner approval required"], "#ffd56e"),
    hologramTexture("SERVICES", ["Meditation room", "Store placeholder", "Booking disabled"]),
    hologramTexture("ENTER", ["Private room path", "Future wellness flow", "No media loaded"], "#b58cff")
  ];
  let slide = 0;
  const holoMat = new THREE.MeshBasicMaterial({ map: holoSlides[0], transparent: true, opacity: .90, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const holo = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 2.55), holoMat);
  holo.name = "PHASE161 WELLNESS HOLOGRAM CAROUSEL PANEL";
  holo.position.set(0, 2.30, 1.30);
  holo.userData.phase161Wellness = true;
  group.add(holo);
  const btnMat = (label, color)=>new THREE.MeshBasicMaterial({ map: hologramTexture(label, ["tap / trigger"], color), transparent: true, opacity: .92, side: THREE.DoubleSide, depthWrite: false });
  const prev = new THREE.Mesh(new THREE.PlaneGeometry(.78, .38), btnMat("BACK", "#58fff4")); prev.position.set(-1.55, 1.02, 1.42); prev.userData.phase161Wellness = true; group.add(prev);
  const next = new THREE.Mesh(new THREE.PlaneGeometry(.78, .38), btnMat("NEXT", "#ffd56e")); next.position.set(1.55, 1.02, 1.42); next.userData.phase161Wellness = true; group.add(next);
  function setSlide(n){ slide = (n + holoSlides.length) % holoSlides.length; holoMat.map = holoSlides[slide]; holoMat.needsUpdate = true; args.setStatus?.(`Wellness Hub hologram ${slide + 1}/${holoSlides.length}`, { force: true }); }
  if (args.renderer?.domElement && args.camera){
    const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2();
    args.renderer.domElement.addEventListener("pointerdown", (ev)=>{
      const rect = args.renderer.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(mouse, args.camera);
      const hit = ray.intersectObjects([prev, next, holo], true)[0];
      if (!hit) return;
      hit.object === prev ? setSlide(slide - 1) : setSlide(slide + 1);
    }, { passive: true });
  }

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 7.8), new THREE.MeshStandardMaterial({ color: 0x071b17, roughness: .72, metalness: .08, emissive: 0x06251f, emissiveIntensity: .30, side: THREE.DoubleSide }));
  carpet.rotation.x = -Math.PI * .5; carpet.position.set(0, .032, 3.6); carpet.userData.phase161Wellness = true; group.add(carpet);
  [-1, 1].forEach((side)=>{ const trim = new THREE.Mesh(new THREE.BoxGeometry(.06, .045, 7.8), side < 0 ? gold : aqua); trim.position.set(side * 2.12, .075, 3.6); trim.userData.phase161Wellness = true; group.add(trim); });

  scene.add(group);
  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt = .016)=>{
    oldTick?.(dt);
    const t = performance.now() * .001;
    holo.position.y = 2.30 + Math.sin(t * 1.7) * .06;
    holo.material.opacity = .70 + Math.sin(t * 1.2) * .14;
    podRing.rotation.z += dt * .32;
    podHalo.rotation.z -= dt * .18;
    archOuter.material.opacity = .72 + Math.sin(t * 1.8) * .12;
    archGold.material.opacity = .46 + Math.sin(t * 1.35 + .6) * .09;
  };
  scene.userData._phase161LuxuryWellnessHub = { group, setSlide };
  return scene.userData._phase161LuxuryWellnessHub;
}

export function applyPhase161WellnessLuxuryStorefront(args = {}, result = {}){
  const scene = args.scene;
  if (!scene || scene.userData._phase161WellnessLuxuryLock) return result;
  const wellness = buildLuxuryWellnessHub(scene, args);
  scene.userData._phase161WellnessLuxuryLock = true;
  window.SVR_PHASE161_WELLNESS_LUXURY = true;
  args.log?.("Phase 161 Wellness Hub luxury storefront active");
  args.setStatus?.("Phase 161: Wellness Hub luxury storefront active", { force: true });
  return { ...result, phase161Wellness: wellness };
}
