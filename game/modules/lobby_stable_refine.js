import * as THREE from "three";

export const SVR_LOBBY_STABLE_PHASE = "PHASE-136-STABLE-LOBBY-FULL-DEMO-REBUILD-LOCK";

const COLOR = {
  wall: 0x070a18,
  wall2: 0x0b1026,
  floor: 0xffffff,
  teal: 0x00f5d4,
  purple: 0xb48cff,
  gold: 0xf6e27f,
  red: 0xff5572,
  blue: 0x66ddff,
  green: 0x7ff5c7,
  white: 0xf7f4ff
};

const TMP = {
  v3: new THREE.Vector3(),
  v3b: new THREE.Vector3()
};

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

function makeFloorTexture(){
  return makeCanvasTexture((ctx, size)=>{
    const g = ctx.createRadialGradient(size/2, size/2, 30, size/2, size/2, size*.72);
    g.addColorStop(0, "#33407c");
    g.addColorStop(.30, "#18214b");
    g.addColorStop(.70, "#070b20");
    g.addColorStop(1, "#02030a");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,size,size);

    for (let i = 0; i <= size; i += 96){
      ctx.strokeStyle = "rgba(127,245,199,.32)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
    }
    for (let i = 48; i <= size; i += 96){
      ctx.strokeStyle = "rgba(180,140,255,.18)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
    }

    ctx.strokeStyle = "rgba(246,226,127,.48)";
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(size/2, size/2, size*.36, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = "rgba(0,245,212,.46)";
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(size/2, size/2, size*.22, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,85,114,.30)";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(size/2, size/2, size*.135, 0, Math.PI*2); ctx.stroke();

    ctx.font = `900 ${Math.floor(size*.060)}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(246,226,127,.70)";
    ctx.fillText("SVR", size/2, size*.496);
    ctx.font = `800 ${Math.floor(size*.028)}px system-ui, Arial`;
    ctx.fillStyle = "rgba(127,245,199,.62)";
    ctx.fillText("VERSION 0.1 DEMO LOBBY", size/2, size*.545);
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
    for (let i=0; i<720; i++){
      const y = Math.random() * size * .68;
      const alpha = .24 + Math.random() * .64;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      const s = Math.random() < .040 ? 2 : 1;
      ctx.fillRect(Math.random()*size, y, s, s);
    }
  }, 1024);
}

function makeHaloTexture(){
  return makeCanvasTexture((ctx, size)=>{
    const g = ctx.createRadialGradient(size/2,size/2,6,size/2,size/2,size*.48);
    g.addColorStop(0, "rgba(255,255,255,.98)");
    g.addColorStop(.20, "rgba(220,232,255,.36)");
    g.addColorStop(.70, "rgba(120,150,255,.11)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,size,size);
  }, 256);
}

function makeLabelTexture(title, sub = "", mode = "teal"){
  return makeCanvasTexture((ctx, size)=>{
    ctx.clearRect(0,0,size,size);
    const w = size*.92;
    const h = size*.42;
    const x = size*.04;
    const y = size*.28;
    const stroke = mode === "red" ? "rgba(255,85,114,.78)" : mode === "gold" ? "rgba(246,226,127,.78)" : "rgba(127,245,199,.78)";
    const subColor = mode === "red" ? "rgba(255,160,174,.94)" : mode === "gold" ? "rgba(246,226,127,.95)" : "rgba(127,245,199,.92)";
    ctx.fillStyle = "rgba(1,6,14,.86)";
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 8;
    roundRect(ctx, x, y, w, h, 34);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f8f4ff";
    ctx.font = `900 ${Math.floor(size*.078)}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, size/2, y + h*.40);
    if (sub){
      ctx.fillStyle = subColor;
      ctx.font = `800 ${Math.floor(size*.038)}px system-ui, Arial`;
      ctx.fillText(sub, size/2, y + h*.69);
    }
  }, 512);
}

function matBasic(color, opts = {}){
  return new THREE.MeshBasicMaterial({ color, fog:false, toneMapped:false, ...opts });
}

function addBox(parent, name, pos, scale, color, opts = {}){
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(scale.x, scale.y, scale.z),
    matBasic(color, opts)
  );
  mesh.name = name;
  mesh.position.copy(pos);
  mesh.renderOrder = opts.renderOrder || 0;
  parent.add(mesh);
  return mesh;
}

function makeFrame(parent, name, w, h, color){
  const group = new THREE.Group();
  group.name = name;
  parent.add(group);
  addBox(group, `${name}_top`, new THREE.Vector3(0,h/2,0), new THREE.Vector3(w,.10,.08), color);
  addBox(group, `${name}_bottom`, new THREE.Vector3(0,-h/2,0), new THREE.Vector3(w,.10,.08), color);
  addBox(group, `${name}_left`, new THREE.Vector3(-w/2,0,0), new THREE.Vector3(.10,h,.08), color);
  addBox(group, `${name}_right`, new THREE.Vector3(w/2,0,0), new THREE.Vector3(.10,h,.08), color);
  return group;
}

