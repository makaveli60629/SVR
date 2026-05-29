import * as THREE from "three";

const PHASE132 = "PHASE-132-FORCE-VISIBLE-VERY-HIGH-MOON-MARS";
let lastScene = null;
let lastCamera = null;
let installed = false;
let api = null;

function tex(size, painter){
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d");
  painter(x, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function moonTexture(){
  return tex(768, (x, s)=>{
    const g = x.createRadialGradient(s*.34,s*.28,s*.04,s*.52,s*.52,s*.72);
    g.addColorStop(0,"#ffffff");
    g.addColorStop(.35,"#eef5ff");
    g.addColorStop(.72,"#aeb8c7");
    g.addColorStop(1,"#505865");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);
    [[.28,.34,.082],[.57,.28,.064],[.65,.58,.096],[.37,.70,.070],[.75,.40,.052],[.19,.62,.050],[.48,.48,.040]].forEach(([cx,cy,rr])=>{
      const r = s*rr;
      const cg = x.createRadialGradient(cx*s-r*.2,cy*s-r*.2,r*.05,cx*s,cy*s,r);
      cg.addColorStop(0,"rgba(255,255,255,.24)");
      cg.addColorStop(.45,"rgba(52,58,70,.42)");
      cg.addColorStop(1,"rgba(255,255,255,.05)");
      x.fillStyle = cg;
      x.beginPath();
      x.arc(cx*s, cy*s, r, 0, Math.PI*2);
      x.fill();
      x.strokeStyle = "rgba(255,255,255,.24)";
      x.lineWidth = Math.max(2, r*.045);
      x.stroke();
    });
    x.globalAlpha = .40;
    for(let i=0;i<80;i++){
      const cx=Math.random()*s, cy=Math.random()*s, r=3+Math.random()*22;
      x.fillStyle="rgba(60,65,75,.28)";
      x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.fill();
    }
  });
}

function marsTexture(){
  return tex(768, (x, s)=>{
    const g = x.createRadialGradient(s*.40,s*.30,s*.04,s*.52,s*.52,s*.74);
    g.addColorStop(0,"#ffc08a");
    g.addColorStop(.34,"#df774a");
    g.addColorStop(.74,"#8c321d");
    g.addColorStop(1,"#2f0d08");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);
    for(let i=0;i<110;i++){
      x.fillStyle = i%4===0 ? "rgba(255,220,150,.26)" : "rgba(52,12,8,.28)";
      x.beginPath();
      x.ellipse(Math.random()*s, Math.random()*s, 24+Math.random()*140, 4+Math.random()*20, Math.random()*Math.PI, 0, Math.PI*2);
      x.fill();
    }
    x.globalAlpha = .32;
    x.strokeStyle = "rgba(255,220,170,.42)";
    for(let i=0;i<44;i++){
      const y = Math.random()*s;
      x.lineWidth = 1+Math.random()*3;
      x.beginPath();
      x.moveTo(0,y);
      x.bezierCurveTo(s*.25,y+Math.random()*70-35,s*.72,y+Math.random()*70-35,s,y+Math.random()*35-18);
      x.stroke();
    }
  });
}

function makeHalo(color, scale){
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  const grad = x.createRadialGradient(128,128,10,128,128,126);
  grad.addColorStop(0, "rgba(255,255,255,.42)");
  grad.addColorStop(.28, `rgba(${r},${g},${b},.30)`);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = grad;
  x.fillRect(0,0,256,256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, color, transparent:true, depthTest:false, depthWrite:false, blending:THREE.AdditiveBlending }));
  sp.scale.setScalar(scale);
  sp.renderOrder = 249998;
  return sp;
}

function hideLowOrOldPlanets(scene){
  scene.traverse((o)=>{
    const n = String(o?.name || "");
    if (/SVR_NORTH_SKY_MOON_MARS|SVR_TEXTURED_MOON_MARS|SVR_EXISTING_TEXTURED_MOON|SVR_EXISTING_TEXTURED_MARS/.test(n)){
      o.visible = false;
    }
  });
}

function install(scene){
  if(!scene || installed) return false;
  installed = true;
  hideLowOrOldPlanets(scene);

  const group = new THREE.Group();
  group.name = "PHASE132_FORCE_VISIBLE_HIGH_SKY_MOON_MARS";
  group.frustumCulled = false;
  group.renderOrder = 249990;

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(7.8, 80, 52),
    new THREE.MeshBasicMaterial({ map: moonTexture(), color:0xffffff, toneMapped:false, depthTest:false, depthWrite:false })
  );
  moon.name = "PHASE132_VERY_HIGH_VISIBLE_MOON";
  moon.renderOrder = 250000;
  moon.frustumCulled = false;
  moon.add(makeHalo(0xdbeaff, 76));
  group.add(moon);

  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(5.2, 80, 52),
    new THREE.MeshBasicMaterial({ map: marsTexture(), color:0xffffff, toneMapped:false, depthTest:false, depthWrite:false })
  );
  mars.name = "PHASE132_VERY_HIGH_VISIBLE_MARS";
  mars.renderOrder = 250001;
  mars.frustumCulled = false;
  mars.add(makeHalo(0xff8f5b, 58));
  group.add(mars);

  const labelMoon = new THREE.PointLight(0xdbeaff, 2.2, 70, 2);
  const labelMars = new THREE.PointLight(0xff9b6b, 1.7, 60, 2);
  group.add(labelMoon, labelMars);

  api = { group, moon, mars, moonLight: labelMoon, marsLight: labelMars };
  scene.add(group);
  scene.userData.phase132VeryHighPlanets = api;
  console.log(`[${PHASE132}] installed force-visible very high Moon/Mars`);
  return true;
}

function updatePlanets(scene, camera){
  if(!scene || !camera) return;
  install(scene);
  if(!api) return;

  const camPos = new THREE.Vector3();
  try { camera.getWorldPosition(camPos); } catch(_e){ camPos.set(0,1.6,0); }
  const t = performance.now() * 0.001;

  // Keep planets extremely high but inside camera far range and above all lobby walls.
  // North sky = negative Z. These follow player X/Z lightly so they stay in render range.
  const moonBase = new THREE.Vector3(camPos.x - 28, camPos.y + 78, camPos.z - 92);
  const marsBase = new THREE.Vector3(camPos.x + 34, camPos.y + 92, camPos.z - 112);

  api.moon.position.set(
    moonBase.x + Math.sin(t * 0.035) * 6.0,
    moonBase.y + Math.sin(t * 0.045) * 1.8,
    moonBase.z + Math.cos(t * 0.030) * 3.5
  );
  api.mars.position.set(
    marsBase.x + Math.sin(t * 0.028 + 1.2) * 6.5,
    marsBase.y + Math.sin(t * 0.040 + .8) * 1.5,
    marsBase.z + Math.cos(t * 0.024 + .4) * 3.2
  );

  api.moon.rotation.y += 0.010;
  api.moon.rotation.x += 0.0014;
  api.mars.rotation.y += 0.013;
  api.mars.rotation.x += 0.0018;
  api.moonLight.position.copy(api.moon.position);
  api.marsLight.position.copy(api.mars.position);
  api.group.visible = true;
  api.group.frustumCulled = false;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrPhase132HighPlanets){
  THREE.WebGLRenderer.prototype.__svrPhase132HighPlanets = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    lastCamera = camera || lastCamera;
    updatePlanets(lastScene, lastCamera);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>updatePlanets(lastScene,lastCamera), 700);
console.log(`[${PHASE132}] loaded`);
