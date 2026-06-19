import * as THREE from "three";

const LABEL = "PHASE-103-VIEW-POLISH-LOCK";
const ROOT = "PHASE103_VIEW_POLISH_ROOT";

function glowMat(color, opacity=.18){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function softTexture(){
  const c=document.createElement("canvas"); c.width=512; c.height=512;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,512,512);
  g.addColorStop(0,"#080914"); g.addColorStop(.5,"#101522"); g.addColorStop(1,"#050711");
  ctx.fillStyle=g; ctx.fillRect(0,0,512,512);
  for(let i=0;i<80;i++){
    ctx.beginPath(); const y=Math.random()*512; ctx.moveTo(0,y);
    for(let x=0;x<=512;x+=24) ctx.lineTo(x,y+Math.sin(x*.02+i)*(8+Math.random()*18));
    ctx.strokeStyle=i%2?"rgba(127,252,255,.05)":"rgba(255,217,138,.045)"; ctx.lineWidth=.8+Math.random()*1.5; ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(8,7); return tex;
}
function clearView(scene, renderer){
  let hidden=0;
  document.querySelectorAll("#bootFallback,#hud,#log,#err,#sceneNav,.phase-label").forEach(el=>{ el.style.display="none"; el.style.opacity="0"; el.style.pointerEvents="none"; hidden++; });
  const safe=document.getElementById("safeStage");
  if(safe && document.body.classList.contains("runtime-visible")){ safe.style.display="none"; safe.style.opacity="0"; safe.style.visibility="hidden"; hidden++; }
  scene.fog=null;
  scene.traverse(o=>{
    const n=String(o.name||"");
    if(/BLACK|VIGNETTE|DARK_EDGE|SCREEN_OVERLAY|FADE_PLANE|CAMERA_OVERLAY|DUST|FOG/i.test(n) && !/MOON|MARS/i.test(n)){
      o.visible=false; o.userData.phase103ViewHidden=true; hidden++;
    }
  });
  renderer?.setClearColor?.(0x010208,1);
  if(renderer){ renderer.toneMappingExposure=Math.min(Math.max(renderer.toneMappingExposure||1,.95),1.04); renderer.shadowMap.enabled=false; }
  return hidden;
}
function applySurfaceTextures(scene){
  let changed=0; const tex=softTexture();
  scene.traverse(o=>{
    const n=String(o.name||""); if(!o.isMesh) return;
    if(/PHASE99_EXPANDED_SOLID_MAIN_FLOOR|MAIN_FLOOR|FREE_SPAWN|WALKWAY/i.test(n)){
      o.material=new THREE.MeshStandardMaterial({map:tex,color:0xffffff,roughness:.42,metalness:.16,emissive:0x02030a,emissiveIntensity:.08});
      o.frustumCulled=false; changed++;
    }
    if(/PHASE99_SOLID_.*WALL|REAR_WALL|LEFT_WALL|RIGHT_WALL|FRONT_LOW_WALL/i.test(n)){
      o.material=new THREE.MeshStandardMaterial({color:0x0b0f1b,roughness:.62,metalness:.05,emissive:0x030612,emissiveIntensity:.18});
      o.frustumCulled=false; changed++;
    }
  });
  return changed;
}
function addLights(scene){
  const old=scene.getObjectByName("PHASE103_LIGHT_SET"); if(old) old.parent?.remove(old);
  const rig=new THREE.Group(); rig.name="PHASE103_LIGHT_SET"; scene.add(rig);
  rig.add(new THREE.HemisphereLight(0xa8ddff,0x15071e,1.25));
  const key=new THREE.DirectionalLight(0xffd98a,1.15); key.position.set(-4,8,5); key.castShadow=false; rig.add(key);
  const fill=new THREE.PointLight(0x7ffcff,1.35,18,1.65); fill.position.set(0,4.2,5.5); rig.add(fill);
  const center=new THREE.PointLight(0xffb86b,2.1,8,1.8); center.position.set(0,3.8,-2.8); rig.add(center);
  return 4;
}
function fixSigns(scene){
  let fixed=0;
  scene.traverse(o=>{
    const n=String(o.name||"");
    if(!/SIGN|DISPLAY|PANEL/.test(n)) return;
    if(o.material){ const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>{ if(m){ m.side=THREE.DoubleSide; m.depthWrite=false; m.needsUpdate=true; }}); }
    o.renderOrder=Math.max(o.renderOrder||0,650); o.userData.phase103SignFixed=true; fixed++;
  });
  return fixed;
}
function removeDuplicateTableSurface(scene){
  let removed=0;
  let old=scene.getObjectByName("PHASE103_MAIN_TABLE_SURFACE");
  while(old){
    old.parent?.remove(old);
    removed++;
    old=scene.getObjectByName("PHASE103_MAIN_TABLE_SURFACE");
  }
  return { removed, created:false, reason:"Removed Phase 103 overlay table; original poker table is preserved." };
}
function enhancePlanets(scene){
  let changed=0;
  scene.traverse(o=>{
    const n=String(o.name||"");
    if(/MOON/i.test(n) && o.isMesh){ o.visible=true; o.scale.setScalar(Math.max(o.scale.x||1,1.8)); o.position.y=Math.max(o.position.y,10.5); changed++; }
    if(/MARS/i.test(n) && o.isMesh){ o.visible=true; o.scale.setScalar(Math.max(o.scale.x||1,.9)); o.position.y=Math.max(o.position.y,9.2); changed++; }
  });
  return changed;
}
function install(){
  const scene=window.__SVR_SCENE__, renderer=window.__SVR_RENDERER__;
  if(!scene||!renderer) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; root.visible=false; scene.add(root);
  const hidden=clearView(scene,renderer);
  const textured=applySurfaceTextures(scene);
  const lights=addLights(scene);
  const signs=fixSigns(scene);
  const table=removeDuplicateTableSurface(scene);
  const planets=enhancePlanets(scene);
  window.SVR_PHASE103_VIEW_POLISH_LOCK={build:LABEL,active:true,hidden,textured,lights,signs,table,planets,duplicateTableRemoved:true,blackOverlayRemoved:true,desktopPanelsMinimized:true,siteTouched:false,publicRootTouched:false,pokerLogicTouched:false,watchTouched:false,movementTouched:false,privateScenesTouched:false,questSafe:true,checkedAt:new Date().toISOString()};
  window.SVR_LIVE_BUILD_POINTER=LABEL; window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>80) clearInterval(timer); },300);
[900,2000,4200,7600,12000].forEach(d=>setTimeout(install,d));
