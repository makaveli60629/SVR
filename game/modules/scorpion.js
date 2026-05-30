import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { bootPrivateScene } from "./private_scene_common.js";

const PHASE157 = "PHASE-157-SCORPION-SCIFI-DOWNTOWN-CITY";
const CITY_OBJ_URL = "/assets/assets%20backup/scifi%20downtown%20city.obj";

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
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x07111d, transparent: true, opacity: .32, side: THREE.DoubleSide, depthWrite: false });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(15.5, 6.2, .18), new THREE.MeshBasicMaterial({ color: 0x03060b, toneMapped: false }));
  backWall.name = "SCORPION_CITY_BACKDROP_DARK_WALL";
  backWall.position.set(0, 3.1, -12.65);
  scene.add(backWall);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 4.7), glassMat);
  glass.name = "SCORPION_CITY_VIEW_GLASS";
  glass.position.set(0, 3.0, -12.52);
  scene.add(glass);

  const top = new THREE.Mesh(new THREE.BoxGeometry(15.7, .12, .24), frameMat);
  top.position.set(0, 5.55, -12.40);
  scene.add(top);
  const bottom = top.clone();
  bottom.position.y = .47;
  scene.add(bottom);
  const left = new THREE.Mesh(new THREE.BoxGeometry(.12, 5.2, .24), frameMat);
  left.position.set(-7.85, 3.0, -12.40);
  scene.add(left);
  const right = left.clone();
  right.position.x = 7.85;
  scene.add(right);
}

function addNeonLine(scene, x1, z1, x2, z2, color = 0xd3a13b){
  const curve = new THREE.LineCurve3(new THREE.Vector3(x1, .045, z1), new THREE.Vector3(x2, .045, z2));
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 1, .018, 8, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .88, toneMapped: false })
  );
  mesh.name = "SCORPION_NEON_FLOOR_LINE";
  scene.add(mesh);
}

function makeProceduralSciFiCity(scene){
  const city = new THREE.Group();
  city.name = "SCORPION_PROCEDURAL_SCIFI_DOWNTOWN_FALLBACK";
  const colors = [0x092342, 0x0e355f, 0x11182a, 0x183e67, 0x0b1220];
  const neon = [0x64eaff, 0xd3a13b, 0xb48cff, 0x78ff9f];

  for (let i = 0; i < 46; i++){
    const x = -18 + Math.random() * 36;
    const z = -35 - Math.random() * 30;
    const w = .8 + Math.random() * 2.4;
    const d = .8 + Math.random() * 2.2;
    const h = 4 + Math.random() * 18;
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: .7, metalness: .1, emissive: 0x01070d, emissiveIntensity: .25 })
    );
    building.name = "SCORPION_SCIFI_DOWNTOWN_BUILDING";
    building.position.set(x, h / 2, z);
    city.add(building);

    const rows = Math.min(9, Math.floor(h / 1.45));
    for (let r = 0; r < rows; r++){
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(w * .82, .035, .012),
        new THREE.MeshBasicMaterial({ color: neon[(i + r) % neon.length], transparent: true, opacity: .45, toneMapped: false })
      );
      strip.position.set(x, .9 + r * 1.35, z + d / 2 + .01);
      city.add(strip);
    }
  }

  const roadMat = new THREE.MeshBasicMaterial({ color: 0x05080d, side: THREE.DoubleSide });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(18, 42), roadMat);
  road.name = "SCORPION_SCIFI_DOWNTOWN_ROAD";
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, .02, -39);
  city.add(road);

  for (let i = 0; i < 12; i++){
    addNeonLine(city, -2.2, -18 - i * 3.2, -2.2, -20 - i * 3.2, 0x64eaff);
    addNeonLine(city, 2.2, -18 - i * 3.2, 2.2, -20 - i * 3.2, 0xd3a13b);
  }

  city.position.set(0, 0, 0);
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

    object.name = "SCORPION_SCIFI_DOWNTOWN_CITY_OBJ_ASSET";
    object.position.set(0, 0, -34);
    object.rotation.y = Math.PI;
    object.scale.setScalar(.035);
    object.traverse((child)=>{
      if (child.isMesh){
        child.frustumCulled = false;
        child.material = new THREE.MeshStandardMaterial({ color: 0x7aa7c9, roughness: .72, metalness: .08, emissive: 0x06101c, emissiveIntensity: .32 });
      }
    });
    scene.add(object);
    scene.userData.scorpionCityAsset = { source: CITY_OBJ_URL, loaded: true, phase: PHASE157 };
    console.log(`[${PHASE157}] loaded OBJ asset`, CITY_OBJ_URL);
    return object;
  } catch (err){
    console.warn(`[${PHASE157}] OBJ asset fallback active:`, err?.message || err);
    const fallback = makeProceduralSciFiCity(scene);
    scene.userData.scorpionCityAsset = { source: CITY_OBJ_URL, loaded: false, fallback: true, reason: err?.message || String(err), phase: PHASE157 };
    return fallback;
  }
}

bootPrivateScene({
  title: "SCORPION ROOM",
  subtitle: "PRIVATE POKER SCENE",
  accent: 0xd3a13b,
  buildLabel: PHASE157,
  build: ({ scene })=>{
    addTable(scene);
    makeWindowPanel(scene);
    loadScifiDowntownObj(scene);
  }
});
