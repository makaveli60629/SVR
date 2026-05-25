import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

export function createPrivateScene(options = {}){
  const cfg = {
    title: options.title || "SVR Private Room",
    subtitle: options.subtitle || "Walkaround test room",
    build: options.build || "PHASE-174-MASTER-AUDIT-ROOM-WALKAROUND-LOCK",
    accent: options.accent || 0xb95aff,
    floor: options.floor || 0x101018,
    sky: options.sky || 0x02030a,
    roomKind: options.roomKind || "room",
    panels: options.panels || [],
    props: options.props || []
  };

  const app = document.getElementById("app") || document.body;
  const status = document.getElementById("status");
  const setStatus = (text)=>{ if (status) status.textContent = text; };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(cfg.sky);
  scene.fog = new THREE.Fog(cfg.sky, 12, 52);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 220);
  camera.position.set(0, 1.62, 5.2);

  const rig = new THREE.Group();
  rig.name = "SVRPrivateSceneRig";
  rig.add(camera);
  scene.add(rig);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  app.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  const hemi = new THREE.HemisphereLight(0xded8ff, 0x08080f, 1.5);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 8, 5);
  scene.add(key);
  const accentLight = new THREE.PointLight(cfg.accent, 4.2, 22, 2.0);
  accentLight.position.set(0, 3.1, 0);
  scene.add(accentLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(10.8, 96),
    new THREE.MeshStandardMaterial({ color: cfg.floor, roughness: 0.92, metalness: 0.02, emissive: cfg.floor, emissiveIntensity: 0.06 })
  );
  floor.rotation.x = -Math.PI * 0.5;
  floor.name = "WalkableFloor";
  scene.add(floor);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(4.8, 0.035, 12, 128),
    new THREE.MeshBasicMaterial({ color: cfg.accent, transparent: true, opacity: 0.76 })
  );
  ring.rotation.x = Math.PI * 0.5;
  ring.position.y = 0.025;
  scene.add(ring);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0d0e17, roughness: 0.85, metalness: 0.05, emissive: 0x080712, emissiveIntensity: 0.08 });
  for (let i=0;i<10;i++){
    const angle = (i / 10) * Math.PI * 2;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2.25, 2.8, 0.08), wallMat.clone());
    wall.position.set(Math.sin(angle) * 9.2, 1.4, Math.cos(angle) * 9.2);
    wall.lookAt(0, 1.4, 0);
    scene.add(wall);
  }

  function makeTextTexture(lines, accent = cfg.accent){
    const c = document.createElement("canvas");
    c.width = 1200; c.height = 700;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#05050c"; ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle = `#${accent.toString(16).padStart(6,'0')}`;
    ctx.lineWidth = 14; ctx.strokeRect(26,26,c.width-52,c.height-52);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff"; ctx.font = "900 78px Arial, Helvetica, sans-serif";
    ctx.fillText(lines[0] || cfg.title, c.width/2, 150);
    ctx.fillStyle = "#d8ccff"; ctx.font = "700 42px Arial, Helvetica, sans-serif";
    (lines.slice(1,6)).forEach((line,i)=> ctx.fillText(line, c.width/2, 265 + i*70));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const titlePanel = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 3.1),
    new THREE.MeshBasicMaterial({ map: makeTextTexture([cfg.title, cfg.subtitle, "VR walkaround enabled", "Lobby route preserved", cfg.build]), side: THREE.DoubleSide })
  );
  titlePanel.position.set(0, 2.25, -5.7);
  scene.add(titlePanel);

  cfg.panels.forEach((p, i)=>{
    const angle = (-0.82 + i*0.41);
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.9),
      new THREE.MeshBasicMaterial({ map: makeTextTexture(p.lines || [p.title || "SVR", p.text || ""], p.accent || cfg.accent), side: THREE.DoubleSide })
    );
    panel.position.set(Math.sin(angle) * 6.4, 1.75, Math.cos(angle) * -6.4);
    panel.lookAt(0, 1.65, 0);
    scene.add(panel);
  });

  function addPedestal(x,z,color,label){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.48,0.58,0.18,32), new THREE.MeshStandardMaterial({color, roughness:.5, metalness:.15, emissive: color, emissiveIntensity:.08}));
    base.position.y=.09; g.add(base);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.22,32,16), new THREE.MeshStandardMaterial({color, emissive:color, emissiveIntensity:.8, roughness:.35}));
    orb.position.y=.62; g.add(orb);
    g.position.set(x,0,z); scene.add(g);
    return {g, orb};
  }
  const props = [
    addPedestal(-2.8, -1.2, cfg.accent, "A"),
    addPedestal(2.8, -1.2, 0x7df9ff, "B"),
    addPedestal(0, 2.7, 0xf4d46a, "C")
  ];

  const keys = {};
  window.addEventListener("keydown", e=>{ keys[e.code] = true; if(e.code === 'Escape') location.href='./index.html'; });
  window.addEventListener("keyup", e=>{ keys[e.code] = false; });

  const controllers = [renderer.xr.getController(0), renderer.xr.getController(1)];
  const gamepads = [];
  controllers.forEach((ctrl,i)=>{
    ctrl.addEventListener('connected', e=>{ gamepads[i]=e.data?.gamepad || null; });
    ctrl.addEventListener('disconnected', ()=>{ gamepads[i]=null; });
    rig.add(ctrl);
  });

  let lastSnap = 0;
  const clock = new THREE.Clock();
  function moveRig(dt){
    const speed = 3.1;
    let x = 0, z = 0, turn = 0;
    if (keys.KeyW || keys.ArrowUp) z -= 1;
    if (keys.KeyS || keys.ArrowDown) z += 1;
    if (keys.KeyA) x -= 1;
    if (keys.KeyD) x += 1;
    if (keys.ArrowLeft) turn += 1;
    if (keys.ArrowRight) turn -= 1;
    for (const gp of gamepads){
      if (!gp?.axes) continue;
      // Common Quest mapping: left stick axes 2/3 or 0/1 depending browser.
      const ax = Math.abs(gp.axes[2] || 0) > Math.abs(gp.axes[0] || 0) ? gp.axes[2] : gp.axes[0];
      const ay = Math.abs(gp.axes[3] || 0) > Math.abs(gp.axes[1] || 0) ? gp.axes[3] : gp.axes[1];
      if (Math.abs(ax) > .18) x += ax;
      if (Math.abs(ay) > .18) z += ay;
      if (Math.abs(gp.axes[2] || 0) > .72 && performance.now() - lastSnap > 320){
        rig.rotation.y += (gp.axes[2] > 0 ? -1 : 1) * Math.PI / 4;
        lastSnap = performance.now();
      }
    }
    if (turn && performance.now() - lastSnap > 230){ rig.rotation.y += turn * Math.PI/4; lastSnap = performance.now(); }
    const v = new THREE.Vector3(x,0,z);
    if (v.lengthSq() > 0){
      v.normalize().multiplyScalar(speed*dt);
      const yaw = rig.rotation.y;
      const dx = v.x * Math.cos(yaw) - v.z * Math.sin(yaw);
      const dz = v.x * Math.sin(yaw) + v.z * Math.cos(yaw);
      rig.position.x += dx; rig.position.z += dz;
      const max=8.6; rig.position.x=Math.max(-max,Math.min(max,rig.position.x)); rig.position.z=Math.max(-max,Math.min(max,rig.position.z));
    }
  }

  window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setStatus(`${cfg.title} ready • WASD/left stick walk • Esc returns lobby`);
  renderer.setAnimationLoop(()=>{
    const dt = Math.min(clock.getDelta(), 0.05);
    moveRig(dt);
    props.forEach((p,i)=>{ p.orb.position.y = 0.62 + Math.sin(performance.now()*0.0015 + i) * 0.08; p.orb.rotation.y += dt; });
    renderer.render(scene, camera);
  });
}
