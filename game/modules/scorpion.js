import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { bootPrivateScene } from "./private_scene_common.js";

const PHASE159 = "PHASE-159-SCORPION-ROOM-WINDOW-CITY-VIEW";
const CITY_OBJ_URL = "/assets/assets%20backup/scifi%20downtown%20city.obj";

function makeTexture(kind = "building"){
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const x = c.getContext("2d");

  if (kind === "wall"){
    x.fillStyle = "#05070d";
    x.fillRect(0,0,512,512);
    x.strokeStyle = "rgba(211,161,59,.34)";
    x.lineWidth = 4;
    for(let y=24;y<512;y+=54){ x.beginPath(); x.moveTo(0,y); x.lineTo(512,y); x.stroke(); }
    for(let i=0;i<26;i++){
      x.strokeStyle = i%2 ? "rgba(100,234,255,.12)" : "rgba(180,140,255,.10)";
      x.strokeRect(Math.random()*512, Math.random()*512, 40+Math.random()*120, 18+Math.random()*52);
    }
  } else if (kind === "floor"){
    x.fillStyle = "#05060a";
    x.fillRect(0,0,512,512);
    x.strokeStyle = "rgba(100,234,255,.24)";
    x.lineWidth = 2;
    for(let i=0;i<=512;i+=48){ x.beginPath(); x.moveTo(i,0); x.lineTo(i,512); x.stroke(); x.beginPath(); x.moveTo(0,i); x.lineTo(512,i); x.stroke(); }
    x.strokeStyle = "rgba(211,161,59,.40)";
    x.lineWidth = 8;
    x.strokeRect(18,18,476,476);
  } else if (kind === "road"){
    x.fillStyle = "#03060b";
    x.fillRect(0,0,512,512);
    x.strokeStyle = "rgba(100,234,255,.42)";
    x.lineWidth = 4;
    for(let i=0;i<12;i++){ x.beginPath(); x.moveTo(80+i*34,0); x.lineTo(20+i*42,512); x.stroke(); }
    x.strokeStyle = "rgba(211,161,59,.78)";
    x.lineWidth = 10;
    x.setLineDash([28,24]);
    x.beginPath(); x.moveTo(256,0); x.lineTo(256,512); x.stroke();
  } else {
    const g = x.createLinearGradient(0,0,512,512);
    g.addColorStop(0,"#07111f");
    g.addColorStop(.45,"#0b2948");
    g.addColorStop(1,"#02050a");
    x.fillStyle = g;
    x.fillRect(0,0,512,512);
    x.strokeStyle = "rgba(255,255,255,.08)";
    x.lineWidth = 2;
    for(let gx=0;gx<512;gx+=64){ x.beginPath(); x.moveTo(gx,0); x.lineTo(gx,512); x.stroke(); }
    for(let gy=0;gy<512;gy+=58){ x.beginPath(); x.moveTo(0,gy); x.lineTo(512,gy); x.stroke(); }
    const neonColors = ["#64eaff", "#d3a13b", "#b48cff", "#78ff9f", "#ffffff"];
    for(let row=0; row<13; row++){
      for(let col=0; col<6; col++){
        const lit = Math.random() > .32;
        x.fillStyle = lit ? neonColors[(row + col) % neonColors.length] : "rgba(8,15,24,.75)";
        x.globalAlpha = lit ? (.48 + Math.random()*.45) : .45;
        x.fillRect(34 + col*76, 28 + row*36, 42, 16);
      }
    }
    x.globalAlpha = 1;
    x.strokeStyle = "rgba(100,234,255,.36)";
    x.lineWidth = 8;
    x.strokeRect(14,14,484,484);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function addBox(scene, name, size, pos, mat){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z), mat);
  mesh.name = name;
  mesh.position.set(pos.x,pos.y,pos.z);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return mesh;
}

