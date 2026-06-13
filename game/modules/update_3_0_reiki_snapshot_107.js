import * as THREE from "three";

function canvasTexture(w, h, draw){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  draw(x, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function rr(ctx, x, y, w, h, r){
  const q = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+q, y); ctx.arcTo(x+w, y, x+w, y+h, q); ctx.arcTo(x+w, y+h, x, y+h, q);
  ctx.arcTo(x, y+h, x, y, q); ctx.arcTo(x, y, x+w, y, q); ctx.closePath();
}

function plaque(title, sub, lines=[], opts={}){
  return canvasTexture(1600, 900, (x,w,h)=>{
    const bg = x.createLinearGradient(0,0,w,h);
    bg.addColorStop(0, opts.light ? '#0a201a' : '#020706');
    bg.addColorStop(.48, '#061313');
    bg.addColorStop(1, '#020206');
    x.fillStyle = bg; x.fillRect(0,0,w,h);
    x.save();
    x.globalAlpha=.16;
    for(let i=0;i<72;i++){
      x.fillStyle = i%3===0 ? '#7ffff0' : (i%3===1 ? '#b56cff' : '#ffffff');
      x.fillRect((i*149)%w, (i*83)%h, 3+(i%3), 24+(i%7)*6);
    }
    x.restore();
    x.lineWidth = opts.thin ? 8 : 18;
    x.strokeStyle = opts.red ? '#ff5e75' : '#8affea';
    rr(x, 42, 42, w-84, h-84, 18); x.stroke();
    x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,.42)';
    rr(x, 86, 86, w-172, h-172, 10); x.stroke();
    x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='#f7ffff'; x.font='900 92px system-ui, Arial'; x.fillText(title, w/2, 142);
    x.fillStyle=opts.red?'#ffd0d8':'#aaffee'; x.font='800 46px system-ui, Arial'; x.fillText(sub, w/2, 230);
    x.fillStyle='#eafffb'; x.font='34px system-ui, Arial';
    let y=340; for(const line of lines){ x.fillText(line, w/2, y); y += 58; }
    x.fillStyle=opts.red?'#ffcad2':'#8affd6'; x.font='900 38px system-ui, Arial';
    x.fillText(opts.footer || 'SVR APPROVAL SAFE MODULE', w/2, h-105);
  });
}

function founderTexture(){
  return canvasTexture(1000, 1200, (x,w,h)=>{
    x.fillStyle='#ffffff'; x.fillRect(0,0,w,h);
    const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#f8fff9'); g.addColorStop(1,'#c2fff0');
    x.fillStyle=g; x.fillRect(34,34,w-68,h-68);
    x.fillStyle='#09130f'; x.font='900 72px system-ui, Arial'; x.textAlign='center'; x.fillText('FOUNDER', w/2, 120);
    x.fillStyle='#161616';
    x.beginPath(); x.arc(w/2, 410, 150, 0, Math.PI*2); x.fill();
    x.fillStyle='#f0d2b8'; x.beginPath(); x.arc(w/2, 365, 88, 0, Math.PI*2); x.fill();
    x.fillStyle='#121212'; x.beginPath(); x.ellipse(w/2, 520, 150, 180, 0, 0, Math.PI*2); x.fill();
    x.strokeStyle='#9dffe9'; x.lineWidth=12; rr(x,58,58,w-116,h-116,20); x.stroke();
    x.fillStyle='#07201a'; x.font='800 48px system-ui, Arial'; x.fillText('Shyona Royston', w/2, 780);
    x.fillStyle='#16453d'; x.font='34px system-ui, Arial'; x.fillText('presentation placeholder', w/2, 845);
    x.fillStyle='#0c1b17'; x.font='30px system-ui, Arial'; x.fillText('Use approved final photo when signed off', w/2, 915);
    x.fillStyle='#b40022'; x.font='900 38px system-ui, Arial'; x.fillText('AWAITING APPROVAL', w/2, 1030);
  });
}

