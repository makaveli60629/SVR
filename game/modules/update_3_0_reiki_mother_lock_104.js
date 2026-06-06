import * as THREE from "three";

const BUILD = "UPDATE-3.0-PHASE-104-ROLLBACK-RECOVERY-REIKI-MOTHER-LOCK";

function makePanelTexture(title, lines = [], opts = {}){
  const w = opts.w || 1200;
  const h = opts.h || 720;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const bg = x.createLinearGradient(0,0,w,h);
  bg.addColorStop(0, opts.bg0 || '#02080a');
  bg.addColorStop(.48, opts.bg1 || '#06241d');
  bg.addColorStop(1, opts.bg2 || '#1a0525');
  x.fillStyle = bg; x.fillRect(0,0,w,h);
  x.strokeStyle = opts.stroke || 'rgba(130,255,235,.94)'; x.lineWidth = 12; x.strokeRect(20,20,w-40,h-40);
  x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineWidth = 2;
  for(let yy=74; yy<h-58; yy+=44){ x.beginPath(); x.moveTo(54,yy); x.lineTo(w-54,yy); x.stroke(); }
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.shadowColor = opts.glow || 'rgba(118,255,220,.82)'; x.shadowBlur = 24;
  x.fillStyle = opts.titleColor || '#ffffff'; x.font = `900 ${opts.titleSize || 72}px system-ui, Segoe UI, Arial`;
  x.fillText(title, w/2, opts.titleY || 115, w-90);
  x.shadowBlur = 8;
  x.font = `700 ${opts.lineSize || 34}px system-ui, Segoe UI, Arial`;
  x.fillStyle = opts.lineColor || '#c8fff5';
  lines.forEach((line,i)=>x.fillText(line, w/2, (opts.lineY || 235)+i*(opts.lineGap || 56), w-110));
  if(opts.badge){
    const bw=560,bh=78,bx=(w-bw)/2,by=h-126;
    x.fillStyle='rgba(255,48,84,.22)'; x.strokeStyle='rgba(255,105,135,.90)'; x.lineWidth=6; x.fillRect(bx,by,bw,bh); x.strokeRect(bx,by,bw,bh);
    x.fillStyle='#ffe4eb'; x.font='900 34px system-ui, Segoe UI, Arial'; x.fillText(opts.badge,w/2,by+bh/2);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function makeVideoTexture(title='REIKI HOLOGRAM', subtitle='VIDEO CAROUSEL RESTORED'){
  const w=1280,h=720,c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
  const g=x.createRadialGradient(w/2,h/2,10,w/2,h/2,620);
  g.addColorStop(0,'#15433f'); g.addColorStop(.42,'#071b25'); g.addColorStop(1,'#100018');
  x.fillStyle=g; x.fillRect(0,0,w,h);
  for(let i=0;i<70;i++){
    const a=(i*37)%w; const y=(i*31)%h;
    x.fillStyle=i%3===0?'rgba(146,255,225,.14)':'rgba(255,255,255,.05)';
    x.fillRect(a,y,280,3+(i%5));
  }
  x.strokeStyle='rgba(132,255,235,.95)'; x.lineWidth=14; x.strokeRect(26,26,w-52,h-52);
  const cx=w/2, cy=h/2+25;
  const aura=x.createRadialGradient(cx,cy,8,cx,cy,230);
  aura.addColorStop(0,'rgba(255,255,255,.96)'); aura.addColorStop(.24,'rgba(178,255,241,.60)'); aura.addColorStop(.72,'rgba(119,255,225,.12)'); aura.addColorStop(1,'rgba(119,255,225,0)');
  x.fillStyle=aura; x.beginPath(); x.arc(cx,cy,240,0,Math.PI*2); x.fill();
  x.textAlign='center'; x.textBaseline='middle'; x.shadowColor='rgba(139,255,236,.9)'; x.shadowBlur=28;
  x.fillStyle='#ffffff'; x.font='900 78px system-ui, Segoe UI, Arial'; x.fillText(title,cx,112,w-120);
  x.shadowBlur=12; x.fillStyle='#cffff6'; x.font='800 43px system-ui, Segoe UI, Arial'; x.fillText(subtitle,cx,cy+158,w-120);
  x.font='800 30px system-ui, Segoe UI, Arial'; x.fillStyle='#ffe7ee'; x.fillText('AWAITING APPROVED VIDEO MEDIA',cx,cy+212,w-120);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}

function glowSprite(color=0x8ffff0, opacity=.22, scale=7){
  const c=document.createElement('canvas'); c.width=128; c.height=128; const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,2,64,64,62);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.2,'rgba(185,255,242,.92)'); g.addColorStop(.58,'rgba(118,255,222,.22)'); g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g; x.fillRect(0,0,128,128);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
  sp.scale.set(scale,scale,1); return sp;
}

