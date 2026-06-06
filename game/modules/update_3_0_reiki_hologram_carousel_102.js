import * as THREE from "three";

const BUILD = "UPDATE-3.0-PHASE-103-REIKI-MOTHER-QUEST-SKY-STOREFRONT-LOCK";

function texPanel(title, lines = [], opts = {}){
  const w = opts.w || 1200, h = opts.h || 720;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,w,h);
  g.addColorStop(0, opts.bg0 || '#02060a');
  g.addColorStop(.42, opts.bg1 || '#071e1b');
  g.addColorStop(1, opts.bg2 || '#180525');
  x.fillStyle = g; x.fillRect(0,0,w,h);
  x.strokeStyle = opts.stroke || 'rgba(137,255,237,.96)';
  x.lineWidth = 12; x.strokeRect(20,20,w-40,h-40);
  x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 2;
  for(let yy=72; yy<h-70; yy+=42){ x.beginPath(); x.moveTo(56,yy); x.lineTo(w-56,yy); x.stroke(); }
  x.textAlign='center'; x.textBaseline='middle';
  x.shadowColor = opts.glow || 'rgba(137,255,237,.75)'; x.shadowBlur = 24;
  x.fillStyle = opts.titleColor || '#ffffff'; x.font = `900 ${opts.titleSize || 76}px system-ui, Segoe UI, Arial`;
  x.fillText(title, w/2, opts.titleY || 118, w-92);
  x.shadowBlur = 8;
  x.font = `700 ${opts.lineSize || 36}px system-ui, Segoe UI, Arial`;
  x.fillStyle = opts.lineColor || '#bcfff1';
  lines.forEach((line,i)=>x.fillText(line, w/2, (opts.lineY || 236) + i*(opts.lineGap || 58), w-100));
  if(opts.badge){
    x.fillStyle='rgba(255,50,80,.18)'; x.strokeStyle='rgba(255,95,130,.85)'; x.lineWidth=6;
    const bw=560,bh=76,bx=(w-bw)/2,by=h-122; x.fillRect(bx,by,bw,bh); x.strokeRect(bx,by,bw,bh);
    x.fillStyle='#ffdce4'; x.font='900 34px system-ui, Segoe UI, Arial'; x.fillText(opts.badge,w/2,by+bh/2);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function glowTexture(){
  const c=document.createElement('canvas'); c.width=128; c.height=128; const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,2,64,64,62);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.20,'rgba(190,255,238,.95)'); g.addColorStop(.55,'rgba(120,255,215,.24)'); g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g; x.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

function makeVideoFrameTexture(label='REIKI HOLOGRAM', phase=0){
  const w=960,h=540,c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#02100f'); g.addColorStop(.55,'#122034'); g.addColorStop(1,'#17021d');
  x.fillStyle=g; x.fillRect(0,0,w,h);
  x.strokeStyle='rgba(130,255,236,.92)'; x.lineWidth=10; x.strokeRect(20,20,w-40,h-40);
  x.globalAlpha=.42;
  for(let i=0;i<38;i++){
    const yy=(i*23+phase*8)%h; x.fillStyle=i%2?'rgba(146,255,230,.13)':'rgba(255,255,255,.05)'; x.fillRect(36,yy,w-72,7);
  }
  x.globalAlpha=1;
  const cx=w/2, cy=h/2+20;
  const rg=x.createRadialGradient(cx,cy,20,cx,cy,210);
  rg.addColorStop(0,'rgba(255,255,255,.96)'); rg.addColorStop(.20,'rgba(186,255,243,.70)'); rg.addColorStop(.64,'rgba(122,255,220,.12)'); rg.addColorStop(1,'rgba(122,255,220,0)');
  x.fillStyle=rg; x.beginPath(); x.arc(cx,cy,215,0,Math.PI*2); x.fill();
  x.fillStyle='rgba(255,255,255,.94)'; x.font='900 70px system-ui, Segoe UI, Arial'; x.textAlign='center'; x.textBaseline='middle';
  x.shadowColor='rgba(142,255,236,.75)'; x.shadowBlur=20; x.fillText(label,cx,104,w-90);
  x.shadowBlur=8; x.font='700 36px system-ui, Segoe UI, Arial'; x.fillStyle='#c8fff3'; x.fillText('VIDEO CAROUSEL PLACEHOLDER',cx,cy+160,w-80);
  x.font='700 28px system-ui, Segoe UI, Arial'; x.fillStyle='#ffdce4'; x.fillText('AWAITING APPROVED MEDIA',cx,cy+205,w-80);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}