function portraitTexture(){
  return canvasTexture(1000,1200,(x,w,h)=>{
    x.fillStyle='#fbfbf8'; x.fillRect(0,0,w,h);
    const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#eef5ef'); x.fillStyle=g; x.fillRect(0,0,w,h);
    x.fillStyle='#f1d0b8'; x.beginPath(); x.ellipse(w*.55,h*.30,120,150,0,0,Math.PI*2); x.fill();
    x.fillStyle='#151515'; x.beginPath(); x.ellipse(w*.50,h*.22,132,92,-.25,0,Math.PI*2); x.fill();
    x.fillStyle='#111111'; x.beginPath(); x.ellipse(w*.56,h*.68,205,330,-.05,0,Math.PI*2); x.fill();
    x.fillStyle='#051813'; x.font='900 58px system-ui, Arial'; x.textAlign='center'; x.fillText('REIKI VISUAL', w/2, 965);
    x.fillStyle='#14806c'; x.font='32px system-ui, Arial'; x.fillText('approval image slot', w/2, 1030);
    x.strokeStyle='#88ffe8'; x.lineWidth=10; rr(x,38,38,w-76,h-76,18); x.stroke();
  });
}

function card(title, sub, footer, color='#7ffff0'){
  return canvasTexture(900,620,(x,w,h)=>{
    const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#04110f'); g.addColorStop(1,'#000405');
    x.fillStyle=g; x.fillRect(0,0,w,h);
    x.strokeStyle=color; x.lineWidth=12; rr(x,28,28,w-56,h-56,20); x.stroke();
    x.strokeStyle='rgba(255,255,255,.3)'; x.lineWidth=3; rr(x,58,58,w-116,h-116,14); x.stroke();
    x.textAlign='center'; x.textBaseline='middle'; x.fillStyle='#ffffff'; x.font='900 56px system-ui, Arial'; x.fillText(title,w/2,180);
    x.fillStyle=color; x.font='800 32px system-ui, Arial'; x.fillText(sub,w/2,270);
    x.fillStyle='#dffff8'; x.font='28px system-ui, Arial'; x.fillText(footer,w/2,398);
    x.fillStyle='rgba(255,255,255,.11)'; rr(x,245,466,410,76,38); x.fill();
    x.fillStyle='#ffffff'; x.font='900 30px system-ui, Arial'; x.fillText(title.includes('VIDEO')?'OPEN HOLOGRAM':'OPEN CARD',w/2,505);
  });
}

function addPlane(group, name, width, height, texture, pos, opts={}){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width,height), new THREE.MeshBasicMaterial({ map:texture, transparent:true, side:THREE.DoubleSide, depthWrite:opts.depthWrite ?? true }));
  m.name = name; m.position.set(pos[0],pos[1],pos[2]);
  if(opts.rotY) m.rotation.y = opts.rotY;
  group.add(m); return m;
}

function makePost(x,z){
  const g=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color:0x0b0b0b, metalness:.75, roughness:.22});
  const chrome=new THREE.MeshStandardMaterial({color:0xe6e6e6, metalness:.9, roughness:.12});
  const cyl=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.72,18),mat); cyl.position.y=.36; g.add(cyl);
  const top=new THREE.Mesh(new THREE.SphereGeometry(.085,18,12),chrome); top.position.y=.77; g.add(top);
  g.position.set(x,0,z); return g;
}

