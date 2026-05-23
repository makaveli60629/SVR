import * as THREE from "three";

export const SVR_LOBBY_STABLE_PHASE = "PHASE-133-STABLE-LOBBY-REFINE-REBASE-LOCK";

function makeCanvasTexture(draw, size = 1024){
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  return tex;
}

function makeFloorTexture(){
  return makeCanvasTexture((ctx, size)=>{
    const g = ctx.createRadialGradient(size/2, size/2, 40, size/2, size/2, size * .72);
    g.addColorStop(0, "#2b336c");
    g.addColorStop(.35, "#151d43");
    g.addColorStop(.78, "#070b1e");
    g.addColorStop(1, "#02030a");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,size,size);
    for (let i = 0; i <= size; i += 96){
      ctx.strokeStyle = "rgba(127,245,199,.30)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
    }
    for (let i = 48; i <= size; i += 96){
      ctx.strokeStyle = "rgba(180,140,255,.16)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(246,226,127,.44)";
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(size/2, size/2, size*.36, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = "rgba(0,245,212,.40)";
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(size/2, size/2, size*.23, 0, Math.PI*2); ctx.stroke();
    ctx.font = `900 ${Math.floor(size*.055)}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(246,226,127,.62)";
    ctx.fillText("SVR", size/2, size*.50);
    ctx.font = `800 ${Math.floor(size*.028)}px system-ui, Arial`;
    ctx.fillStyle = "rgba(127,245,199,.55)";
    ctx.fillText("STABLE LOBBY", size/2, size*.545);
  });
}

function makeStarTexture(){
  return makeCanvasTexture((ctx, size)=>{
    const g = ctx.createLinearGradient(0,0,0,size);
    g.addColorStop(0, "#00010b");
    g.addColorStop(.45, "#02051e");
    g.addColorStop(1, "#000103");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,size,size);
    for (let i=0; i<650; i++){
      const y = Math.random() * size * .68;
      const alpha = .22 + Math.random() * .62;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      const s = Math.random() < .045 ? 2 : 1;
      ctx.fillRect(Math.random()*size, y, s, s);
    }
  }, 1024);
}

function makeHaloTexture(){
  return makeCanvasTexture((ctx, size)=>{
    const g = ctx.createRadialGradient(size/2,size/2,6,size/2,size/2,size*.48);
    g.addColorStop(0, "rgba(255,255,255,.98)");
    g.addColorStop(.20, "rgba(220,232,255,.34)");
    g.addColorStop(.68, "rgba(120,150,255,.10)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,size,size);
  }, 256);
}

function makeLabelTexture(title, sub = ""){
  return makeCanvasTexture((ctx, size)=>{
    ctx.clearRect(0,0,size,size);
    const w = size * .92;
    const h = size * .34;
    const x = size * .04;
    const y = size * .33;
    ctx.fillStyle = "rgba(1,6,14,.82)";
    ctx.strokeStyle = "rgba(127,245,199,.72)";
    ctx.lineWidth = 8;
    roundRect(ctx, x, y, w, h, 34);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f6f3ff";
    ctx.font = `900 ${Math.floor(size*.075)}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, size/2, y + h*.43);
    if (sub){
      ctx.fillStyle = "rgba(246,226,127,.92)";
      ctx.font = `800 ${Math.floor(size*.037)}px system-ui, Arial`;
      ctx.fillText(sub, size/2, y + h*.70);
    }
  }, 512);
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function makeWall(parent, { x=0, z=0, rot=0, w=18, h=7, title="SVR", sub="" } = {}){
  const group = new THREE.Group();
  group.position.set(x, h/2, z);
  group.rotation.y = rot;
  parent.add(group);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color:0x070a18, side:THREE.DoubleSide, fog:false })
  );
  wall.renderOrder = 10;
  group.add(wall);
  const trim = new THREE.Mesh(
    new THREE.RingGeometry(.48, .52, 4),
    new THREE.MeshBasicMaterial({ color:0x00f5d4, side:THREE.DoubleSide, transparent:true, opacity:.30, fog:false })
  );
  trim.scale.set(w*.96, h*.96, 1);
  trim.rotation.z = Math.PI/4;
  trim.position.z = .015;
  group.add(trim);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(w*.72, 8.0), 2.15),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(title, sub), transparent:true, fog:false, toneMapped:false, depthWrite:false })
  );
  label.position.set(0, .75, .04);
  label.renderOrder = 20;
  group.add(label);
  return group;
}

