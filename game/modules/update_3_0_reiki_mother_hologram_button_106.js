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

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

function panelTexture(title, subtitle, lines = [], opts = {}){
  return canvasTexture(1400, 900, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0, opts.green ? '#031813' : '#080316');
    g.addColorStop(.55, '#050914');
    g.addColorStop(1, opts.purple ? '#1a0630' : '#031014');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.save();
    x.globalAlpha = .26;
    for(let i=0;i<42;i++){
      x.fillStyle = i%2 ? '#8dffdc' : '#c776ff';
      x.beginPath();
      x.arc((i*97)%w, (i*173)%h, 1+(i%4), 0, Math.PI*2); x.fill();
    }
    x.restore();
    x.lineWidth = 18;
    x.strokeStyle = opts.red ? 'rgba(255,70,90,.95)' : 'rgba(110,255,220,.88)';
    roundRect(x,34,34,w-68,h-68,38); x.stroke();
    x.lineWidth = 5; x.strokeStyle = 'rgba(185,112,255,.65)';
    roundRect(x,62,62,w-124,h-124,28); x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#f7ffff'; x.font = '900 92px system-ui, Arial'; x.fillText(title, w/2, 150);
    x.fillStyle = opts.red ? '#ffcad2' : '#bffff2'; x.font = '800 48px system-ui, Arial'; x.fillText(subtitle, w/2, 235);
    x.fillStyle = '#e8fffb'; x.font = '36px system-ui, Arial';
    let y = 340;
    for(const line of lines){ x.fillText(line, w/2, y); y += 64; }
    x.fillStyle = '#9dffd2'; x.font = '900 42px system-ui, Arial'; x.fillText(opts.footer || 'OPEN • VIEW • APPROVAL SAFE', w/2, h-112);
  });
}

function smallCardTexture(title, subtitle, icon='✦', kind='green'){
  return canvasTexture(900, 700, (x,w,h)=>{
    const colors = {
      video:['#061425','#00fff0','#cc84ff'],
      about:['#071520','#88ffe4','#66aaff'],
      store:['#111018','#ffc966','#ff69da'],
      meditate:['#06180f','#7dffae','#95ffea'],
      approval:['#21060b','#ff7485','#ffb86c']
    }[kind] || ['#061425','#00fff0','#cc84ff'];
    const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,colors[0]); g.addColorStop(1,'#020006'); x.fillStyle=g; x.fillRect(0,0,w,h);
    x.strokeStyle=colors[1]; x.lineWidth=14; roundRect(x,28,28,w-56,h-56,34); x.stroke();
    x.strokeStyle='rgba(255,255,255,.22)'; x.lineWidth=4; roundRect(x,55,55,w-110,h-110,24); x.stroke();
    x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle=colors[1]; x.font='900 110px system-ui, Arial'; x.fillText(icon,w/2,150);
    x.fillStyle='#ffffff'; x.font='900 58px system-ui, Arial'; x.fillText(title,w/2,315);
    x.fillStyle=colors[2]; x.font='800 34px system-ui, Arial'; x.fillText(subtitle,w/2,388);
    x.fillStyle='#dffff7'; x.font='28px system-ui, Arial'; x.fillText('interactive carousel card',w/2,486);
    if(kind==='video'){
      x.fillStyle='rgba(255,255,255,.12)'; roundRect(x,260,536,380,78,39); x.fill();
      x.fillStyle='#ffffff'; x.font='900 34px system-ui, Arial'; x.fillText('OPEN HOLOGRAM',w/2,575);
    }
  });
}

function chakraTexture(symbol, label){
  return canvasTexture(512,512,(x,w,h)=>{
    x.clearRect(0,0,w,h);
    const grad=x.createRadialGradient(w/2,h/2,10,w/2,h/2,w/2);
    grad.addColorStop(0,'rgba(185,112,255,.72)'); grad.addColorStop(.55,'rgba(110,255,220,.25)'); grad.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=grad; x.beginPath(); x.arc(w/2,h/2,w/2-8,0,Math.PI*2); x.fill();
    x.strokeStyle='rgba(150,255,224,.82)'; x.lineWidth=10; x.beginPath(); x.arc(w/2,h/2,w/2-42,0,Math.PI*2); x.stroke();
    x.fillStyle='#f7ffff'; x.textAlign='center'; x.textBaseline='middle'; x.font='900 132px system-ui, Arial'; x.fillText(symbol,w/2,h/2-12);
    x.fillStyle='#cffff6'; x.font='800 34px system-ui, Arial'; x.fillText(label,w/2,h-80);
  });
}

