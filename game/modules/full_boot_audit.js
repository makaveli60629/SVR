const app = document.getElementById('app');
const bootText = document.getElementById('bootText');
const bootLog = document.getElementById('bootLog');

function line(message, ok = true){
  const text = `${ok ? 'OK' : 'FAIL'} - ${message}`;
  if (bootLog) {
    const div = document.createElement('div');
    div.textContent = text;
    div.className = ok ? 'ok' : 'fail';
    bootLog.appendChild(div);
  }
  if (bootText) bootText.textContent = text;
  console[ok ? 'log' : 'error']('[SVR FULL AUDIT]', text);
}

async function step(name, fn){
  try{
    line(`Testing ${name}...`);
    const result = await fn();
    line(`${name} loaded`);
    return result;
  }catch(err){
    line(`${name} failed: ${err && (err.message || err.stack) || String(err)}`, false);
    throw err;
  }
}

function makeFallbackScene(THREE){
  if (!app) return;
  app.innerHTML = '';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020205);
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 1000);
  camera.position.set(0, 1.55, 4.2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  app.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xaedfff, 0x201025, 1.35);
  scene.add(hemi);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 72), new THREE.MeshStandardMaterial({ color: 0x111018, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.85, 0.18, 64), new THREE.MeshStandardMaterial({ color: 0x2a1235, roughness: 0.9, emissive: 0x100018, emissiveIntensity: 0.16 }));
  table.position.y = 0.82;
  table.scale.z = 0.68;
  scene.add(table);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.82, 32, 16), new THREE.MeshBasicMaterial({ color: 0xe8e6ff }));
  moon.position.set(-3.5, 6.0, -8.5);
  scene.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16), new THREE.MeshBasicMaterial({ color: 0xd76b3a }));
  mars.position.set(3.6, 5.5, -9.2);
  scene.add(mars);

  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 1024;
  labelCanvas.height = 256;
  const x = labelCanvas.getContext('2d');
  x.fillStyle = '#060711'; x.fillRect(0,0,1024,256);
  x.strokeStyle = 'rgba(105,232,255,.9)'; x.lineWidth = 10; x.strokeRect(16,16,992,224);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#ffffff'; x.font = '900 76px system-ui, Arial'; x.fillText('SVR FULL DEBUG', 512, 106);
  x.fillStyle = '#c9eaff'; x.font = '700 34px system-ui, Arial'; x.fillText('core renderer online - modules auditing', 512, 170);
  const tex = new THREE.CanvasTexture(labelCanvas); tex.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  sign.position.set(0, 2.8, -4.5);
  scene.add(sign);

  addEventListener('resize', ()=>{
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  renderer.setAnimationLoop(()=>{
    moon.rotation.y += 0.003;
    mars.rotation.y += 0.005;
    table.rotation.y += 0.002;
    camera.lookAt(0, 1.1, 0);
    renderer.render(scene, camera);
  });
  return { scene, camera, renderer };
}

async function run(){
  const THREE = await step('Three.js CDN module', async()=> await import('three'));
  makeFallbackScene(THREE);
  const modules = {};
  modules.core = await step('core_scene.js', async()=> await import('./core_scene.js?v=phase101'));
  modules.desktop = await step('desktop_controls.js', async()=> await import('./desktop_controls.js?v=phase101'));
  modules.assetBase = await step('asset_base.js', async()=> await import('./asset_base.js?v=phase101'));
  modules.audio = await step('audio.js', async()=> await import('./audio.js?v=phase101'));
  modules.eventBus = await step('svr_event_bus.js', async()=> await import('./svr_event_bus.js?v=phase101'));
  modules.teleport = await step('teleport.js', async()=> await import('./teleport.js?v=phase101'));
  modules.hands = await step('hands.js', async()=> await import('./hands.js?v=phase101'));
  modules.watch = await step('watch.js', async()=> await import('./watch.js?v=phase101'));
  modules.world = await step('world_skyline.js', async()=> await import('./world_skyline.js?v=phase101'));
  line('All full-build modules imported. Heavy world construction remains isolated from /game/index.html.');
  return modules;
}

run().catch(()=>{});