function addHologramCarousel(scene, opts={}){
  const root = new THREE.Group(); root.name = opts.name || 'SVR_PHASE102_REIKI_HOLOGRAM_VIDEO_CAROUSEL';
  root.position.copy(opts.position || new THREE.Vector3(18.85,0.04,0));
  root.rotation.y = opts.rotationY ?? -Math.PI/2;
  scene.add(root);

  const additive = THREE.AdditiveBlending;
  const baseMat = new THREE.MeshStandardMaterial({color:0x061012,roughness:.22,metalness:.45,emissive:0x063c3b,emissiveIntensity:.42});
  const trimMat = new THREE.MeshStandardMaterial({color:0xa7fff1,roughness:.12,metalness:.55,emissive:0x36d9b8,emissiveIntensity:1.0});
  const glassMat = new THREE.MeshBasicMaterial({color:0x9ffff0,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false,blending:additive});

  const stage = new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.55,.14,96), baseMat); stage.position.set(0,.07,0); root.add(stage);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.45,.035,12,160), new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.72,depthWrite:false,blending:additive})); ring.rotation.x=Math.PI/2; ring.position.y=.18; root.add(ring);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color:0x9affec,transparent:true,opacity:.22,depthWrite:false,blending:additive})); halo.scale.set(7,7,1); halo.position.set(0,2.5,.05); root.add(halo);

  const screenTex = makeVideoFrameTexture('REIKI HUB', 0);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.8,2.7), new THREE.MeshBasicMaterial({map:screenTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  screen.position.set(0,3.05,.28); root.add(screen);
  const screenGlow = new THREE.PointLight(0x8ffff0,1.35,10,2); screenGlow.position.set(0,3.05,.68); root.add(screenGlow);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.42,1.8,3.5,64,1,true), new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false,blending:additive})); beam.position.set(0,1.84,.02); root.add(beam);

  const titles = [
    ['HOLOGRAM PREVIEW',['approved video slot','carousel restored','sound disabled']],
    ['REIKI STORE',['wellness items','session info','approval safe']],
    ['PRIVATE ROOM',['meditation stage','green rising energy','return gate']],
    ['AWAITING APPROVAL',['placeholder active','no outside branding','media can be swapped']]
  ];
  const cards=[];
  for(let i=0;i<titles.length;i++){
    const [title,lines]=titles[i];
    const card = new THREE.Mesh(new THREE.PlaneGeometry(2.25,1.34), new THREE.MeshBasicMaterial({map:texPanel(title,lines,{w:900,h:560,titleSize:54,lineSize:28,lineY:212,lineGap:46,badge:i===3?'AWAITING APPROVAL':''}),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    card.userData.angle = i/titles.length*Math.PI*2;
    card.userData.radius = 3.55;
    cards.push(card); root.add(card);
  }

  const titlePanel = new THREE.Mesh(new THREE.PlaneGeometry(5.5,.72), new THREE.MeshBasicMaterial({map:texPanel('REIKI HOLOGRAM CAROUSEL',['new room/storefront restored'],{w:1100,h:260,titleSize:54,titleY:86,lineSize:25,lineY:170}),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  titlePanel.position.set(0,4.78,.32); root.add(titlePanel);

  root.userData.tick = (dt,t)=>{
    ring.rotation.z += dt*.55;
    beam.rotation.y += dt*.18;
    halo.material.opacity = .18 + .06*(.5+.5*Math.sin(t*1.2));
    screenGlow.intensity = 1.05 + .35*(.5+.5*Math.sin(t*1.7));
    if(Math.floor(t*2.2)%2===0){ screen.material.opacity = .96; } else { screen.material.opacity = .86; }
    cards.forEach((card,idx)=>{
      const a = card.userData.angle + t*.22;
      const r = card.userData.radius;
      card.position.set(Math.cos(a)*r, 2.15 + Math.sin(t*1.1+idx)*.10, Math.sin(a)*r*.52 + .20);
      card.lookAt(0,2.05,.3);
      const front = (Math.sin(a) > -0.35) ? 1 : .42;
      card.material.opacity = front;
    });
  };
  return root;
}

function removeLegacyFlatReikiPanels(scene){
  // Do not delete the whole hub. Only hide duplicate flat placeholder planes if a prior phase tagged them.
  scene.traverse((o)=>{
    const n = String(o.name||'').toLowerCase();
    if(n.includes('old_reiki_flat') || n.includes('legacy_reiki_placeholder')) o.visible = false;
  });
}

export function applyReikiHologramCarousel102({scene,setStatus,log}={}){
  if(!scene || scene.userData.SVR_PHASE102_REIKI_HOLOGRAM_LOCK) return scene?.userData?.SVR_PHASE102_REIKI_HOLOGRAM_LOCK;
  removeLegacyFlatReikiPanels(scene);
  const lobbyCarousel = addHologramCarousel(scene, {name:'SVR_PHASE102_LOBBY_REIKI_HOLOGRAM_CAROUSEL', position:new THREE.Vector3(18.35,.04,-.35), rotationY:-Math.PI/2});
  const roots=[lobbyCarousel];
  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = function(dt){ oldTick?.(dt); const t = scene.userData._time || performance.now()/1000; roots.forEach(r=>r?.userData?.tick?.(dt,t)); };
  const lock={build:BUILD,reiki:'hologram video carousel restored',audio:'disabled',approval:'awaiting approval safe'};
  scene.userData.SVR_PHASE102_REIKI_HOLOGRAM_LOCK=lock; window.SVR_PHASE102_REIKI_HOLOGRAM_LOCK=lock;
  setStatus?.('Phase 103: Reiki mother module + hologram carousel locked; music remains disabled.',{force:true});
  log?.('Phase 103 Reiki mother module hologram carousel lock loaded', BUILD);
  return lock;
}

export { addHologramCarousel };


export const PHASE_103_REIKI_MOTHER_LOCK = true;