function addScorpionRoomShell(scene){
  const wallTex = makeTexture("wall");
  wallTex.repeat.set(3,1.5);
  const floorTex = makeTexture("floor");
  floorTex.repeat.set(5,5);

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, color: 0xffffff, roughness: .78, metalness: .04, emissive: 0x05020a, emissiveIntensity: .18 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, color: 0xffffff, roughness: .62, metalness: .08, emissive: 0x02070a, emissiveIntensity: .18 });
  const trimMat = new THREE.MeshBasicMaterial({ color: 0xd3a13b, toneMapped: false });
  const cyanMat = new THREE.MeshBasicMaterial({ color: 0x64eaff, toneMapped: false });

  addBox(scene,"SCORPION_ROOM_FLOOR",{x:18,y:.16,z:18},{x:0,y:-.03,z:0},floorMat);
  addBox(scene,"SCORPION_ROOM_CEILING",{x:18,y:.14,z:18},{x:0,y:6.15,z:0},wallMat);
  addBox(scene,"SCORPION_ROOM_LEFT_WALL",{x:.18,y:6.2,z:18},{x:-9,y:3.05,z:0},wallMat);
  addBox(scene,"SCORPION_ROOM_RIGHT_WALL",{x:.18,y:6.2,z:18},{x:9,y:3.05,z:0},wallMat);
  addBox(scene,"SCORPION_ROOM_FRONT_WALL",{x:18,y:6.2,z:.18},{x:0,y:3.05,z:8.95},wallMat);

  // Back wall is split around a big window so the city is truly outside the room.
  addBox(scene,"SCORPION_BACK_WALL_LEFT_OF_WINDOW",{x:1.5,y:6.2,z:.20},{x:-8.25,y:3.05,z:-8.95},wallMat);
  addBox(scene,"SCORPION_BACK_WALL_RIGHT_OF_WINDOW",{x:1.5,y:6.2,z:.20},{x:8.25,y:3.05,z:-8.95},wallMat);
  addBox(scene,"SCORPION_BACK_WALL_ABOVE_WINDOW",{x:15,y:1.0,z:.20},{x:0,y:5.7,z:-8.95},wallMat);
  addBox(scene,"SCORPION_BACK_WALL_BELOW_WINDOW",{x:15,y:.9,z:.20},{x:0,y:.45,z:-8.95},wallMat);

  addBox(scene,"SCORPION_WINDOW_TOP_GOLD_TRIM",{x:15.3,y:.12,z:.26},{x:0,y:5.18,z:-8.78},trimMat);
  addBox(scene,"SCORPION_WINDOW_BOTTOM_GOLD_TRIM",{x:15.3,y:.12,z:.26},{x:0,y:.95,z:-8.78},trimMat);
  addBox(scene,"SCORPION_WINDOW_LEFT_GOLD_TRIM",{x:.12,y:4.35,z:.26},{x:-7.55,y:3.05,z:-8.78},trimMat);
  addBox(scene,"SCORPION_WINDOW_RIGHT_GOLD_TRIM",{x:.12,y:4.35,z:.26},{x:7.55,y:3.05,z:-8.78},trimMat);

  addBox(scene,"SCORPION_ROOM_CYAN_FLOOR_TRIM_BACK",{x:16.4,y:.04,z:.06},{x:0,y:.07,z:-8.65},cyanMat);
  addBox(scene,"SCORPION_ROOM_CYAN_FLOOR_TRIM_LEFT",{x:.06,y:.04,z:16.4},{x:-8.65,y:.07,z:0},cyanMat);
  addBox(scene,"SCORPION_ROOM_CYAN_FLOOR_TRIM_RIGHT",{x:.06,y:.04,z:16.4},{x:8.65,y:.07,z:0},cyanMat);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(14.6, 4.05),
    new THREE.MeshBasicMaterial({ color: 0x07111d, transparent: true, opacity: .16, side: THREE.DoubleSide, depthWrite: false })
  );
  glass.name = "SCORPION_ROOM_BIG_CITY_WINDOW_GLASS";
  glass.position.set(0,3.05,-8.68);
  glass.frustumCulled = false;
  scene.add(glass);

  const signTex = new THREE.CanvasTexture(Object.assign(document.createElement("canvas"), { width: 1024, height: 256 }));
  const c = signTex.image;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(3,5,10,.9)"; x.fillRect(0,0,1024,256);
  x.strokeStyle = "#d3a13b"; x.lineWidth = 10; x.strokeRect(20,20,984,216);
  x.textAlign = "center"; x.fillStyle = "#fff7e3"; x.font = "900 66px Arial"; x.fillText("SCORPION ROOM",512,118);
  x.fillStyle = "#64eaff"; x.font = "800 28px Arial"; x.fillText("CITY VIEW PRIVATE POKER",512,172);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.8,1.45), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, toneMapped: false }));
  sign.name = "SCORPION_ROOM_WINDOW_HEADER_SIGN";
  sign.position.set(0,5.55,-8.55);
  scene.add(sign);
}

function addTable(scene){
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.1, .18, 96),
    new THREE.MeshStandardMaterial({ color: 0x10261f, roughness: .88 })
  );
  table.name = "SCORPION_SINGLE_SHOW_TABLE";
  table.position.y = .9;
  scene.add(table);

  const felt = new THREE.Mesh(
    new THREE.CircleGeometry(1.9, 96),
    new THREE.MeshBasicMaterial({ color: 0x0f5138, side: THREE.DoubleSide })
  );
  felt.name = "SCORPION_TABLE_FELT";
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = 1.0;
  scene.add(felt);
}

function addNeonLine(root, x1, z1, x2, z2, color = 0xd3a13b){
  const curve = new THREE.LineCurve3(new THREE.Vector3(x1, .045, z1), new THREE.Vector3(x2, .045, z2));
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 1, .024, 8, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .92, toneMapped: false })
  );
  mesh.name = "SCORPION_CITY_NEON_ROAD_LINE";
  root.add(mesh);
}