function addRisingSprites(root, color=0x63ffb2, count=90, radius=3.2){
  const geom=new THREE.BufferGeometry(); const pos=new Float32Array(count*3); const speed=new Float32Array(count);
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*radius;
    pos[i*3]=Math.cos(a)*r; pos[i*3+1]=Math.random()*4.5+.15; pos[i*3+2]=Math.sin(a)*r*.65;
    speed[i]=.35+Math.random()*.75;
  }
  geom.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(geom,new THREE.PointsMaterial({color,size:.055,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending}));
  root.add(pts);
  pts.userData.tick=(dt)=>{
    const p=pts.geometry.attributes.position.array;
    for(let i=0;i<count;i++){ p[i*3+1]+=speed[i]*dt; if(p[i*3+1]>5.4) p[i*3+1]=.12; }
    pts.geometry.attributes.position.needsUpdate=true;
  };
  return pts;
}

function addPlant(root, x, z, s=1){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.045*s,.07*s,.62*s,10),new THREE.MeshStandardMaterial({color:0x3b2112,roughness:.9})); trunk.position.set(x,.34*s,z); root.add(trunk);
  const leafMat=new THREE.MeshStandardMaterial({color:0x38d07c,emissive:0x063a1a,emissiveIntensity:.18,roughness:.7});
  for(let i=0;i<7;i++){
    const leaf=new THREE.Mesh(new THREE.ConeGeometry(.13*s,.8*s,12),leafMat);
    leaf.position.set(x+Math.cos(i)*.13*s,.78*s,z+Math.sin(i)*.10*s); leaf.rotation.z=(i-3)*.18; root.add(leaf);
  }
}

function makeCard(title, lines, badge=''){
  return new THREE.Mesh(new THREE.PlaneGeometry(2.22,1.34), new THREE.MeshBasicMaterial({
    map: makePanelTexture(title, lines, {w:920,h:560,titleSize:50,lineSize:27,lineY:207,lineGap:44,badge}),
    transparent:true, side:THREE.DoubleSide, depthWrite:false
  }));
}

