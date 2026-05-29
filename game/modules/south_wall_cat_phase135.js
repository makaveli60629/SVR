import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const PHASE135 = "PHASE-135-SOUTH-WALL-SLEEPING-CAT";
const CAT_ASSET_URLS = [
  "./assets/models/cat/The%20sleeping%20cat%202.glb",
  "./assets/models/cat/the_sleeping_cat_2.glb",
  "./assets/models/The%20sleeping%20cat%202.glb"
];

// South wall placement: centered against the south/front wall, slightly above floor.
const CAT_POSITION = new THREE.Vector3(0.0, 0.08, 17.35);
const CAT_YAW = Math.PI;
const CAT_SCALE = 1.15;

let lastScene = null;
let installed = false;

function makeFurTexture(){
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#d3b08a");
  g.addColorStop(.45, "#9c6e47");
  g.addColorStop(1, "#5d3b25");
  x.fillStyle = g;
  x.fillRect(0,0,c.width,c.height);
  x.globalAlpha = .22;
  for(let i=0;i<160;i++){
    x.strokeStyle = i % 2 ? "#fff0d0" : "#3b2418";
    x.lineWidth = 1 + Math.random()*2;
    x.beginPath();
    const y = Math.random()*c.height;
    x.moveTo(-20, y);
    x.bezierCurveTo(180, y + Math.random()*40-20, 340, y + Math.random()*40-20, 540, y + Math.random()*30-15);
    x.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function add(root, obj, x, y, z){
  obj.position.set(x, y, z);
  obj.frustumCulled = false;
  root.add(obj);
  return obj;
}

function makeFallbackCat(){
  const root = new THREE.Group();
  root.name = "SOUTH_WALL_SLEEPING_CAT_FALLBACK_PHASE135";
  const fur = new THREE.MeshStandardMaterial({ map: makeFurTexture(), color: 0xffffff, roughness: .88, metalness: 0, emissive: 0x120806, emissiveIntensity: .025 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b1a12, roughness: .9, metalness: 0 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xe9a2a8, roughness: .75, metalness: 0 });

  const body = add(root, new THREE.Mesh(new THREE.SphereGeometry(1.05, 40, 24), fur), 0, .58, 0);
  body.name = "PHASE135_CAT_BODY";
  body.scale.set(1.55, .58, .82);

  const head = add(root, new THREE.Mesh(new THREE.SphereGeometry(.48, 36, 22), fur), -1.05, .72, .05);
  head.name = "PHASE135_CAT_HEAD";
  head.scale.set(1.04, .82, .92);

  const earL = add(root, new THREE.Mesh(new THREE.ConeGeometry(.18, .42, 4), fur), -1.25, 1.12, -.24);
  earL.name = "PHASE135_CAT_EAR_L";
  earL.rotation.set(.15, .20, .76);
  const earR = add(root, new THREE.Mesh(new THREE.ConeGeometry(.18, .42, 4), fur), -1.25, 1.12, .30);
  earR.name = "PHASE135_CAT_EAR_R";
  earR.rotation.set(-.15, -.20, .76);

  const nose = add(root, new THREE.Mesh(new THREE.SphereGeometry(.055, 16, 10), pink), -1.50, .73, .05);
  nose.name = "PHASE135_CAT_NOSE";

  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.18,.58,.18),
    new THREE.Vector3(1.75,.70,.42),
    new THREE.Vector3(1.60,.86,.88),
    new THREE.Vector3(1.02,.73,.95)
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 24, .105, 12, false), fur);
  tail.name = "PHASE135_CAT_CURLED_TAIL";
  tail.frustumCulled = false;
  root.add(tail);

  for(let i=0;i<4;i++){
    const paw = add(root, new THREE.Mesh(new THREE.SphereGeometry(.18, 20, 12), fur), -0.48 + i*.34, .22, i%2 ? .54 : -.52);
    paw.name = `PHASE135_CAT_PAW_${i}`;
    paw.scale.set(1.4,.55,.75);
  }

  const shadow = add(root, new THREE.Mesh(new THREE.CircleGeometry(1.8, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .28, depthWrite: false })), .10, .012, .04);
  shadow.name = "PHASE135_CAT_SOFT_SHADOW";
  shadow.rotation.x = -Math.PI/2;

  const eyes = [
    add(root, new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), dark), -1.45, .84, -.09),
    add(root, new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), dark), -1.46, .84, .20)
  ];
  eyes.forEach((e, i)=>{ e.name = `PHASE135_CAT_SLEEPING_EYE_${i}`; e.scale.set(1.8,.25,.45); });

  return root;
}

