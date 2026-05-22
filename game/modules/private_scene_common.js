import * as THREE from "three";

export const PHASE_LABEL = 'PHASE-84-DATABASE-STRUCTURE-AUDIT-LOCK';

export function bootPrivateScene({ title = 'SVR Private Scene', subtitle = 'Private module', accent = 0x9b6dff } = {}){
  const app = document.getElementById('app') || document.body.appendChild(document.createElement('div'));
  app.id = 'app';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05030a);
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 400);
  camera.position.set(0, 1.6, 5.2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.xr.enabled = true;
  app.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xcfc5ff, 0x050509, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(4, 7, 3);
  scene.add(key);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(18, 80),
    new THREE.MeshStandardMaterial({ color: 0x0c0714, roughness: 0.92, metalness: 0.03, emissive: 0x130821, emissiveIntensity: 0.12 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.5, 0.035, 12, 96),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.04;
  scene.add(ring);

  function labelTexture(){
    const canvas = document.createElement('canvas');
    canvas.width = 1400; canvas.height = 520;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    g.addColorStop(0, '#10051d'); g.addColorStop(1, '#020106');
    ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = 'rgba(190,150,255,.9)'; ctx.lineWidth = 10; ctx.strokeRect(18,18,canvas.width-36,canvas.height-36);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8f5ff'; ctx.font = 'bold 86px system-ui, Arial'; ctx.fillText(title, canvas.width/2, 170);
    ctx.fillStyle = '#cbb7ff'; ctx.font = '42px system-ui, Arial'; ctx.fillText(subtitle, canvas.width/2, 282);
    ctx.fillStyle = '#8fffd7'; ctx.font = 'bold 34px system-ui, Arial'; ctx.fillText(PHASE_LABEL, canvas.width/2, 402);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 2.75), new THREE.MeshBasicMaterial({ map: labelTexture(), side: THREE.DoubleSide }));
  sign.position.set(0, 2.7, -4.8);
  scene.add(sign);

  const backBtn = document.createElement('a');
  backBtn.href = './index.html?v=phase84-db-structure';
  backBtn.textContent = 'Return to Lobby';
  backBtn.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:20;padding:10px 14px;border:1px solid rgba(180,140,255,.65);border-radius:999px;background:rgba(0,0,0,.7);color:white;text-decoration:none;font:600 13px system-ui';
  document.body.appendChild(backBtn);

  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  return { scene, camera, renderer, ring };
}
