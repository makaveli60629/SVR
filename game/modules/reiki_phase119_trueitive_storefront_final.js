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
    const rg=x.createRadialGradient(w/2,310,30,w/2,310,220); rg.addColorStop(0,'#ffe0ce'); rg.addColorStop(.58,'#bf735f'); rg.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=rg; x.beginPath(); x.arc(w/2,270,116,0,Math.PI*2); x.fill();
    x.fillStyle='rgba(35,12,18,.95)'; x.beginPath(); x.ellipse(w/2,410,210,178,0,0,Math.PI*2); x.fill();
    x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='#f7ffff'; x.font='900 64px system-ui,Arial'; x.fillText('Meet the Founder', w/2, 635);
    x.fillStyle='#bfffee'; x.font='900 46px system-ui,Arial'; x.fillText('Shyona Royston', w/2, 704);
    x.fillStyle='#eaffff'; x.font='700 31px system-ui,Arial';
    ['Trueitive holistic wellness', 'Reiki • meditation • bodywork', 'Private session / booking presentation', 'Video hologram + store slides'].forEach((line,i)=>x.fillText(line,w/2,790+i*58));
    x.fillStyle='#ff4a4a'; x.font='900 34px system-ui,Arial'; x.fillText('WAITING FOR APPROVAL', w/2, 1032);
    x.fillStyle='#7dffb2'; x.font='900 28px system-ui,Arial'; x.fillText('POLISHED DEMO • APPROVAL REVIEW', w/2, 1090);
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

function makeStorefrontTexture(title, lines=[], accent='#7dfff0', footer='OPEN PORTAL'){
  return canvasTexture(1200, 760, (x,w,h)=>{
    const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#060910'); g.addColorStop(.55,'#13051c'); g.addColorStop(1,'#03050a');
    x.fillStyle=g; x.fillRect(0,0,w,h);
    x.strokeStyle=accent; x.lineWidth=14; roundRect(x,24,24,w-48,h-48,42); x.stroke();
    x.fillStyle='rgba(255,255,255,.065)'; roundRect(x,70,88,w-140,132,30); x.fill();
    x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='#f7ffff'; x.font='900 72px system-ui,Arial'; x.fillText(title, w/2, 150);
    x.fillStyle='#d9fff7'; x.font='700 34px system-ui,Arial'; let y=292;
    lines.slice(0,5).forEach((line)=>{ x.fillText(line, w/2, y); y+=64; });
    x.fillStyle='rgba(255,40,56,.18)'; roundRect(x,190,h-145,w-380,72,22); x.fill();
    x.strokeStyle='rgba(255,72,72,.78)'; x.lineWidth=5; roundRect(x,190,h-145,w-380,72,22); x.stroke();
    x.fillStyle='#ffd6d6'; x.font='900 30px system-ui,Arial'; x.fillText('WAITING FOR APPROVAL / DEMO PREVIEW', w/2, h-110);
    x.fillStyle=accent; x.font='900 27px system-ui,Arial'; x.fillText(footer, w/2, h-58);
  });
}

function addPortalStorefront(scene, sceneTargets, key, opts={}){
  const rec = sceneTargets?.[key] || sceneTargets?.sponsor || sceneTargets?.store;
  if(!scene || !rec?.pos) return null;
  const look = rec.look || new THREE.Vector3(0,1.4,0);
  const dir = new THREE.Vector3().subVectors(look, rec.pos); dir.y=0;
  if(dir.lengthSq()<0.0001) dir.set(0,0,-1); else dir.normalize();
  const right = new THREE.Vector3(dir.z,0,-dir.x).normalize();
  const group = new THREE.Group();
  group.name = `PHASE129 STOREFRONT ${opts.title || key}`;
  group.position.copy(rec.pos).addScaledVector(dir, opts.forward ?? 1.35).addScaledVector(right, opts.side ?? 0);
  group.rotation.y = Math.atan2(dir.x, dir.z);
  scene.add(group);

  const accent = opts.accent || '#7dfff0';
  const accentColor = new THREE.Color(accent);
  const matTrim = new THREE.MeshStandardMaterial({ color: accentColor, roughness:.22, metalness:.42, emissive:accentColor, emissiveIntensity:.72 });
  const matDark = new THREE.MeshStandardMaterial({ color:0x080a10, roughness:.82, metalness:.08, emissive:0x07050d, emissiveIntensity:.14 });
  const matGlass = new THREE.MeshStandardMaterial({ color:accentColor, transparent:true, opacity:.13, roughness:.04, metalness:.18, emissive:accentColor, emissiveIntensity:.10, side:THREE.DoubleSide, depthWrite:false });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.65), new THREE.MeshStandardMaterial({ color:opts.floorColor || 0x101018, roughness:.92, metalness:.02, emissive:0x080510, emissiveIntensity:.18, side:THREE.DoubleSide }));
  floor.rotation.x = -Math.PI/2; floor.position.set(0,.018,.85); group.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.62,2.70,.16), matDark); back.position.set(0,1.55,-.46); group.add(back);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.34,2.34), matGlass); glass.position.set(0,1.55,-.36); group.add(glass);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.78,.13,.22), matTrim); top.position.set(0,2.96,-.31); group.add(top);
  const left = new THREE.Mesh(new THREE.BoxGeometry(.12,2.86,.20), matTrim); left.position.set(-1.86,1.56,-.31); group.add(left);
  const rightCol = left.clone(); rightCol.position.x = 1.86; group.add(rightCol);
  const tex = makeStorefrontTexture(opts.title || key, opts.lines || [], accent, opts.footer || 'PORTAL READY');
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.86,1.82), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  panel.position.set(0,1.66,-.24); group.add(panel);
  const portal = new THREE.Mesh(new THREE.RingGeometry(.45,.56,52), new THREE.MeshBasicMaterial({ color:accentColor, transparent:true, opacity:.70, side:THREE.DoubleSide, depthWrite:false }));
  portal.position.set(0,.46,1.02); portal.rotation.x = -Math.PI/2; group.add(portal);
  return group;
}

