import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-182-EXPANDED-ORIGINAL-WALL-LOCK";

function makeCanvasTexture(width, height, painter){
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  painter(ctx, width, height, canvas);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 2;
  tex.generateMipmaps = true;
  return tex;
}

function makeWallLabelTexture(title, subtitle, accent = "#7ffcff"){
  return makeCanvasTexture(1600, 420, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#030711");
    g.addColorStop(0.55, "#09091a");
    g.addColorStop(1, "#13051f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    ctx.strokeRect(26, 26, w - 52, h - 52);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 78px system-ui, Arial";
    ctx.fillText(title, w / 2, 162);
    ctx.fillStyle = accent;
    ctx.font = "800 42px system-ui, Arial";
    ctx.fillText(subtitle, w / 2, 246);
    ctx.fillStyle = "#d9eaff";
    ctx.font = "700 28px system-ui, Arial";
    ctx.fillText("Expanded original-wall lobby • octagon shell removed", w / 2, 318);
  });
}

function disposeObject(obj){
  if (!obj) return;
  obj.traverse?.((child)=>{
    if (child.geometry) child.geometry.dispose?.();
    const mat = child.material;
    if (Array.isArray(mat)) mat.forEach(m=>m.dispose?.());
    else mat?.dispose?.();
  });
}

function hideOctagonAndArena(scene){
  const hidden = [];
  const killNames = [
    /PHASE168/i,
    /PHASE169/i,
    /PHASE173/i,
    /SOLID_OCTAGON/i,
    /SINGLE_OCTAGON/i,
    /OCTAGON_WALL/i,
    /CENTER_SPECTATOR_RING/i,
    /CENTER_FEATURED_TABLE_STAGE/i,
    /PHASE176_JUMBOTRON/i,
    /PHASE176_RING_LABEL/i,
    /PHASE176_PUBLIC_BROADCAST_CAMERA/i,
    /PHASE176_LOBBY_ARENA_BROADCAST_ROOT/i
  ];
  scene.traverse((obj)=>{
    if (!obj || obj === scene) return;
    const name = String(obj.name || "");
    if (killNames.some(rx=>rx.test(name))){
      obj.visible = false;
      hidden.push(name || obj.type);
    }
  });
  const oldKeys = [
    "_phase168SolidOctagonLobby",
    "_phase168SolidOctagon",
    "_phase169ExpandedLobby",
    "_phase173SingleWall",
    "_phase176ArenaBroadcast"
  ];
  oldKeys.forEach((key)=>{
    const obj = scene.userData?.[key];
    if (obj){ obj.visible = false; hidden.push(key); }
  });
  return hidden;
}

function makeWall(width, height, depth, mat){
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  wall.castShadow = false;
  wall.receiveShadow = true;
  return wall;
}

function addTrim(root, x, y, z, sx, sy, sz, color = 0x7ffcff){
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.64, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  mesh.position.set(x, y, z);
  root.add(mesh);
  return mesh;
}

function addWallPanel(root, name, title, subtitle, pos, rotY, accent){
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 2.0),
    new THREE.MeshBasicMaterial({ map: makeWallLabelTexture(title, subtitle, accent), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  panel.name = name;
  panel.position.copy(pos);
  panel.rotation.y = rotY;
  panel.renderOrder = 40;
  root.add(panel);
  return panel;
}

function addPortalPad(root, name, x, z, color){
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, 0.035, z);
  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 48),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  pad.rotation.x = -Math.PI / 2;
  group.add(pad);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.022, 10, 96),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring.position.y = 0.94;
  group.add(ring);
  group.userData.tick = (t)=>{ ring.rotation.z = t * 0.85; ring.rotation.y = Math.sin(t * 0.55) * 0.10; };
  root.add(group);
  return group;
}

