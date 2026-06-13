import * as THREE from "three";

function canvasTexture(w, h, painter){
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  painter(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function makePanelTexture(title, lines = [], accent = '#7dfff0', footer = 'WAITING FOR APPROVAL'){
  return canvasTexture(1024, 768, (x, w, h)=>{
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#061014');
    g.addColorStop(0.58, '#16071c');
    g.addColorStop(1, '#03050a');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = accent;
    x.lineWidth = 12;
    roundRect(x, 28, 28, w - 56, h - 56, 40);
    x.stroke();
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = '#f7ffff';
    x.font = '900 62px system-ui, Arial';
    x.fillText(title, w / 2, 108);
    x.fillStyle = '#dffff8';
    x.font = '700 34px system-ui, Arial';
    let y = 216;
    for (const line of lines.slice(0, 6)){
      x.fillText(line, w / 2, y);
      y += 58;
    }
    x.fillStyle = 'rgba(255,40,56,.20)';
    roundRect(x, 120, h - 150, w - 240, 82, 24);
    x.fill();
    x.strokeStyle = 'rgba(255,72,72,.82)';
    x.lineWidth = 5;
    roundRect(x, 120, h - 150, w - 240, 82, 24);
    x.stroke();
    x.fillStyle = '#ffdada';
    x.font = '900 30px system-ui, Arial';
    x.fillText(footer, w / 2, h - 108);
  });
}

function makeFounderTexture(){
  return makePanelTexture('FOUNDER', [
    'Trueitive wellness presentation',
    'Reiki • meditation • bodywork',
    'Founder story / services wall',
    'Video hologram carousel',
    'Booking and private-room route'
  ], '#7dfff0', 'WAITING FOR APPROVAL');
}

function makeStorefrontTexture(title, lines = [], accent = '#7dfff0'){
  return makePanelTexture(title, lines, accent, 'DEMO PREVIEW • WAITING FOR APPROVAL');
}

function addStorefront(scene, sceneTargets, key, opts = {}){
  const rec = sceneTargets?.[key] || sceneTargets?.sponsor || sceneTargets?.store;
  if (!scene || !rec?.pos) return null;
  const look = rec.look || new THREE.Vector3(0, 1.4, 0);
  const dir = new THREE.Vector3().subVectors(look, rec.pos);
  dir.y = 0;
  if (dir.lengthSq() < 0.0001) dir.set(0, 0, -1); else dir.normalize();
  const group = new THREE.Group();
  group.name = `PHASE129 STOREFRONT ${opts.title || key}`;
  group.position.copy(rec.pos).addScaledVector(dir, opts.forward ?? 1.18);
  group.rotation.y = Math.atan2(dir.x, dir.z);
  scene.add(group);

  const accent = new THREE.Color(opts.color || 0x7dfff0);
  const trim = new THREE.MeshStandardMaterial({ color: accent, roughness: .22, metalness: .42, emissive: accent, emissiveIntensity: .70 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x080a10, roughness: .82, metalness: .08, emissive: 0x07050d, emissiveIntensity: .14 });
  const glass = new THREE.MeshStandardMaterial({ color: accent, transparent: true, opacity: .13, roughness: .04, metalness: .18, emissive: accent, emissiveIntensity: .10, side: THREE.DoubleSide, depthWrite: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(3.35, 2.55), new THREE.MeshStandardMaterial({ color: opts.floorColor || 0x101018, roughness: .92, metalness: .02, emissive: 0x080510, emissiveIntensity: .18, side: THREE.DoubleSide }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, .018, .82);
  group.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.62, 2.65, .16), dark);
  back.position.set(0, 1.55, -.46);
  group.add(back);
  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(3.34, 2.28), glass);
  glassPane.position.set(0, 1.55, -.35);
  group.add(glassPane);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.78, .13, .22), trim);
  top.position.set(0, 2.94, -.31);
  group.add(top);
  const left = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.82, .20), trim);
  left.position.set(-1.86, 1.54, -.31);
  group.add(left);
  const right = left.clone();
  right.position.x = 1.86;
  group.add(right);
  const tex = makeStorefrontTexture(opts.title || key, opts.lines || [], opts.accent || '#7dfff0');
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.86, 1.82), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  panel.position.set(0, 1.66, -.24);
  group.add(panel);
  const portal = new THREE.Mesh(new THREE.RingGeometry(.45, .56, 52), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .70, side: THREE.DoubleSide, depthWrite: false }));
  portal.position.set(0, .46, 1.02);
  portal.rotation.x = -Math.PI / 2;
  group.add(portal);
  return group;
}