function addPhase129OtherStorefronts(scene, sceneTargets){
  if(!scene || scene.userData._phase129OtherStorefronts) return scene?.userData?._phase129OtherStorefronts || null;
  const stores = [];
  stores.push(addPortalStorefront(scene, sceneTargets, 'pga', {
    title:'PGA EXPANSION', accent:'#75fff2', floorColor:0x102818, forward:1.10,
    lines:['Driving range portal','Chip + putt training','Private golf scene','Sponsor-ready wall'], footer:'PGA HUB / GOLF TRAINING'
  }));
  stores.push(addPortalStorefront(scene, sceneTargets, 'store', {
    title:'SVR STORE', accent:'#b48cff', floorColor:0x161020, forward:1.12,
    lines:['Avatar gear preview','Watches • gloves • table skins','Store opens on site','VR portal surface'], footer:'SVR STORE PORTAL'
  }));
  stores.push(addPortalStorefront(scene, sceneTargets, 'lounge', {
    title:'VIBES THEATER', accent:'#ff79d8', floorColor:0x1d0a18, forward:1.08,
    lines:['Music / video lounge','Replay jumbotron space','Social theater portal','Sponsor media ready'], footer:'THEATER STOREFRONT'
  }));
  stores.push(addPortalStorefront(scene, sceneTargets, 'scorpion', {
    title:'SCORPION ROOM', accent:'#ffd36e', floorColor:0x22160a, forward:1.08,
    lines:['Private poker room','City overlook table','Table selector future','VIP route preserved'], footer:'PRIVATE POKER PORTAL'
  }));
  const group = new THREE.Group(); group.name = 'PHASE129 OTHER STOREFRONTS REGISTRY';
  stores.filter(Boolean).forEach(s=>group.add(s));
  scene.userData._phase129OtherStorefronts = { stores: stores.filter(Boolean) };
  return scene.userData._phase129OtherStorefronts;
}

