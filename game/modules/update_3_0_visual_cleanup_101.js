import * as THREE from "three";

const BUILD = "UPDATE-3.0-PHASE-101-REIKI-SKY-NO-MUSIC-REFINE-LOCK";

function makeTextTexture(title, lines = [], w = 1200, h = 560){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,w,h);
  g.addColorStop(0,'#020609'); g.addColorStop(.45,'#071f1b'); g.addColorStop(1,'#16051f');
  x.fillStyle = g; x.fillRect(0,0,w,h);
  x.strokeStyle = 'rgba(142,255,236,.96)'; x.lineWidth = 12; x.strokeRect(18,18,w-36,h-36);
  x.shadowColor='rgba(130,255,236,.65)'; x.shadowBlur=24;
  x.textAlign='center'; x.textBaseline='middle';
  x.fillStyle='#ffffff'; x.font='900 74px system-ui,Segoe UI,Arial'; x.fillText(title,w/2,120,w-80);
  x.shadowBlur=8; x.fillStyle='#bcfff1'; x.font='700 34px system-ui,Segoe UI,Arial';
  lines.forEach((line,i)=>x.fillText(line,w/2,220+i*54,w-90));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
function makeGlowTexture(){
  const c=document.createElement('canvas'); c.width=128; c.height=128; const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,2,64,64,62);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.18,'rgba(200,255,230,.92)'); g.addColorStop(.45,'rgba(80,255,150,.28)'); g.addColorStop(1,'rgba(80,255,150,0)');
  x.fillStyle=g; x.fillRect(0,0,128,128);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function panel(title, lines, w=3.6, h=1.24){
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({map:makeTextTexture(title,lines),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
}
function loadTexture(path){
  const t = new THREE.TextureLoader().load(path);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function makeHalo(color, opacity, scale){
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTexture(),color,transparent:true,opacity,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
  spr.scale.set(scale,scale,1);
  return spr;
}
function hideOldSmallPlanets(scene){
  scene.traverse((o)=>{
    if (!o?.isMesh || !o.geometry?.parameters?.radius) return;
    const r=o.geometry.parameters.radius;
    if (r >= 5 && r <= 13 && o.position.y > 25 && o.position.z < -40){
      o.visible = false;
      o.userData.phase101HiddenOldPlanet = true;
    }
  });
}
function addMoonMars(scene){
  hideOldSmallPlanets(scene);
  const root = new THREE.Group(); root.name = 'SVR_PHASE101_HIGH_TEXTURED_MOON_MARS'; scene.add(root);
  const moonMat = new THREE.MeshStandardMaterial({
    color:0xffffff, roughness:.96, metalness:0,
    map:loadTexture('./assets/texture/moon_diffuse.png'),
    bumpMap:loadTexture('./assets/texture/moon_bump.png'), bumpScale:1.08,
    emissive:0x111722, emissiveIntensity:.10
  });
  const marsMat = new THREE.MeshStandardMaterial({
    color:0xffffff, roughness:.88, metalness:0,
    map:loadTexture('./assets/texture/mars/diffuse_1k.jpg'),
    bumpMap:loadTexture('./assets/texture/mars/bump_1k.jpg'), bumpScale:.58,
    emissive:0x1f0904, emissiveIntensity:.08
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(22,80,48), moonMat);
  moon.name='SVR_PHASE101_MOON_HIGH_TEXTURED'; moon.frustumCulled=false; root.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(11.5,64,40), marsMat);
  mars.name='SVR_PHASE101_MARS_ORBITING_MOON_TEXTURED'; mars.frustumCulled=false; root.add(mars);
  const moonHalo=makeHalo(0xf4f7ff,.12,128); root.add(moonHalo);
  const marsHalo=makeHalo(0xff9b6b,.10,72); root.add(marsHalo);
  const moonLight=new THREE.PointLight(0xeaf2ff,3.2,520,1.45); root.add(moonLight);
  const marsLight=new THREE.PointLight(0xff9a72,1.8,320,1.55); root.add(marsLight);
  root.userData.tick=(dt,t)=>{
    const baseX=-48+Math.sin(t*.010)*4;
    const baseY=148+Math.sin(t*.030)*1.5;
    const baseZ=-262+Math.cos(t*.008)*5;
    moon.position.set(baseX,baseY,baseZ);
    moon.rotation.y += dt*.055; moon.rotation.x = .06;
    const a=t*.18;
    mars.position.set(baseX+Math.cos(a)*48, baseY+12+Math.sin(a*1.2)*7, baseZ+Math.sin(a)*34-18);
    mars.rotation.y += dt*.082; mars.rotation.z=.04;
    moonHalo.position.copy(moon.position); marsHalo.position.copy(mars.position);
    moonLight.position.copy(moon.position); marsLight.position.copy(mars.position);
    moonHalo.material.opacity=.10+.025*(.5+.5*Math.sin(t*.22));
    marsHalo.material.opacity=.075+.02*(.5+.5*Math.sin(t*.28));
  };
  return root;
}
function addRisingSprites(scene, center, opts={}){
  const tex=makeGlowTexture();
  const group=new THREE.Group(); group.name=opts.name || 'SVR_PHASE101_RISING_SPRITES'; scene.add(group);
  const count=opts.count || 60;
  for(let i=0;i<count;i++){
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:i%3===0?opts.colorB:opts.colorA,transparent:true,opacity:opts.opacity ?? .34,depthWrite:false,blending:THREE.AdditiveBlending}));
    const r=(opts.radius || 4)*(Math.sqrt(Math.random())); const a=Math.random()*Math.PI*2;
    spr.position.set(center.x+Math.cos(a)*r, (opts.minY||.45)+Math.random()*((opts.maxY||8)-(opts.minY||.45)), center.z+Math.sin(a)*r);
    const sz=(opts.minSize||.12)+Math.random()*((opts.maxSize||.42)-(opts.minSize||.12)); spr.scale.set(sz,sz,1);
    spr.userData.baseX=spr.position.x; spr.userData.baseZ=spr.position.z; spr.userData.phase=Math.random()*Math.PI*2; spr.userData.speed=(opts.speed||.9)*(0.65+Math.random()*.7);
    group.add(spr);
  }
  group.userData.tick=(dt,t)=>{
    group.children.forEach((spr,i)=>{
      spr.position.y += dt*spr.userData.speed;
      if(spr.position.y > (opts.maxY||8)) spr.position.y=(opts.minY||.45);
      spr.position.x=spr.userData.baseX+Math.sin(t*.9+spr.userData.phase)*.09;
      spr.position.z=spr.userData.baseZ+Math.cos(t*.8+spr.userData.phase)*.09;
      spr.material.opacity=(opts.opacity ?? .32)*(.72+.28*Math.sin(t*.75+i));
    });
  };
  return group;
}
function addReikiStorefrontOverlay(scene){
  const root=new THREE.Group(); root.name='SVR_PHASE101_REIKI_NEW_STOREFRONT_REINFORCE'; root.position.set(19.95,0.015,0); root.rotation.y=-Math.PI/2; scene.add(root);
  const frameMat=new THREE.MeshStandardMaterial({color:0x071115,roughness:.28,metalness:.35,emissive:0x0b564e,emissiveIntensity:.34});
  const trimMat=new THREE.MeshStandardMaterial({color:0x8ffff0,roughness:.16,metalness:.55,emissive:0x21bfa3,emissiveIntensity:.85});
  const glassMat=new THREE.MeshStandardMaterial({color:0x9affec,transparent:true,opacity:.12,roughness:.06,metalness:.28,emissive:0x1d806f,emissiveIntensity:.32,side:THREE.DoubleSide,depthWrite:false});
  const shell=new THREE.Mesh(new THREE.BoxGeometry(18.3,6.8,.22),frameMat); shell.position.set(0,3.25,-2.7); root.add(shell);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(18.8,.18,5.8),frameMat); roof.position.set(0,6.72,-.22); root.add(roof);
  for(const x of [-9.1,9.1]){ const col=new THREE.Mesh(new THREE.BoxGeometry(.18,6.5,5.5),trimMat); col.position.set(x,3.25,-.25); root.add(col); }
  const top=new THREE.Mesh(new THREE.BoxGeometry(18.5,.18,.28),trimMat); top.position.set(0,6.45,.60); root.add(top);
  for(const x of [-6.4,6.4]){ const g=new THREE.Mesh(new THREE.PlaneGeometry(4.4,4.2),glassMat); g.position.set(x,2.75,.72); root.add(g); }
  const sign=panel('REIKI HUB 3.0',['NEW STOREFRONT RESTORED','AWAITING APPROVAL'],7.2,1.12); sign.position.set(0,5.92,.82); root.add(sign);
  const left=panel('WELLNESS PORTAL',['Private Reiki room','Hologram route ready','SVR placeholder only'],3.35,2.35); left.position.set(-5.1,3.0,.86); root.add(left);
  const mid=panel('AWAITING APPROVAL',['No outside branding active','Sponsor content locked','Approval-safe display'],3.35,2.35); mid.position.set(0,3.0,.88); root.add(mid);
  const right=panel('REIKI STORE',['Meditation items','Session info cards','Future approved media'],3.35,2.35); right.position.set(5.1,3.0,.86); root.add(right);
  const portalRing=new THREE.Mesh(new THREE.TorusGeometry(1.12,.035,12,96),new THREE.MeshBasicMaterial({color:0x8ffff0,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending})); portalRing.position.set(0,1.72,1.08); root.add(portalRing);
  const light=new THREE.PointLight(0x79ffd4,1.2,10,2); light.position.set(0,2.4,1.6); root.add(light);
  root.userData.tick=(dt,t)=>{ portalRing.rotation.z+=dt*.6; light.intensity=.85+.35*Math.sin(t*1.8); };
  return root;
}
function removeMusicElements(){
  window.SVR_AUDIO_DISABLED = true;
  document.querySelectorAll('audio,video[data-audio-only="true"]').forEach(el=>{ try{ el.pause(); el.muted=true; el.remove(); }catch(_e){} });
}
export function applyUpdate30VisualCleanup101({scene,camera,renderer,setStatus,log}={}){
  if(!scene || scene.userData.SVR_PHASE101_REFINED_LOCK) return scene?.userData?.SVR_PHASE101_REFINED_LOCK;
  removeMusicElements();
  const moonMars=addMoonMars(scene);
  const reikiStore=addReikiStorefrontOverlay(scene);
  const reikiSprites=addRisingSprites(scene,new THREE.Vector3(20,0,0),{name:'SVR_PHASE101_GREEN_REIKI_RISING_SPRITES',colorA:0x63ff9c,colorB:0xd4ffe4,count:96,radius:7.2,minY:.35,maxY:16,opacity:.28,minSize:.10,maxSize:.34,speed:1.1});
  const tableSprites=addRisingSprites(scene,new THREE.Vector3(0,0,0),{name:'SVR_PHASE101_PURPLE_TABLE_RISING_SPRITES',colorA:0xb06cff,colorB:0xf6dcff,count:64,radius:8.4,minY:.4,maxY:12.5,opacity:.22,minSize:.08,maxSize:.28,speed:.82});
  const roots=[moonMars,reikiStore,reikiSprites,tableSprites];
  const oldTick=scene.userData._tickWorld;
  scene.userData._tickWorld=function(dt){ oldTick?.(dt); const t=(scene.userData._time||performance.now()/1000); roots.forEach(r=>r?.userData?.tick?.(dt,t)); removeMusicElements(); };
  const lock={build:BUILD,audio:'disabled',moonMars:'high textured orbit',reiki:'new storefront overlay restored'};
  scene.userData.SVR_PHASE101_REFINED_LOCK=lock; window.SVR_PHASE101_REFINED_LOCK=lock;
  setStatus?.('Phase 101 refined: music removed, high textured Moon/Mars, Reiki storefront restored.',{force:true});
  log?.('Phase 101 refine lock loaded',BUILD);
  return lock;
}
