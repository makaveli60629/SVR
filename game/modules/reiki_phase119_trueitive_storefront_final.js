import * as THREE from "three";

function canvasTexture(w, h, painter){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  painter(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
function roundRect(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.lineTo(x+w-rr,y); ctx.quadraticCurveTo(x+w,y,x+w,y+rr);
  ctx.lineTo(x+w,y+h-rr); ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h); ctx.lineTo(x+rr,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-rr); ctx.lineTo(x,y+rr); ctx.quadraticCurveTo(x,y,x+rr,y); ctx.closePath();
}
function makePanelTexture(title, lines=[], accent='#7dfff0', footer='TRUEITIVE PRESENTATION'){
  return canvasTexture(1024, 768, (x,w,h)=>{
    const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#071618'); g.addColorStop(.55,'#13091b'); g.addColorStop(1,'#05060a');
    x.fillStyle=g; x.fillRect(0,0,w,h);
    x.strokeStyle=accent; x.lineWidth=12; roundRect(x,28,28,w-56,h-56,38); x.stroke();
    x.strokeStyle='rgba(255,255,255,.20)'; x.lineWidth=3; roundRect(x,54,54,w-108,h-108,28); x.stroke();
    x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='#f7ffff'; x.font='900 64px system-ui,Arial'; x.fillText(title, w/2, 112);
    x.fillStyle='#cffff7'; x.font='700 34px system-ui,Arial'; let y=210;
    for(const line of lines){ x.fillText(line, w/2, y); y+=58; }
    x.fillStyle='rgba(125,255,240,.16)'; roundRect(x,116,h-154,w-232,88,22); x.fill();
    x.strokeStyle='rgba(125,255,240,.48)'; x.lineWidth=5; roundRect(x,116,h-154,w-232,88,22); x.stroke();
    x.fillStyle='#ffeff7'; x.font='900 30px system-ui,Arial'; x.fillText(footer, w/2, h-108);
  });
}
function makeFounderTexture(){
  return canvasTexture(900,1200,(x,w,h)=>{
    const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#120a18'); g.addColorStop(1,'#061315'); x.fillStyle=g; x.fillRect(0,0,w,h);
    x.strokeStyle='rgba(125,255,240,.92)'; x.lineWidth=12; roundRect(x,30,30,w-60,h-60,42); x.stroke();
    x.fillStyle='rgba(255,255,255,.08)'; roundRect(x,142,114,w-284,430,48); x.fill();
    // stylized portrait silhouette placeholder so the founder/photo area is present even when the raw image asset is unavailable.
    const rg=x.createRadialGradient(w/2,310,30,w/2,310,220); rg.addColorStop(0,'#ffe0ce'); rg.addColorStop(.58,'#bf735f'); rg.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=rg; x.beginPath(); x.arc(w/2,270,116,0,Math.PI*2); x.fill();
    x.fillStyle='rgba(35,12,18,.95)'; x.beginPath(); x.ellipse(w/2,410,210,178,0,0,Math.PI*2); x.fill();
    x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='#f7ffff'; x.font='900 64px system-ui,Arial'; x.fillText('Meet the Founder', w/2, 635);
    x.fillStyle='#bfffee'; x.font='900 46px system-ui,Arial'; x.fillText('Shyona Royston', w/2, 704);
    x.fillStyle='#eaffff'; x.font='700 31px system-ui,Arial';
    ['Trueitive holistic wellness', 'Reiki • meditation • bodywork', 'Private session / booking presentation', 'Video hologram + store slides'].forEach((line,i)=>x.fillText(line,w/2,790+i*58));
    x.fillStyle='#7dffb2'; x.font='900 32px system-ui,Arial'; x.fillText('POLISHED DEMO • APPROVAL REVIEW', w/2, 1090);
  });
}
function cylinderBetween(a,b, radius, mat){
  const mid = new THREE.Vector3().addVectors(a,b).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(b,a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,len,14), mat);
  mesh.position.copy(mid);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
  return mesh;
}

