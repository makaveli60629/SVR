import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

function makeTextTexture(title, subtitle = "", lines = [], accent = "#b48cff", danger = false){
  const c = document.createElement("canvas"); c.width = 1280; c.height = 720;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0, danger ? "#2a030b" : "#050611"); g.addColorStop(1,"#090019");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = danger ? "#ff3b5d" : accent; x.lineWidth = 10; x.strokeRect(22,22,c.width-44,c.height-44);
  x.textAlign = "center"; x.fillStyle = "#fff"; x.font = "900 76px system-ui, Arial"; x.fillText(title,c.width/2,130);
  if (subtitle){ x.fillStyle = danger ? "#ff9aad" : accent; x.font = "800 42px system-ui, Arial"; x.fillText(subtitle,c.width/2,194); }
  x.fillStyle = "#eaffff"; x.font = "34px system-ui, Arial"; let y = 292;
  for (const line of lines){ x.fillText(String(line), c.width/2, y); y += 54; }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}

function makePlanetTexture(kind = "moon"){
  const c = document.createElement("canvas"); c.width = c.height = 512; const x = c.getContext("2d");
  const g = x.createRadialGradient(180,150,18,256,256,230);
  if (kind === "mars"){ g.addColorStop(0,"#ffd0a0"); g.addColorStop(.52,"#ff7441"); g.addColorStop(1,"#6b1e12"); }
  else { g.addColorStop(0,"#ffffff"); g.addColorStop(.55,"#dce8ff"); g.addColorStop(1,"#7f8ea9"); }
  x.fillStyle = g; x.beginPath(); x.arc(256,256,212,0,Math.PI*2); x.fill();
  if (kind === "mars"){
    x.strokeStyle = "rgba(80,20,8,.32)"; x.lineWidth = 9;
    for (let i=0;i<7;i++){ x.beginPath(); x.ellipse(256,150+i*42,154-i*8,10+(i%2)*6,i*.13,0,Math.PI*2); x.stroke(); }
  } else {
    x.fillStyle = "rgba(70,85,112,.26)";
    [[184,205,22],[306,158,35],[326,322,24],[146,318,16],[378,248,20],[235,278,12]].forEach(([px,py,r])=>{ x.beginPath(); x.arc(px,py,r,0,Math.PI*2); x.fill(); });
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

function makeGlowTexture(){
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  const g = x.createRadialGradient(64,64,3,64,64,62);
  g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.28,"rgba(180,140,255,.48)"); g.addColorStop(1,"rgba(180,140,255,0)");
  x.fillStyle = g; x.fillRect(0,0,128,128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

function addPanel(scene, title, subtitle, lines, pos, rotY = 0, accent = "#b48cff", danger = false){
  const tex = makeTextTexture(title, subtitle, lines, accent, danger);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.6,2.6), new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide }));
  panel.position.copy(pos); panel.rotation.y = rotY; scene.add(panel); return panel;
}

function addStars(scene){
  const count = 900; const pos = new Float32Array(count*3); const colors = new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const r = 42 + Math.random()*120; const a = Math.random()*Math.PI*2;
    pos[i*3] = Math.cos(a)*r; pos[i*3+1] = 9 + Math.random()*58; pos[i*3+2] = Math.sin(a)*r - 18;
    const tint = .78 + Math.random()*.22; colors[i*3] = tint; colors[i*3+1] = .86 + Math.random()*.14; colors[i*3+2] = 1;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos,3)); geo.setAttribute("color", new THREE.BufferAttribute(colors,3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ size:.16, transparent:true, opacity:.92, vertexColors:true, depthWrite:false }));
  scene.add(stars); return stars;
}