function addOtherStorefronts(scene, sceneTargets){
  if (!scene || scene.userData._phase129OtherStorefronts) return scene?.userData?._phase129OtherStorefronts || null;
  const stores = [
    addStorefront(scene, sceneTargets, 'pga', { title: 'PGA EXPANSION', accent: '#75fff2', color: 0x75fff2, floorColor: 0x102818, lines: ['Driving range portal', 'Chip + putt training', 'Private golf scene', 'Sponsor-ready wall'] }),
    addStorefront(scene, sceneTargets, 'store', { title: 'SVR STORE', accent: '#b48cff', color: 0xb48cff, floorColor: 0x161020, lines: ['Avatar gear preview', 'Watches • gloves • table skins', 'Store opens on site', 'VR portal surface'] }),
    addStorefront(scene, sceneTargets, 'lounge', { title: 'VIBES THEATER', accent: '#ff79d8', color: 0xff79d8, floorColor: 0x1d0a18, lines: ['Music / video lounge', 'Replay jumbotron space', 'Social theater portal', 'Sponsor media ready'] }),
    addStorefront(scene, sceneTargets, 'scorpion', { title: 'SCORPION ROOM', accent: '#ffd36e', color: 0xffd36e, floorColor: 0x22160a, lines: ['Private poker room', 'City overlook table', 'Table selector future', 'VIP route preserved'] })
  ].filter(Boolean);
  scene.userData._phase129OtherStorefronts = { stores };
  return scene.userData._phase129OtherStorefronts;
}

