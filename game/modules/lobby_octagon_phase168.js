import * as THREE from "three";

function makeCanvasTexture(width, height, painter){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
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
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function bannerTexture({ title, subtitle, slot, accent = "#7ffcff" }){
  return makeCanvasTexture(1600, 720, (ctx,w,h)=>{
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,"#05070c");
    bg.addColorStop(.48,"#10121d");
    bg.addColorStop(1,"#070611");
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = .22;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    for(let x=-w;x<w*2;x+=96){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+h*.55,h); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 34;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 14;
    roundRect(ctx,34,34,w-68,h-68,46);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,.07)";
    roundRect(ctx,82,78,300,86,30); ctx.fill();
    ctx.fillStyle = accent;
    ctx.font = "900 38px system-ui,Arial";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(slot,232,122);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 86px system-ui,Arial";
    ctx.fillText(title,92,310);
    ctx.fillStyle = accent;
    ctx.font = "800 44px system-ui,Arial";
    ctx.fillText(subtitle,98,392);
    ctx.fillStyle = "#dbeaff";
    ctx.font = "700 34px system-ui,Arial";
    ctx.fillText("Wide Tier 1 banner slider surface • modular sponsor inventory",98,500);
    ctx.fillStyle = "rgba(255,255,255,.74)";
    ctx.font = "700 26px system-ui,Arial";
    ctx.textAlign = "right";
    ctx.fillText("PHASE 168 SOLID OCTAGON LOCK",w-92,h-82);
  });
}

function signTexture({ title, subtitle, accent = "#c9b6ff" }){
  return makeCanvasTexture(1300, 440, (ctx,w,h)=>{
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,"#06070b"); bg.addColorStop(1,"#150b20");
    ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = accent; ctx.lineWidth = 10; ctx.strokeRect(26,26,w-52,h-52);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff"; ctx.font = "900 78px system-ui,Arial"; ctx.fillText(title,w/2,178);
    ctx.fillStyle = accent; ctx.font = "800 36px system-ui,Arial"; ctx.fillText(subtitle,w/2,276);
  });
}

function makeWallSegment({ length, height, mat, trimMat }){
  const group = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(length, height, 0.24), mat);
  wall.position.y = height * 0.5;
  group.add(wall);
  const top = new THREE.Mesh(new THREE.BoxGeometry(length + 0.05, 0.10, 0.30), trimMat);
  top.position.y = height + 0.06;
  group.add(top);
  const bottom = top.clone();
  bottom.position.y = 0.08;
  group.add(bottom);
  return group;
}

function placeOnCircle(obj, radius, angle, y = 0){
  obj.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  obj.lookAt(0, y, 0);
}

function makePillar({ title, subtitle, slot, accent, width = 5.9, height = 5.9 }){
  const group = new THREE.Group();
  group.name = `Phase168 Cardinal Pillar ${slot}`;
  const color = new THREE.Color(accent);
  const bodyMat = new THREE.MeshStandardMaterial({ color:0x080a10, roughness:.58, metalness:.34, emissive:color.clone().multiplyScalar(.10), emissiveIntensity:.42 });
  const trimMat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.78, blending:THREE.AdditiveBlending, depthWrite:false });

  const body = new THREE.Mesh(new THREE.BoxGeometry(width + .55, height + .55, .44), bodyMat);
  body.position.y = height * .5 + .15;
  group.add(body);

  const tex = bannerTexture({ title, subtitle, slot, accent });
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(width, height * .72), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  banner.position.set(0, height * .57 + .18, .235);
  banner.renderOrder = 45;
  group.add(banner);

  const top = new THREE.Mesh(new THREE.BoxGeometry(width + .85, .12, .16), trimMat); top.position.set(0,height+.58,.28);
  const bot = top.clone(); bot.position.y = .34;
  const left = new THREE.Mesh(new THREE.BoxGeometry(.12, height+.45, .16), trimMat); left.position.set(-width*.5-.22,height*.5+.25,.28);
  const right = left.clone(); right.position.x = width*.5+.22;
  group.add(top, bot, left, right);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(.55,.72,.16,8), trimMat);
  crown.position.set(0,height+.96,.18);
  crown.rotation.y = Math.PI / 8;
  group.add(crown);

  return group;
}

function makeLegendMannequin(x, z, color = 0xbfa6ff){
  const group = new THREE.Group();
  group.position.set(x,0,z);
  const mat = new THREE.MeshStandardMaterial({ color, roughness:.52, metalness:.30, emissive:new THREE.Color(color).multiplyScalar(.07), emissiveIntensity:.45 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.22,.30,.10,16), mat); base.position.y=.05;
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.82,14), mat); legs.position.y=.48;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.22,.62,8,16), mat); torso.position.y=1.08;
  const head = new THREE.Mesh(new THREE.SphereGeometry(.19,18,12), mat); head.position.y=1.62;
  const shoulder = new THREE.Mesh(new THREE.BoxGeometry(.72,.12,.18), mat); shoulder.position.y=1.32;
  group.add(base, legs, torso, head, shoulder);
  return group;
}

