import * as THREE from "three";

const PHASE133 = "PHASE-133-CAMERA-SAFE-HIGH-SKY-MOON-MARS";
let lastScene = null;
let lastCamera = null;
let installed = false;
let sky = null;

function makeTexture(kind){
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d");
  const s = c.width;

  if (kind === "moon"){
    const g = x.createRadialGradient(s*.35,s*.28,s*.04,s*.52,s*.52,s*.72);
    g.addColorStop(0,"#ffffff");
    g.addColorStop(.32,"#eef5ff");
    g.addColorStop(.68,"#aeb9c8");
    g.addColorStop(1,"#4c5360");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);
    [[.28,.34,.085],[.57,.27,.065],[.66,.58,.100],[.36,.70,.072],[.76,.40,.055],[.20,.61,.050],[.48,.48,.040],[.61,.78,.034]].forEach(([cx,cy,rr])=>{
      const r = s*rr;
      const cg = x.createRadialGradient(cx*s-r*.22,cy*s-r*.22,r*.06,cx*s,cy*s,r);
      cg.addColorStop(0,"rgba(255,255,255,.28)");
      cg.addColorStop(.45,"rgba(48,55,68,.46)");
      cg.addColorStop(1,"rgba(255,255,255,.05)");
      x.fillStyle = cg;
      x.beginPath(); x.arc(cx*s,cy*s,r,0,Math.PI*2); x.fill();
      x.strokeStyle = "rgba(255,255,255,.26)"; x.lineWidth = Math.max(2,r*.045); x.stroke();
    });
    x.globalAlpha = .38;
    for(let i=0;i<130;i++){
      const cx=Math.random()*s, cy=Math.random()*s, r=2+Math.random()*22;
      x.fillStyle="rgba(55,62,74,.26)";
      x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.fill();
    }
  } else {
    const g = x.createRadialGradient(s*.40,s*.30,s*.04,s*.52,s*.52,s*.74);
    g.addColorStop(0,"#ffc58e");
    g.addColorStop(.34,"#e27a4c");
    g.addColorStop(.74,"#8b301b");
    g.addColorStop(1,"#2d0c07");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);
    for(let i=0;i<145;i++){
      x.fillStyle = i%4===0 ? "rgba(255,224,155,.28)" : "rgba(48,10,6,.30)";
      x.beginPath();
      x.ellipse(Math.random()*s,Math.random()*s,24+Math.random()*175,4+Math.random()*24,Math.random()*Math.PI,0,Math.PI*2);
      x.fill();
    }
    x.globalAlpha = .35;
    x.strokeStyle = "rgba(255,224,170,.42)";
    for(let i=0;i<60;i++){
      const y = Math.random()*s;
      x.lineWidth = 1+Math.random()*3.4;
      x.beginPath();
      x.moveTo(0,y);
      x.bezierCurveTo(s*.25,y+Math.random()*80-40,s*.72,y+Math.random()*80-40,s,y+Math.random()*38-19);
      x.stroke();
    }
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeHaloTexture(color){
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  const r = (color >> 16) & 255;
  const g = (color >> 8) & 255;
  const b = color & 255;
  const grad = x.createRadialGradient(256,256,28,256,256,250);
  grad.addColorStop(0,"rgba(255,255,255,.42)");
  grad.addColorStop(.27,`rgba(${r},${g},${b},.28)`);
  grad.addColorStop(1,"rgba(0,0,0,0)");
  x.fillStyle = grad;
  x.fillRect(0,0,512,512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSprite(name, map, size, renderOrder){
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map,
    color: 0xffffff,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  }));
  sprite.name = name;
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = renderOrder;
  sprite.frustumCulled = false;
  return sprite;
}

function hideOld(scene){
  scene.traverse((o)=>{
    const n = String(o?.name || "");
    if (/MOON|MARS|PLANET|SVR_NORTH_SKY_MOON_MARS|PHASE132_FORCE_VISIBLE/.test(n) && !/PHASE133/.test(n)){
      if (o.isMesh || o.isSprite || o.isGroup) o.visible = false;
    }
  });
}

function install(scene){
  if(!scene || installed) return false;
  installed = true;
  hideOld(scene);

  const group = new THREE.Group();
  group.name = "PHASE133_CAMERA_SAFE_HIGH_SKY_PLANETS";
  group.frustumCulled = false;

  const moonHalo = makeSprite("PHASE133_MOON_HALO", makeHaloTexture(0xdbeaff), 34, 299990);
  const moon = makeSprite("PHASE133_HIGH_VISIBLE_MOON", makeTexture("moon"), 15.5, 300000);
  const marsHalo = makeSprite("PHASE133_MARS_HALO", makeHaloTexture(0xff8f5b), 27, 299991);
  const mars = makeSprite("PHASE133_HIGH_VISIBLE_MARS", makeTexture("mars"), 10.5, 300001);

  group.add(moonHalo, moon, marsHalo, mars);
  scene.add(group);

  sky = { group, moon, mars, moonHalo, marsHalo };
  scene.userData.phase133HighSkyPlanets = sky;
  console.log(`[${PHASE133}] installed camera-safe high sky planets`);
  return true;
}

function update(scene, camera){
  if(!scene || !camera) return;
  install(scene);
  if(!sky) return;

  // Prevent camera far clipping on Quest/Desktop.
  if (camera.far < 800){
    camera.far = 800;
    camera.updateProjectionMatrix?.();
  }

  const camPos = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0,1,0);

  try{
    camera.getWorldPosition(camPos);
    camera.getWorldDirection(forward);
  }catch(_err){
    camPos.set(0,1.6,0);
    forward.set(0,0,-1);
  }

  forward.y = 0;
  if (forward.lengthSq() < 0.0001) forward.set(0,0,-1);
  forward.normalize();
  right.crossVectors(forward, up).normalize();

  const t = performance.now() * 0.001;

  // Very high but still in front of the camera and inside far range.
  const moonPos = camPos.clone()
    .addScaledVector(forward, 86)
    .addScaledVector(up, 54 + Math.sin(t * .30) * 1.8)
    .addScaledVector(right, -25 + Math.sin(t * .18) * 4.5);

  const marsPos = camPos.clone()
    .addScaledVector(forward, 98)
    .addScaledVector(up, 68 + Math.sin(t * .24 + 1.2) * 1.6)
    .addScaledVector(right, 31 + Math.sin(t * .15 + .8) * 4.0);

  sky.moon.position.copy(moonPos);
  sky.moonHalo.position.copy(moonPos);
  sky.mars.position.copy(marsPos);
  sky.marsHalo.position.copy(marsPos);

  // Sprite UV texture rotation for visible surface motion.
  sky.moon.material.rotation = (sky.moon.material.rotation || 0) + 0.0016;
  sky.mars.material.rotation = (sky.mars.material.rotation || 0) + 0.0022;

  sky.group.visible = true;
  sky.group.frustumCulled = false;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrPhase133CameraSafePlanets){
  THREE.WebGLRenderer.prototype.__svrPhase133CameraSafePlanets = true;
  THREE.WebGLRenderer.prototype.render = function(scene, camera){
    lastScene = scene || lastScene;
    lastCamera = camera || lastCamera;
    update(lastScene, lastCamera);
    return originalRender.call(this, scene, camera);
  };
}

setInterval(()=>update(lastScene,lastCamera), 500);
console.log(`[${PHASE133}] loaded`);
