import * as THREE from "three";

function makeCanvasTexture(width, height, painter){
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  painter(ctx, width, height, canvas);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 1;
  tex.generateMipmaps = true;
  return tex;
}
function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
}
function signTexture({ title, subtitle, accent = "#7ffcff", slot = "" }){
  return makeCanvasTexture(1400, 560, (ctx,w,h)=>{
    const bg = ctx.createLinearGradient(0,0,w,h); bg.addColorStop(0,"#05070c"); bg.addColorStop(1,"#13051f");
    ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = accent; ctx.lineWidth = 12; roundRect(ctx,30,30,w-60,h-60,40); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.07)"; roundRect(ctx,74,62,250,72,28); ctx.fill();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = accent; ctx.font = "900 32px system-ui,Arial"; ctx.fillText(slot,199,98);
    ctx.fillStyle = "#fff"; ctx.font = "900 72px system-ui,Arial"; ctx.fillText(title,w/2,230);
    ctx.fillStyle = accent; ctx.font = "800 36px system-ui,Arial"; ctx.fillText(subtitle,w/2,314);
    ctx.fillStyle = "#dbeaff"; ctx.font = "700 27px system-ui,Arial"; ctx.fillText("Interactive pod • slide display • portal-ready",w/2,410);
  });
}
function bannerTexture({ title, subtitle, slot, accent = "#7ffcff" }){
  return makeCanvasTexture(1600, 720, (ctx,w,h)=>{
    const bg = ctx.createLinearGradient(0,0,w,h); bg.addColorStop(0,"#05070c"); bg.addColorStop(.5,"#10121d"); bg.addColorStop(1,"#070611");
    ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = .18; ctx.strokeStyle = accent; ctx.lineWidth = 3;
    for(let x=-w;x<w*2;x+=96){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+h*.55,h); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.shadowColor = accent; ctx.shadowBlur = 26; ctx.strokeStyle = accent; ctx.lineWidth = 14; roundRect(ctx,34,34,w-68,h-68,46); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.07)"; roundRect(ctx,82,78,300,86,30); ctx.fill();
    ctx.fillStyle = accent; ctx.font = "900 38px system-ui,Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(slot,232,122);
    ctx.textAlign = "left"; ctx.fillStyle = "#ffffff"; ctx.font = "900 86px system-ui,Arial"; ctx.fillText(title,92,310);
    ctx.fillStyle = accent; ctx.font = "800 44px system-ui,Arial"; ctx.fillText(subtitle,98,392);
    ctx.fillStyle = "#dbeaff"; ctx.font = "700 34px system-ui,Arial"; ctx.fillText("Wide Tier 1 banner slider surface",98,500);
    ctx.fillStyle = "rgba(255,255,255,.74)"; ctx.font = "700 26px system-ui,Arial"; ctx.textAlign = "right"; ctx.fillText("PHASE 169 EXPANDED LOBBY",w-92,h-82);
  });
}
function placeOnCircle(obj, radius, angle, y = 0){ obj.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius); obj.lookAt(0, y, 0); }
function makeWallSegment({ length, height, mat, trimMat }){
  const group = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(length, height, 0.30), mat); wall.position.y = height * 0.5; group.add(wall);
  const top = new THREE.Mesh(new THREE.BoxGeometry(length + 0.14, 0.12, 0.36), trimMat); top.position.y = height + 0.07; group.add(top);
  const bottom = top.clone(); bottom.position.y = 0.08; group.add(bottom);
  return group;
}
function makePillar({ title, subtitle, slot, accent, width = 8.7, height = 6.5 }){
  const group = new THREE.Group(); group.name = `Phase169 Cardinal Pillar ${slot}`;
  const color = new THREE.Color(accent);
  const bodyMat = new THREE.MeshStandardMaterial({ color:0x080a10, roughness:.58, metalness:.30, emissive:color.clone().multiplyScalar(.09), emissiveIntensity:.35 });
  const trimMat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.72, blending:THREE.AdditiveBlending, depthWrite:false });
  const body = new THREE.Mesh(new THREE.BoxGeometry(width + .65, height + .55, .50), bodyMat); body.position.y = height * .5 + .15; group.add(body);
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(width, height * .66), new THREE.MeshBasicMaterial({ map:bannerTexture({ title, subtitle, slot, accent }), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  banner.position.set(0, height * .56 + .18, .265); banner.renderOrder = 45; group.add(banner);
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + .9, .12, .18), trimMat); top.position.set(0,height+.62,.31);
  const bot = top.clone(); bot.position.y = .34;
  const left = new THREE.Mesh(new THREE.BoxGeometry(.12, height+.45, .18), trimMat); left.position.set(-width*.5-.25,height*.5+.25,.31);
  const right = left.clone(); right.position.x = width*.5+.25; group.add(top, bot, left, right);
  return group;
}
function makeHubPod({ title, subtitle, slot, accent = "#b55cff", portal = "PORTAL" }){
  const root = new THREE.Group(); root.name = `Phase169 Hub Pod ${title}`;
  const color = new THREE.Color(accent);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(1.85, 40), new THREE.MeshStandardMaterial({ color:0x0b0b13, roughness:.82, metalness:.08, emissive:color.clone().multiplyScalar(.08), emissiveIntensity:.35, side:THREE.DoubleSide }));
  pad.rotation.x = -Math.PI/2; pad.position.y = .024; root.add(pad);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.3,1.32), new THREE.MeshBasicMaterial({ map:signTexture({ title, subtitle, accent, slot }), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.position.set(0,2.15,-.32); root.add(panel);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.78,.025,12,96), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.62, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, depthWrite:false }));
  ring.position.set(0,1.10,.48); root.add(ring);
  const portalLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.35,.34), new THREE.MeshBasicMaterial({ map:signTexture({ title:portal, subtitle:"tap / point / select", accent, slot:"GO" }), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  portalLabel.scale.set(.62,.62,.62); portalLabel.position.set(0,.58,.55); root.add(portalLabel);
  root.userData.tick = (t)=>{ ring.rotation.z = t*.7; ring.rotation.y = Math.sin(t*.45)*.10; };
  return root;
}
function makeLegendMannequin(x, z, color = 0xbfa6ff){
  const group = new THREE.Group(); group.position.set(x,0,z);
  const mat = new THREE.MeshStandardMaterial({ color, roughness:.52, metalness:.30, emissive:new THREE.Color(color).multiplyScalar(.07), emissiveIntensity:.45 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.22,.30,.10,16), mat); base.position.y=.05;
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.82,14), mat); legs.position.y=.48;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.22,.62,8,16), mat); torso.position.y=1.08;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.19,18,12), mat); head.position.y=1.62;
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(.72,.12,.18), mat); shoulder.position.y=1.32;
  group.add(base, legs, torso, head, shoulder); return group;
}
function makeLegendsHub(){
  const root = makeHubPod({ title:"LEGENDS HUB", subtitle:"Hall of Fame • Champions", slot:"LEGENDS", accent:"#d7b6ff", portal:"HALL" });
  [-.72,0,.72].forEach((x,idx)=>root.add(makeLegendMannequin(x,.64, idx===1 ? 0xffd987 : 0xbca4ff)));
  return root;
}