function makeProceduralSciFiCity(scene){
  const city = new THREE.Group();
  city.name = "SCORPION_OUTSIDE_WINDOW_TEXTURED_SCIFI_CITY_PHASE159";
  const neon = [0x64eaff, 0xd3a13b, 0xb48cff, 0x78ff9f];
  const facadeTextures = [makeTexture("building"), makeTexture("building"), makeTexture("building")];

  for (let i = 0; i < 70; i++){
    const x = -18 + Math.random() * 36;
    const z = -12 - Math.random() * 32;
    const w = .9 + Math.random() * 2.8;
    const d = .8 + Math.random() * 2.6;
    const h = 4 + Math.random() * 24;
    const tex = facadeTextures[i % facadeTextures.length].clone();
    tex.needsUpdate = true;
    tex.repeat.set(Math.max(1, Math.round(w)), Math.max(2, Math.round(h / 2.5)));
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: .62, metalness: .12, emissive: 0x06101c, emissiveIntensity: .28 })
    );
    building.name = "SCORPION_OUTSIDE_WINDOW_TEXTURED_CITY_BUILDING";
    building.position.set(x, h / 2, z);
    building.frustumCulled = false;
    city.add(building);

    const rows = Math.min(13, Math.floor(h / 1.2));
    for (let r = 0; r < rows; r++){
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(w * .82, .04, .016),
        new THREE.MeshBasicMaterial({ color: neon[(i + r) % neon.length], transparent: true, opacity: .72, toneMapped: false })
      );
      strip.name = "SCORPION_OUTSIDE_WINDOW_NEON_STRIP";
      strip.position.set(x, .8 + r * 1.18, z + d / 2 + .02);
      city.add(strip);
    }
  }

  const roadTexture = makeTexture("road");
  roadTexture.repeat.set(1, 5);
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 38),
    new THREE.MeshBasicMaterial({ map: roadTexture, side: THREE.DoubleSide, toneMapped: false })
  );
  road.name = "SCORPION_OUTSIDE_WINDOW_TEXTURED_ROAD";
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, .025, -22);
  city.add(road);

  for (let i = 0; i < 11; i++){
    addNeonLine(city, -2.15, -10 - i * 3.0, -2.15, -12 - i * 3.0, 0x64eaff);
    addNeonLine(city, 2.15, -10 - i * 3.0, 2.15, -12 - i * 3.0, 0xd3a13b);
  }

  // Put city just outside the window. Window is at z -8.68; city starts beyond it.
  city.position.set(0, 0, -4.25);
  scene.add(city);
  return city;
}

async function loadScifiDowntownObj(scene){
  try{
    const response = await fetch(CITY_OBJ_URL, { cache: "no-store" });
    const objText = await response.text();
    if (!response.ok || objText.trim().length < 32){
      throw new Error("scifi downtown city OBJ is empty or unavailable in repo deploy");
    }

    const loader = new OBJLoader();
    const object = loader.parse(objText);
    if (!object || object.children.length === 0){
      throw new Error("scifi downtown city OBJ parsed with no mesh children");
    }

    const facade = makeTexture("building");
    facade.repeat.set(8, 12);
    object.name = "SCORPION_OUTSIDE_WINDOW_OBJ_CITY_PHASE159";
    object.position.set(0, 0, -15.5);
    object.rotation.y = Math.PI;
    object.scale.setScalar(.085);
    object.traverse((child)=>{
      if (child.isMesh){
        child.frustumCulled = false;
        child.material = new THREE.MeshStandardMaterial({ map: facade, color: 0xffffff, roughness: .65, metalness: .12, emissive: 0x071426, emissiveIntensity: .35 });
      }
    });
    scene.add(object);
    scene.userData.scorpionCityAsset = { source: CITY_OBJ_URL, loaded: true, textured: true, outsideWindow: true, phase: PHASE159 };
    console.log(`[${PHASE159}] loaded OBJ city outside Scorpion window`, CITY_OBJ_URL);
    return object;
  } catch (err){
    console.warn(`[${PHASE159}] outside window city fallback active:`, err?.message || err);
    const fallback = makeProceduralSciFiCity(scene);
    scene.userData.scorpionCityAsset = { source: CITY_OBJ_URL, loaded: false, fallback: true, textured: true, outsideWindow: true, reason: err?.message || String(err), phase: PHASE159 };
    return fallback;
  }
}

bootPrivateScene({
  title: "SCORPION ROOM",
  subtitle: "CITY VIEW PRIVATE POKER",
  accent: 0xd3a13b,
  buildLabel: PHASE159,
  build: ({ scene })=>{
    addScorpionRoomShell(scene);
    addTable(scene);
    loadScifiDowntownObj(scene);
  }
});
