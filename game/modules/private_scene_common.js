import * as THREE from "three";

export const PHASE_LABEL = 'PHASE-90-PRIVATE-ROOM-POLISH-LOCK';

function tex(width, height, painter){
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  painter(ctx, width, height);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function rr(ctx, x, y, w, h, r){
  const a = Math.min(r, w * .5, h * .5);
  ctx.beginPath();
  ctx.moveTo(x + a, y);
  ctx.arcTo(x + w, y, x + w, y + h, a);
  ctx.arcTo(x + w, y + h, x, y + h, a);
  ctx.arcTo(x, y + h, x, y, a);
  ctx.arcTo(x, y, x + w, y, a);
  ctx.closePath();
}

function labelTexture(title, subtitle, accent = '#be96ff', phase = PHASE_LABEL){
  return tex(1500, 560, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, '#10051d');
    g.addColorStop(.52, '#050711');
    g.addColorStop(1, '#020106');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    rr(ctx, 22, 22, w - 44, h - 44, 38);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8f5ff';
    ctx.font = '900 88px system-ui, Arial';
    ctx.fillText(title, w/2, 165);
    ctx.fillStyle = '#d9ccff';
    ctx.font = '700 42px system-ui, Arial';
    ctx.fillText(subtitle, w/2, 286);
    ctx.fillStyle = '#8fffd7';
    ctx.font = '800 33px system-ui, Arial';
    ctx.fillText(phase, w/2, 415);
  });
}

function smallSignTexture(title, lines = [], accent = '#69e8ff'){
  return tex(1000, 700, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, '#07111d');
    g.addColorStop(1, '#210719');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    rr(ctx, 20, 20, w - 40, h - 40, 28);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 58px system-ui, Arial';
    ctx.fillText(title, w/2, 110);
    ctx.fillStyle = '#dceeff';
    ctx.font = '700 34px system-ui, Arial';
    let y = 225;
    for (const line of lines){
      ctx.fillText(line, w/2, y);
      y += 82;
    }
  });
}

function addSign(scene, title, subtitle, accent, pos = [0,2.7,-4.8], size = [7.4,2.75]){
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(size[0], size[1]),
    new THREE.MeshBasicMaterial({ map: labelTexture(title, subtitle, accent), side: THREE.DoubleSide })
  );
  sign.position.set(...pos);
  scene.add(sign);
  return sign;
}

function addBoard(scene, title, lines, accent, pos, size = [2.8,2.0]){
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(size[0], size[1]),
    new THREE.MeshBasicMaterial({ map: smallSignTexture(title, lines, accent), side: THREE.DoubleSide, transparent: true })
  );
  board.position.set(...pos);
  scene.add(board);
  return board;
}

function addRope(scene, a, b, y, mat){
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,len,12), mat);
  rope.position.copy(a).lerp(b,.5).add(new THREE.Vector3(0,y,0));
  rope.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
  scene.add(rope);
}

function addStanchions(scene, points, redMat, goldMat){
  points.forEach((p)=>{
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.86,16), goldMat);
    post.position.copy(p).add(new THREE.Vector3(0,.43,0));
    scene.add(post);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.105,16,12), redMat);
    cap.position.copy(p).add(new THREE.Vector3(0,.89,0));
    scene.add(cap);
  });
  for (let i = 0; i < points.length; i++){
    addRope(scene, points[i], points[(i+1)%points.length], .72, redMat);
    addRope(scene, points[i], points[(i+1)%points.length], .54, redMat);
  }
}

function addScorpionSet(scene, accent){
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(2.25,2.25,.12,64), new THREE.MeshStandardMaterial({ color:0x35133d, roughness:.86, metalness:.04, emissive:0x17051d, emissiveIntensity:.20 }));
  felt.scale.z = .64;
  felt.position.y = .82;
  scene.add(felt);
  const rail = new THREE.Mesh(new THREE.TorusGeometry(1.92,.07,16,96), new THREE.MeshStandardMaterial({ color:0x3b2417, roughness:.7, metalness:.08 }));
  rail.scale.z = .64;
  rail.rotation.x = Math.PI*.5;
  rail.position.y = .91;
  scene.add(rail);
  for (let i=0;i<6;i++){
    const a = i / 6 * Math.PI * 2;
    const chair = new THREE.Mesh(new THREE.BoxGeometry(.58,.28,.58), new THREE.MeshStandardMaterial({ color:0x141923, roughness:.78, metalness:.12, emissive:0x090914, emissiveIntensity:.10 }));
    chair.position.set(Math.cos(a)*3.15,.50,Math.sin(a)*3.15);
    chair.lookAt(0,.5,0);
    scene.add(chair);
  }
  addBoard(scene, 'SCORPION FLOW', ['one table focus','player action timer','auto-check / auto-fold','readable cards'], '#ff6fb5', [-3.8,2.25,-3.7]);
}

