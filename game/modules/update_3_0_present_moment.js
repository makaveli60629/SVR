import * as THREE from "three";
const BUILD = "PHASE-100-UPDATE-3.0-PRESENT-MOMENT-LOCK";
function tex(title, sub='', w=1024, h=420){
  const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#02070a'); g.addColorStop(.55,'#19042b'); g.addColorStop(1,'#031c19');
  x.fillStyle=g; x.fillRect(0,0,w,h); x.strokeStyle='rgba(140,255,242,.95)'; x.lineWidth=10; x.strokeRect(18,18,w-36,h-36);
  x.textAlign='center'; x.textBaseline='middle'; x.shadowColor='rgba(140,255,242,.7)'; x.shadowBlur=22; x.fillStyle='#fff'; x.font='900 70px system-ui,Segoe UI,Arial'; x.fillText(title,w/2,h*.36,w-80);
  x.shadowBlur=8; x.fillStyle='#bafff2'; x.font='700 32px system-ui,Segoe UI,Arial'; String(sub).split('\n').forEach((line,i)=>x.fillText(line,w/2,h*.62+i*45,w-90));
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
function panel(title, sub, W=2.8,H=1.0){ return new THREE.Mesh(new THREE.PlaneGeometry(W,H), new THREE.MeshBasicMaterial({map:tex(title,sub),transparent:true,side:THREE.DoubleSide,depthWrite:false})); }
function glass(color=0x82fff0, opacity=.15){ return new THREE.MeshStandardMaterial({color,transparent:true,opacity,roughness:.06,metalness:.2,emissive:color,emissiveIntensity:.25,side:THREE.DoubleSide,depthWrite:false}); }
function addPortal(root, title, sub, key, pos, ry, gotoScene){
  const g=new THREE.Group(); g.name='SVR_UPDATE3_PORTAL_'+key; g.position.copy(pos); g.rotation.y=ry; root.add(g);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(2.3,3.05), glass(0x8ffff2,.17)); back.position.set(0,1.75,0); g.add(back);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.88,.025,12,96), new THREE.MeshBasicMaterial({color:0x8ffff2,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending})); ring.position.set(0,1.55,.035); g.add(ring);
  const sign=panel(title,sub,2.7,.78); sign.position.set(0,3.46,.06); g.add(sign);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.18,.08,64), new THREE.MeshStandardMaterial({color:0x061010,metalness:.75,roughness:.28,emissive:0x0b746c,emissiveIntensity:.35})); base.position.set(0,.04,.04); g.add(base);
  const light=new THREE.PointLight(0x8ffff2,.7,5,2); light.position.set(0,1.8,.45); g.add(light);
  g.userData.tick=t=>{ring.rotation.z=t*.00075; light.intensity=.55+Math.sin(t*.002)*.22;};
  g.userData.activate=()=>gotoScene?.(key);
  return g;
}
function addButtons(gotoScene){
  const nav=document.getElementById('sceneNav'); if(!nav) return;
  [['reikiTalk','Reiki Talk'],['pgaDrive','PGA Drive'],['chipPutt','Chip/Putt'],['vrStore','VR Store'],['smokerLounge','Smoker'],['scorpionRoom','Scorpion Room']].forEach(([key,label])=>{
    if(nav.querySelector(`[data-scene="${key}"]`)) return;
    const b=document.createElement('button'); b.className='scene-btn'; b.dataset.scene=key; b.textContent=label; b.addEventListener('click',()=>gotoScene?.(key)); nav.appendChild(b);
  });
}
function addClick(scene,camera,renderer){
  const rc=new THREE.Raycaster(), p=new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown',e=>{const r=renderer.domElement.getBoundingClientRect(); p.x=((e.clientX-r.left)/r.width)*2-1; p.y=-(((e.clientY-r.top)/r.height)*2-1); rc.setFromCamera(p,camera); for(const h of rc.intersectObjects(scene.children,true)){let o=h.object; while(o){if(o.userData?.activate){o.userData.activate(); return;} o=o.parent;}}},{passive:true});
}
function makeVideoPanel(){
  const fallback=tex('REIKI HOLOGRAM','narrow portrait frame\nvideo auto-detect enabled',800,1100);
  const mat=new THREE.MeshBasicMaterial({map:fallback,transparent:true,opacity:.84,side:THREE.DoubleSide,depthWrite:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.16,2.02),mat); mesh.renderOrder=95;
  const v=document.createElement('video'); v.muted=true; v.loop=true; v.playsInline=true; v.crossOrigin='anonymous'; v.preload='metadata'; v.style.display='none'; document.body.appendChild(v);
  const sources=['./assets/video/reiki-hologram.mp4','./assets/video/riki-hologram.mp4','./assets/media/reiki-hologram.mp4','./assets/media/riki-hologram.mp4','./assets/video/hologram.mp4']; let i=0, loaded=false;
  const next=()=>{ if(i<sources.length){ v.src=sources[i++]; v.load(); } };
  v.addEventListener('loadeddata',()=>{loaded=true; v.play().catch(()=>{});}); v.addEventListener('error',next); next();
  const vt=new THREE.VideoTexture(v); vt.colorSpace=THREE.SRGBColorSpace;
  window.addEventListener('pointerdown',()=>v.play().catch(()=>{}),{passive:true});
  mesh.userData.tick=()=>{ if(loaded && mat.map!==vt){ mat.map=vt; mat.needsUpdate=true; } };
  return mesh;
}
function addHologram(scene){
  const old=scene.getObjectByName('SVR_PHASE99_REIKI_PRESENTATION_HOLOGRAMS');
  const root=new THREE.Group(); root.name='SVR_UPDATE3_REIKI_HOLOGRAM_STAGE';
  if(old?.parent){ old.scale.x=Math.min(old.scale.x||1,.76); root.position.copy(old.position).add(new THREE.Vector3(-2.05,-.08,.18)); old.parent.add(root); }
  else { root.position.set(4.4,1.35,-4.9); root.rotation.y=-.85; scene.add(root); }
  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.72,1.08,.16,64), new THREE.MeshStandardMaterial({color:0x061315,metalness:.82,roughness:.25,emissive:0x0b8178,emissiveIntensity:.45})); pedestal.position.set(0,.64,0); root.add(pedestal);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.20,.78,2.55,64,1,true), new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})); beam.position.set(0,1.68,.03); root.add(beam);
  const vid=makeVideoPanel(); vid.position.set(0,1.86,.05); root.add(vid);
  const faceGlass=new THREE.Mesh(new THREE.PlaneGeometry(1.44,2.36), new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})); faceGlass.position.set(0,1.86,.08); root.add(faceGlass);
  const left=panel('LEFT VIEW','hologram talk',1.34,.55); left.position.set(-1.12,2.8,.06); left.rotation.y=.16; root.add(left);
  const right=panel('RIGHT VIEW','storefront side',1.34,.55); right.position.set(1.12,2.8,.06); right.rotation.y=-.16; root.add(right);
  const light=new THREE.PointLight(0x8ffff0,1.1,7,2.3); light.position.set(0,1.15,.55); root.add(light);
  root.userData.tick=t=>{vid.userData.tick?.(t); const p=.5+.5*Math.sin(t*.003); beam.material.opacity=.05+p*.08; faceGlass.material.opacity=.12+p*.10; light.intensity=.8+p*.55;};
  return root;
}
function planetTex(kind){return tex(kind==='mars'?'MARS':'MOON','',512,256)}
function addSkyFallback(scene){
  let found=0; scene.traverse(o=>{const n=String(o.name||'').toLowerCase(); if(n.includes('moon')||n.includes('mars')) found++;}); if(found>=2) return null;
  const g=new THREE.Group(); g.name='SVR_UPDATE3_MOON_MARS_FALLBACK'; scene.add(g);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(2.6,48,24),new THREE.MeshBasicMaterial({map:planetTex('moon')})); moon.position.set(-18,28,-38); g.add(moon);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(1.4,48,24),new THREE.MeshBasicMaterial({map:planetTex('mars')})); mars.position.set(19,24,-44); g.add(mars);
  g.userData.tick=()=>{moon.rotation.y+=.0004; mars.rotation.y+=.0007;}; return g;
}
export function applyUpdate30PresentMoment({scene,camera,renderer,sceneTargets={},setStatus,log,gotoScene}){
  if(!scene || scene.userData.SVR_UPDATE30_LOCK) return scene?.userData?.SVR_UPDATE30_LOCK;
  sceneTargets.reikiRoom=sceneTargets.reikiRoom||{href:'./reiki.html?v=update3'}; sceneTargets.reikiTalk=sceneTargets.reikiTalk||{href:'./reiki.html?mode=hologram&v=update3'}; sceneTargets.pgaDrive=sceneTargets.pgaDrive||{href:'./pga-drive.html?v=update3'}; sceneTargets.chipPutt=sceneTargets.chipPutt||{href:'./chip-putt.html?v=update3'}; sceneTargets.vrStore=sceneTargets.vrStore||{href:'./store-room.html?v=update3'}; sceneTargets.smokerLounge=sceneTargets.smokerLounge||{href:'./smoker-lounge.html?v=update3'}; sceneTargets.scorpionRoom=sceneTargets.scorpionRoom||{href:'./scorpion.html?v=update3'};
  const root=new THREE.Group(); root.name='SVR_UPDATE3_PRESENT_MOMENT_ROOT'; scene.add(root);
  const layers=[addHologram(scene), addSkyFallback(scene)];
  const portals=new THREE.Group(); portals.name='SVR_UPDATE3_STOREFRONT_PORTALS'; scene.add(portals);
  addPortal(portals,'REIKI ROOM','private meditation', 'reikiRoom', new THREE.Vector3(5.55,0,-3.35), -1.05, gotoScene);
  addPortal(portals,'REIKI TALK','hologram stage', 'reikiTalk', new THREE.Vector3(5.55,0,-.80), -1.15, gotoScene);
  addPortal(portals,'PGA DRIVE','private range', 'pgaDrive', new THREE.Vector3(-5.55,0,-3.10), 1.05, gotoScene);
  addPortal(portals,'CHIP + PUTT','short game', 'chipPutt', new THREE.Vector3(-5.55,0,-.52), 1.15, gotoScene);
  addPortal(portals,'VR STORE','web portal', 'vrStore', new THREE.Vector3(0,0,-6.35), 0, gotoScene);
  addPortal(portals,'SMOKER','social lounge', 'smokerLounge', new THREE.Vector3(3.55,0,5.25), Math.PI, gotoScene);
  addPortal(portals,'SCORPION','private poker', 'scorpionRoom', new THREE.Vector3(-3.55,0,5.25), Math.PI, gotoScene);
  const header=panel('SVR UPDATE 3.0','present moment storefront lock',4.2,.85); header.position.set(0,4.3,-6.4); scene.add(header);
  layers.push(portals);
  addButtons(gotoScene); addClick(scene,camera,renderer);
  const old=scene.onBeforeRender; scene.onBeforeRender=function(...args){old?.apply(this,args); const t=performance.now(); layers.forEach(l=>l?.userData?.tick?.(t)); portals.children.forEach(p=>p.userData?.tick?.(t));};
  const lock={build:BUILD,sceneTargets}; scene.userData.SVR_UPDATE30_LOCK=lock; window.SVR_UPDATE30_LOCK=lock; setStatus?.('Update 3.0 ready: portals, Reiki hologram, private rooms restored.',{force:true}); log?.('Update 3.0 present moment lock loaded',BUILD); return lock;
}