function addMoonMars(scene){
  const glowTex = makeGlowTexture();
  function body(name, kind, pos, scale, color){
    const group = new THREE.Group(); group.name = name; group.position.copy(pos);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, color, transparent:true, opacity:.58, depthWrite:false, blending:THREE.AdditiveBlending })); halo.scale.setScalar(scale*4.1); group.add(halo);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(scale,48,32), new THREE.MeshStandardMaterial({ map:makePlanetTexture(kind), roughness:.82, emissive:color, emissiveIntensity:kind==="mars"?.12:.08 })); group.add(mesh);
    const light = new THREE.PointLight(color, kind==="mars"?1.0:1.8, 90, 1.6); group.add(light); scene.add(group); return { group, mesh, halo };
  }
  const moon = body("SVR_PRIVATE_SCENE_GLB_STYLE_MOON","moon",new THREE.Vector3(-12,20,-34),2.15,0xddeaff);
  const mars = body("SVR_PRIVATE_SCENE_GLB_STYLE_MARS","mars",new THREE.Vector3(9,18,-38),.96,0xff7a45);
  return (dt)=>{ moon.mesh.rotation.y += dt*.05; mars.mesh.rotation.y += dt*.10; moon.halo.material.opacity=.50+Math.sin(performance.now()*.0006)*.05; mars.halo.material.opacity=.44+Math.sin(performance.now()*.0007)*.04; };
}

function addRoomShell(scene, accent = 0xb48cff){
  const floor = new THREE.Mesh(new THREE.CircleGeometry(18,96), new THREE.MeshStandardMaterial({ color:0x05060b, roughness:.94, metalness:.04, emissive:0x050018, emissiveIntensity:.22 })); floor.rotation.x = -Math.PI/2; scene.add(floor);
  const grid = new THREE.GridHelper(34,34,accent,0x1a1a28); grid.position.y=.012; scene.add(grid);
  const wallMat = new THREE.MeshBasicMaterial({ color:0x060711, transparent:true, opacity:.82, side:THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(34,9), wallMat); back.position.set(0,4.5,-13.8); scene.add(back);
  const left = back.clone(); left.position.set(-16.8,4.5,0); left.rotation.y = Math.PI/2; scene.add(left);
  const right = back.clone(); right.position.set(16.8,4.5,0); right.rotation.y = -Math.PI/2; scene.add(right);
}

function addPgaDrive(scene){
  addPanel(scene,"PGA DRIVE","PRIVATE RANGE",["Stand on gold mat","Ball directly ahead","Target greens restored","Local score only"],new THREE.Vector3(0,2.5,-10.5),0,"#7dff8a");
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(6,22),new THREE.MeshStandardMaterial({ color:0x093b16, roughness:.96, emissive:0x031307, emissiveIntensity:.25, side:THREE.DoubleSide })); lane.rotation.x=-Math.PI/2; lane.position.set(0,.02,-8.2); scene.add(lane);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(2.7,1.45),new THREE.MeshBasicMaterial({ map:makeTextTexture("STAND HERE","AIM AT BALL",["Private PGA Drive"],"#ffcf4a"), side:THREE.DoubleSide })); mat.rotation.x=-Math.PI/2; mat.position.set(0,.03,2.1); scene.add(mat);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.16,32,16),new THREE.MeshStandardMaterial({ color:0xffffff, roughness:.38, emissive:0x101010, emissiveIntensity:.12 })); ball.position.set(0,.18,.72); scene.add(ball);
  [5,10,15].forEach((z,i)=>{ const ring = new THREE.Mesh(new THREE.RingGeometry(1.2+i*.5,1.28+i*.5,80), new THREE.MeshBasicMaterial({ color:[0x7dff8a,0xffcf4a,0xb48cff][i], transparent:true, opacity:.8, side:THREE.DoubleSide })); ring.rotation.x=-Math.PI/2; ring.position.set(0,.05,-z); scene.add(ring); });
}