function addPgaSet(scene){
  const mat = new THREE.Mesh(new THREE.BoxGeometry(2.9,.05,1.45), new THREE.MeshStandardMaterial({ color:0xd6a829, emissive:0x5c3a00, emissiveIntensity:.35, roughness:.7 }));
  mat.position.set(0,.035,1.6);
  scene.add(mat);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.12,32,16), new THREE.MeshStandardMaterial({ color:0xffffff, roughness:.35 }));
  ball.position.set(0,.17,-.85);
  scene.add(ball);
  for (let i=0;i<5;i++){
    const ring = new THREE.Mesh(new THREE.RingGeometry(.45 + i*.36, .48 + i*.36, 64), new THREE.MeshBasicMaterial({ color:i%2?0xa7ff80:0x69e8ff, transparent:true, opacity:.42, side:THREE.DoubleSide }));
    ring.rotation.x = -Math.PI*.5;
    ring.position.set(0,.025,-4.1 - i*.75);
    scene.add(ring);
  }
  addBoard(scene, 'PGA TRAINING', ['stand on gold mat','aim at ball','private range route','future swing meter'], '#a7ff80', [3.55,2.25,-3.7]);
}

function addReikiSet(scene){
  const redMat = new THREE.MeshStandardMaterial({ color:0xb50c28, roughness:.38, metalness:.12, emissive:0x680512, emissiveIntensity:.65 });
  const goldMat = new THREE.MeshStandardMaterial({ color:0xffd36b, roughness:.32, metalness:.45, emissive:0x5a3505, emissiveIntensity:.32 });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(7.2,4.4), new THREE.MeshStandardMaterial({ color:0x890718, roughness:.92, metalness:.02, emissive:0x35010a, emissiveIntensity:.28, side:THREE.DoubleSide }));
  carpet.rotation.x = -Math.PI*.5;
  carpet.position.set(0,.018,.70);
  scene.add(carpet);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(8.2,3.2), new THREE.MeshStandardMaterial({ color:0xff7f95, transparent:true, opacity:.13, roughness:.08, metalness:.14, emissive:0x4c0714, emissiveIntensity:.25, side:THREE.DoubleSide }));
  glass.position.set(0,2.35,-3.9);
  scene.add(glass);
  addBoard(scene, 'AWAITING APPROVAL', ['sponsor content disabled','SVR placeholder only','no outside branding'], '#ff405c', [0,2.36,-3.78], [4.0,2.25]);
  addStanchions(scene, [new THREE.Vector3(-3.8,0,-.6),new THREE.Vector3(3.8,0,-.6),new THREE.Vector3(3.8,0,2.5),new THREE.Vector3(-3.8,0,2.5)], redMat, goldMat);
}

function addStoreSet(scene){
  for (let x=-2;x<=2;x++){
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.05,1.55,.18), new THREE.MeshStandardMaterial({ color:0x101827, roughness:.6, metalness:.18, emissive:0x07111f, emissiveIntensity:.18 }));
    shelf.position.set(x*1.35,1.05,-3.1);
    scene.add(shelf);
    const item = new THREE.Mesh(new THREE.BoxGeometry(.55,.38,.22), new THREE.MeshStandardMaterial({ color:x%2?0xff5be9:0x69e8ff, roughness:.42, metalness:.18, emissive:x%2?0x4a063d:0x063c4a, emissiveIntensity:.35 }));
    item.position.set(x*1.35,1.45,-2.95);
    scene.add(item);
  }
  addBoard(scene, 'SVR STORE', ['avatar gear','table skins','sponsor drops','VR portal shopping'], '#ffd36b', [0,2.55,-3.85], [4.4,2.3]);
}