function makeWall(parent, { x=0, z=0, rot=0, w=18, h=7.6, title="SVR", sub="", color=COLOR.teal, mode="teal" } = {}){
  const group = new THREE.Group();
  group.name = `SVR_PHASE136_WALL_${title.replace(/\W+/g,"_")}`;
  group.position.set(x, h/2, z);
  group.rotation.y = rot;
  parent.add(group);

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), matBasic(COLOR.wall, { side:THREE.DoubleSide }));
  wall.name = `${group.name}_panel`;
  wall.renderOrder = 10;
  group.add(wall);
  const backGlow = new THREE.Mesh(new THREE.PlaneGeometry(w*.96, h*.92), matBasic(color, { side:THREE.DoubleSide, transparent:true, opacity:.08, depthWrite:false }));
  backGlow.position.z = .012;
  backGlow.renderOrder = 11;
  group.add(backGlow);
  const frame = makeFrame(group, `${group.name}_frame`, w*.97, h*.94, color);
  frame.position.z = .045;

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(w*.76, 9.3), 2.50),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(title, sub, mode), transparent:true, fog:false, toneMapped:false, depthWrite:false })
  );
  label.name = `${group.name}_label`;
  label.position.set(0, .76, .08);
  label.renderOrder = 30;
  group.add(label);
  return group;
}

function makePortal(parent, { key, title, sub, x, z, rot=0, color=COLOR.teal, mode="teal" } = {}){
  const group = new THREE.Group();
  group.name = `SVR_PHASE136_PORTAL_${key}`;
  group.position.set(x, 2.05, z);
  group.rotation.y = rot;
  parent.add(group);

  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(1.65, 48),
    matBasic(color, { transparent:true, opacity:.18, side:THREE.DoubleSide, depthWrite:false })
  );
  pad.name = `${group.name}_floor_pad`;
  pad.rotation.x = -Math.PI/2;
  pad.position.set(0,-2.00,.68);
  pad.renderOrder = 12;
  group.add(pad);

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(3.15, 1.80),
    matBasic(0x020610, { transparent:true, opacity:.88, side:THREE.DoubleSide })
  );
  plate.name = `${group.name}_plate`;
  plate.renderOrder = 34;
  group.add(plate);

  const frame = makeFrame(group, `${group.name}_frame`, 3.30, 1.95, color);
  frame.position.z = .045;

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.90, 1.45),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture(title, sub, mode), transparent:true, depthWrite:false, fog:false, toneMapped:false })
  );
  label.name = `${group.name}_label`;
  label.position.z = .09;
  label.renderOrder = 36;
  group.add(label);
  return group;
}

function makeTable(parent){
  const group = new THREE.Group();
  group.name = "SVR_PHASE136_SHOW_TABLE_SCORPION_PORTAL";
  group.position.set(0, .74, 0);
  parent.add(group);

  const rail = new THREE.Mesh(new THREE.CylinderGeometry(3.95, 3.95, .28, 80), matBasic(0x24131f));
  rail.name = "SVR_PHASE136_TABLE_RAIL";
  group.add(rail);
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(3.36, 3.36, .30, 80), matBasic(0x0b3d31));
  felt.name = "SVR_PHASE136_TABLE_FELT";
  felt.position.y = .055;
  group.add(felt);

  const passLine = new THREE.Mesh(
    new THREE.RingGeometry(2.25, 2.31, 80),
    matBasic(COLOR.gold, { transparent:true, opacity:.28, side:THREE.DoubleSide, depthWrite:false })
  );
  passLine.name = "SVR_PHASE136_TABLE_PASS_BET_LINE";
  passLine.rotation.x = -Math.PI/2;
  passLine.position.y = .225;
  group.add(passLine);

  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(2.65, .90),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture("SVR", "SCORPION PORTAL TABLE", "gold"), transparent:true, depthWrite:false, fog:false, toneMapped:false })
  );
  logo.name = "SVR_PHASE136_TABLE_LOGO";
  logo.rotation.x = -Math.PI/2;
  logo.position.y = .245;
  logo.renderOrder = 42;
  group.add(logo);

  for (let i=0;i<6;i++){
    const a = -Math.PI/2 + i * Math.PI*2/6;
    const chair = new THREE.Mesh(new THREE.CylinderGeometry(.46,.56,.44,18), matBasic(i === 3 ? COLOR.teal : COLOR.purple, { transparent:true, opacity:.88 }));
    chair.name = `SVR_PHASE136_SEAT_${i+1}`;
    chair.position.set(Math.cos(a)*4.95, -.43, Math.sin(a)*4.95);
    chair.scale.z = .72;
    group.add(chair);
  }
  return group;
}

