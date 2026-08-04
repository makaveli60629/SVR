import * as THREE from "three";
const LABEL="UPDATE-3.0-PHASE-213-STAIR-INPUT-BEAM-FACE-FINAL-LOCK";
function stamp(){
  window.SVR_PHASE106=window.SVR_PHASE106||{};
  window.SVR_PHASE106.build=LABEL;
  window.SVR_PHASE213={build:LABEL,active:true,stairInputBeamFaceFinal:true,checkedAt:new Date().toISOString()};
  document.title=`SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(e=>{if((e.textContent||"").includes("BUILD:"))e.textContent=`BUILD: ${LABEL}`});
  ["hud","sceneNav","log","err","bootFallback","status","mode"].forEach(id=>{const e=document.getElementById(id);if(e){e.style.display="none";e.style.opacity="0";e.style.pointerEvents="none";e.style.visibility="hidden";}});
}
function floorY(x,z){
  const ax=Math.abs(x);
  if(ax>=10.0&&ax<=18.2&&z<=9.2&&z>=0.1) return THREE.MathUtils.clamp(((8.45-z)/7.75)*3.42,0,3.42);
  if(z<=-10.6&&z>=-15.6&&ax<=18.8) return 3.42;
  if(ax>=15.0&&ax<=18.8&&z<=6.9&&z>=-12.8) return 3.42;
  return 0;
}
function texMoon(){
  const c=document.createElement("canvas"),ctx=c.getContext("2d");c.width=1024;c.height=512;
  const g=ctx.createRadialGradient(430,210,40,512,256,420);g.addColorStop(0,"#fff");g.addColorStop(.35,"#ddd9cf");g.addColorStop(.75,"#8e918e");g.addColorStop(1,"#454b55");ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);
  for(let i=0;i<64;i++){const x=Math.random()*c.width,y=Math.random()*c.height,r=8+Math.random()*46;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle="rgba(25,28,34,.18)";ctx.fill();ctx.beginPath();ctx.arc(x-r*.15,y-r*.16,r*.72,0,Math.PI*2);ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=Math.max(2,r*.06);ctx.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function texMars(){
  const c=document.createElement("canvas"),ctx=c.getContext("2d");c.width=768;c.height=384;
  const g=ctx.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,"#ff8b51");g.addColorStop(.55,"#9b301c");g.addColorStop(1,"#4a130b");ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function sign(text){
  const c=document.createElement("canvas"),ctx=c.getContext("2d");c.width=900;c.height=240;ctx.fillStyle="rgba(1,4,10,.78)";ctx.fillRect(0,0,900,240);ctx.strokeStyle="#7ffcff";ctx.lineWidth=10;ctx.strokeRect(18,18,864,204);ctx.fillStyle="#fff";ctx.font="900 54px system-ui,Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,450,120);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.Mesh(new THREE.PlaneGeometry(3.4,.9),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
}
function sceneWork(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  window.SVR_PHASE213_FLOOR_HEIGHT=window.SVR_PHASE212_FLOOR_HEIGHT=window.SVR_PHASE211_FLOOR_HEIGHT=window.SVR_PHASE209_FLOOR_HEIGHT=floorY;
  scene.traverse(o=>{if(/FACE_OVERLAY|VIEW_OVERLAY|PHASE204|PHASE203_ACTION/i.test(String(o.name||"")))o.visible=false;});
  if(!scene.getObjectByName("PHASE213_FINAL_BIG_TEXTURED_MOON")){const m=new THREE.Mesh(new THREE.SphereGeometry(5.1,80,52),new THREE.MeshStandardMaterial({map:texMoon(),roughness:.78,emissive:0x20283a,emissiveIntensity:.32}));m.name="PHASE213_FINAL_BIG_TEXTURED_MOON";scene.add(m);const r=new THREE.Mesh(new THREE.SphereGeometry(1.15,48,32),new THREE.MeshStandardMaterial({map:texMars(),roughness:.82,emissive:0x300904,emissiveIntensity:.25}));r.name="PHASE213_FINAL_TEXTURED_MARS";scene.add(r);const old=scene.userData._tickWorld;scene.userData._tickWorld=(dt)=>{if(typeof old==="function")old(dt);const t=performance.now()*.001;m.position.set(-8+Math.sin(t*.025)*1.2,22,-32+Math.cos(t*.025));m.rotation.y=t*.075;r.position.set(m.position.x+Math.cos(t*.07)*8,m.position.y-1.6,m.position.z-5+Math.sin(t*.07)*2);r.rotation.y=t*.13;};}
  if(!scene.getObjectByName("PHASE213_FINISH_ROOT")){const root=new THREE.Group();root.name="PHASE213_FINISH_ROOT";scene.add(root);[[0,-12.3,"LEGENDS HALL"],[-8.8,-12.3,"EVENTS"],[8.8,-12.3,"SPONSORS"],[-15.6,-3,"LEFT LOUNGE"],[15.6,-3,"RIGHT LOUNGE"]].forEach(([x,z,t])=>{const s=sign(t);s.position.set(x,4.8,z);root.add(s);});for(let i=0;i<16;i++){const a=i/16*Math.PI*2,l=new THREE.PointLight([0x7ffcff,0xffd98a,0xa77cff,0x8dffb4][i%4],.42,8,2);l.position.set(Math.cos(a)*15,3+(i%2),Math.sin(a)*12-4);root.add(l);} }
  return true;
}
stamp();let n=0;const id=setInterval(()=>{stamp();n++;if(sceneWork()||n>80)clearInterval(id);},250);[600,1800,4000,8000].forEach(ms=>setTimeout(()=>{stamp();sceneWork();},ms));
