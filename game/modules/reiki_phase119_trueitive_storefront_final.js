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

function drawPortrait(ctx, cx, cy, scale = 1){
  const hair = ctx.createRadialGradient(cx, cy + 22 * scale, 20 * scale, cx, cy + 44 * scale, 142 * scale);
  hair.addColorStop(0, '#6d382f');
  hair.addColorStop(0.62, '#2d1518');
  hair.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 50 * scale, 145 * scale, 170 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  const face = ctx.createRadialGradient(cx - 26 * scale, cy - 18 * scale, 8 * scale, cx, cy, 80 * scale);
  face.addColorStop(0, '#ffe4d3');
  face.addColorStop(0.55, '#c9826d');
  face.addColorStop(1, '#7a3e37');
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(cx, cy, 70 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.beginPath();
  ctx.arc(cx - 24 * scale, cy - 10 * scale, 5 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 24 * scale, cy - 10 * scale, 5 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,14,20,.72)';
  ctx.lineWidth = 5 * scale;
  ctx.beginPath();
  ctx.arc(cx, cy + 22 * scale, 28 * scale, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.stroke();
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
    x.font = '900 60px system-ui, Arial';
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

function makeFounderColumnTexture(title, lines = []){
  return canvasTexture(900, 1200, (x, w, h)=>{
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#081619');
    g.addColorStop(1, '#160916');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(125,255,240,.92)';
    x.lineWidth = 12;
    roundRect(x, 30, 30, w - 60, h - 60, 42);
    x.stroke();
    x.fillStyle = 'rgba(255,255,255,.08)';
    roundRect(x, 150, 102, w - 300, 330, 48);
    x.fill();
    drawPortrait(x, w / 2, 252, 1.05);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = '#f7ffff';
    x.font = '900 56px system-ui, Arial';
    x.fillText(title, w / 2, 520);
    x.fillStyle = '#dffff8';
    x.font = '700 31px system-ui, Arial';
    let y = 610;
    for (const line of lines.slice(0, 6)){
      x.fillText(line, w / 2, y);
      y += 58;
    }
    x.fillStyle = '#ffb8b8';
    x.font = '900 30px system-ui, Arial';
    x.fillText('WAITING FOR APPROVAL', w / 2, 1080);
  });
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
  group.name = `PHASE130 STOREFRONT ${opts.title || key}`;
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
  if (!scene || scene.userData._phase130OtherStorefronts) return scene?.userData?._phase130OtherStorefronts || null;
  const stores = [
    addStorefront(scene, sceneTargets, 'pga', { title: 'PGA EXPANSION', accent: '#75fff2', color: 0x75fff2, floorColor: 0x102818, lines: ['Driving range portal', 'Chip + putt training', 'Private golf scene', 'Sponsor-ready wall'] }),
    addStorefront(scene, sceneTargets, 'store', { title: 'SVR STORE', accent: '#b48cff', color: 0xb48cff, floorColor: 0x161020, lines: ['Avatar gear preview', 'Watches • gloves • table skins', 'Store opens on site', 'VR portal surface'] }),
    addStorefront(scene, sceneTargets, 'lounge', { title: 'VIBES THEATER', accent: '#ff79d8', color: 0xff79d8, floorColor: 0x1d0a18, lines: ['Music / video lounge', 'Replay jumbotron space', 'Social theater portal', 'Sponsor media ready'] }),
    addStorefront(scene, sceneTargets, 'scorpion', { title: 'SCORPION ROOM', accent: '#ffd36e', color: 0xffd36e, floorColor: 0x22160a, lines: ['Private poker room', 'City overlook table', 'Table selector future', 'VIP route preserved'] })
  ].filter(Boolean);
  scene.userData._phase130OtherStorefronts = { stores };
  return scene.userData._phase130OtherStorefronts;
}

export function applyPhase119ReikiTrueitiveStorefrontFinal({ scene, camera, renderer, sceneTargets, setStatus = ()=>{}, log = ()=>{} } = {}){
  if (!scene || scene.userData._phase130ReikiDisplay) return scene?.userData?._phase130ReikiDisplay || null;
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  if (!rec?.pos || !rec?.look) return null;

  const front = rec.pos.clone();
  const look = rec.look.clone();
  const dir = new THREE.Vector3().subVectors(look, front);
  dir.y = 0;
  if (dir.lengthSq() < 0.0001) dir.set(0, 0, -1); else dir.normalize();
  const center = front.clone().addScaledVector(dir, 3.72);
  const group = new THREE.Group();
  group.name = 'PHASE130 TRUEITIVE REIKI ONE-DISPLAY PRESENTATION';
  group.position.copy(center);
  const entryDir = new THREE.Vector3().subVectors(front, center);
  entryDir.y = 0;
  if (entryDir.lengthSq() < 0.0001) entryDir.set(0, 0, 1); else entryDir.normalize();
  group.rotation.set(0, Math.atan2(entryDir.x, entryDir.z), 0);
  scene.add(group);

  const teal = new THREE.MeshStandardMaterial({ color: 0x7dfff0, roughness: .18, metalness: .48, emissive: 0x1cbca8, emissiveIntensity: .92 });
  const glass = new THREE.MeshStandardMaterial({ color: 0xaafff4, transparent: true, opacity: .10, roughness: .02, metalness: .18, emissive: 0x113f3b, emissiveIntensity: .10, side: THREE.DoubleSide, depthWrite: false });
  const red = new THREE.MeshStandardMaterial({ color: 0xaa0924, roughness: .82, metalness: .04, emissive: 0x3e0610, emissiveIntensity: .25, side: THREE.DoubleSide });

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.75, 6.2), red);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, .021, 2.02);
  group.add(carpet);
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(11.8, .20, .32), teal);
  archTop.position.set(0, 5.72, -1.12);
  group.add(archTop);
  const archL = new THREE.Mesh(new THREE.BoxGeometry(.22, 5.65, .34), teal);
  archL.position.set(-5.9, 2.85, -1.12);
  group.add(archL);
  const archR = archL.clone();
  archR.position.x = 5.9;
  group.add(archR);
  const glassBack = new THREE.Mesh(new THREE.PlaneGeometry(11.3, 4.65), glass);
  glassBack.position.set(0, 2.66, -1.06);
  group.add(glassBack);

  const title = new THREE.Mesh(new THREE.PlaneGeometry(7.4, .86), new THREE.MeshBasicMaterial({ map: makePanelTexture('TRUEITIVE PRESENTATION', ['One clean display', 'No floor tabs', 'Approval-ready demo'], '#7dfff0', 'WAITING FOR APPROVAL'), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  title.position.set(0, 5.02, -1.22);
  group.add(title);

  const leftCol = new THREE.Mesh(new THREE.PlaneGeometry(2.18, 3.18), new THREE.MeshBasicMaterial({ map: makeFounderColumnTexture('FOUNDER', ['Trueitive wellness', 'Reiki / meditation', 'Booking path', 'Approval review']), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  leftCol.position.set(-3.65, 2.44, -1.00);
  group.add(leftCol);
  const centerCol = new THREE.Mesh(new THREE.PlaneGeometry(2.18, 3.18), new THREE.MeshBasicMaterial({ map: makeFounderColumnTexture('ABOUT', ['Founder-led story', 'Holistic support', 'Virtual presentation', 'Private room route']), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  centerCol.position.set(0, 2.44, -1.08);
  group.add(centerCol);
  const rightCol = new THREE.Mesh(new THREE.PlaneGeometry(2.18, 3.18), new THREE.MeshBasicMaterial({ map: makeFounderColumnTexture('SERVICES', ['Reiki sessions', 'Meditation reset', 'Bodywork referrals', 'Wellness guidance']), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  rightCol.position.set(3.65, 2.44, -1.00);
  group.add(rightCol);

  const slides = [
    { type: 'video', texture: makePanelTexture('VIDEO', ['Founder hologram', 'Tap NEXT to continue', 'Audio only near Reiki'], '#58fff4', 'PLAY FROM REIKI ZONE') },
    { type: 'panel', texture: makePanelTexture('ABOUT', ['Founder spotlight', 'Trueitive wellness story', 'Presentation-ready info'], '#b58cff', 'SLIDE 2 / 4') },
    { type: 'panel', texture: makePanelTexture('REIKI', ['Reiki symbols', 'Meditation reset', 'Wellness services'], '#7dffb2', 'SLIDE 3 / 4') },
    { type: 'panel', texture: makePanelTexture('ROOM', ['Private Reiki room', 'Portal route preserved', 'Meditation space'], '#ffd36e', 'SLIDE 4 / 4') }
  ];
  let slideIndex = 0;
  const displayMat = new THREE.MeshBasicMaterial({ map: slides[0].texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const display = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 1.72), displayMat);
  display.name = 'TRUEITIVE SINGLE SLIDE DISPLAY';
  display.position.set(0, 2.10, .78);
  group.add(display);

  const video = document.createElement('video');
  video.src = './assets/video/reiki_hologram.mp4';
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.muted = true;
  video.volume = .90;
  const vTex = new THREE.VideoTexture(video);
  vTex.colorSpace = THREE.SRGBColorSpace;
  const videoPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 1.56), new THREE.MeshBasicMaterial({ map: vTex, transparent: true, opacity: .78, side: THREE.DoubleSide, depthWrite: false }));
  videoPlane.position.copy(display.position);
  videoPlane.position.z += .012;
  group.add(videoPlane);

  const buttonMat = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const prevBtn = new THREE.Mesh(new THREE.PlaneGeometry(.82, .38), buttonMat.clone());
  const nextBtn = new THREE.Mesh(new THREE.PlaneGeometry(.82, .38), buttonMat.clone());
  prevBtn.material.map = makePanelTexture('BACK', ['Previous'], '#b58cff', '');
  nextBtn.material.map = makePanelTexture('NEXT', ['Advance'], '#7dffb2', '');
  prevBtn.position.set(-1.78, 1.04, .82);
  nextBtn.position.set(1.78, 1.04, .82);
  group.add(prevBtn, nextBtn);

  function setSlide(idx){
    slideIndex = (idx + slides.length) % slides.length;
    displayMat.map = slides[slideIndex].texture;
    displayMat.needsUpdate = true;
    const isVideo = slides[slideIndex].type === 'video';
    videoPlane.visible = isVideo;
    display.visible = !isVideo;
    setStatus(`Reiki slide ${slideIndex + 1}/${slides.length}`, { force: true });
  }
  setSlide(0);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer?.domElement?.addEventListener('pointerdown', (ev)=>{
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects([prevBtn, nextBtn, display, videoPlane], true)[0];
    if (!hit) return;
    if (hit.object === prevBtn) setSlide(slideIndex - 1);
    else setSlide(slideIndex + 1);
  }, { passive: true });
  window.addEventListener('keydown', (ev)=>{
    if (ev.code === 'ArrowLeft') setSlide(slideIndex - 1);
    if (ev.code === 'ArrowRight') setSlide(slideIndex + 1);
  });

  const tempCamPos = new THREE.Vector3();
  const tempWorld = new THREE.Vector3();
  let userPrimed = false;
  let near = false;
  const prime = async()=>{
    userPrimed = true;
    if (near && slideIndex === 0){
      video.muted = false;
      try{ await video.play(); }catch(_e){}
    }
  };
  window.addEventListener('pointerdown', prime, { passive: true });
  window.addEventListener('keydown', prime);
  scene.userData._tickReikiPhase130 = ()=>{
    if (camera){ camera.getWorldPosition(tempCamPos); group.getWorldPosition(tempWorld); near = tempCamPos.distanceTo(tempWorld) < 8.8; }
    if (near && slideIndex === 0){ if (userPrimed){ video.muted = false; if (video.paused) video.play().catch(()=>{}); } }
    else { if (!video.paused) video.pause(); video.muted = true; }
  };
  const prevTick = scene.userData._tickWorld;
  if (prevTick && !scene.userData._phase130WrappedTick){
    scene.userData._tickWorld = (dt)=>{ prevTick(dt); if (scene.userData._tickReikiPhase130) scene.userData._tickReikiPhase130(dt); };
    scene.userData._phase130WrappedTick = true;
  }

  addOtherStorefronts(scene, sceneTargets);
  scene.userData._phase130ReikiDisplay = { group, video, display, prevBtn, nextBtn, setSlide };
  setStatus('Phase 130 Reiki cleaned: one display, no floor tabs, storefronts preserved.', { force: true });
  log?.('Phase 130 Reiki one-display presentation active');
  return scene.userData._phase130ReikiDisplay;
}