function makeLegendsHub(){
  const root = new THREE.Group();
  root.name = "PHASE168_LEGENDS_HUB_RESTORED";
  const padMat = new THREE.MeshStandardMaterial({ color:0x100b18, roughness:.82, metalness:.08, emissive:0x1b0b2f, emissiveIntensity:.22, side:THREE.DoubleSide });
  const pad = new THREE.Mesh(new THREE.CircleGeometry(1.45, 8), padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.rotation.z = Math.PI / 8;
  pad.position.y = .018;
  root.add(pad);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.0,1.02), new THREE.MeshBasicMaterial({ map:signTexture({ title:"LEGENDS HUB", subtitle:"Hall of Fame • Champions • History", accent:"#d7b6ff" }), transparent:true, side:THREE.DoubleSide }));
  sign.position.set(0,2.55,-.18);
  root.add(sign);

  const back = new THREE.Mesh(new THREE.BoxGeometry(3.35,2.5,.14), new THREE.MeshStandardMaterial({ color:0x08060d, roughness:.68, metalness:.24, emissive:0x16072a, emissiveIntensity:.30 }));
  back.position.set(0,1.55,-.28);
  root.add(back);

  [-.72,0,.72].forEach((x,idx)=>{
    const m = makeLegendMannequin(x,.42, idx===1 ? 0xffd987 : 0xbca4ff);
    root.add(m);
  });

  const ropeMat = new THREE.MeshBasicMaterial({ color:0xffd987, transparent:true, opacity:.88 });
  const rail = new THREE.Mesh(new THREE.BoxGeometry(3.05,.045,.045), ropeMat); rail.position.set(0,.62,1.08); root.add(rail);
  const left = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.7,10), ropeMat); left.position.set(-1.45,.35,1.08); root.add(left);
  const right = left.clone(); right.position.x = 1.45; root.add(right);
  return root;
}

export function installPhase168SolidOctagonLobby({ scene, log = console.log, enabled = true } = {}){
  if (!enabled || !scene) return null;

  // Hide the previous eight generic ad-building ring. Phase 168 replaces it with four major cardinal pillar buildings.
  const oldAdRoot = scene.userData?._phase123AdBanners || scene.getObjectByName("PHASE123_Eight_Table_Facing_Ad_Banner_Buildings");
  if (oldAdRoot) oldAdRoot.visible = false;

  const root = new THREE.Group();
  root.name = "PHASE168_SOLID_OCTAGON_WALL_FOUR_PILLARS_LEGENDS_LOCK";
  scene.add(root);

  const R = 8.25;
  const side = 2 * R * Math.tan(Math.PI / 8) + 0.18;
  const wallHeight = 3.7;
  const wallMat = new THREE.MeshStandardMaterial({ color:0x06080d, roughness:.72, metalness:.24, emissive:0x09091b, emissiveIntensity:.26 });
  const trimMat = new THREE.MeshBasicMaterial({ color:0x7b5cff, transparent:true, opacity:.38, blending:THREE.AdditiveBlending, depthWrite:false });

  for (let i=0;i<8;i++){
    const angle = i * Math.PI / 4 + Math.PI / 8;
    const seg = makeWallSegment({ length:side, height:wallHeight, mat:wallMat, trimMat });
    seg.name = `Phase168_NoGap_Octagon_Wall_${i+1}`;
    placeOnCircle(seg, R, angle, 0);
    root.add(seg);
  }

  const pillars = [
    { angle:-Math.PI/2, title:"TIER 1 NORTH", subtitle:"Premium sponsor slider", slot:"NORTH", accent:"#7ffcff" },
    { angle:0, title:"TIER 1 EAST", subtitle:"Leaderboard sponsor face", slot:"EAST", accent:"#ffe28a" },
    { angle:Math.PI/2, title:"TIER 1 SOUTH", subtitle:"Notifications sponsor face", slot:"SOUTH", accent:"#ff8ad8" },
    { angle:Math.PI, title:"TIER 1 WEST", subtitle:"Events sponsor face", slot:"WEST", accent:"#8dffb4" }
  ];

  pillars.forEach((cfg)=>{
    const p = makePillar(cfg);
    placeOnCircle(p, R - .06, cfg.angle, 0);
    p.position.y = .04;
    root.add(p);
  });

  const legends = makeLegendsHub();
  placeOnCircle(legends, R - 1.05, -Math.PI * .75, 0);
  legends.position.y = .04;
  root.add(legends);

  const floorRingMat = new THREE.LineBasicMaterial({ color:0xd7b6ff, transparent:true, opacity:.70 });
  const pts = [];
  for(let i=0;i<8;i++){
    const a = i * Math.PI/4 + Math.PI/8;
    pts.push(new THREE.Vector3(Math.cos(a)*(R-.46), .035, Math.sin(a)*(R-.46)));
  }
  pts.push(pts[0].clone());
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), floorRingMat);
  ring.name = "Phase168 Solid Octagon Floor Seam";
  root.add(ring);

  root.userData.tick = (t)=>{
    ring.material.opacity = .56 + Math.sin(t*.8) * .08;
  };

  scene.userData._phase168SolidOctagonLobby = root;
  window.SVR_PHASE168_SOLID_OCTAGON = {
    locked:true,
    oldGenericAdBuildingsHidden:!!oldAdRoot,
    walls:8,
    cardinalPillars:4,
    legendsHub:"restored",
    notes:"Solid octagon shell with no-gap wall segments and four wide Tier 1 banner pillar faces."
  };
  log("[Phase168] Solid octagon lobby installed. Generic 8-building ring hidden. Four cardinal pillars active. Legends restored.");
  return root;
}