function normalizeLoadedCat(model){
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x || 1, size.y || 1, size.z || 1);
  const scale = CAT_SCALE * (2.55 / maxDim);
  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
  model.traverse((o)=>{
    if (o.isMesh){
      o.frustumCulled = false;
      o.castShadow = false;
      o.receiveShadow = true;
      if (o.material){
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m)=>{
          m.side = THREE.FrontSide;
          if ("roughness" in m) m.roughness = Math.max(m.roughness ?? .75, .72);
          if ("metalness" in m) m.metalness = 0;
          m.needsUpdate = true;
        });
      }
    }
  });
  return model;
}

async function tryLoadCat(){
  const loader = new GLTFLoader();
  for (const url of CAT_ASSET_URLS){
    try{
      const gltf = await loader.loadAsync(url);
      const model = gltf.scene || gltf.scenes?.[0];
      if (model){
        model.name = "SOUTH_WALL_SLEEPING_CAT_GLB_PHASE135";
        model.userData.sourceUrl = url;
        return normalizeLoadedCat(model);
      }
    }catch(err){
      console.warn(`[${PHASE135}] cat GLB not available at ${url}`, err?.message || err);
    }
  }
  return null;
}

function addPlaque(root){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0,0,c.width,0);
  bg.addColorStop(0,"rgba(5,5,10,.92)");
  bg.addColorStop(.5,"rgba(28,12,40,.92)");
  bg.addColorStop(1,"rgba(5,5,10,.92)");
  x.fillStyle = bg;
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "#ffd77b";
  x.lineWidth = 10;
  x.strokeRect(14,14,c.width-28,c.height-28);
  x.fillStyle = "#fff7e3";
  x.font = "900 62px Arial";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("SVR SOUTH WALL CAT", c.width/2, 103);
  x.fillStyle = "#71f7ff";
  x.font = "800 32px Arial";
  x.fillText("sleeping lobby companion", c.width/2, 164);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8,.70), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
  sign.name = "PHASE135_CAT_SOUTH_WALL_PLAQUE";
  sign.position.set(0,1.52,-.18);
  sign.frustumCulled = false;
  root.add(sign);
}

async function install(scene){
  if(!scene || installed) return false;
  installed = true;

  const root = new THREE.Group();
  root.name = "SOUTH_WALL_CAT_DECOR_PHASE135";
  root.position.copy(CAT_POSITION);
  root.rotation.y = CAT_YAW;
  root.frustumCulled = false;

  const bed = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85,1.95,.26,64),
    new THREE.MeshStandardMaterial({ color: 0x220716, roughness: .82, metalness: 0, emissive: 0x180010, emissiveIntensity: .08 })
  );
  bed.name = "PHASE135_CAT_PURPLE_BED";
  bed.position.y = .13;
  bed.scale.z = .68;
  bed.frustumCulled = false;
  root.add(bed);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.90,.055,12,80),
    new THREE.MeshBasicMaterial({ color: 0xffd77b, toneMapped: false })
  );
  rim.name = "PHASE135_CAT_BED_GOLD_RIM";
  rim.position.y = .28;
  rim.rotation.x = Math.PI/2;
  rim.scale.z = .68;
  rim.frustumCulled = false;
  root.add(rim);

  const loaded = await tryLoadCat();
  const cat = loaded || makeFallbackCat();
  cat.position.y += .24;
  cat.rotation.y += 0;
  cat.frustumCulled = false;
  root.add(cat);

  addPlaque(root);

  const warm = new THREE.PointLight(0xffd77b, 1.2, 7, 2);
  warm.name = "PHASE135_CAT_WARM_LIGHT";
  warm.position.set(0,2.0,1.2);
  root.add(warm);

  scene.add(root);
  scene.userData.phase135SouthWallCat = root;
  console.log(`[${PHASE135}] installed`, loaded ? "uploaded GLB cat" : "procedural fallback cat", CAT_POSITION);
  return true;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrSouthWallCatPhase135){
  THREE.WebGLRenderer.prototype.__svrSouthWallCatPhase135 = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    install(lastScene);
    return originalRender.call(this, scene, camera);
  };
}
setInterval(()=>install(lastScene),1000);
console.log(`[${PHASE135}] loaded`);