function addChipPutt(scene){
  addPanel(scene,"PGA CHIP / PUTT","SHORT GAME PRIVATE ROOM",["Putting green restored","Chip targets restored","Lobby stays clean"],new THREE.Vector3(0,2.5,-10.5),0,"#7dff8a");
  const green = new THREE.Mesh(new THREE.CircleGeometry(7.2,96),new THREE.MeshStandardMaterial({ color:0x126b2b, roughness:.92, emissive:0x031407, emissiveIntensity:.24 })); green.rotation.x=-Math.PI/2; green.position.z=-3.5; scene.add(green);
  [-2.5,0,2.5].forEach((x,i)=>{ const hole = new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.035,32),new THREE.MeshBasicMaterial({ color:0x000000 })); hole.position.set(x,.04,-5.8-i*1.6); scene.add(hole); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.4,12),new THREE.MeshBasicMaterial({ color:0xffffff })); pole.position.set(x,.72,-5.8-i*1.6); scene.add(pole); const flag = new THREE.Mesh(new THREE.PlaneGeometry(.55,.32),new THREE.MeshBasicMaterial({ color:[0xffcf4a,0xb48cff,0x7dff8a][i], side:THREE.DoubleSide })); flag.position.set(x+.32,1.15,-5.8-i*1.6); scene.add(flag); });
}

function addStore(scene){
  addPanel(scene,"SVR VR STORE","WEB PORTAL SURFACE",["https://svrpoker.com/site/store.html","Store scene route restored","Website remains separate"],new THREE.Vector3(0,2.5,-10.5),0,"#7dff8a");
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(5.6,3.15),new THREE.MeshBasicMaterial({ color:0x0b1222, transparent:true, opacity:.92, side:THREE.DoubleSide })); portal.position.set(0,2.2,-3.7); scene.add(portal);
  const glow = new THREE.Mesh(new THREE.RingGeometry(2.95,3.08,96),new THREE.MeshBasicMaterial({ color:0x7dff8a, transparent:true, opacity:.65, side:THREE.DoubleSide })); glow.position.copy(portal.position); glow.rotation.z=Math.PI/2; scene.add(glow);
}

function addLounge(scene){
  addPanel(scene,"SMOKER LOUNGE","PRIVATE SOCIAL ROOM",["Conversation lounge restored","Replay wall placeholder","No lobby overlap"],new THREE.Vector3(0,2.5,-10.5),0,"#ff77d7");
  for (let i=-1;i<=1;i+=2){ const couch = new THREE.Mesh(new THREE.BoxGeometry(3.2,.55,1.05),new THREE.MeshStandardMaterial({ color:0x21112a, roughness:.72, emissive:0x120617, emissiveIntensity:.18 })); couch.position.set(i*3.2,.32,-1.2); scene.add(couch); const back = new THREE.Mesh(new THREE.BoxGeometry(3.2,1.0,.28),couch.material.clone()); back.position.set(i*3.2,.9,-1.75); scene.add(back); }
}

function addScorpion(scene){
  addPanel(scene,"SCORPION ROOM","PRIVATE POKER ROOM",["Enclosed table route restored","City overlook style","Bots + player seat placeholder"],new THREE.Vector3(0,2.5,-10.5),0,"#ffcf4a");
  const table = new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.0,.24,64),new THREE.MeshStandardMaterial({ color:0x401010, roughness:.75, emissive:0x130404, emissiveIntensity:.18 })); table.scale.z=.72; table.position.set(0,.45,-1.5); scene.add(table);
  const felt = new THREE.Mesh(new THREE.CircleGeometry(1.72,64),new THREE.MeshBasicMaterial({ color:0x180a22, side:THREE.DoubleSide })); felt.rotation.x=-Math.PI/2; felt.scale.z=.72; felt.position.set(0,.585,-1.5); scene.add(felt);
  for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+.35; const bot = new THREE.Mesh(new THREE.CapsuleGeometry(.22,.72,8,14),new THREE.MeshStandardMaterial({ color:0x2c2238, roughness:.8, emissive:0x0b0810, emissiveIntensity:.1 })); bot.position.set(Math.cos(a)*2.55,.86,-1.5+Math.sin(a)*1.85); scene.add(bot); }
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(8,3.2),new THREE.MeshBasicMaterial({ color:0x8fdfff, transparent:true, opacity:.14, side:THREE.DoubleSide })); glass.position.set(0,2.4,-8.0); scene.add(glass);
}