function makePortal(parent, { key, title, sub, x, z, rot=0, color=0x00f5d4 } = {}){
  const group = new THREE.Group();
  group.name = `SVR_PORTAL_${key}`;
  group.position.set(x, 1.8, z);
  group.rotation.y = rot;
  parent.add(group);
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.42),
    new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.18, side:THREE.DoubleSide, depthWrite:false, fog:false })
  );
  plate.renderOrder = 30;
  group.add(plate);
  const border = new THREE.Mesh(
    new THREE.RingGeometry(.50, .55, 4),
    new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.66, side:THREE.DoubleSide, depthWrite:false, fog:false })
  );
  border.scale.set(2.35, 1.30, 1);
  border.rotation.z = Math.PI/4;
  border.position.z = .02;
  border.renderOrder = 31;
  group.add(border);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.25, 1.05),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(title, sub), transparent:true, depthWrite:false, fog:false, toneMapped:false })
  );
  label.position.z = .04;
  label.renderOrder = 32;
  group.add(label);
  return group;
}

function makeTable(parent){
  const group = new THREE.Group();
  group.name = "SVR_STABLE_LOBBY_SHOW_TABLE";
  group.position.set(0, .72, 0);
  parent.add(group);
  const rail = new THREE.Mesh(
    new THREE.CylinderGeometry(3.65, 3.65, .24, 96),
    new THREE.MeshBasicMaterial({ color:0x24131f, fog:false })
  );
  group.add(rail);
  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(3.18, 3.18, .27, 96),
    new THREE.MeshBasicMaterial({ color:0x0b3a2e, fog:false })
  );
  felt.position.y = .04;
  group.add(felt);
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.25, .72),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture("SVR", "SCORPION PORTAL TABLE"), transparent:true, depthWrite:false, fog:false, toneMapped:false })
  );
  logo.rotation.x = -Math.PI/2;
  logo.position.y = .205;
  logo.renderOrder = 38;
  group.add(logo);
  for (let i=0;i<6;i++){
    const a = -Math.PI/2 + i * Math.PI*2/6;
    const chair = new THREE.Mesh(
      new THREE.CylinderGeometry(.43,.50,.40,20),
      new THREE.MeshBasicMaterial({ color: i === 3 ? 0x00f5d4 : 0x5b42a1, transparent:true, opacity:.78, fog:false })
    );
    chair.position.set(Math.cos(a)*4.75, -.42, Math.sin(a)*4.75);
    chair.scale.z = .74;
    group.add(chair);
  }
  return group;
}

function makePlanets(parent){
  const group = new THREE.Group();
  group.name = "SVR_STABLE_HIGH_ORBIT_SKY";
  group.userData.svrNoWorldShift = true;
  parent.add(group);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(950, 36, 18),
    new THREE.MeshBasicMaterial({ map: makeStarTexture(), side:THREE.BackSide, fog:false, depthWrite:false, depthTest:false })
  );
  sky.frustumCulled = false;
  group.add(sky);
  const halo = makeHaloTexture();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(38, 36, 24), new THREE.MeshBasicMaterial({ color:0xf1f4f8, fog:false }));
  moon.name = "SVR_STABLE_MOON_HIGH_ORBIT";
  moon.frustumCulled = false;
  group.add(moon);
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:halo, transparent:true, opacity:.40, color:0xf5f7ff, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending, fog:false }));
  moonHalo.scale.set(275,275,1);
  moonHalo.frustumCulled = false;
  group.add(moonHalo);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(23, 32, 20), new THREE.MeshBasicMaterial({ color:0xe17b4e, fog:false }));
  mars.name = "SVR_STABLE_MARS_HIGH_ORBIT";
  mars.frustumCulled = false;
  group.add(mars);
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:halo, transparent:true, opacity:.30, color:0xff9b6b, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending, fog:false }));
  marsHalo.scale.set(185,185,1);
  marsHalo.frustumCulled = false;
  group.add(marsHalo);
  return {
    group,
    update(dt){
      const t = performance.now() * .001;
      const moonA = -Math.PI/2 + t * .012;
      const marsA = t * .015;
      moon.position.set(Math.cos(moonA)*650, 650 + Math.sin(t*.04)*8, Math.sin(moonA)*650);
      mars.position.set(Math.cos(marsA)*590, 565 + Math.sin(t*.05+1)*6, Math.sin(marsA)*590);
      moon.rotation.y += dt * .025;
      mars.rotation.y += dt * .035;
      moonHalo.position.copy(moon.position);
      marsHalo.position.copy(mars.position);
    }
  };
}

