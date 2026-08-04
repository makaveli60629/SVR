import * as THREE from "three";
const LABEL="UPDATE-3.0-PHASE-215-UPRIGHT-STANCE-CLOSE-FAR-TELEPORT-CLEAN-SKY-LOCK";
function stamp(){
  window.SVR_PHASE106=window.SVR_PHASE106||{};window.SVR_PHASE106.build=LABEL;
  window.SVR_PHASE215={build:LABEL,active:true,uprightStanding:true,overlayPurge:true,duplicateSkyClean:true,checkedAt:new Date().toISOString()};
  document.title=`SVR Poker • ${LABEL}`;
  ["hud","sceneNav","log","err","bootFallback","status","mode"].forEach(id=>{const e=document.getElementById(id);if(e){e.style.display="none";e.style.opacity="0";e.style.pointerEvents="none";e.style.visibility="hidden";}});
  document.querySelectorAll(".pill").forEach(e=>{if((e.textContent||"").includes("BUILD:"))e.textContent=`BUILD: ${LABEL}`});
}
function floorY(x,z){const ax=Math.abs(x);if(ax>=9.2&&ax<=19.5&&z<=9.7&&z>=-.35)return THREE.MathUtils.clamp(((8.65-z)/8.15)*3.42,0,3.42);if(z<=-10&&z>=-16.4&&ax<=19.8)return 3.42;if(ax>=14.6&&ax<=19.8&&z<=7.4&&z>=-13.5)return 3.42;return 0;}
function purge(){
  const scene=window.__SVR_SCENE__,cam=window.__SVR_CAMERA__,ren=window.__SVR_RENDERER__;
  if(!scene)return;
  const remove=[];
  scene.traverse(o=>{const n=String(o.name||"");if(/PHASE20[034]_VISUAL|PHASE203_ACTION|FACE_OVERLAY|BLACK_OVERLAY|VIEW_OVERLAY|TARGET_LABEL|GUIDANCE_LABEL/i.test(n)||o.userData?.phase204Overlay||o.userData?.phase203Action)remove.push(o);});
  remove.forEach(o=>o.parent?.remove(o));
  const roots=[];if(cam)roots.push(cam);try{const x=ren?.xr?.getCamera?.(cam);if(x)roots.push(x);}catch{}
  roots.forEach(r=>r.children?.slice?.().forEach(o=>{const n=String(o.name||"");const plane=o.isSprite||(o.isMesh&&/Plane|Circle/.test(o.geometry?.type||"")&&o.material?.transparent);if(plane||/OVERLAY|GUIDE|TARGET|LABEL|BLACK|FACE/i.test(n)){o.visible=false;o.parent?.remove(o);}}));
}
function texMoon(){const c=document.createElement("canvas"),ctx=c.getContext("2d");c.width=1280;c.height=640;const g=ctx.createRadialGradient(540,260,50,640,320,520);g.addColorStop(0,"#fff");g.addColorStop(.3,"#e8e2d6");g.addColorStop(.72,"#8d908e");g.addColorStop(1,"#454c58");ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);for(let i=0;i<92;i++){const x=Math.random()*c.width,y=Math.random()*c.height,r=7+Math.random()*54;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle="rgba(22,25,32,.18)";ctx.fill();ctx.beginPath();ctx.arc(x-r*.14,y-r*.16,r*.72,0,Math.PI*2);ctx.strokeStyle="rgba(255,255,255,.19)";ctx.lineWidth=Math.max(2,r*.06);ctx.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function texMars(){const c=document.createElement("canvas"),ctx=c.getContext("2d");c.width=1024;c.height=512;const g=ctx.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,"#ff8d50");g.addColorStop(.55,"#9b301d");g.addColorStop(1,"#461209");ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);for(let i=0;i<45;i++){ctx.beginPath();ctx.ellipse(Math.random()*c.width,Math.random()*c.height,18+Math.random()*52,6+Math.random()*22,Math.random()*Math.PI,0,Math.PI*2);ctx.fillStyle=Math.random()>.5?"rgba(255,200,120,.13)":"rgba(35,5,3,.20)";ctx.fill();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function sky(){
  const scene=window.__SVR_SCENE__;if(!scene)return false;
  const kill=[];scene.traverse(o=>{const n=String(o.name||"");if(/MOON|MARS/i.test(n)&&!/PHASE215_FINAL/.test(n))kill.push(o);});kill.forEach(o=>o.parent?.remove(o));
  let m=scene.getObjectByName("PHASE215_FINAL_SINGLE_BIG_TEXTURED_MOON"),r=scene.getObjectByName("PHASE215_FINAL_SINGLE_TEXTURED_MARS");
  if(!m){m=new THREE.Mesh(new THREE.SphereGeometry(5.5,96,64),new THREE.MeshStandardMaterial({map:texMoon(),roughness:.78,emissive:0x20283a,emissiveIntensity:.32}));m.name="PHASE215_FINAL_SINGLE_BIG_TEXTURED_MOON";scene.add(m);}
  if(!r){r=new THREE.Mesh(new THREE.SphereGeometry(1.18,56,36),new THREE.MeshStandardMaterial({map:texMars(),roughness:.82,emissive:0x300904,emissiveIntensity:.25}));r.name="PHASE215_FINAL_SINGLE_TEXTURED_MARS";scene.add(r);}
  if(!scene.userData._phase215Sky){scene.userData._phase215Sky=true;const old=scene.userData._tickWorld;scene.userData._tickWorld=(dt)=>{if(typeof old==="function")old(dt);const t=performance.now()*.001;m.position.set(-8+Math.sin(t*.025)*1.2,22,-32+Math.cos(t*.025));m.rotation.y=t*.075;r.position.set(m.position.x+Math.cos(t*.07)*8,m.position.y-1.6,m.position.z-5+Math.sin(t*.07)*2);r.rotation.y=t*.13;};}
  return true;
}
function install(){stamp();window.SVR_PHASE215_FLOOR_HEIGHT=floorY;window.SVR_PHASE214_FLOOR_HEIGHT=floorY;purge();sky();return !!window.__SVR_SCENE__;}
let n=0;const id=setInterval(()=>{n++;if(install()||n>140)clearInterval(id);},200);[500,1200,2400,5000,9000,15000].forEach(ms=>setTimeout(install,ms));