function addReiki(scene){
  addPanel(scene,"REIKI ROOM","AWAITING APPROVAL",["Private meditation route restored","SVR placeholders only","No unapproved sponsor branding"],new THREE.Vector3(0,2.5,-10.5),0,"#ff3b5d",true);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.68,48,32),new THREE.MeshStandardMaterial({ color:0xbffff1, transparent:true, opacity:.75, emissive:0x41ffd0, emissiveIntensity:1.25, roughness:.32 })); orb.position.set(0,1.35,-1.5); scene.add(orb);
  for(let i=0;i<22;i++){ const a=i/22*Math.PI*2; const r=7+Math.random()*4; const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,1.5,8),new THREE.MeshStandardMaterial({ color:0x28160e })); trunk.position.set(Math.cos(a)*r,.75,Math.sin(a)*r-1.5); scene.add(trunk); const crown=new THREE.Mesh(new THREE.ConeGeometry(.75,2.2,10),new THREE.MeshStandardMaterial({ color:0x0a2a1a, roughness:.92, emissive:0x031108, emissiveIntensity:.2 })); crown.position.set(trunk.position.x,2.1,trunk.position.z); scene.add(crown); }
}

export function createPrivateScene(options = {}){
  const kind = options.kind || "generic";
  const app = document.getElementById("app") || document.body;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020004); scene.fog = new THREE.FogExp2(0x05020b,.018);
  const camera = new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.01,360); camera.position.set(0,1.62,6.8);
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:"high-performance" }); renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.45)); renderer.setSize(innerWidth,innerHeight); renderer.xr.enabled = true; app.appendChild(renderer.domElement); document.body.appendChild(VRButton.createButton(renderer));
  scene.add(new THREE.HemisphereLight(0xcfefff,0x130016,1.25)); const key = new THREE.DirectionalLight(0xffffff,1.65); key.position.set(-4,8,6); scene.add(key); const pulse = new THREE.PointLight(options.accent||0xb48cff,2.0,26,2); pulse.position.set(0,4,0); scene.add(pulse);
  addRoomShell(scene, options.accent || 0xb48cff); const stars = addStars(scene); const tickPlanets = addMoonMars(scene);
  if (kind === "pgaDrive") addPgaDrive(scene); else if (kind === "chipPutt") addChipPutt(scene); else if (kind === "store") addStore(scene); else if (kind === "lounge") addLounge(scene); else if (kind === "scorpion") addScorpion(scene); else if (kind === "reiki") addReiki(scene); else addPanel(scene, options.title||"SVR PRIVATE SCENE", options.subtitle||"ROUTE RESTORED", options.lines||["Scene route restored"], new THREE.Vector3(0,2.5,-10.5),0,options.accentCss||"#b48cff");
  document.getElementById("backLobby")?.addEventListener("click",()=>{ location.href = "./index.html?v=phase81-private-scene-return"; });
  document.getElementById("resetView")?.addEventListener("click",()=>{ camera.position.set(0,1.62,6.8); camera.lookAt(0,1.35,-2); });
  addEventListener("resize",()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
  let tPrev = performance.now();
  renderer.setAnimationLoop(()=>{ const now=performance.now(); const dt=Math.min((now-tPrev)/1000,.033); tPrev=now; tickPlanets(dt); stars.rotation.y += dt*.004; pulse.intensity = 1.75 + Math.sin(now*.0012)*.35; camera.lookAt(0,1.35,-2.2); renderer.render(scene,camera); });
  return { scene, camera, renderer };
}