export function applyPhase119ReikiTrueitiveStorefrontFinal({ scene, camera, sceneTargets, setStatus = ()=>{}, log = ()=>{} } = {}){
  if (!scene || scene.userData._phase120ReikiTrueitiveStorefront) return scene?.userData?._phase120ReikiTrueitiveStorefront || null;
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  if (!rec?.pos || !rec?.look) return null;

  const front = rec.pos.clone();
  const look = rec.look.clone();
  const dir = new THREE.Vector3().subVectors(look, front);
  dir.y = 0;
  if (dir.lengthSq() < 0.0001) dir.set(0, 0, -1); else dir.normalize();
  const center = front.clone().addScaledVector(dir, 3.62);
  const group = new THREE.Group();
  group.name = 'PHASE129 TRUEITIVE REIKI WALL-LOCKED PRESENTATION STOREFRONT';
  group.position.copy(center);
  const entryDir = new THREE.Vector3().subVectors(front, center);
  entryDir.y = 0;
  if (entryDir.lengthSq() < 0.0001) entryDir.set(0, 0, 1); else entryDir.normalize();
  group.rotation.set(0, Math.atan2(entryDir.x, entryDir.z), 0);
  scene.add(group);

  const teal = new THREE.MeshStandardMaterial({ color: 0x7dfff0, roughness: .18, metalness: .48, emissive: 0x1cbca8, emissiveIntensity: .92 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xaafff4, transparent: true, opacity: .13, roughness: .02, metalness: .18, emissive: 0x113f3b, emissiveIntensity: .12, side: THREE.DoubleSide, depthWrite: false });
  const red = new THREE.MeshStandardMaterial({ color: 0xaa0924, roughness: .82, metalness: .04, emissive: 0x3e0610, emissiveIntensity: .25, side: THREE.DoubleSide });

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.75, 6.6), red);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, .021, 2.08);
  group.add(carpet);
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(11.8, .20, .32), teal);
  archTop.position.set(0, 5.72, -1.08);
  group.add(archTop);
  const archL = new THREE.Mesh(new THREE.BoxGeometry(.22, 5.65, .34), teal);
  archL.position.set(-5.9, 2.85, -1.08);
  group.add(archL);
  const archR = archL.clone();
  archR.position.x = 5.9;
  group.add(archR);
  const glassBack = new THREE.Mesh(new THREE.PlaneGeometry(11.3, 4.65), glass);
  glassBack.position.set(0, 2.66, -1.02);
  group.add(glassBack);

  const signTex = makePanelTexture('TRUEITIVE REIKI HUB', ['Founder presentation', 'Compact video carousel', 'Three-wall service panels', 'Private Reiki route preserved'], '#7dfff0', 'WAITING FOR APPROVAL');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.7, 1.55), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  sign.position.set(0, 4.82, -1.20);
  group.add(sign);

  const founder = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 3.35), new THREE.MeshBasicMaterial({ map: makeFounderTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  founder.position.set(-3.55, 2.42, -.84);
  group.add(founder);
  const rightP = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 3.35), new THREE.MeshBasicMaterial({ map: makePanelTexture('THE ZEN DEN', ['Breathe • restore • reset', 'Video / booking / info slides', 'Meditation room route'], '#7dfff0', 'WAITING FOR APPROVAL'), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  rightP.position.set(3.55, 2.42, -.84);
  group.add(rightP);

  const slider = new THREE.Group();
  slider.name = 'TRUEITIVE COMPACT SLIDE HOLOGRAM CAROUSEL';
  slider.position.set(0, 2.35, .08);
  group.add(slider);
  const slides = [
    makePanelTexture('VIDEO', ['Founder hologram', 'Play when near', 'Next / Back panel'], '#58fff4', 'PLAY FROM REIKI ZONE'),
    makePanelTexture('ABOUT', ['Founder story', 'Trueitive wellness', 'Services and booking'], '#b58cff', 'ABOUT SLIDE'),
    makePanelTexture('REIKI', ['Reiki symbols', 'Meditation reset', 'Wellness services'], '#7dffb2', 'REIKI SLIDE'),
    makePanelTexture('ROOM', ['Private Reiki room', 'Meditation space', 'Portal route preserved'], '#ffd36e', 'PRIVATE ROOM SLIDE')
  ];
  const slideMeshes = [];
  for (let i = 0; i < slides.length; i++){
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 1.34), new THREE.MeshBasicMaterial({ map: slides[i], transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    m.userData.baseAngle = (i / slides.length) * Math.PI * 2;
    slideMeshes.push(m);
    slider.add(m);
  }
  const video = document.createElement('video');
  video.src = './assets/video/reiki_hologram.mp4';
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.muted = true;
  video.volume = .90;
  const vTex = new THREE.VideoTexture(video);
  vTex.colorSpace = THREE.SRGBColorSpace;
  const videoPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 1.22), new THREE.MeshBasicMaterial({ map: vTex, transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false }));
  videoPlane.position.set(0, .98, .20);
  slider.add(videoPlane);

  const cue = new THREE.Mesh(new THREE.PlaneGeometry(2.20, .78), new THREE.MeshBasicMaterial({ map: makePanelTexture('NEXT / BACK', ['Video', 'About', 'Reiki symbols', 'Meditation room'], '#ff76d5', 'TOUCH / CONTROLLER READY'), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  cue.position.set(0, .18, .92);
  group.add(cue);

  const tempCamPos = new THREE.Vector3();
  const tempWorld = new THREE.Vector3();
  let userPrimed = false;
  let near = false;
  const prime = async()=>{
    userPrimed = true;
    if (near){
      video.muted = false;
      try{ await video.play(); }catch(_e){}
    }
  };
  window.addEventListener('pointerdown', prime, { passive: true });
  window.addEventListener('keydown', prime);
  scene.userData._tickReikiPhase120 = ()=>{
    const t = performance.now() * .001;
    slideMeshes.forEach((m)=>{
      const a = t * .55 + m.userData.baseAngle;
      m.position.set(Math.sin(a) * .98, -.74 + Math.cos(a * 1.5) * .045, .22 + Math.cos(a) * .30);
      m.material.opacity = .72 + .22 * (.5 + .5 * Math.cos(a));
      m.rotation.y = -Math.sin(a) * .28;
    });
    slider.rotation.y = Math.sin(t * .42) * .045;
    if (camera){ camera.getWorldPosition(tempCamPos); group.getWorldPosition(tempWorld); near = tempCamPos.distanceTo(tempWorld) < 8.8; }
    if (near){ if (userPrimed){ video.muted = false; if (video.paused) video.play().catch(()=>{}); } cue.material.opacity = .98; }
    else { if (!video.paused) video.pause(); video.muted = true; cue.material.opacity = .62; }
  };
  const prevTick = scene.userData._tickWorld;
  if (prevTick && !scene.userData._phase120WrappedTick){
    scene.userData._tickWorld = (dt)=>{ prevTick(dt); if (scene.userData._tickReikiPhase120) scene.userData._tickReikiPhase120(dt); };
    scene.userData._phase120WrappedTick = true;
  }

  addOtherStorefronts(scene, sceneTargets);
  scene.userData._phase120ReikiTrueitiveStorefront = { group, video, slider };
  setStatus('Phase 129 Reiki presentation cleaned; extra storefronts added. Waiting for approval badge active.');
  log?.('Phase 129 Reiki + Vibes Theater + SVR Store + PGA Expansion storefront lock active');
  return scene.userData._phase120ReikiTrueitiveStorefront;
}