export function applyReikiSnapshot107({ scene, camera, renderer, sceneTargets, setStatus=()=>{}, log=()=>{} }={}){
  if(!scene) return null;
  if(scene.userData._svrReikiSnapshot107) return scene.userData._svrReikiSnapshot107;
  // Hide older Reiki mother overlays so the screenshot reference becomes the visible source of truth.
  scene.traverse(o=>{
    if(o?.name && /PHASE 10[2-6] REIKI|REIKI OLD\+NEW|REIKI MOTHER MODULE/i.test(o.name)) o.visible=false;
  });
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom || null;
  const pos = rec?.pos ? rec.pos.clone() : new THREE.Vector3(-4.8,0,-3.6);
  const look = rec?.look ? rec.look.clone() : new THREE.Vector3(0,1.45,0);
  const group = new THREE.Group();
  group.name='UPDATE 3.0 PHASE 107 REIKI SNAPSHOT MOTHER MODULE';
  group.position.set(pos.x, .02, pos.z);
  group.lookAt(look.x,1.45,look.z);

  // Large storefront shell matching the provided screenshot: teal trim, recessed dark wall, red carpet, rope queue.
  const wallMat = new THREE.MeshStandardMaterial({color:0x02120f, metalness:.15, roughness:.72, emissive:0x00140f, emissiveIntensity:.4});
  const trimMat = new THREE.MeshBasicMaterial({color:0x72ffe5});
  const redMat = new THREE.MeshStandardMaterial({color:0xa10919, roughness:.58, metalness:.04});
  const blackGlass = new THREE.MeshPhysicalMaterial({color:0x020707, metalness:.1, roughness:.18, transmission:0.12, transparent:true, opacity:.88});
  const back = new THREE.Mesh(new THREE.BoxGeometry(7.6,3.05,.15), wallMat); back.position.set(0,1.66,-.23); group.add(back);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(8.35,.11,.24), trimMat); canopy.position.set(0,3.25,-.10); group.add(canopy);
  const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(7.9,.055,.18), trimMat); baseTrim.position.set(0,.24,-.09); group.add(baseTrim);
  const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(.08,3.0,.18), trimMat); leftTrim.position.set(-4.02,1.76,-.09); group.add(leftTrim);
  const rightTrim = leftTrim.clone(); rightTrim.position.x=4.02; group.add(rightTrim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6.7,3.0), redMat); floor.rotation.x=-Math.PI/2; floor.position.set(0,.018,1.08); group.add(floor);
  const glassL = new THREE.Mesh(new THREE.BoxGeometry(.05,1.05,2.25), blackGlass); glassL.position.set(-3.18,.72,.95); group.add(glassL);
  const glassR = glassL.clone(); glassR.position.x=3.18; group.add(glassR);

  addPlane(group,'Reiki Snapshot Main Sign',4.9,.56, plaque('REIKI / RIKI STOREFRONT','OLD + NEW REMODEL MATCH', ['GATES OPENING • RED CARPET ENTRY'], {thin:true, footer:'VIDEO HOLOGRAM CAROUSEL CENTER'}), [0,3.02,.02]);
  addPlane(group,'Reiki Snapshot Approval Banner',3.75,.38, plaque('AWAITING APPROVAL','NO FINAL BRANDING UNTIL SIGN-OFF', [], {red:true, thin:true, footer:'APPROVAL LOCK'}), [0,2.55,.05]);
  addPlane(group,'Reiki Snapshot Left Founder Panel',1.42,1.78, plaque('About The Founder','Shyona Royston', ['Services', 'Reiki • energy work', 'Wellness presentation', 'Approval-safe demo text'], {footer:'READABLE LEFT PANEL'}), [-2.78,1.58,.05]);
  addPlane(group,'Reiki Snapshot Founder Photo Slot',1.02,1.38, founderTexture(), [-.68,1.33,.08]);
  addPlane(group,'Reiki Snapshot Right Visual Slot',1.32,1.92, portraitTexture(), [2.56,1.55,.06]);
  addPlane(group,'Reiki Snapshot Service Panel',1.42,1.28, plaque('REIKI STORE','Video • About • Store', ['Interactive card carousel', 'Private Reiki room route', 'Hologram opens by button'], {footer:'MOTHER MODULE ROUTER'}), [.74,1.78,.10]);

  const cardDefs=[
    ['VIDEO HOLOGRAM','interactive button','opens Reiki video portal','#93fff0', -1.35,.53,.54],
    ['ABOUT','founder + service info','readable info card','#9ed0ff', -.45,.36,.46],
    ['REIKI STORE','store preview','approval-safe store slot','#ffc46e', .45,.36,.46],
    ['MEDITATION','private room','opens Reiki room','#8affae', 1.35,.53,.54],
    ['APPROVAL','waiting lock','not final sponsor content','#ff778e', 2.25,.78,.50]
  ];
  const clickables=[];
  for(const [title,sub,foot,color,x,y,z] of cardDefs){
    const p=addPlane(group,`Reiki Snapshot Carousel ${title}`,.74,.50,card(title,sub,foot,color),[x,y,z],{rotY:-x*.08});
    p.userData.svrReikiCarousel107=title;
    if(title==='VIDEO HOLOGRAM') p.userData.svrHref='./reiki-video-portal.html?v=phase107-snapshot-reiki&zone=reiki';
    if(title==='MEDITATION') p.userData.svrScene='reikiRoom';
    clickables.push(p);
  }

  // Center hologram beacon like screenshot.
  const halo = new THREE.Mesh(new THREE.TorusGeometry(.46,.018,16,120), new THREE.MeshBasicMaterial({color:0x8affea, transparent:true, opacity:.85, blending:THREE.AdditiveBlending}));
  halo.position.set(0,1.0,.63); group.add(halo);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.16,.42,1.25,48,1,true), new THREE.MeshBasicMaterial({color:0x86ffe4, transparent:true, opacity:.18, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false}));
  beam.position.set(0,.72,.63); group.add(beam);

  // Ropes and plants matching screenshot spacing.
  const ropeMat=new THREE.MeshBasicMaterial({color:0x8a0712});
  [-2.7,-1.8,-.9,.9,1.8,2.7].forEach(x=>{ group.add(makePost(x,.12)); group.add(makePost(x,1.86)); });
  for(const z of [.12,1.86]){
    for(let i=0;i<5;i++){
      const x=-2.7+i*1.35;
      const rope=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.35,10),ropeMat);
      rope.rotation.z=Math.PI/2; rope.position.set(x+.675,.72,z); group.add(rope);
    }
  }
  const plantMat=new THREE.MeshStandardMaterial({color:0x0ca65e, roughness:.7});
  const potMat=new THREE.MeshStandardMaterial({color:0x5b1020, roughness:.6});
  const plantSpots=[[-3.8,.25],[-3.35,1.95],[-.42,.86],[3.72,.33],[3.35,1.95],[-2.2,2.15],[2.2,2.15]];
  for(const [x,z] of plantSpots){
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.18,16),potMat); pot.position.set(x,.09,z); group.add(pot);
    for(let i=0;i<7;i++){
      const leaf=new THREE.Mesh(new THREE.ConeGeometry(.035,.38,8),plantMat);
      leaf.position.set(x+(i-3)*.025,.34,z); leaf.rotation.z=(i-3)*.18; leaf.rotation.x=.35; group.add(leaf);
    }
  }

  function openVideo(){
    setStatus('Opening Reiki hologram video carousel…',{force:true});
    window.location.href='./reiki-video-portal.html?v=phase107-snapshot-reiki&zone=reiki';
  }
  window.SVR_OPEN_REIKI_HOLOGRAM = openVideo;
  window.SVR_REIKI_SNAPSHOT_MOTHER_MODULE_READY = true;

  const raycaster=new THREE.Raycaster(); const mouse=new THREE.Vector2();
  const onPointer=(ev)=>{
    if(!renderer?.domElement || renderer.xr?.isPresenting) return;
    const rect=renderer.domElement.getBoundingClientRect();
    mouse.x=((ev.clientX-rect.left)/rect.width)*2-1; mouse.y=-((ev.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,camera);
    const hit=raycaster.intersectObjects(clickables,false)[0];
    if(!hit) return;
    const o=hit.object;
    if(o.userData.svrHref) openVideo();
    else if(o.userData.svrScene && sceneTargets?.[o.userData.svrScene]?.href) window.location.href = sceneTargets[o.userData.svrScene].href;
    else setStatus(`Reiki carousel: ${o.userData.svrReikiCarousel107}`, {force:true});
  };
  renderer?.domElement?.addEventListener('pointerdown', onPointer);

  scene.add(group);
  const api={group, openVideo, dispose(){renderer?.domElement?.removeEventListener('pointerdown', onPointer); scene.remove(group);}};
  scene.userData._svrReikiSnapshot107=api;
  log('Phase 107 Reiki snapshot visual match mother module restored.');
  return api;
}
