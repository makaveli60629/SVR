import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { bootPrivateScene } from "./private_scene_common.js";

const PHASE158 = "PHASE-158-SCORPION-CLOSER-TEXTURED-SCIFI-CITY";
const CITY_OBJ_URL = "/assets/assets%20backup/scifi%20downtown%20city.obj";

function makeTexture(kind = "building", tint = 0x64eaff){
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const x = c.getContext("2d");

  if (kind === "road"){
    x.fillStyle = "#03060b";
    x.fillRect(0,0,c.width,c.height);
    x.strokeStyle = "rgba(100,234,255,.38)";
    x.lineWidth = 4;
    for(let i=0;i<12;i++){
      x.beginPath();
      x.moveTo(80 + i * 34, 0);
      x.lineTo(20 + i * 42, 512);
      x.stroke();
    }
    x.strokeStyle = "rgba(211,161,59,.74)";
    x.lineWidth = 10;
    x.setLineDash([28, 24]);
    x.beginPath();
    x.moveTo(256, 0);
    x.lineTo(256, 512);
    x.stroke();
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
        const lit = Math.random() > .34;
        x.fillStyle = lit ? neonColors[(row + col) % neonColors.length] : "rgba(8,15,24,.75)";
        x.globalAlpha = lit ? (.45 + Math.random()*.45) : .45;
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

function makeWindowPanel(scene){
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xd3a13b, toneMapped: false });
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x07111d, transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(16.2, 6.7, .18), new THREE.MeshBasicMaterial({ color: 0x03060b, toneMapped: false }));
  backWall.name = "SCORPION_CITY_BACKDROP_DARK_WALL";
  backWall.position.set(0, 3.2, -10.85);
  scene.add(backWall);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(14.2, 5.2), glassMat);
  glass.name = "SCORPION_CITY_VIEW_GLASS";
  glass.position.set(0, 3.18, -10.72);
  scene.add(glass);

  const top = new THREE.Mesh(new THREE.BoxGeometry(16.4, .14, .24), frameMat);
  top.position.set(0, 5.95, -10.60);
  scene.add(top);
  const bottom = top.clone();
  bottom.position.y = .42;
  scene.add(bottom);
  const left = new THREE.Mesh(new THREE.BoxGeometry(.14, 5.6, .24), frameMat);
  left.position.set(-8.2, 3.15, -10.60);
  scene.add(left);
  const right = left.clone();
  right.position.x = 8.2;
  scene.add(right);
}

function addNeonLine(root, x1, z1, x2, z2, color = 0xd3a13b){
  const curve = new THREE.LineCurve3(new THREE.Vector3(x1, .045, z1), new THREE.Vector3(x2, .045, z2));
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 1, .024, 8, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .92, toneMapped: false })
  );
  mesh.name = "SCORPION_NEON_ROAD_LINE";
  root.add(mesh);
}

function makeProceduralSciFiCity(scene){
  const city = new THREE.Group();
  city.name = "SCORPION_TEXTURED_SCIFI_DOWNTOWN_FALLBACK_PHASE158";
  const neon = [0x64eaff, 0xd3a13b, 0xb48cff, 0x78ff9f];
  const facadeTextures = [makeTexture("building"), makeTexture("building"), makeTexture("building")];

  for (let i = 0; i < 58; i++){
    const x = -15 + Math.random() * 30;
    const z = -15 - Math.random() * 26; // closer than Phase 157
    const w = .9 + Math.random() * 2.7;
    const d = .8 + Math.random() * 2.4;
    const h = 4 + Math.random() * 22;
    const tex = facadeTextures[i % facadeTextures.length].clone();
    tex.needsUpdate = true;
    tex.repeat.set(Math.max(1, Math.round(w)), Math.max(2, Math.round(h / 2.5)));
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: .62, metalness: .12, emissive: 0x06101c, emissiveIntensity: .28 })
    );
    building.name = "SCORPION_TEXTURED_SCIFI_DOWNTOWN_BUILDING";
    building.position.set(x, h / 2, z);
    building.frustumCulled = false;
    city.add(building);

    const rows = Math.min(12, Math.floor(h / 1.25));
    for (let r = 0; r < rows; r++){
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(w * .82, .04, .016),
        new THREE.MeshBasicMaterial({ color: neon[(i + r) % neon.length], transparent: true, opacity: .68, toneMapped: false })
      );
      strip.name = "SCORPION_CITY_NEON_WINDOW_STRIP";
      strip.position.set(x, .8 + r * 1.22, z + d / 2 + .02);
      city.add(strip);
    }
  }

  const roadTexture = makeTexture("road");
  roadTexture.repeat.set(1, 4);
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 32),
    new THREE.MeshBasicMaterial({ map: roadTexture, side: THREE.DoubleSide, toneMapped: false })
  );
  road.name = "SCORPION_TEXTURED_SCIFI_DOWNTOWN_ROAD";
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, .025, -24);
  city.add(road);

  for (let i = 0; i < 9; i++){
    addNeonLine(city, -2.15, -11 - i * 3.0, -2.15, -13 - i * 3.0, 0x64eaff);
    addNeonLine(city, 2.15, -11 - i * 3.0, 2.15, -13 - i * 3.0, 0xd3a13b);
  }

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
    facade.repeat.set(6, 10);
    object.name = "SCORPION_SCIFI_DOWNTOWN_CITY_OBJ_TEXTURED_PHASE158";
    object.position.set(0, 0, -17.5);
    object.rotation.y = Math.PI;
    object.scale.setScalar(.060);
    object.traverse((child)=>{
      if (child.isMesh){
        child.frustumCulled = false;
        child.material = new THREE.MeshStandardMaterial({ map: facade, color: 0xffffff, roughness: .65, metalness: .12, emissive: 0x071426, emissiveIntensity: .35 });
      }
    });
    scene.add(object);
    scene.userData.scorpionCityAsset = { source: CITY_OBJ_URL, loaded: true, textured: true, phase: PHASE158 };
    console.log(`[${PHASE158}] loaded closer textured OBJ asset`, CITY_OBJ_URL);
    return object;
  } catch (err){
    console.warn(`[${PHASE158}] textured fallback active:`, err?.message || err);
    const fallback = makeProceduralSciFiCity(scene);
    scene.userData.scorpionCityAsset = { source: CITY_OBJ_URL, loaded: false, fallback: true, textured: true, reason: err?.message || String(err), phase: PHASE158 };
    return fallback;
  }
}

bootPrivateScene({
  title: "SCORPION ROOM",
  subtitle: "PRIVATE POKER SCENE",
  accent: 0xd3a13b,
  buildLabel: PHASE158,
  build: ({ scene })=>{
    addTable(scene);
    makeWindowPanel(scene);
    loadScifiDowntownObj(scene);
  }
});
