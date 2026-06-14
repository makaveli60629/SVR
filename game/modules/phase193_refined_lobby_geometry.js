import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-193-REFINED-LOBBY-GEOMETRY-LOCK";
const GOLD = 0xffdf8a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const WALL = 0x0b0d16;

function makeMat(color, emissive = 0x02030a, emissiveIntensity = 0.08, roughness = 0.72, metalness = 0.06){
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity });
}

function makeGlow(color, opacity = 0.42){
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
}

function addBox(root, name, size, pos, color = WALL, emissive = 0x050612){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), makeMat(color, emissive, 0.16));
  mesh.name = name;
  mesh.position.copy(pos);
  root.add(mesh);
  return mesh;
}

function addPanelLabel(root, name, title, x, z, rotY, accent = CYAN){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 340;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  grad.addColorStop(0,"#050713");
  grad.addColorStop(1,"#12051d");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = `#${accent.toString(16).padStart(6,"0")}`;
  ctx.lineWidth = 12;
  ctx.strokeRect(24,24,canvas.width-48,canvas.height-48);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 64px system-ui, Arial";
  ctx.fillText(title, canvas.width/2, 136);
  ctx.fillStyle = `#${accent.toString(16).padStart(6,"0")}`;
  ctx.font = "800 34px system-ui, Arial";
  ctx.fillText("walk up • select • teleport", canvas.width/2, 228);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 1.25), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  panel.name = name;
  panel.position.set(x, 2.16, z);
  panel.rotation.y = rotY;
  panel.renderOrder = 80;
  root.add(panel);
  return panel;
}

function hideNoisyGeometry(scene){
  let hidden = 0;
  const patterns = [
    /PHASE185_TALL_CURVED_ROMAN_WALL/i,
    /PHASE185_BLUE_GOLD_VERTICAL_BANNER/i,
    /PHASE185_UPPER_STOREFRONT_WALKWAY_RING/i,
    /PHASE185_ROMAN_BALCONY_BANISTER_RING/i,
    /PHASE185_UPPER_GOLD_CORNICE_RING/i,
    /PHASE185_CENTER_GOLD_SPECTATOR_RAIL/i,
    /PHASE185_RECESSED_PLAY_GAME_STAGE/i,
    /PHASE185_TIER_/i,
    /PHASE188_/i,
    /PHASE189_HARD_/i,
    /PHASE189_REAL_STAIR/i,
    /PHASE189_UPPER_/i,
    /PHASE123/i,
    /Phase123/i,
    /building/i,
    /skyline/i,
    /tower/i,
    /city/i
  ];
  const keep = /PHASE193|PHASE192|PHASE191|PHASE190|PHASE185_OFFICIAL_POLISHED_MARBLE_FLOOR|PHASE185_FLOOR_INLAY|Moon|Mars|PGA|REIKI|WELLNESS|STORE|SPONSOR|SCORPION|LEGEND|Watch|Teleport|Hand|Controller/i;
  scene.traverse(obj=>{
    const name = String(obj?.name || "");
    if (!name || keep.test(name)) return;
    if (patterns.some(rx=>rx.test(name)) && obj.visible !== false){
      obj.visible = false;
      obj.userData.svrPhase193HiddenNoise = true;
      hidden++;
    }
  });
  return hidden;
}

function tuneBase(scene){
  let tuned = 0;
  scene.traverse(obj=>{
    const name = String(obj?.name || "");
    if (name === "PHASE185_OFFICIAL_POLISHED_MARBLE_FLOOR" && obj.material){
      obj.material.color?.setHex?.(0x151722);
      obj.material.roughness = 0.82;
      obj.material.metalness = 0.04;
      if ("emissiveIntensity" in obj.material) obj.material.emissiveIntensity = 0.045;
      tuned++;
    }
    if (obj.isLight && /PHASE185|moonlight|warm|arch/i.test(name)){
      obj.intensity = Math.min(obj.intensity || 0.25, 0.22);
      tuned++;
    }
  });
  return tuned;
}