export function installPhase168SolidOctagonLobby({ scene, log = console.log, enabled = true } = {}){
  if (!enabled || !scene) return null;

  // Aggressively remove/hide prior background/building clutter. Phase 169 keeps only the expanded octagon, cardinal pillars, and hub pods.
  const hidden = [];
  scene.traverse((obj)=>{
    const n = String(obj.name || "");
    if (/PHASE123_Eight_Table_Facing_Ad_Banner_Buildings|AdBuilding|BannerBuilding|skyline|building/i.test(n)){
      if (!/PHASE169|Phase169|Phase168_SOLID/i.test(n)){ obj.visible = false; hidden.push(n); }
    }
  });
  const oldAdRoot = scene.userData?._phase123AdBanners || scene.getObjectByName("PHASE123_Eight_Table_Facing_Ad_Banner_Buildings");
  if (oldAdRoot){ oldAdRoot.visible = false; hidden.push(oldAdRoot.name); }

  const root = new THREE.Group(); root.name = "PHASE169_EXPANDED_SOLID_OCTAGON_HUB_PODS_LOCOMOTION_LOCK"; scene.add(root);
  const R = 17.75;
  const side = 2 * R * Math.tan(Math.PI / 8) + 0.55;
  const wallHeight = 4.65;
  const wallMat = new THREE.MeshStandardMaterial({ color:0x06080d, roughness:.74, metalness:.20, emissive:0x09091b, emissiveIntensity:.22 });
  const trimMat = new THREE.MeshBasicMaterial({ color:0x7b5cff, transparent:true, opacity:.34, blending:THREE.AdditiveBlending, depthWrite:false });
  for (let i=0;i<8;i++){
    const angle = i * Math.PI / 4 + Math.PI / 8;
    const seg = makeWallSegment({ length:side, height:wallHeight, mat:wallMat, trimMat });
    seg.name = `Phase169_NoGap_Expanded_Octagon_Wall_${i+1}`;
    placeOnCircle(seg, R, angle, 0); root.add(seg);
  }
  [
    { angle:-Math.PI/2, title:"TIER 1 NORTH", subtitle:"Premium sponsor slider", slot:"NORTH", accent:"#7ffcff" },
    { angle:0, title:"TIER 1 EAST", subtitle:"Leaderboard sponsor face", slot:"EAST", accent:"#ffe28a" },
    { angle:Math.PI/2, title:"TIER 1 SOUTH", subtitle:"Notifications sponsor face", slot:"SOUTH", accent:"#ff8ad8" },
    { angle:Math.PI, title:"TIER 1 WEST", subtitle:"Events sponsor face", slot:"WEST", accent:"#8dffb4" }
  ].forEach((cfg)=>{ const p = makePillar(cfg); placeOnCircle(p, R - .14, cfg.angle, 0); p.position.y = .04; root.add(p); });

  const pods = [
    { angle:-Math.PI*.25, radius:11.8, title:"PGA HUB", subtitle:"Training range portal", slot:"PGA", accent:"#6fb8ff", portal:"RANGE" },
    { angle:0, radius:11.8, title:"SPONSOR HUB", subtitle:"Approved partner pod", slot:"SPONSOR", accent:"#7ffcff", portal:"ADS" },
    { angle:Math.PI*.25, radius:11.8, title:"WELLNESS HUB", subtitle:"Slide + hologram portal", slot:"WELLNESS", accent:"#5fffd8", portal:"ROOM" },
    { angle:Math.PI*.50, radius:12.0, title:"SVR STORE", subtitle:"Shop and preview portal", slot:"STORE", accent:"#b88cff", portal:"STORE" },
    { angle:Math.PI*.75, radius:11.8, title:"SCORPION ROOM", subtitle:"Private table portal", slot:"ROOM", accent:"#ff5b8c", portal:"PLAY" },
    { angle:-Math.PI*.75, radius:11.8, title:"LEGENDS HUB", subtitle:"Hall of Fame restored", slot:"LEGENDS", accent:"#d7b6ff", portal:"HALL" }
  ];
  pods.forEach((cfg)=>{
    const pod = cfg.slot === "LEGENDS" ? makeLegendsHub() : makeHubPod(cfg);
    placeOnCircle(pod, cfg.radius, cfg.angle, 0); pod.position.y = .04; root.add(pod);
  });

  const pts = [];
  for(let i=0;i<8;i++){ const a = i * Math.PI/4 + Math.PI/8; pts.push(new THREE.Vector3(Math.cos(a)*(R-.62), .035, Math.sin(a)*(R-.62))); }
  pts.push(pts[0].clone());
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color:0xd7b6ff, transparent:true, opacity:.70 }));
  ring.name = "Phase169 Expanded Solid Octagon Floor Seam"; root.add(ring);
  root.userData.tick = (t)=>{ ring.material.opacity = .56 + Math.sin(t*.8)*.08; root.children.forEach(c=>c.userData?.tick?.(t)); };

  scene.userData._phase168SolidOctagonLobby = root;
  window.SVR_PHASE169_EXPANDED_LOBBY = { locked:true, radius:R, oldBackgroundBuildingsHidden:hidden.length, walls:8, cardinalPillars:4, hubPods:pods.length, notes:"Expanded lobby with no generic background buildings, aligned hub pods, portal displays, and four Tier 1 pillar faces." };
  log(`[Phase169] Expanded lobby installed. Hidden background/building objects=${hidden.length}. Radius=${R}. Hub pods=${pods.length}.`);
  return root;
}