function makeSky(parent){
  const group = new THREE.Group();
  group.name = "SVR_PHASE136_HIGH_ORBIT_SKY";
  group.userData.svrNoWorldShift = true;
  parent.add(group);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(980, 36, 18), new THREE.MeshBasicMaterial({ map:makeStarTexture(), side:THREE.BackSide, fog:false, depthWrite:false, depthTest:false }));
  sky.name = "SVR_PHASE136_STAR_SKY";
  sky.frustumCulled = false;
  group.add(sky);

  const halo = makeHaloTexture();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(42, 40, 24), matBasic(0xf1f4f8));
  moon.name = "SVR_PHASE136_MOON_HIGH_ORBIT";
  moon.frustumCulled = false;
  group.add(moon);
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:halo, transparent:true, opacity:.42, color:0xf5f7ff, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending, fog:false }));
  moonHalo.name = "SVR_PHASE136_MOON_HALO";
  moonHalo.scale.set(310,310,1);
  moonHalo.frustumCulled = false;
  group.add(moonHalo);

  const mars = new THREE.Mesh(new THREE.SphereGeometry(26, 34, 20), matBasic(0xe17b4e));
  mars.name = "SVR_PHASE136_MARS_HIGH_ORBIT";
  mars.frustumCulled = false;
  group.add(mars);
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:halo, transparent:true, opacity:.31, color:0xff9b6b, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending, fog:false }));
  marsHalo.name = "SVR_PHASE136_MARS_HALO";
  marsHalo.scale.set(210,210,1);
  marsHalo.frustumCulled = false;
  group.add(marsHalo);

  return {
    update(dt){
      const t = performance.now() * .001;
      const moonA = -Math.PI/2 + t * .010;
      const marsA = t * .013;
      moon.position.set(Math.cos(moonA)*700, 705 + Math.sin(t*.035)*8, Math.sin(moonA)*700);
      mars.position.set(Math.cos(marsA)*620, 610 + Math.sin(t*.042+1)*7, Math.sin(marsA)*620);
      moon.rotation.y += dt * .020;
      mars.rotation.y += dt * .030;
      moonHalo.position.copy(moon.position);
      marsHalo.position.copy(mars.position);
    }
  };
}

function makeSpawnPad(parent){
  const pad = new THREE.Mesh(new THREE.CircleGeometry(1.28, 48), matBasic(COLOR.green, { transparent:true, opacity:.26, side:THREE.DoubleSide, depthWrite:false }));
  pad.name = "SVR_PHASE136_SAFE_SPAWN_PAD_FACE_NORTH";
  pad.rotation.x = -Math.PI/2;
  pad.position.set(0,.035,8.4);
  pad.renderOrder = 16;
  parent.add(pad);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.28,.85,3), matBasic(COLOR.gold, { transparent:true, opacity:.85 }));
  arrow.name = "SVR_PHASE136_NORTH_ARROW";
  arrow.rotation.x = -Math.PI/2;
  arrow.rotation.z = Math.PI;
  arrow.position.set(0,.10,7.15);
  arrow.renderOrder = 17;
  parent.add(arrow);
}

