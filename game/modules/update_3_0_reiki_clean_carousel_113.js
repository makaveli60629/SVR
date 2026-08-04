import * as THREE from "three";

function makeCanvasTexture(w, h, painter){
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  painter(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y); ctx.lineTo(x+w-rr,y); ctx.quadraticCurveTo(x+w,y,x+w,y+rr);
  ctx.lineTo(x+w,y+h-rr); ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
  ctx.lineTo(x+rr,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-rr);
  ctx.lineTo(x,y+rr); ctx.quadraticCurveTo(x,y,x+rr,y); ctx.closePath();
}

function cardTexture(title, sub, accent='#66ffcc'){
  return makeCanvasTexture(512, 320, (ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'rgba(3,18,20,.92)');
    g.addColorStop(1,'rgba(10,3,20,.92)');
    ctx.fillStyle = g; roundRect(ctx, 14, 14, w-28, h-28, 34); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 7; roundRect(ctx, 22, 22, w-44, h-44, 28); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; ctx.font = '900 42px system-ui, Arial'; ctx.fillText(title, w/2, 116);
    ctx.fillStyle = '#cafff6'; ctx.font = '700 26px system-ui, Arial'; ctx.fillText(sub, w/2, 176);
    ctx.fillStyle = '#ffefaa'; ctx.font = '800 22px system-ui, Arial'; ctx.fillText('INTERACTIVE', w/2, 238);
  });
}

export function applyReikiCleanCarousel113({ scene, camera, renderer, sceneTargets, setStatus=()=>{}, log=()=>{} }={}){
  if (!scene || scene.userData._svrReikiCleanCarousel113) return scene?.userData?._svrReikiCleanCarousel113 || null;
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  const pos = rec?.pos ? rec.pos.clone() : new THREE.Vector3(0,0,-5);
  const look = rec?.look ? rec.look.clone() : new THREE.Vector3(0,1.4,0);

  const group = new THREE.Group();
  group.name = 'PHASE 113 CLEAN REIKI HOLOGRAM CAROUSEL';
  // Place low and forward so the 1.4G storefront remains readable.
  group.position.set(pos.x, 0.06, pos.z + 1.05);
  group.lookAt(look.x, 1.35, look.z);

  const cards = [
    ['VIDEO','Open hologram','#80fff1','video',-1.54,0.98,0.06],
    ['ABOUT','Founder panel','#b58cff','about',-0.52,0.80,0.04],
    ['STORE','Reiki store','#7dffb2','store',0.52,0.80,0.04],
    ['ROOM','Private Reiki','#ffd36e','room',1.54,0.98,0.06]
  ];
  const clickables=[];
  for(const [title, sub, color, kind, x, y, z] of cards){
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86,0.54),
      new THREE.MeshBasicMaterial({ map: cardTexture(title, sub, color), transparent:true, side:THREE.DoubleSide, depthWrite:false })
    );
    mesh.position.set(x,y,z);
    mesh.rotation.y = -x*0.10;
    mesh.userData.reikiAction = kind;
    if(kind === 'video') mesh.userData.href = './reiki-video-portal.html?v=phase113-reiki-front-clean&zone=reiki';
    group.add(mesh); clickables.push(mesh);
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.55,1.63,128),
    new THREE.MeshBasicMaterial({ color:0x66ffcc, transparent:true, opacity:.22, side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false })
  );
  ring.rotation.x = -Math.PI/2; ring.position.set(0,0.025,0.28); group.add(ring);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.35,0.32),
    new THREE.MeshBasicMaterial({ map: makeCanvasTexture(1024,192,(ctx,w,h)=>{
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle='rgba(0,10,12,.72)'; roundRect(ctx,18,36,w-36,h-72,34); ctx.fill();
      ctx.strokeStyle='rgba(102,255,204,.80)'; ctx.lineWidth=6; roundRect(ctx,26,44,w-52,h-88,28); ctx.stroke();
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#f6ffff'; ctx.font='900 54px system-ui, Arial'; ctx.fillText('REIKI HOLOGRAM CAROUSEL', w/2, h/2);
    }), transparent:true, side:THREE.DoubleSide, depthWrite:false })
  );
  label.position.set(0,1.52,0.03); group.add(label);

  function open(kind){
    if(kind === 'video') window.location.href = './reiki-video-portal.html?v=phase113-reiki-front-clean&zone=reiki';
    else if(kind === 'room' && sceneTargets?.reikiRoom?.pos) setStatus('Use Reiki Room route from watch/buttons.', {force:true});
    else setStatus(`Reiki carousel: ${kind}`, {force:true});
  }
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const onPointer = (ev)=>{
    if (!renderer?.domElement || renderer.xr?.isPresenting) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(clickables, false)[0];
    if(hit) open(hit.object.userData.reikiAction);
  };
  renderer?.domElement?.addEventListener('pointerdown', onPointer);
  scene.add(group);
  const api = { group, clickables, dispose(){ renderer?.domElement?.removeEventListener('pointerdown', onPointer); scene.remove(group); } };
  scene.userData._svrReikiCleanCarousel113 = api;
  window.SVR_REIKI_CLEAN_FRONT_LOCK = 'PHASE-113';
  log('Phase 113: Reiki storefront front cleaned; duplicate overlay panels disabled; compact hologram carousel installed.');
  return api;
}