export function installPhase193RefinedLobbyGeometry(){
  const scene = window.__SVR_SCENE__;
  if (!scene) return null;
  let root = scene.getObjectByName("PHASE193_REFINED_LOBBY_GEOMETRY_ROOT");
  if (!root){
    root = new THREE.Group();
    root.name = "PHASE193_REFINED_LOBBY_GEOMETRY_ROOT";

    // Clean rectangular room shell: low walls + stable vertical geometry. No fake skyline pop-in.
    const halfW = 14.8;
    const halfD = 12.6;
    const wallH = 3.75;
    const wallT = 0.34;
    addBox(root, "PHASE193_NORTH_CLEAN_WALL", new THREE.Vector3(halfW*2, wallH, wallT), new THREE.Vector3(0, wallH/2, -halfD), 0x080b14, 0x050717);
    addBox(root, "PHASE193_SOUTH_CLEAN_WALL", new THREE.Vector3(halfW*2, wallH, wallT), new THREE.Vector3(0, wallH/2, halfD), 0x080b14, 0x050717);
    addBox(root, "PHASE193_EAST_CLEAN_WALL", new THREE.Vector3(wallT, wallH, halfD*2), new THREE.Vector3(halfW, wallH/2, 0), 0x080b14, 0x050717);
    addBox(root, "PHASE193_WEST_CLEAN_WALL", new THREE.Vector3(wallT, wallH, halfD*2), new THREE.Vector3(-halfW, wallH/2, 0), 0x080b14, 0x050717);

    // Cornice and base trims read as real architecture instead of loose floating blocks.
    const trimMat = makeGlow(GOLD, 0.50);
    [
      ["N_TOP", 0, 3.86, -halfD + .20, halfW*2, .06, .06],
      ["S_TOP", 0, 3.86, halfD - .20, halfW*2, .06, .06],
      ["E_TOP", halfW - .20, 3.86, 0, .06, .06, halfD*2],
      ["W_TOP", -halfW + .20, 3.86, 0, .06, .06, halfD*2],
      ["N_BASE", 0, .18, -halfD + .22, halfW*2, .055, .055],
      ["S_BASE", 0, .18, halfD - .22, halfW*2, .055, .055],
      ["E_BASE", halfW - .22, .18, 0, .055, .055, halfD*2],
      ["W_BASE", -halfW + .22, .18, 0, .055, .055, halfD*2]
    ].forEach(([n,x,y,z,sx,sy,sz])=>{
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), trimMat);
      m.name = `PHASE193_${n}_TRIM`;
      m.position.set(x,y,z);
      root.add(m);
    });

    // Clean columns at the modular bays.
    const colMat = makeMat(0xd8c9a8, 0x100a04, 0.12, 0.58, 0.08);
    [[-10.4,-12.18],[-4.1,-12.18],[4.1,-12.18],[10.4,-12.18],[-14.55,-6.0],[-14.55,6.0],[14.55,-6.0],[14.55,6.0]].forEach(([x,z],i)=>{
      const col = new THREE.Mesh(new THREE.CylinderGeometry(.18,.24,3.55,24), colMat);
      col.name = `PHASE193_CLEAN_COLUMN_${i+1}`;
      col.position.set(x, 1.78, z);
      root.add(col);
    });

    // Wall-based module signs. Keep the center open for movement and poker.
    addPanelLabel(root, "PHASE193_PLAY_WALL_LABEL", "PLAY GAME", 0, -12.38, 0, GOLD);
    addPanelLabel(root, "PHASE193_WELLNESS_WALL_LABEL", "WELLNESS", -9.0, -12.38, 0, PURPLE);
    addPanelLabel(root, "PHASE193_PGA_WALL_LABEL", "PGA TRAINING", 9.0, -12.38, 0, CYAN);
    addPanelLabel(root, "PHASE193_STORE_WALL_LABEL", "SVR STORE", -14.65, 4.8, Math.PI/2, 0x8dffb4);
    addPanelLabel(root, "PHASE193_SCORPION_WALL_LABEL", "SCORPION", 14.65, 4.8, -Math.PI/2, 0xff5b8c);

    // Subtle ceiling ring set above the walls, not a visible second floor.
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(10.8, .032, 10, 160), makeGlow(CYAN, .28));
    ring1.name = "PHASE193_LIGHTWEIGHT_CEILING_GUIDE_RING";
    ring1.rotation.x = Math.PI/2;
    ring1.position.y = 4.25;
    root.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(5.6, .022, 10, 140), makeGlow(PURPLE, .22));
    ring2.name = "PHASE193_INNER_CEILING_GUIDE_RING";
    ring2.rotation.x = Math.PI/2;
    ring2.position.y = 4.05;
    root.add(ring2);

    root.userData.tick = (t)=>{
      ring1.rotation.z = t * 0.025;
      ring2.rotation.z = -t * 0.032;
    };
    scene.add(root);
  }

  const hidden = hideNoisyGeometry(scene);
  const tuned = tuneBase(scene);
  window.SVR_PHASE193_REFINED_GEOMETRY = {
    label: LABEL,
    locked: true,
    noSkylinePopIn: true,
    geometry: "clean rectangular modular lobby shell",
    hiddenNoisyObjects: hidden,
    tunedObjects: tuned,
    checkedAt: new Date().toISOString()
  };
  setInterval(()=>{ hideNoisyGeometry(scene); tuneBase(scene); }, 1200);
  console.log(`[Phase193] refined lobby geometry active; hidden noisy objects=${hidden}`);
  return root;
}

export function autoInstallPhase193RefinedLobbyGeometry(){
  const start = performance.now();
  const id = setInterval(()=>{
    if (window.__SVR_SCENE__){
      clearInterval(id);
      installPhase193RefinedLobbyGeometry();
    } else if (performance.now() - start > 16000){
      clearInterval(id);
    }
  }, 300);
}