export function buildStableLobby(parent, { renderer = null, log = console.log } = {}){
  const root = new THREE.Group();
  root.name = "SVR_PHASE136_FULL_DEMO_LOBBY";
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

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_RADIUS*2.10, ROOM_RADIUS*2.10, 1, 1), new THREE.MeshBasicMaterial({ map:makeFloorTexture(), side:THREE.DoubleSide, fog:false, toneMapped:false }));
  floor.name = "SVR_PHASE136_CORRECT_VISIBLE_LOBBY_FLOOR";
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  floor.renderOrder = 2;
  root.add(floor);

  const floorEdge = new THREE.Mesh(new THREE.RingGeometry(ROOM_RADIUS*.98, ROOM_RADIUS*1.02, 128), matBasic(COLOR.teal, { transparent:true, opacity:.46, side:THREE.DoubleSide, depthWrite:false }));
  floorEdge.name = "SVR_PHASE136_FLOOR_EDGE_LOCK";
  floorEdge.rotation.x = -Math.PI/2;
  floorEdge.position.y = .024;
  root.add(floorEdge);

  makeSpawnPad(root);

  makeWall(root, { x:0, z:-23.7, rot:0, w:20, h:8.4, title:"SVR POKER", sub:"VERSION 0.1 • NORTH WALL", color:COLOR.teal, mode:"teal" });
  makeWall(root, { x:23.7, z:0, rot:-Math.PI/2, w:18, h:7.8, title:"PGA", sub:"DRIVE • CHIP • PUTT", color:COLOR.green, mode:"teal" });
  makeWall(root, { x:-23.7, z:0, rot:Math.PI/2, w:18, h:7.8, title:"REIKI", sub:"AWAITING APPROVAL", color:COLOR.gold, mode:"gold" });
  makeWall(root, { x:0, z:23.7, rot:Math.PI, w:20, h:7.8, title:"SVR STORE", sub:"PROFILE • SPONSOR • IMPACT", color:COLOR.blue, mode:"teal" });

  makeTable(root);

  const portals = [
    { key:"reiki", title:"REIKI", sub:"PRIVATE ROOM", x:-15.0, z:-16.2, rot:.50, color:COLOR.gold, mode:"gold" },
    { key:"pga", title:"PGA", sub:"DRIVING RANGE", x:15.0, z:-16.2, rot:-.50, color:COLOR.green, mode:"teal" },
    { key:"scorpion", title:"SCORPION", sub:"REAL POKER ROOM", x:0, z:-18.7, rot:0, color:COLOR.red, mode:"red" },
    { key:"store", title:"STORE", sub:"WEB + VR SHOP", x:-13.6, z:16.5, rot:Math.PI-.45, color:COLOR.blue, mode:"teal" },
    { key:"lounge", title:"LOUNGE", sub:"SOCIAL HANGOUT", x:13.6, z:16.5, rot:Math.PI+.45, color:COLOR.purple, mode:"teal" },
    { key:"sponsor", title:"SPONSOR", sub:"BRAND HUBS", x:-18.3, z:3.4, rot:Math.PI/2, color:COLOR.teal, mode:"teal" },
    { key:"impact", title:"IMPACT", sub:"CHARITY ENGINE", x:18.3, z:3.4, rot:-Math.PI/2, color:COLOR.gold, mode:"gold" }
  ];
  portals.forEach(p=>makePortal(root,p));

  const sky = makeSky(root);
  const ambient = new THREE.HemisphereLight(0xe9f2ff, 0x080512, .78);
  ambient.userData.svrNoWorldShift = true;
  root.add(ambient);

  const sceneTargets = {
    lobby: { pos:{ x:0, z:8.4 }, look:{ x:0, z:-8 } },
    table: { pos:{ x:0, z:7.0 }, look:{ x:0, z:0 } },
    seat: { pos:{ x:0, z:5.4 }, look:{ x:0, z:0 } },
    reiki: { pos:{ x:-14.8, z:-14.8 }, look:{ x:-21, z:-22 } },
    pga: { pos:{ x:14.8, z:-14.8 }, look:{ x:21, z:-22 } },
    legends: { pos:{ x:0, z:-12.5 }, look:{ x:0, z:-23 } },
    sponsor: { pos:{ x:-17.0, z:3.4 }, look:{ x:-23, z:3.4 } },
    impact: { pos:{ x:17.0, z:3.4 }, look:{ x:23, z:3.4 } },
    scorpion: { pos:{ x:0, z:-16.0 }, look:{ x:0, z:-23 } },
    pgaDrive: { pos:{ x:15.6, z:-15.2 }, look:{ x:23, z:-23 } },
    chipPutt: { pos:{ x:16.2, z:-8.0 }, look:{ x:23, z:-14 } },
    storeRoom: { pos:{ x:-13.0, z:15.0 }, look:{ x:0, z:23 } },
    smokerLounge: { pos:{ x:13.0, z:15.0 }, look:{ x:0, z:23 } },
    reikiRoom: { pos:{ x:-15.6, z:-15.2 }, look:{ x:-23, z:-23 } }
  };

  root.userData._tickWorld = (dt)=>{ sky.update(dt); };
  parent.userData._tickWorld = root.userData._tickWorld;
  if (renderer){
    try { renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, .56)); } catch {}
    try { renderer.xr?.setFramebufferScaleFactor?.(.56); } catch {}
    try { renderer.xr?.setFoveation?.(1.0); } catch {}
  }

  window.SVR_PHASE136_STABLE_LOBBY = {
    phase: SVR_LOBBY_STABLE_PHASE,
    rootName: root.name,
    floor:true,
    portals:portals.map(p=>p.key),
    moon:"high orbit",
    mars:"high orbit east start",
    siteTouched:false,
    demo:"SVR-Version 0.1 full lobby demo rebuild"
  };
  log?.("[Phase136] Full demo lobby rebuild loaded: floor, walls, portals, table, sky, performance lock.");

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