export function applyPhase119ReikiTrueitiveStorefrontFinal({ scene, camera, sceneTargets, setStatus=()=>{}, log=()=>{} }={}){
  if(!scene || scene.userData._phase120ReikiTrueitiveStorefront) return scene?.userData?._phase119ReikiTrueitiveStorefront || null;
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  if(!rec?.pos || !rec?.look) return null;

  const front = rec.pos.clone();
  const look = rec.look.clone();
  const towardStore = new THREE.Vector3().subVectors(look, front); towardStore.y=0;
  if(towardStore.lengthSq()<0.0001) towardStore.set(0,0,-1); else towardStore.normalize();

  const center = front.clone().addScaledVector(towardStore, 3.62);
  const group = new THREE.Group();
  group.name = 'PHASE129 TRUEITIVE REIKI WALL-LOCKED PRESENTATION STOREFRONT';
  group.position.copy(center);
  const entryDir = new THREE.Vector3().subVectors(front, center); entryDir.y = 0;
  if (entryDir.lengthSq() < 0.0001) entryDir.set(0, 0, 1); else entryDir.normalize();
  group.rotation.set(0, Math.atan2(entryDir.x, entryDir.z), 0);
  scene.add(group);

  const matTeal = new THREE.MeshStandardMaterial({ color:0x7dfff0, roughness:.18, metalness:.48, emissive:0x1cbca8, emissiveIntensity:.92 });
  const matGlass = new THREE.MeshStandardMaterial({ color:0xaafff4, transparent:true, opacity:.13, roughness:.02, metalness:.18, emissive:0x113f3b, emissiveIntensity:.12, side:THREE.DoubleSide, depthWrite:false });
  const matRed = new THREE.MeshStandardMaterial({ color:0xaa0924, roughness:.82, metalness:.04, emissive:0x3e0610, emissiveIntensity:.25, side:THREE.DoubleSide });
  const matPost = new THREE.MeshStandardMaterial({ color:0x111318, roughness:.22, metalness:.78, emissive:0x05070a, emissiveIntensity:.10 });
  const matRope = new THREE.MeshStandardMaterial({ color:0xc70a28, roughness:.74, metalness:.04, emissive:0x4d0611, emissiveIntensity:.34 });

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.75, 6.6), matRed);
  carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, 0.021, 2.08); carpet.renderOrder = 8; group.add(carpet);
  const carpetEdgeL = new THREE.Mesh(new THREE.BoxGeometry(.08,.06,6.6), matTeal); carpetEdgeL.position.set(-2.42,.055,2.08); group.add(carpetEdgeL);
  const carpetEdgeR = carpetEdgeL.clone(); carpetEdgeR.position.x=2.42; group.add(carpetEdgeR);

  const archTop = new THREE.Mesh(new THREE.BoxGeometry(11.8,.20,.32), matTeal); archTop.position.set(0,5.72,-1.08); group.add(archTop);
  const archL = new THREE.Mesh(new THREE.BoxGeometry(.22,5.65,.34), matTeal); archL.position.set(-5.9,2.85,-1.08); group.add(archL);
  const archR = archL.clone(); archR.position.x=5.9; group.add(archR);
  const glassBack = new THREE.Mesh(new THREE.PlaneGeometry(11.3,4.65), matGlass); glassBack.position.set(0,2.66,-1.02); group.add(glassBack);
  for(const sx of [-1,1]){
    const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(5.25,3.4), matGlass);
    sideGlass.position.set(sx*5.72,1.94,1.05); sideGlass.rotation.y=sx*Math.PI/2; group.add(sideGlass);
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(.14,.11,5.25), matTeal); topRail.position.set(sx*5.72,3.66,1.05); group.add(topRail);
    const lowRail = topRail.clone(); lowRail.position.y=.34; group.add(lowRail);
  }

  const postPositions=[];
  for(const sx of [-1,1]) for(let i=0;i<5;i++) postPositions.push([sx*2.48, -.85+i*1.15]);
  for(const [x,z] of postPositions){
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,1.12,16), matPost); post.position.set(x,.56,z); group.add(post);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.105,16,16), matPost); head.position.set(x,1.16,z); group.add(head);
  }
  for(const sx of [-1,1]) for(let i=0;i<4;i++) group.add(cylinderBetween(new THREE.Vector3(sx*2.48,1.02,-.85+i*1.15), new THREE.Vector3(sx*2.48,1.02,-.85+(i+1)*1.15), .035, matRope));

  const signTex = canvasTexture(1600,310,(x,w,h)=>{
    x.fillStyle='#061014'; x.fillRect(0,0,w,h); x.strokeStyle='rgba(125,255,240,.96)'; x.lineWidth=14; x.strokeRect(18,18,w-36,h-36);
    x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#f7ffff'; x.font='900 92px system-ui,Arial'; x.fillText('TRUEITIVE REIKI HUB', w/2, 96);
    x.fillStyle='#ffb8b8'; x.font='900 46px system-ui,Arial'; x.fillText('WAITING FOR APPROVAL • PRESENTATION DEMO', w/2, 208);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.8,1.42), new THREE.MeshBasicMaterial({map:signTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  sign.position.set(0,4.92,-1.22); group.add(sign);

  const founder = new THREE.Mesh(new THREE.PlaneGeometry(2.45,3.35), new THREE.MeshBasicMaterial({map:makeFounderTexture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  founder.position.set(-3.55,2.42,-.84); group.add(founder);
  const rightTex = makePanelTexture('THE ZEN DEN',['Breathe • restore • reset','Video / booking / info slides','Private Reiki room route'],'#7dfff0','WELLNESS PRESENTATION');
  const rightP = new THREE.Mesh(new THREE.PlaneGeometry(2.45,3.35), new THREE.MeshBasicMaterial({map:rightTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  rightP.position.set(3.55,2.42,-.84); group.add(rightP);

  const slider = new THREE.Group(); slider.name='TRUEITIVE COMPACT SLIDE HOLOGRAM CAROUSEL'; slider.position.set(0,2.35,.08); group.add(slider);
  const slides=[
    makePanelTexture('VIDEO',['Founder hologram','Play when near','Next / Back panel'],'#58fff4','PLAY FROM REIKI ZONE'),
    makePanelTexture('ABOUT',['Shyona Royston','Trueitive wellness story','Founder presentation'],'#b58cff','ABOUT SLIDE'),
    makePanelTexture('REIKI',['Reiki symbols','Meditation reset','Wellness services'],'#7dffb2','REIKI SLIDE'),
    makePanelTexture('ROOM',['Private Reiki room','Meditation space','Portal route preserved'],'#ffd36e','PRIVATE ROOM SLIDE')
  ];
  const slideMeshes=[];
  for(let i=0;i<slides.length;i++){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(1.85,1.34), new THREE.MeshBasicMaterial({map:slides[i],transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    m.userData.baseAngle=(i/slides.length)*Math.PI*2; slideMeshes.push(m); slider.add(m);
  }
  const portraitCenter = new THREE.Mesh(new THREE.PlaneGeometry(1.20,1.58), new THREE.MeshBasicMaterial({map:makeFounderTexture(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  portraitCenter.position.set(0,-.16,.12); slider.add(portraitCenter);

  const video = document.createElement('video'); video.src='./assets/video/reiki_hologram.mp4'; video.loop=true; video.playsInline=true; video.preload='metadata'; video.muted=true; video.volume=.90;
  const vTex = new THREE.VideoTexture(video); vTex.colorSpace=THREE.SRGBColorSpace;
  const videoPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.12,1.22), new THREE.MeshBasicMaterial({map:vTex,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false}));
  videoPlane.position.set(0,.98,.20); slider.add(videoPlane);
  const videoFrame = new THREE.Mesh(new THREE.BoxGeometry(2.32,1.42,.06), matTeal); videoFrame.position.copy(videoPlane.position).add(new THREE.Vector3(0,0,-.04)); slider.add(videoFrame);

  const cueTex = makePanelTexture('NEXT / BACK',['Video','About','Reiki symbols','Meditation room'],'#ff76d5','TOUCH / CONTROLLER READY');
  const cue = new THREE.Mesh(new THREE.PlaneGeometry(2.20,.78), new THREE.MeshBasicMaterial({map:cueTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  cue.position.set(0,.18,.92); group.add(cue);

  const leafMat = new THREE.MeshStandardMaterial({color:0x1f8d58, roughness:.88, metalness:0, emissive:0x063019, emissiveIntensity:.12, side:THREE.DoubleSide});
  const potMat = new THREE.MeshStandardMaterial({color:0x151014, roughness:.9, metalness:.12});
  function addPlant(x,z,s=1){
    const p=new THREE.Group(); p.position.set(x,0,z); group.add(p);
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.18*s,.26*s,.38*s,16),potMat); pot.position.y=.19*s; p.add(pot);
    for(let i=0;i<9;i++){ const leaf=new THREE.Mesh(new THREE.ConeGeometry(.055*s,.82*s,5),leafMat); leaf.position.set(Math.sin(i)*.12*s,.70*s,Math.cos(i*1.7)*.12*s); leaf.rotation.z=(i%2?1:-1)*.45; leaf.rotation.y=i*.72; p.add(leaf); }
  }
  [-.60,.80,2.20,3.60].forEach((z,i)=>{ addPlant(-3.02,z,1.0+(i%2)*.16); addPlant(3.02,z,1.0+((i+1)%2)*.16); });

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
    if(near){ if(userPrimed){ video.muted=false; if(video.paused) video.play().then(()=>{activated=true;}).catch(()=>{}); } cue.material.opacity=.98; }
    else{ if(!video.paused) video.pause(); video.muted=true; activated=false; cue.material.opacity=.62; }
  };
  const prevTick = scene.userData._tickWorld;
  if(prevTick && !scene.userData._phase120WrappedTick){
    scene.userData._tickWorld = (dt)=>{ prevTick(dt); if(scene.userData._tickReikiPhase120) scene.userData._tickReikiPhase120(dt); };
    scene.userData._phase120WrappedTick=true;
  }

  addPhase129OtherStorefronts(scene, sceneTargets);
  scene.userData._phase120ReikiTrueitiveStorefront = { group, video, slider };
  setStatus('Phase 129 Reiki presentation cleaned; extra storefronts added. Waiting for approval badge active.');
  log?.('Phase 129 Reiki + Vibes Theater + SVR Store + PGA Expansion storefront lock active');
  return scene.userData._phase120ReikiTrueitiveStorefront;
}