export function applyReikiMotherHologramButton106({ scene, camera, renderer, sceneTargets, setStatus = ()=>{}, log = ()=>{} } = {}){
  if (!scene || !THREE) return null;
  if (scene.userData._svrReikiMother106) return scene.userData._svrReikiMother106;

  const reikiRec = sceneTargets?.reiki || sceneTargets?.reikiRoom || null;
  const pos = reikiRec?.pos ? reikiRec.pos.clone() : new THREE.Vector3(-4.8,0,-3.6);
  const look = reikiRec?.look ? reikiRec.look.clone() : new THREE.Vector3(0,1.45,0);
  const group = new THREE.Group();
  group.name = 'UPDATE 3.0 PHASE 106 REIKI OLD+NEW MOTHER MODULE';
  group.position.set(pos.x + 0.25, 0.03, pos.z + 0.25);
  group.lookAt(look.x, 1.45, look.z);

  const main = new THREE.Mesh(
    new THREE.PlaneGeometry(4.85, 2.78),
    new THREE.MeshBasicMaterial({ map: panelTexture('REIKI MOTHER MODULE', 'OLD + NEW REMODEL RESTORED', [
      'Hologram video carousel active',
      'About • Store • Meditation • Approval cards',
      'Green rising sprites and chakra readability lock',
      'Approval-safe storefront: no outside branding'
    ], { footer:'VIDEO HOLOGRAM BUTTON INSIDE CAROUSEL', green:true, purple:true }), transparent:true, side:THREE.DoubleSide })
  );
  main.position.set(0, 2.02, -0.04);
  group.add(main);

  const frame = new THREE.Mesh(new THREE.TorusGeometry(1.72, .026, 14, 160), new THREE.MeshBasicMaterial({ color:0x77ffdd, transparent:true, opacity:.62, side:THREE.DoubleSide, blending:THREE.AdditiveBlending }));
  frame.name='Reiki Mother Hologram Ring';
  frame.scale.set(1.55,.88,1); frame.position.set(0,2.02,.015);
  group.add(frame);

  const cards = [
    ['VIDEO HOLOGRAM','press to open','▶','video', -2.18, 1.04, .24],
    ['ABOUT','Reiki info card','ℹ','about', -1.08, .72, .14],
    ['REIKI STORE','product preview','✚','store', 0, .62, .08],
    ['MEDITATION','private room','☯','meditate', 1.08, .72, .14],
    ['APPROVAL','waiting lock','!','approval', 2.18, 1.04, .24]
  ];
  const clickables = [];
  for(const [title, sub, icon, kind, x, y, z] of cards){
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(.94,.72),
      new THREE.MeshBasicMaterial({ map:smallCardTexture(title, sub, icon, kind), transparent:true, side:THREE.DoubleSide })
    );
    mesh.name = `Reiki Carousel Card ${title}`;
    mesh.position.set(x, y, z);
    mesh.rotation.y = -x * 0.11;
    mesh.userData.svrReikiCarousel = kind;
    if(kind === 'video') mesh.userData.svrHref = './reiki-video-portal.html?v=phase106-reiki-mother-button&zone=reiki';
    group.add(mesh); clickables.push(mesh);
  }

  const floorRing = new THREE.Mesh(new THREE.RingGeometry(1.22,1.32,96), new THREE.MeshBasicMaterial({ color:0x66ffcc, transparent:true, opacity:.34, side:THREE.DoubleSide, blending:THREE.AdditiveBlending }));
  floorRing.rotation.x = -Math.PI/2; floorRing.position.set(0,.025,.18); group.add(floorRing);

  const chakraDefs = [['लं','ROOT'],['वं','SACRAL'],['रं','SOLAR'],['यं','HEART'],['हं','THROAT'],['ॐ','CROWN']];
  chakraDefs.forEach(([sym,label],i)=>{
    const a = -Math.PI*.78 + i*(Math.PI*1.56/(chakraDefs.length-1));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.42,.42), new THREE.MeshBasicMaterial({ map:chakraTexture(sym,label), transparent:true, opacity:.92, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
    m.position.set(Math.sin(a)*2.65, 3.72 + Math.cos(a)*.32, .09);
    m.name = `Reiki Chakra ${label}`;
    group.add(m);
  });

  const videoButton = clickables[0];
  function openVideo(){
    setStatus('Opening Reiki hologram video carousel…', { force:true });
    window.location.href = './reiki-video-portal.html?v=phase106-reiki-mother-button&zone=reiki';
  }
  window.SVR_OPEN_REIKI_HOLOGRAM = openVideo;
  window.SVR_REIKI_MOTHER_MODULE_READY = true;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const onPointer = (ev)=>{
    if (!renderer?.domElement || renderer.xr?.isPresenting) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(clickables, false)[0];
    if(!hit) return;
    if(hit.object === videoButton || hit.object.userData.svrHref) openVideo();
    else setStatus(`Reiki carousel: ${hit.object.userData.svrReikiCarousel}`, { force:true });
  };
  renderer?.domElement?.addEventListener('pointerdown', onPointer);

  const openButton = document.querySelector('[data-scene="reikiVideoPortal"]');
  if(openButton){ openButton.textContent = 'Reiki Hologram'; openButton.title = 'Open Reiki hologram video carousel'; }

  scene.add(group);
  const api = { group, clickables, openVideo, dispose(){ renderer?.domElement?.removeEventListener('pointerdown', onPointer); scene.remove(group); } };
  scene.userData._svrReikiMother106 = api;
  log('Phase 106 Reiki old+new mother module with interactive hologram button restored.');
  return api;
}
