import * as THREE from "three";

export function createPrivateScene({ title = 'SVR Private Scene', subtitle = '', accent = '#b48cff', portalUrl = null } = {}){
  const app = document.getElementById('app');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  app.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05050a);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 400);
  camera.position.set(0, 1.65, 5.2);
  const hemi = new THREE.HemisphereLight(0x9ab8ff, 0x211126, 1.2); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(2, 6, 3); scene.add(key);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(42,42), new THREE.MeshStandardMaterial({ color: 0x111018, roughness: 0.9 }));
  floor.rotation.x = -Math.PI/2; scene.add(floor);
  const grid = new THREE.GridHelper(42, 42, 0x6e42ff, 0x242033); grid.material.opacity = 0.18; grid.material.transparent = true; scene.add(grid);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.1, 48, 24), new THREE.MeshBasicMaterial({ color: 0xded8ff }));
  moon.position.set(-10, 18, -36); scene.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(1.05, 40, 20), new THREE.MeshBasicMaterial({ color: 0xff704c }));
  mars.position.set(8, 21, -42); scene.add(mars);
  const starGeo = new THREE.BufferGeometry();
  const pos = []; for(let i=0;i<450;i++){ const r=70+Math.random()*110, a=Math.random()*Math.PI*2; pos.push(Math.cos(a)*r, 14+Math.random()*50, Math.sin(a)*r-40); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.10, transparent: true, opacity: 0.75 })); scene.add(stars);
  function makePanel(text, sub){
    const c=document.createElement('canvas'); c.width=1024; c.height=512; const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,'rgba(13,8,25,0.96)'); g.addColorStop(1,'rgba(60,20,110,0.92)'); x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
    x.strokeStyle=accent; x.lineWidth=10; x.strokeRect(22,22,c.width-44,c.height-44);
    x.fillStyle='#fff'; x.font='bold 74px system-ui, Arial'; x.textAlign='center'; x.fillText(text,512,180);
    x.fillStyle='rgba(235,230,255,0.86)'; x.font='34px system-ui, Arial'; x.fillText(sub,512,250);
    x.fillStyle='rgba(180,255,220,0.9)'; x.font='bold 31px system-ui, Arial'; x.fillText('PRIVATE SCENE • RETURN GATE BEHIND YOU',512,385);
    const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
  }
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(6.8,3.4), new THREE.MeshBasicMaterial({ map: makePanel(title, subtitle), transparent: true }));
  panel.position.set(0,2.6,-5.5); scene.add(panel);
  const portal = new THREE.Mesh(new THREE.RingGeometry(0.95,1.25,48), new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent:true, opacity:0.52, side:THREE.DoubleSide }));
  portal.position.set(0,1.25,3.4); portal.rotation.y=Math.PI; scene.add(portal);
  const portalCore = new THREE.Mesh(new THREE.CircleGeometry(0.92,48), new THREE.MeshBasicMaterial({ color:0x12081e, transparent:true, opacity:0.84, side:THREE.DoubleSide })); portalCore.position.copy(portal.position); portalCore.rotation.copy(portal.rotation); scene.add(portalCore);
  renderer.domElement.addEventListener('pointerdown',()=>{ if(portalUrl){ window.location.href=portalUrl; } });
  window.addEventListener('resize',()=>{ camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
  const keys={}; window.addEventListener('keydown',e=>{ keys[e.code]=true; if(e.code==='Escape'||e.code==='KeyB') window.location.href='./index.html'; }); window.addEventListener('keyup',e=>{ keys[e.code]=false; });
  renderer.setAnimationLoop(()=>{
    const speed=0.045; if(keys.KeyW||keys.ArrowUp) camera.position.z-=speed; if(keys.KeyS||keys.ArrowDown) camera.position.z+=speed; if(keys.KeyA||keys.ArrowLeft) camera.position.x-=speed; if(keys.KeyD||keys.ArrowRight) camera.position.x+=speed;
    moon.rotation.y += 0.0015; mars.rotation.y += 0.002; stars.rotation.y += 0.00008; portal.rotation.z += 0.006; portalCore.rotation.z -= 0.004; renderer.render(scene,camera);
  });
}