export function buildStableLobby(parent, { renderer = null, log = console.log } = {}){
  const root = new THREE.Group();
  root.name = "SVR_PHASE133_STABLE_REFINED_LOBBY";
  parent.add(root);

  const ROOM_RADIUS = 24;
  const tableCenter = new THREE.Vector3(0,0,0);
  const seats = [
    { x: 0, z: -4.8, label: "North Seat" },
    { x: 4.2, z: -2.4, label: "East North Seat" },
    { x: 4.2, z: 2.4, label: "East South Seat" },
    { x: 0, z: 5.4, label: "Open South Player Seat" },
    { x: -4.2, z: 2.4, label: "West South Seat" },
    { x: -4.2, z: -2.4, label: "Dealer Side" }
  ];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_RADIUS*2.08, ROOM_RADIUS*2.08, 1, 1),
    new THREE.MeshBasicMaterial({ map:makeFloorTexture(), side:THREE.DoubleSide, fog:false, toneMapped:false })
  );
  floor.name = "SVR_PHASE133_CORRECT_LOBBY_FLOOR";
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  floor.renderOrder = 2;
  root.add(floor);

  const floorEdge = new THREE.Mesh(
    new THREE.RingGeometry(ROOM_RADIUS*.98, ROOM_RADIUS*1.02, 128),
    new THREE.MeshBasicMaterial({ color:0x00f5d4, transparent:true, opacity:.42, side:THREE.DoubleSide, depthWrite:false, fog:false })
  );
  floorEdge.rotation.x = -Math.PI/2;
  floorEdge.position.y = .02;
  floorEdge.renderOrder = 3;
  root.add(floorEdge);

  makeWall(root, { x:0, z:-23.7, rot:0, w:18, h:8, title:"SVR POKER", sub:"NORTH WALL • STABLE LOBBY" });
  makeWall(root, { x:23.7, z:0, rot:-Math.PI/2, w:16, h:7, title:"PGA", sub:"PRIVATE ROUTE" });
  makeWall(root, { x:-23.7, z:0, rot:Math.PI/2, w:16, h:7, title:"REIKI", sub:"AWAITING APPROVAL" });
  makeWall(root, { x:0, z:23.7, rot:Math.PI, w:18, h:7, title:"SVR STORE", sub:"PORTAL WALL" });

  makeTable(root);

  const portals = [
    { key:"reiki", title:"REIKI", sub:"PRIVATE ROOM", x:-14, z:-16, rot:.48, color:0xf6e27f },
    { key:"pga", title:"PGA", sub:"DRIVING RANGE", x:14, z:-16, rot:-.48, color:0x7ff5c7 },
    { key:"scorpion", title:"SCORPION", sub:"POKER ROOM", x:0, z:-18.8, rot:0, color:0xff6b7f },
    { key:"store", title:"STORE", sub:"WEB PORTAL", x:-12, z:16.5, rot:Math.PI-.44, color:0x66ddff },
    { key:"lounge", title:"LOUNGE", sub:"SOCIAL", x:12, z:16.5, rot:Math.PI+.44, color:0xb48cff }
  ];
  portals.forEach(p=>makePortal(root,p));

  const sky = makePlanets(root);
  const ambient = new THREE.HemisphereLight(0xe9f2ff, 0x080512, .75);
  ambient.userData.svrNoWorldShift = true;
  root.add(ambient);
  const key = new THREE.DirectionalLight(0xf6f3ff, .85);
  key.position.set(0, 12, 9);
  key.userData.svrNoWorldShift = true;
  root.add(key);

  const sceneTargets = {
    lobby: { pos:{ x:0, z:8.4 }, look:{ x:0, z:-8 } },
    table: { pos:{ x:0, z:7.0 }, look:{ x:0, z:0 } },
    seat: { pos:{ x:0, z:5.4 }, look:{ x:0, z:0 } },
    reiki: { pos:{ x:-13.4, z:-14.6 }, look:{ x:-18, z:-22 } },
    pga: { pos:{ x:13.4, z:-14.6 }, look:{ x:18, z:-22 } },
    legends: { pos:{ x:0, z:-12 }, look:{ x:0, z:-23 } },
    sponsor: { pos:{ x:-10, z:14 }, look:{ x:0, z:23 } },
    scorpion: { pos:{ x:0, z:-16 }, look:{ x:0, z:-23 } },
    pgaDrive: { pos:{ x:15, z:-15 }, look:{ x:23, z:-23 } },
    chipPutt: { pos:{ x:16, z:-8 }, look:{ x:23, z:-14 } },
    storeRoom: { pos:{ x:-12, z:15 }, look:{ x:0, z:23 } },
    smokerLounge: { pos:{ x:12, z:15 }, look:{ x:0, z:23 } },
    reikiRoom: { pos:{ x:-15, z:-15 }, look:{ x:-23, z:-23 } }
  };

  root.userData._tickWorld = (dt)=>{ sky.update(dt); };
  parent.userData._tickWorld = root.userData._tickWorld;
  if (renderer){
    try { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, .54)); } catch {}
    try { renderer.xr?.setFramebufferScaleFactor?.(.54); } catch {}
    try { renderer.xr?.setFoveation?.(1.0); } catch {}
  }

  window.SVR_PHASE133_STABLE_LOBBY = { phase: SVR_LOBBY_STABLE_PHASE, rootName: root.name, floor:true, moon:"high orbit", mars:"high orbit", siteTouched:false };
  log?.("[Phase133] Stable refined lobby loaded; heavy skyline bypassed.");

  return {
    root,
    roomClamp: ROOM_RADIUS - 1.5,
    seats,
    tableCenter,
    joinRadius: 6.4,
    previewOrbitRadius: 20,
    sceneTargets,
    update: root.userData._tickWorld
  };
}