function addLoungeSet(scene){
  const sofaMat = new THREE.MeshStandardMaterial({ color:0x17111f, roughness:.8, metalness:.04, emissive:0x100717, emissiveIntensity:.15 });
  [-2.4,2.4].forEach((x)=>{
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(2.1,.42,.82), sofaMat);
    sofa.position.set(x,.42,.85);
    sofa.lookAt(0,.42,.15);
    scene.add(sofa);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.1,.95,.16), sofaMat);
    back.position.set(x,.93,1.22);
    back.lookAt(0,.93,.15);
    scene.add(back);
  });
  const table = new THREE.Mesh(new THREE.CylinderGeometry(.82,.82,.18,32), new THREE.MeshStandardMaterial({ color:0x211927, roughness:.58, metalness:.20, emissive:0x11091a, emissiveIntensity:.10 }));
  table.position.set(0,.18,.55);
  scene.add(table);
  addBoard(scene, 'SOCIAL LOUNGE', ['private hangout','moderator ready','event conversation','clean luxury vibe'], '#69e8ff', [0,2.55,-3.85], [4.4,2.3]);
}

function addChipPuttSet(scene){
  const green = new THREE.Mesh(new THREE.PlaneGeometry(8.4,5.8), new THREE.MeshStandardMaterial({ color:0x123b20, roughness:.96, metalness:.02, emissive:0x06210f, emissiveIntensity:.18, side:THREE.DoubleSide }));
  green.rotation.x = -Math.PI*.5;
  green.position.y = .02;
  scene.add(green);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.02,32), new THREE.MeshBasicMaterial({ color:0x020202 }));
  cup.position.set(0,.035,-2.15);
  scene.add(cup);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(.035,1.5,.035), new THREE.MeshStandardMaterial({ color:0xffffff }));
  flag.position.set(0,.78,-2.15);
  scene.add(flag);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.095,24,16), new THREE.MeshStandardMaterial({ color:0xffffff, roughness:.35 }));
  ball.position.set(0,.13,1.95);
  scene.add(ball);
  addBoard(scene, 'CHIP / PUTT', ['short game route','putting target','training mode','private scene'], '#a7ff80', [0,2.55,-3.85], [4.4,2.3]);
}

function addRoomDetails(scene, title = '', accent = 0x9b6dff){
  const lower = String(title).toLowerCase();
  if (lower.includes('scorpion')) addScorpionSet(scene, accent);
  else if (lower.includes('pga') || lower.includes('range')) addPgaSet(scene);
  else if (lower.includes('reiki') || lower.includes('zen')) addReikiSet(scene);
  else if (lower.includes('store')) addStoreSet(scene);
  else if (lower.includes('smoker') || lower.includes('lounge')) addLoungeSet(scene);
  else if (lower.includes('chip') || lower.includes('putt')) addChipPuttSet(scene);
}

export function bootPrivateScene({ title = 'SVR Private Scene', subtitle = 'Private module', accent = 0x9b6dff } = {}){
  const app = document.getElementById('app') || document.body.appendChild(document.createElement('div'));
  app.id = 'app';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05030a);
  scene.fog = new THREE.FogExp2(0x05030a, .018);
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 400);
  camera.position.set(0, 1.6, 5.2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
  renderer.setSize(innerWidth, innerHeight);
  renderer.xr.enabled = true;
  app.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xcfc5ff, 0x050509, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(4, 7, 3);
  scene.add(key);
  const fill = new THREE.PointLight(accent, 1.5, 18, 2.0);
  fill.position.set(0, 3.2, 1.6);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(18, 96),
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

  addSign(scene, title, subtitle, `#${accent.toString(16).padStart(6,'0')}`);
  addRoomDetails(scene, title, accent);

  const routeStrip = addBoard(scene, 'PRIVATE ROOM', ['lobby stays clean','full experience stays here','VR route verified'], '#8fffd7', [3.9, 2.2, -3.55], [2.3,1.7]);
  routeStrip.rotation.y = -.14;

  const backBtn = document.createElement('a');
  backBtn.href = './index.html?v=phase90-private-room-polish';
  backBtn.textContent = 'Return to Lobby';
  backBtn.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:20;padding:10px 14px;border:1px solid rgba(180,140,255,.65);border-radius:999px;background:rgba(0,0,0,.7);color:white;text-decoration:none;font:600 13px system-ui';
  document.body.appendChild(backBtn);

  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  window.SVR_PRIVATE_ROOM_STATE = { phase: PHASE_LABEL, title, subtitle, polished: true };
  return { scene, camera, renderer, ring };
}
