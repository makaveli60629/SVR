import * as THREE from "three";

const STORE_URL = "https://svrpoker.com/site/store.html";

function makeCanvasTexture(lines){
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 768;
  const ctx = canvas.getContext('2d');
  const grd = ctx.createLinearGradient(0,0,1024,768);
  grd.addColorStop(0,'#070a14'); grd.addColorStop(1,'#211034');
  ctx.fillStyle = grd; ctx.fillRect(0,0,1024,768);
  ctx.strokeStyle = 'rgba(125,255,225,.9)'; ctx.lineWidth = 10; ctx.strokeRect(24,24,976,720);
  ctx.fillStyle = '#cffff6'; ctx.font = '900 64px system-ui, Arial'; ctx.textAlign='center';
  ctx.fillText('SVR STORE KIOSK',512,92);
  ctx.fillStyle = '#b48cff'; ctx.font = '800 34px system-ui, Arial';
  ctx.fillText('VR-touch prototype • sample equip panel',512,142);
  ctx.textAlign='left'; ctx.font = '700 34px system-ui, Arial'; ctx.fillStyle='#ffffff';
  lines.forEach((line,i)=>ctx.fillText(line,88,220+i*62));
  const buttons = [['OPEN STORE',88,570,250],['STORE ROOM',386,570,250],['EQUIP TEST',684,570,250]];
  for(const [label,x,y,w] of buttons){
    ctx.fillStyle='rgba(0,226,199,.16)'; ctx.strokeStyle='rgba(0,226,199,.95)'; ctx.lineWidth=5;
    ctx.beginPath(); ctx.roundRect(x,y,w,86,20); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#eafffb'; ctx.font='900 28px system-ui, Arial'; ctx.textAlign='center'; ctx.fillText(label,x+w/2,y+54);
  }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  return tex;
}

export function createStoreKioskInteraction({ scene, camera, renderer, sceneTargets = {}, statusCb = ()=>{} }){
  const state = { open:false, selected:'none', equipped:[], url:STORE_URL };
  const tex = makeCanvasTexture([
    '• SVR Gloves — sample equip',
    '• SVR Watch Skin — sample equip',
    '• Poker Hoodie — sample equip',
    '• Sponsor gear preview — sandbox only',
    '• Full checkout stays on website until backend lock'
  ]);
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(2.95,2.22),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent:true, depthWrite:false })
  );
  panel.name = 'SVR_STORE_INTERACTIVE_KIOSK_PANEL';
  panel.visible = false;
  panel.renderOrder = 55;
  scene.add(panel);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(0,0);
  function storeTarget(){ return sceneTargets.store?.pos || new THREE.Vector3(7.8,0,1.2); }
  function openPanel(){
    const target = storeTarget();
    panel.position.set(target.x, 1.72, target.z);
    if (sceneTargets.store?.look) panel.lookAt(sceneTargets.store.look.clone().setY(1.55));
    else panel.lookAt(0,1.5,0);
    panel.visible = true; state.open = true;
    statusCb('SVR STORE KIOSK • point/click center buttons • O toggles');
  }
  function closePanel(){ panel.visible=false; state.open=false; }
  function toggle(){ state.open ? closePanel() : openPanel(); }
  function choose(action){
    if(action==='openStore') { statusCb('Opening SVR Store website…'); window.open(STORE_URL, '_blank', 'noopener'); }
    if(action==='storeRoom') { statusCb('Entering VR Store room…'); window.location.href = './store-room.html'; }
    if(action==='equip') { state.equipped.push('SVR sample item'); statusCb('EQUIP TEST • sample item attached in sandbox state'); }
    window.dispatchEvent(new CustomEvent('svr_store_kiosk_action',{detail:{...state, action}}));
  }
  window.addEventListener('keydown', ev=>{ if(ev.code==='KeyO' && !ev.repeat){ ev.preventDefault(); toggle(); }});
  window.addEventListener('click', ev=>{
    if(!state.open || renderer?.xr?.isPresenting) return;
    ndc.x = (ev.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(ev.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(panel, false)[0];
    if(!hit?.uv) return;
    const x = hit.uv.x, y = hit.uv.y;
    if(y > 0.14 && y < 0.28){
      if(x < .36) choose('openStore'); else if(x < .66) choose('storeRoom'); else choose('equip');
    }
  });
  function update(){
    if(!state.open || !panel.visible) return;
    if(renderer?.xr?.isPresenting){
      const xrCam = renderer.xr.getCamera(camera);
      const camPos = new THREE.Vector3(); xrCam.getWorldPosition(camPos);
      panel.lookAt(camPos.x, 1.55, camPos.z);
    }
  }
  window.SVR_STORE_KIOSK = { state, openPanel, closePanel, toggle, choose, STORE_URL };
  return { state, openPanel, closePanel, toggle, choose, update };
}