export function applyPhase119ReikiTrueitiveStorefrontFinal({ scene, camera, sceneTargets, setStatus=()=>{}, log=()=>{} }={}){
  if(!scene || scene.userData._phase120ReikiTrueitiveStorefront) return scene?.userData?._phase119ReikiTrueitiveStorefront || null;
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  if(!rec?.pos || !rec?.look) return null;

  const front = rec.pos.clone();
  const look = rec.look.clone();
  const towardStore = new THREE.Vector3().subVectors(look, front); towardStore.y=0;
  if(towardStore.lengthSq()<0.0001) towardStore.set(0,0,-1); else towardStore.normalize();
  const right = new THREE.Vector3(towardStore.z,0,-towardStore.x).normalize();
  const up = new THREE.Vector3(0,1,0);

  const center = front.clone().addScaledVector(towardStore, 2.92);
  const group = new THREE.Group();
  group.name = 'PHASE119 TRUEITIVE 1.4G STOREFRONT GLASS EXTENSION FINAL';
  group.position.copy(center);
  // Phase 120 alignment fix:
  // Do not use lookAt() with a higher Y target here. That pitched the whole storefront
  // upward, turning the red carpet/glass extension into a giant canopy over the player.
  // The 1.4G storefront uses local +Z as the red-carpet entrance direction, so yaw only.
  const entryDir = new THREE.Vector3().subVectors(front, center);
  entryDir.y = 0;
  if (entryDir.lengthSq() < 0.0001) entryDir.set(0, 0, 1); else entryDir.normalize();
  group.rotation.set(0, Math.atan2(entryDir.x, entryDir.z), 0);
  scene.add(group);

  const matTeal = new THREE.MeshStandardMaterial({ color:0x7dfff0, roughness:.18, metalness:.48, emissive:0x1cbca8, emissiveIntensity:1.08 });
  const matGlass = new THREE.MeshStandardMaterial({ color:0xaafff4, transparent:true, opacity:.18, roughness:.02, metalness:.18, emissive:0x113f3b, emissiveIntensity:.18, side:THREE.DoubleSide, depthWrite:false });
  const matRed = new THREE.MeshStandardMaterial({ color:0xaa0924, roughness:.82, metalness:.04, emissive:0x3e0610, emissiveIntensity:.25, side:THREE.DoubleSide });
  const matPost = new THREE.MeshStandardMaterial({ color:0x111318, roughness:.22, metalness:.78, emissive:0x05070a, emissiveIntensity:.10 });
  const matRope = new THREE.MeshStandardMaterial({ color:0xc70a28, roughness:.74, metalness:.04, emissive:0x4d0611, emissiveIntensity:.34 });

  // Long red carpet runway / presentation entry.
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5.25, 9.6), matRed);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.021, 2.55);
  carpet.renderOrder = 8;
  group.add(carpet);
  const carpetEdgeL = new THREE.Mesh(new THREE.BoxGeometry(.08,.06,9.6), matTeal); carpetEdgeL.position.set(-2.68,.055,2.55); group.add(carpetEdgeL);
  const carpetEdgeR = carpetEdgeL.clone(); carpetEdgeR.position.x=2.68; group.add(carpetEdgeR);

  // Glass extension/walkway around the storefront entrance.
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(11.8,.20,.32), matTeal); archTop.position.set(0,5.72,-.48); group.add(archTop);
  const archL = new THREE.Mesh(new THREE.BoxGeometry(.22,5.65,.34), matTeal); archL.position.set(-5.9,2.85,-.48); group.add(archL);
  const archR = archL.clone(); archR.position.x=5.9; group.add(archR);
  const glassBack = new THREE.Mesh(new THREE.PlaneGeometry(11.3,4.65), matGlass); glassBack.position.set(0,2.66,-.62); group.add(glassBack);
  for(const sx of [-1,1]){
    const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(8.7,3.4), matGlass);
    sideGlass.position.set(sx*3.12,1.94,2.45); sideGlass.rotation.y=sx*Math.PI/2; group.add(sideGlass);
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(.14,.11,8.7), matTeal); topRail.position.set(sx*3.12,3.66,2.45); group.add(topRail);
    const lowRail = topRail.clone(); lowRail.position.y=.34; group.add(lowRail);
  }

  // Long black stanchions and red ropes.
  const postPositions=[];
  for(const sx of [-1,1]) for(let i=0;i<6;i++) postPositions.push([sx*2.72, -1.35+i*1.35]);
  for(const [x,z] of postPositions){
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,1.26,16), matPost); post.position.set(x,.63,z); group.add(post);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.105,16,16), matPost); head.position.set(x,1.30,z); group.add(head);
  }
  for(const sx of [-1,1]) for(let i=0;i<5;i++){
    const a=new THREE.Vector3(sx*2.72,1.14,-1.35+i*1.35);
    const b=new THREE.Vector3(sx*2.72,1.14,-1.35+(i+1)*1.35);
    group.add(cylinderBetween(a,b,.035,matRope));
  }

  // Top signage.
  const signTex = canvasTexture(1600,310,(x,w,h)=>{
    x.fillStyle='#061014'; x.fillRect(0,0,w,h); x.strokeStyle='rgba(125,255,240,.96)'; x.lineWidth=14; x.strokeRect(18,18,w-36,h-36);
    x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#f7ffff'; x.font='900 98px system-ui,Arial'; x.fillText('REIKI HUB', w/2, 100);
    x.fillStyle='#eaffff'; x.font='900 72px system-ui,Arial'; x.fillText('TRUEITIVE.COM', w/2, 212);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.8,1.42), new THREE.MeshBasicMaterial({map:signTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  sign.position.set(0,4.92,-.84); group.add(sign);

  // Left founder/about info panel and right presentation image panel.
  const founder = new THREE.Mesh(new THREE.PlaneGeometry(2.45,3.35), new THREE.MeshBasicMaterial({map:makeFounderTexture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  founder.position.set(-3.55,2.42,-.30); group.add(founder);
  const rightTex = makePanelTexture('THE ZEN DEN',['Breathe • restore • reset','Video / booking / info slides','Private Reiki room route'],'#7dfff0','WELLNESS PRESENTATION');
  const rightP = new THREE.Mesh(new THREE.PlaneGeometry(2.45,3.35), new THREE.MeshBasicMaterial({map:rightTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  rightP.position.set(3.55,2.42,-.30); group.add(rightP);

  // Center circular slider/hologram stack.
  const slider = new THREE.Group(); slider.name='TRUEITIVE SLIDE HOLOGRAM CAROUSEL'; slider.position.set(0,2.45,.10); group.add(slider);
  const slides=[
    makePanelTexture('VIDEO',['Founder hologram','Voice-enabled when near','Auto-off when you leave'],'#58fff4','PLAY FROM REIKI ZONE'),
    makePanelTexture('ABOUT',['Shyona Royston','Trueitive wellness story','Services and booking info'],'#b58cff','ABOUT SLIDE'),
    makePanelTexture('STORE',['Reiki sessions','Wellness services','Future product/store panel'],'#7dffb2','STORE SLIDE'),
    makePanelTexture('ROOM',['Private Reiki room','Meditation space','Portal route preserved'],'#ffd36e','PRIVATE ROOM SLIDE')
  ];
  const slideMeshes=[];
  for(let i=0;i<slides.length;i++){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.85,1.34), new THREE.MeshBasicMaterial({map:slides[i],transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    m.userData.baseAngle=(i/slides.length)*Math.PI*2; slideMeshes.push(m); slider.add(m);
  }
  const portraitCenter = new THREE.Mesh(new THREE.PlaneGeometry(1.32,1.78), new THREE.MeshBasicMaterial({map:makeFounderTexture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  portraitCenter.position.set(0,-.12,.12); slider.add(portraitCenter);

  // Video hologram texture in the middle. Browser keeps it muted until user gesture; proximity activates and deactivates.
  const video = document.createElement('video'); video.src='./assets/video/reiki_hologram.mp4'; video.loop=true; video.playsInline=true; video.preload='metadata'; video.muted=true; video.volume=.90;
  const vTex = new THREE.VideoTexture(video); vTex.colorSpace=THREE.SRGBColorSpace;
  const videoPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.12,1.22), new THREE.MeshBasicMaterial({map:vTex,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false}));
  videoPlane.position.set(0,.98,.20); slider.add(videoPlane);
  const videoFrame = new THREE.Mesh(new THREE.BoxGeometry(2.32,1.42,.06), matTeal); videoFrame.position.copy(videoPlane.position).add(new THREE.Vector3(0,0,-.04)); slider.add(videoFrame);

  const cueTex = makePanelTexture('PLAY • NEXT',['Hologram video','About slide','Store slide'],'#ff76d5','DISTANCE AUDIO ZONE');
  const cue = new THREE.Mesh(new THREE.PlaneGeometry(2.20,.78), new THREE.MeshBasicMaterial({map:cueTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  cue.position.set(0,.02,.24); group.add(cue);

  // Plants along carpet using procedural bushes so the runway reads full even if OBJ plant load is delayed.
  const leafMat = new THREE.MeshStandardMaterial({color:0x1f8d58, roughness:.88, metalness:0, emissive:0x063019, emissiveIntensity:.12, side:THREE.DoubleSide});
  const potMat = new THREE.MeshStandardMaterial({color:0x151014, roughness:.9, metalness:.12});
  function addPlant(x,z,s=1){
    const p=new THREE.Group(); p.position.set(x,0,z); group.add(p);
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.26*s,.38*s,16),potMat); pot.position.y=.19*s; p.add(pot);
    for(let i=0;i<9;i++){ const leaf=new THREE.Mesh(new THREE.ConeGeometry(.055*s,.82*s,5),leafMat); leaf.position.set(Math.sin(i)*.12*s,.70*s,Math.cos(i*1.7)*.12*s); leaf.rotation.z=(i%2?1:-1)*.45; leaf.rotation.y=i*.72; p.add(leaf); }
  }
  [-1.15,.20,1.55,2.90,4.25].forEach((z,i)=>{ addPlant(-3.24,z,1.0+(i%2)*.16); addPlant(3.24,z,1.0+((i+1)%2)*.16); });
  addPlant(0,5.45,1.28);

  // Interaction/proximity lock for hologram audio. It can only become audible after user gesture and shuts off when leaving.
  const tempCamPos = new THREE.Vector3(); const tempWorld = new THREE.Vector3(); let userPrimed=false; let near=false; let activated=false;
  const prime = async()=>{ userPrimed=true; if(near){ video.muted=false; try{ await video.play(); activated=true; }catch(_e){} } };
  window.addEventListener('pointerdown', prime, {passive:true});
  window.addEventListener('keydown', prime);
  scene.userData._tickReikiPhase120 = (dt=0)=>{
    const t=performance.now()*0.001;
    slideMeshes.forEach((m,idx)=>{
      const a=t*.55+m.userData.baseAngle; const r=.98;
      m.position.set(Math.sin(a)*r, -.74+Math.cos(a*1.5)*.045, .22+Math.cos(a)*.30);
      m.scale.setScalar(idx===0?1.0:.92); m.material.opacity=.72+.22*(0.5+0.5*Math.cos(a));
      m.rotation.y=-Math.sin(a)*.28;
    });
    slider.rotation.y=Math.sin(t*.42)*.045;
    if(camera){ camera.getWorldPosition(tempCamPos); group.getWorldPosition(tempWorld); near=tempCamPos.distanceTo(tempWorld)<8.8; }
    if(near){
      if(userPrimed){ video.muted=false; if(video.paused) video.play().then(()=>{activated=true;}).catch(()=>{}); }
      cue.material.opacity=.98;
    }else{
      if(!video.paused) video.pause(); video.muted=true; activated=false; cue.material.opacity=.62;
    }
  };
  const prevTick = scene.userData._tickWorld;
  if(prevTick && !scene.userData._phase120WrappedTick){
    scene.userData._tickWorld = (dt)=>{ prevTick(dt); if(scene.userData._tickReikiPhase120) scene.userData._tickReikiPhase120(dt); };
    scene.userData._phase120WrappedTick=true;
  }

  scene.userData._phase120ReikiTrueitiveStorefront = { group, video, slider };
  setStatus('Trueitive Reiki 1.4G storefront restored. Hologram audio zone armed.');
  log?.('Phase 120 Reiki storefront alignment + high Moon/Mars lock active');
  return scene.userData._phase120ReikiTrueitiveStorefront;
}