export function installPhase168SolidOctagonLobby({ scene, log = console.log, enabled = true } = {}){
  if (!enabled || !scene) return null;

  // Backwards-compatible function name. It now restores the expanded original rectangular lobby and removes the octagon shell.
  const existing = scene.getObjectByName("PHASE182_EXPANDED_ORIGINAL_RECTANGULAR_LOBBY_WALL_LOCK");
  if (existing) return existing;

  const hidden = hideOctagonAndArena(scene);
  const root = new THREE.Group();
  root.name = "PHASE182_EXPANDED_ORIGINAL_RECTANGULAR_LOBBY_WALL_LOCK";

  const halfW = 31.5;
  const halfD = 24.0;
  const wallHeight = 5.35;
  const wallDepth = 0.42;
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x070a12,
    roughness: 0.82,
    metalness: 0.08,
    emissive: 0x080820,
    emissiveIntensity: 0.32
  });

  const north = makeWall(halfW * 2, wallHeight, wallDepth, wallMat);
  north.name = "PHASE182_ORIGINAL_NORTH_WALL";
  north.position.set(0, wallHeight / 2, -halfD);
  root.add(north);

  const south = north.clone();
  south.name = "PHASE182_ORIGINAL_SOUTH_WALL";
  south.position.z = halfD;
  root.add(south);

  const east = makeWall(wallDepth, wallHeight, halfD * 2, wallMat);
  east.name = "PHASE182_ORIGINAL_EAST_WALL";
  east.position.set(halfW, wallHeight / 2, 0);
  root.add(east);

  const west = east.clone();
  west.name = "PHASE182_ORIGINAL_WEST_WALL";
  west.position.x = -halfW;
  root.add(west);

  addTrim(root, 0, wallHeight + 0.08, -halfD + 0.24, halfW * 2, 0.08, 0.08);
  addTrim(root, 0, wallHeight + 0.08, halfD - 0.24, halfW * 2, 0.08, 0.08);
  addTrim(root, halfW - 0.24, wallHeight + 0.08, 0, 0.08, 0.08, halfD * 2);
  addTrim(root, -halfW + 0.24, wallHeight + 0.08, 0, 0.08, 0.08, halfD * 2);
  addTrim(root, 0, 0.16, -halfD + 0.24, halfW * 2, 0.06, 0.06, 0xb48cff);
  addTrim(root, 0, 0.16, halfD - 0.24, halfW * 2, 0.06, 0.06, 0xb48cff);
  addTrim(root, halfW - 0.24, 0.16, 0, 0.06, 0.06, halfD * 2, 0xb48cff);
  addTrim(root, -halfW + 0.24, 0.16, 0, 0.06, 0.06, halfD * 2, 0xb48cff);

  addWallPanel(root, "PHASE182_NORTH_FEATURE_WALL", "SVR POKER", "Original expanded lobby wall restored", new THREE.Vector3(0, 2.85, -halfD + 0.30), 0, "#7ffcff");
  addWallPanel(root, "PHASE182_SOUTH_ABOUT_WALL", "MISSION + ABOUT", "Sponsor-ready public message wall", new THREE.Vector3(0, 2.85, halfD - 0.30), Math.PI, "#ff8ad8");
  addWallPanel(root, "PHASE182_EAST_STORE_WALL", "STORE + SPONSOR", "Portal surfaces stay on the wall", new THREE.Vector3(halfW - 0.30, 2.85, 0), -Math.PI / 2, "#ffe28a");
  addWallPanel(root, "PHASE182_WEST_EVENTS_WALL", "EVENTS + LEGENDS", "Expanded walking space preserved", new THREE.Vector3(-halfW + 0.30, 2.85, 0), Math.PI / 2, "#8dffb4");

  const pads = [
    addPortalPad(root, "PHASE182_REIKI_PORTAL_PAD", -18.0, -17.5, 0x5fffd8),
    addPortalPad(root, "PHASE182_PGA_PORTAL_PAD", 18.0, -17.5, 0x6fb8ff),
    addPortalPad(root, "PHASE182_STORE_PORTAL_PAD", 24.5, 5.5, 0xb88cff),
    addPortalPad(root, "PHASE182_SCORPION_PORTAL_PAD", -24.5, 5.5, 0xff5b8c)
  ];

  const seamPts = [
    new THREE.Vector3(-halfW + 0.7, 0.04, -halfD + 0.7),
    new THREE.Vector3( halfW - 0.7, 0.04, -halfD + 0.7),
    new THREE.Vector3( halfW - 0.7, 0.04,  halfD - 0.7),
    new THREE.Vector3(-halfW + 0.7, 0.04,  halfD - 0.7),
    new THREE.Vector3(-halfW + 0.7, 0.04, -halfD + 0.7)
  ];
  const seam = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(seamPts),
    new THREE.LineBasicMaterial({ color: 0xd7b6ff, transparent: true, opacity: 0.70 })
  );
  seam.name = "PHASE182_EXPANDED_RECTANGULAR_FLOOR_SEAM";
  root.add(seam);

  root.userData.tick = (t)=>{
    seam.material.opacity = 0.54 + Math.sin(t * 0.8) * 0.08;
    pads.forEach(p=>p.userData?.tick?.(t));
  };

  scene.add(root);
  scene.userData._phase182ExpandedOriginalWall = root;
  window.SVR_PHASE182_EXPANDED_ORIGINAL_WALL = {
    label: LABEL,
    locked: true,
    shape: "expanded-rectangle",
    octagonRemoved: true,
    halfWidth: halfW,
    halfDepth: halfD,
    wallHeight,
    hiddenObjects: hidden.length,
    note: "Original expanded wall boundary restored. Phase168/169/173/176 octagon/arena shell hidden."
  };
  log(`[Phase182] expanded original rectangular lobby wall installed; octagon/arena objects hidden=${hidden.length}`);
  return root;
}

export function autoInstallPhase168SolidOctagonLobby(){
  const start = performance.now();
  const timer = setInterval(()=>{
    const scene = window.__SVR_SCENE__;
    if (scene){ clearInterval(timer); installPhase168SolidOctagonLobby({ scene, log: console.log, enabled: true }); }
    else if (performance.now() - start > 12000){ clearInterval(timer); console.warn("[Phase182] scene not found for expanded original wall install"); }
  }, 250);
}
