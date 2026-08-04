import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-209-QUEST-LOCOMOTION-TELEPORT-STAIR-SKY-LOCK";
const BAD_FACE_OBJECT = /FACE_OVERLAY|BLACK_OVERLAY|VIEW_OVERLAY|TARGET_LABEL|GUIDANCE_LABEL|PHASE204_VISUAL_GUIDE|PHASE204_GUIDANCE|PHASE204_FEEDBACK|PHASE204_TARGET|PHASE204_GUIDE_|PHASE203_ACTION_PULSE/i;

function lockLabel(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE209 = window.SVR_PHASE209 || {};
  Object.assign(window.SVR_PHASE209, {
    build: LABEL,
    active: true,
    noFaceSquares: true,
    headRelativeMove: true,
    holdReleaseTeleport: true,
    moonMarsScaled: true,
    stairWalkHeight: true,
    checkedAt: new Date().toISOString()
  });
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE203_BOOT_DISABLED = true;
  window.SVR_PHASE204_BOOT_DISABLED = true;
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function makeMoonTexture(){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(410,210,40,512,256,390);
  g.addColorStop(0,"#ffffff"); g.addColorStop(.35,"#dcdad0"); g.addColorStop(.72,"#8d8f8b"); g.addColorStop(1,"#4d5054");
  ctx.fillStyle = g; ctx.fillRect(0,0,c.width,c.height);
  const craters = [[220,170,44],[365,285,62],[610,205,38],[730,350,54],[835,160,30],[510,380,26],[120,330,28],[940,290,36]];
  for (const [x,y,r] of craters){
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle="rgba(25,27,31,.20)"; ctx.fill();
    ctx.beginPath(); ctx.arc(x-r*.15,y-r*.18,r*.72,0,Math.PI*2); ctx.strokeStyle="rgba(255,255,255,.22)"; ctx.lineWidth=Math.max(3,r*.08); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeMarsTexture(){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#f27a45"); g.addColorStop(.48,"#9e3422"); g.addColorStop(1,"#5e2117");
  ctx.fillStyle = g; ctx.fillRect(0,0,c.width,c.height);
  for(let i=0;i<38;i++){
    ctx.beginPath();
    const x=Math.random()*c.width, y=Math.random()*c.height, r=10+Math.random()*42;
    ctx.ellipse(x,y,r,r*(.25+Math.random()*.55),Math.random()*Math.PI,0,Math.PI*2);
    ctx.fillStyle = Math.random()>.5 ? "rgba(255,190,120,.16)" : "rgba(45,8,5,.22)";
    ctx.fill();
  }
  ctx.fillStyle="rgba(255,210,180,.22)"; ctx.fillRect(0,36,c.width,30);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function installSkyFix(scene){
  const moon = scene.getObjectByName("PHASE200_SINGLE_VISIBLE_MOON_LOCKED");
  const mars = scene.getObjectByName("PHASE200_SINGLE_VISIBLE_MARS_LOCKED");
  if (moon){
    moon.name = "PHASE209_DOUBLE_SIZE_TEXTURED_MOON_HIGH_LOCKED";
    moon.material = new THREE.MeshStandardMaterial({ map:makeMoonTexture(), color:0xffffff, roughness:0.78, metalness:0.02, emissive:0x1d2230, emissiveIntensity:0.20 });
    moon.geometry?.dispose?.();
    moon.geometry = new THREE.SphereGeometry(2.56,72,48);
    moon.position.set(-4.6,17.8,-24.0);
  }
  if (mars){
    mars.name = "PHASE209_TEXTURED_MARS_HIGH_ORBIT_LOCKED";
    mars.material = new THREE.MeshStandardMaterial({ map:makeMarsTexture(), color:0xffffff, roughness:0.82, metalness:0.02, emissive:0x2a0803, emissiveIntensity:0.24 });
    mars.geometry?.dispose?.();
    mars.geometry = new THREE.SphereGeometry(0.78,48,32);
    mars.position.set(3.6,16.1,-27.2);
  }
  if (!scene.userData._phase209SkyWrapped){
    scene.userData._phase209SkyWrapped = true;
    const oldTick = scene.userData._tickWorld;
    scene.userData._tickWorld = (dt)=>{
      if (typeof oldTick === "function") oldTick(dt);
      const t = performance.now()*0.001;
      const m = scene.getObjectByName("PHASE209_DOUBLE_SIZE_TEXTURED_MOON_HIGH_LOCKED");
      const r = scene.getObjectByName("PHASE209_TEXTURED_MARS_HIGH_ORBIT_LOCKED");
      if (m){
        m.rotation.y = t*0.060;
        m.rotation.x = Math.sin(t*0.025)*0.08;
        m.position.set(-4.6 + Math.sin(t*0.030)*1.1, 17.8 + Math.sin(t*0.017)*0.25, -24.0 + Math.cos(t*0.030)*0.75);
      }
      if (r && m){
        r.rotation.y = t*0.105;
        r.position.set(m.position.x + Math.cos(t*0.070)*5.8, m.position.y - 1.35 + Math.sin(t*0.050)*0.35, m.position.z - 4.1 + Math.sin(t*0.070)*1.8);
      }
    };
  }
}

function installStairHeight(){
  window.SVR_PHASE209_FLOOR_HEIGHT = (x,z)=>{
    const ax = Math.abs(x);
    if (ax > 11.35 && ax < 16.7 && z < 8.4 && z > 1.05){
      const t = THREE.MathUtils.clamp((7.95 - z) / 6.7, 0, 1);
      return THREE.MathUtils.clamp(t * 3.42, 0, 3.42);
    }
    if (z < -11.0 && z > -15.25 && ax < 18.2) return 3.42;
    if (ax > 15.35 && ax < 18.35 && z < 6.4 && z > -12.3) return 3.42;
    return 0;
  };
}

function suppressHtmlFaceSquares(){
  ["bootFallback","log","err"].forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display="none"; el.style.opacity="0"; el.style.pointerEvents="none";
  });
  const renderer = window.__SVR_RENDERER__;
  if (renderer?.xr?.isPresenting){
    document.body.classList.add("xr-active");
    ["hud","sceneNav"].forEach(id=>{
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display="none"; el.style.opacity="0"; el.style.pointerEvents="none";
    });
  }
}
function removeCameraAttachedSquares(scene,camera){
  const roots = [camera, rendererArrayCamera()].filter(Boolean);
  roots.forEach(root=>{
    root.children?.slice?.().forEach(child=>{
      const name = String(child.name || "");
      if (child.isMesh || child.isSprite || child.isLine || BAD_FACE_OBJECT.test(name) || child.userData?.phase204Overlay){
        child.visible = false;
        child.parent?.remove(child);
      }
    });
  });
  const toRemove=[];
  scene.traverse(obj=>{
    const name = String(obj.name || "");
    if (BAD_FACE_OBJECT.test(name)) toRemove.push(obj);
  });
  toRemove.forEach(obj=>obj.parent?.remove(obj));
}
function rendererArrayCamera(){
  try { return window.__SVR_RENDERER__?.xr?.getCamera?.(window.__SVR_CAMERA__); } catch { return null; }
}

function install(){
  lockLabel();
  installStairHeight();
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__;
  if (!scene || !camera) return false;
  installSkyFix(scene);
  suppressHtmlFaceSquares();
  removeCameraAttachedSquares(scene,camera);
  const renderer = window.__SVR_RENDERER__;
  if (renderer?.xr && !window.SVR_PHASE209_XR_LISTENERS){
    window.SVR_PHASE209_XR_LISTENERS = true;
    renderer.xr.addEventListener("sessionstart", ()=>{
      setTimeout(()=>{ suppressHtmlFaceSquares(); removeCameraAttachedSquares(scene,camera); },50);
      setTimeout(()=>{ suppressHtmlFaceSquares(); removeCameraAttachedSquares(scene,camera); },500);
      setTimeout(()=>{ suppressHtmlFaceSquares(); removeCameraAttachedSquares(scene,camera); },1500);
    });
  }
  window.SVR_PHASE209_READY = true;
  return true;
}

let tries = 0;
const timer = setInterval(()=>{
  tries++;
  if (install() || tries > 80) clearInterval(timer);
},250);
setTimeout(install,1000);
setTimeout(install,2500);
setTimeout(install,5000);