function addReikiMotherModule(scene, opts={}){
  const root=new THREE.Group(); root.name=opts.name || 'SVR_PHASE104_REIKI_MOTHER_MODULE_HOLOGRAM_CAROUSEL';
  root.position.copy(opts.position || new THREE.Vector3(18.25,.02,-.35));
  root.rotation.y=opts.rotationY ?? -Math.PI/2;
  scene.add(root);

  const metal=new THREE.MeshStandardMaterial({color:0x061014,roughness:.25,metalness:.58,emissive:0x052c2a,emissiveIntensity:.34});
  const neon=new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.86,depthWrite:false,blending:THREE.AdditiveBlending});
  const floor=new THREE.Mesh(new THREE.CylinderGeometry(4.75,5.15,.16,128),metal); floor.position.y=.08; root.add(floor);
  const outerRing=new THREE.Mesh(new THREE.TorusGeometry(5.18,.045,12,180),neon); outerRing.rotation.x=Math.PI/2; outerRing.position.y=.22; root.add(outerRing);
  const innerRing=new THREE.Mesh(new THREE.TorusGeometry(2.55,.038,12,160),new THREE.MeshBasicMaterial({color:0x68ffb7,transparent:true,opacity:.82,depthWrite:false,blending:THREE.AdditiveBlending})); innerRing.rotation.x=Math.PI/2; innerRing.position.y=.25; root.add(innerRing);

  const backWall=new THREE.Mesh(new THREE.PlaneGeometry(7.3,4.55),new THREE.MeshBasicMaterial({map:makePanelTexture('REIKI MOTHER MODULE',['hologram video carousel','about • store • meditation','AWAITING APPROVAL'],{w:1400,h:820,titleSize:82,lineSize:38,badge:'AWAITING APPROVAL'}),transparent:true,side:THREE.DoubleSide}));
  backWall.position.set(0,3.05,-.72); root.add(backWall);

  const screen=new THREE.Mesh(new THREE.PlaneGeometry(5.05,2.85),new THREE.MeshBasicMaterial({map:makeVideoTexture('REIKI HOLOGRAM','VIDEO CAROUSEL RESTORED'),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  screen.position.set(0,3.12,.42); root.add(screen);
  const halo=glowSprite(0x92fff0,.22,7.4); halo.position.set(0,3.04,.34); root.add(halo);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.48,1.9,3.85,72,1,true),new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.060,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); beam.position.set(0,1.98,.1); root.add(beam);
  const light=new THREE.PointLight(0x8ffff0,1.9,14,2); light.position.set(0,3.1,1.0); root.add(light);

  const cards=[
    makeCard('VIDEO SLOT',['hologram media','approved video goes here','sound remains off']),
    makeCard('ABOUT',['mission panel','wellness intro','approval safe copy']),
    makeCard('REIKI STORE',['storefront card','session info','items later']),
    makeCard('MEDITATION',['private room','breathing ring','green sprites']),
    makeCard('APPROVAL',['no outside brand','red approval lock','replace later'],'AWAITING APPROVAL')
  ];
  cards.forEach((card,i)=>{card.userData.a=i/cards.length*Math.PI*2; card.userData.r=4.25; root.add(card);});

  const title=new THREE.Mesh(new THREE.PlaneGeometry(6.2,.72),new THREE.MeshBasicMaterial({map:makePanelTexture('REIKI HUB 3.0',['mother module lock'],{w:1200,h:260,titleSize:58,titleY:86,lineSize:26,lineY:170}),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  title.position.set(0,5.58,.42); root.add(title);

  [-3.7,-2.7,2.7,3.7].forEach((x,i)=>addPlant(root,x, i<2?1.35:1.55, i%2?1.1:1.35));
  const sprites=addRisingSprites(root,0x63ffb2,130,4.3);

  root.userData.tick=(dt,time)=>{
    outerRing.rotation.z+=dt*.35; innerRing.rotation.z-=dt*.52; beam.rotation.y+=dt*.18;
    halo.material.opacity=.18+.08*(.5+.5*Math.sin(time*1.5));
    light.intensity=1.35+.55*(.5+.5*Math.sin(time*1.7));
    sprites.userData.tick(dt);
    cards.forEach((card,i)=>{const a=card.userData.a+time*.25; const r=card.userData.r; card.position.set(Math.cos(a)*r,2.22+Math.sin(time+i)*.09,Math.sin(a)*1.7+.58); card.lookAt(0,2.15,.45); card.material.opacity=Math.sin(a)>-.55?1:.38;});
  };
  return root;
}

function hideKnownBadLegacy(scene){
  scene.traverse((o)=>{
    const n=String(o.name||'').toLowerCase();
    if(n.includes('old_reiki_flat') || n.includes('legacy_reiki_placeholder') || n.includes('phase85_reiki')) o.visible=false;
  });
}

export function applyReikiMotherModule104({scene,setStatus,log}={}){
  if(!scene || scene.userData.SVR_PHASE104_REIKI_MOTHER_LOCK) return scene?.userData?.SVR_PHASE104_REIKI_MOTHER_LOCK;
  hideKnownBadLegacy(scene);
  const module=addReikiMotherModule(scene);
  const oldTick=scene.userData._tickWorld;
  scene.userData._tickWorld=function(dt){ oldTick?.(dt); const t=performance.now()/1000; module?.userData?.tick?.(dt,t); };
  const lock={build:BUILD,reiki:'mother module hologram carousel restored',audio:'disabled',baseline:'rollback recovery'};
  scene.userData.SVR_PHASE104_REIKI_MOTHER_LOCK=lock; window.SVR_PHASE104_REIKI_MOTHER_LOCK=lock;
  setStatus?.('Phase 104: Reiki mother module restored and locked.',{force:true});
  log?.('Phase 104 Reiki mother module lock loaded', BUILD);
  return lock;
}

export { addReikiMotherModule, makePanelTexture };
