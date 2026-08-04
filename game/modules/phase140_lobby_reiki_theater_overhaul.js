import * as THREE from "three";
import { applyPhase139UploadedAdsBackground } from "./reiki_phase139_ads_background.js";

const REIKI_ROOM_URL = "./reiki.html?v=phase140-reiki-pod";

function canvasTexture(w, h, draw){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
function labelTexture(title, lines = [], accent = "#7dfff0", approval = true){
  return canvasTexture(1024, 768, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "#02080c");
    g.addColorStop(.58, "#12051b");
    g.addColorStop(1, "#020306");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    roundRect(ctx, 28, 28, w-56, h-56, 38);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f7ffff";
    ctx.font = "900 58px system-ui, Arial";
    ctx.fillText(title, w/2, 105);
    ctx.fillStyle = "#dffff8";
    ctx.font = "700 34px system-ui, Arial";
    let y = 220;
    lines.forEach(line=>{ ctx.fillText(line, w/2, y); y += 58; });
    if (approval){
      ctx.fillStyle = "rgba(210,0,30,.32)";
      roundRect(ctx, 130, h-148, w-260, 82, 24);
      ctx.fill();
      ctx.strokeStyle = "#ff2e48";
      ctx.lineWidth = 6;
      roundRect(ctx, 130, h-148, w-260, 82, 24);
      ctx.stroke();
      ctx.fillStyle = "#ffd8de";
      ctx.font = "900 31px system-ui, Arial";
      ctx.fillText("AWAITING APPROVAL", w/2, h-107);
    }
  });
}
function planetTexture(kind){
  const size = kind === "earth" ? [1536, 768] : [768, 384];
  return canvasTexture(size[0], size[1], (ctx, w, h)=>{
    if (kind === "earth"){
      const ocean = ctx.createLinearGradient(0,0,w,h);
      ocean.addColorStop(0, "#082868"); ocean.addColorStop(.45, "#0a4a92"); ocean.addColorStop(1, "#061a4a");
      ctx.fillStyle = ocean; ctx.fillRect(0,0,w,h);
      const land = [[210,260,185,86,-.25],[430,390,165,100,.50],[810,285,245,110,-.38],[1040,475,170,82,.20],[1300,250,155,70,.08],[120,520,105,58,.42]];
      land.forEach((p,i)=>{ ctx.fillStyle = i%2 ? "rgba(58,158,82,.92)" : "rgba(86,178,110,.88)"; ctx.beginPath(); ctx.ellipse(...p,0,Math.PI*2); ctx.fill(); });
      ctx.fillStyle = "rgba(255,255,255,.22)";
      for(let i=0;i<26;i++){ ctx.beginPath(); ctx.ellipse((i*127+70)%w,80+(i*67)%570,150+(i%4)*35,16+(i%3)*9,i*.28,0,Math.PI*2); ctx.fill(); }
      ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 6; for(let y=60;y<h;y+=82){ ctx.beginPath(); ctx.moveTo(0,y); ctx.bezierCurveTo(w*.25,y-20,w*.55,y+22,w,y-8); ctx.stroke(); }
    } else if (kind === "moon"){
      ctx.fillStyle = "#d8d9de"; ctx.fillRect(0,0,w,h);
      for(let i=0;i<70;i++){ ctx.fillStyle = `rgba(70,72,82,${.10+(i%7)*.026})`; ctx.beginPath(); ctx.arc((i*89)%w,(i*53)%h,7+(i%8)*5,0,Math.PI*2); ctx.fill(); }
    } else {
      const mars = ctx.createLinearGradient(0,0,w,h); mars.addColorStop(0,"#8d341d"); mars.addColorStop(.45,"#c86a3d"); mars.addColorStop(1,"#e79058"); ctx.fillStyle=mars; ctx.fillRect(0,0,w,h);
      ctx.fillStyle = "rgba(70,18,8,.35)"; for(let i=0;i<45;i++){ ctx.beginPath(); ctx.ellipse((i*83)%w,(i*47)%h,35+(i%6)*16,10+(i%4)*7,i*.37,0,Math.PI*2); ctx.fill(); }
      ctx.strokeStyle = "rgba(255,210,120,.15)"; ctx.lineWidth = 7; for(let y=40;y<h;y+=70){ ctx.beginPath(); ctx.moveTo(0,y); ctx.bezierCurveTo(w*.35,y+30,w*.55,y-25,w,y+10); ctx.stroke(); }
    }
  });
}
function glowTexture(core, edge){
  return canvasTexture(256, 256, (ctx, w, h)=>{
    const g = ctx.createRadialGradient(w/2,h/2,6,w/2,h/2,w/2);
    g.addColorStop(0, core);
    g.addColorStop(.28, "rgba(255,255,255,.58)");
    g.addColorStop(1, edge);
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
  });
}
function hideOldPlanetsAndSkyLines(scene, keeper){
  const p = new THREE.Vector3();
  scene.traverse(obj=>{
    if (!obj || obj === keeper) return;
    obj.getWorldPosition?.(p);
    if (p.y < 35) return;
    const radius = obj.isMesh ? (obj.geometry?.parameters?.radius || 0) : 0;
    const bigSprite = obj.isSprite && Math.max(obj.scale.x||0,obj.scale.y||0) > 22;
    const skyLine = (obj.isLine || obj.type === "Line" || obj.type === "LineLoop") && p.y > 36;
    const skyLight = obj.isPointLight && p.length() > 80;
    if ((obj.isMesh && radius >= 3.0) || bigSprite || skyLine || skyLight) obj.visible = false;
  });
}
function addAtmosphere(scene){
  if (scene.userData._phase140Atmosphere) return scene.userData._phase140Atmosphere;
  const n = 1800;
  const pos = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const c = new THREE.Color();
  for(let i=0;i<n;i++){
    const r = 130 + Math.random()*280;
    const a = Math.random()*Math.PI*2;
    const y = 45 + Math.random()*150;
    pos[i*3] = Math.cos(a)*r;
    pos[i*3+1] = y;
    pos[i*3+2] = Math.sin(a)*r;
    c.setHSL(.58 + Math.random()*.18, .35, .70 + Math.random()*.25);
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: .38, vertexColors: true, transparent: true, opacity: .92, depthWrite: false }));
  stars.name = "PHASE140 REALISTIC STAR AURA FIELD";
  scene.add(stars);
  const aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(95,170,255,.50)","rgba(60,40,180,0)"), transparent:true, opacity:.11, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  aura.name = "PHASE140 LOBBY AURA ATMOSPHERE";
  aura.scale.set(420, 260, 1);
  aura.position.set(0, 100, -170);
  scene.add(aura);
  scene.userData._phase140Atmosphere = { stars, aura, update(dt){ stars.rotation.y += dt*.004; aura.material.opacity = .095 + Math.sin(performance.now()*.00025)*.025; } };
  return scene.userData._phase140Atmosphere;
}
function addCinematicPlanets(scene, log=()=>{}){
  if(scene.userData._phase140Planets) return scene.userData._phase140Planets;
  if(scene.userData._phase137StablePlanets?.group) scene.userData._phase137StablePlanets.group.visible = false;
  if(scene.userData._phase136Solar?.group) scene.userData._phase136Solar.group.visible = false;
  const group = new THREE.Group();
  group.name = "PHASE140 CINEMATIC EARTH MOON MARS SYSTEM";
  scene.add(group);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(22, 64, 40), new THREE.MeshStandardMaterial({ map: planetTexture("earth"), roughness:.70, metalness:.01, emissive:0x07152a, emissiveIntensity:.08 }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(7.2, 48, 28), new THREE.MeshStandardMaterial({ map: planetTexture("moon"), roughness:.92, metalness:.01, emissive:0x101018, emissiveIntensity:.04 }));
  const mars = new THREE.Mesh(new THREE.SphereGeometry(9.0, 48, 28), new THREE.MeshStandardMaterial({ map: planetTexture("mars"), roughness:.78, metalness:.02, emissive:0x2a0804, emissiveIntensity:.05 }));
  const earthHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture("rgba(120,210,255,.9)","rgba(30,100,255,0)"), transparent:true, opacity:.21, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture("rgba(255,255,245,.88)","rgba(175,195,255,0)"), transparent:true, opacity:.15, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture("rgba(255,145,95,.9)","rgba(255,70,40,0)"), transparent:true, opacity:.16, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  earthHalo.scale.set(92,92,1); moonHalo.scale.set(35,35,1); marsHalo.scale.set(44,44,1);
  const light = new THREE.PointLight(0xbddfff, 1.35, 360, 1.7);
  group.add(earth, moon, mars, earthHalo, moonHalo, marsHalo, light);
  const atmosphere = addAtmosphere(scene);
  const state = { group, earth, moon, mars, atmosphere, update(dt=0){
    hideOldPlanetsAndSkyLines(scene, group);
    const t = performance.now()*.001;
    const orbit = t*.010;
    const r = 170;
    const y = 118 + Math.sin(t*.035)*4;
    earth.position.set(Math.cos(orbit)*r, y, Math.sin(orbit)*r*.72);
    earth.rotation.y += dt*.035;
    earth.rotation.z = .23;
    const mo = t*.080;
    moon.position.set(earth.position.x + Math.cos(mo)*48, earth.position.y + 12 + Math.sin(mo*.9)*5, earth.position.z + Math.sin(mo)*38);
    moon.rotation.y += dt*.055;
    const marsDistance = 86 + Math.sin(t*.032)*44;
    const ma = t*.028;
    mars.position.set(earth.position.x + Math.cos(ma)*marsDistance, earth.position.y + 18 + Math.sin(ma*.8)*9, earth.position.z + Math.sin(ma)*marsDistance*.76);
    mars.rotation.y += dt*.045;
    earthHalo.position.copy(earth.position); moonHalo.position.copy(moon.position); marsHalo.position.copy(mars.position); light.position.copy(earth.position);
    atmosphere.update(dt);
  }};
  scene.userData._phase140Planets = state;
  log?.("Phase 140 cinematic slow planets active");
  return state;
}
function hideOlderReikiEntrance(group){
  group.traverse(obj=>{
    if (!obj?.isMesh) return;
    const n = String(obj.name || "");
    const g = String(obj.geometry?.type || "");
    const z = obj.position?.z ?? 0;
    const y = obj.position?.y ?? 0;
    if (n.includes("PHASE138") || n.includes("BENT RED ROPE") || n.includes("CARPET") || (g.includes("Plane") && y < .08 && z > 0)) obj.visible = false;
  });
}
function addPlant(parent, x, z, scale=1){
  const group = new THREE.Group(); group.position.set(x,0,z); group.name = "PHASE140 REIKI ROPELINE PLANT"; parent.add(group);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.22*scale,.28*scale,.38*scale,20), new THREE.MeshStandardMaterial({ color:0x23120e, roughness:.78, metalness:.03 })); pot.position.y=.19*scale; group.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color:0x1d7f4d, roughness:.65, emissive:0x06351e, emissiveIntensity:.16, side:THREE.DoubleSide });
  for(let i=0;i<7;i++){
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(.20*scale,.82*scale), leafMat);
    leaf.position.y = .72*scale;
    leaf.rotation.y = i/7*Math.PI*2;
    leaf.rotation.x = -.72 + Math.random()*.18;
    group.add(leaf);
  }
  return group;
}
function addStanchionsAndRopes(group){
  const poleMat = new THREE.MeshStandardMaterial({ color:0xd8b45a, roughness:.25, metalness:.72, emissive:0x342008, emissiveIntensity:.18 });
  const ropeMat = new THREE.MeshStandardMaterial({ color:0xbd0625, roughness:.42, metalness:.02, emissive:0x55040e, emissiveIntensity:.38 });
  const positions = [-.1, 1.55, 3.25, 5.05, 6.95, 8.65];
  for (const side of [-1,1]){
    const pts = [];
    positions.forEach((z)=>{
      const x = side * 1.78;
      const pole = new THREE.Group(); pole.name = "PHASE140 GOLD STANCHION"; pole.position.set(x,0,z); group.add(pole);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(.20,.30,.10,28), poleMat); base.position.y=.05; pole.add(base);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,1.05,24), poleMat); stem.position.y=.56; pole.add(stem);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(.16,24,16), poleMat); ball.position.y=1.12; pole.add(ball);
      pts.push(new THREE.Vector3(x, .96, z));
    });
    for(let i=0;i<pts.length-1;i++){
      const a=pts[i], b=pts[i+1];
      const mid = a.clone().lerp(b,.5); mid.y -= .22;
      const curve = new THREE.CatmullRomCurve3([a, mid, b]);
      const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, .045, 16, false), ropeMat);
      rope.name = "PHASE140 SAGGING RED VELVET ROPE";
      group.add(rope);
    }
  }
}
function chakraIcon(name, color){
  return canvasTexture(512,512,(ctx,w,h)=>{
    ctx.fillStyle="rgba(0,0,0,.0)"; ctx.clearRect(0,0,w,h);
    const g=ctx.createRadialGradient(w/2,h/2,12,w/2,h/2,210); g.addColorStop(0,color); g.addColorStop(.32,"rgba(255,255,255,.7)"); g.addColorStop(.78,color); g.addColorStop(1,"rgba(0,0,0,0)"); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(w/2,h/2,190,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.85)"; ctx.lineWidth=10; ctx.beginPath(); ctx.arc(w/2,h/2,138,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle="#fff"; ctx.font="900 110px serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("✦",w/2,h/2-10);
    ctx.font="900 42px system-ui,Arial"; ctx.fillText(name,w/2,h-70);
  });
}
function addChakraWalls(group){
  const names=["Root","Sacral","Solar","Heart","Throat","Third","Crown"];
  const colors=["#ff2e4e","#ff8a2a","#ffd13d","#55ff99","#54d9ff","#7b6cff","#d88cff"];
  names.forEach((name,i)=>{
    const side = i%2===0 ? -1 : 1;
    const z = .55 + i*1.04;
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(.72,.72), new THREE.MeshBasicMaterial({ map:chakraIcon(name,colors[i]), transparent:true, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending }));
    icon.name = "PHASE140 NEON CHAKRA WALL ICON";
    icon.position.set(side*3.15, 1.85 + (i%3)*.35, z);
    icon.rotation.y = side < 0 ? Math.PI*.18 : -Math.PI*.18;
    group.add(icon);
  });
}
function addGlassStorefront(group){
  const glassMat = new THREE.MeshStandardMaterial({ color:0xaafff4, transparent:true, opacity:.16, roughness:.04, metalness:.10, emissive:0x0d3835, emissiveIntensity:.14, side:THREE.DoubleSide, depthWrite:false });
  const frameMat = new THREE.MeshStandardMaterial({ color:0x7dfff0, roughness:.25, metalness:.42, emissive:0x1ea899, emissiveIntensity:.55 });
  const sideL = new THREE.Mesh(new THREE.PlaneGeometry(7.7,3.2), glassMat); sideL.name="PHASE140 GLASS STOREFRONT LEFT"; sideL.position.set(-2.55,2.0,4.25); sideL.rotation.y = Math.PI/2; group.add(sideL);
  const sideR = sideL.clone(); sideR.name="PHASE140 GLASS STOREFRONT RIGHT"; sideR.position.x = 2.55; sideR.rotation.y = -Math.PI/2; group.add(sideR);
  const top = new THREE.Mesh(new THREE.BoxGeometry(5.4,.12,.16), frameMat); top.name="PHASE140 GLASS ENTRY HEADER"; top.position.set(0,3.66,7.95); group.add(top);
  const l = new THREE.Mesh(new THREE.BoxGeometry(.12,3.25,.16), frameMat); l.position.set(-2.55,2.05,7.95); const r=l.clone(); r.position.x=2.55; group.add(l,r);
}
function addLongCarpet(group){
  const mat = new THREE.MeshStandardMaterial({ color:0x96081f, roughness:.72, metalness:.02, emissive:0x2d0208, emissiveIntensity:.16, side:THREE.DoubleSide });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 11.8), mat);
  carpet.name = "PHASE140 LONGER NARROW RED CARPET RUNNER";
  carpet.rotation.x = -Math.PI/2;
  carpet.position.set(0,.03,4.65);
  carpet.renderOrder = 9;
  group.add(carpet);
  const trimMat = new THREE.MeshStandardMaterial({ color:0xe2c06a, metalness:.52, roughness:.30, emissive:0x2e2108, emissiveIntensity:.18 });
  [-1,1].forEach(side=>{ const trim = new THREE.Mesh(new THREE.BoxGeometry(.055,.05,11.75), trimMat); trim.position.set(side*1.48,.065,4.65); group.add(trim); });
}
function findCenterDisplay(group){
  let display = null;
  group.traverse(obj=>{
    if(display || !obj?.isMesh || !obj.material?.map) return;
    const p = obj.position || new THREE.Vector3();
    if(Math.abs(p.x) < .2 && p.y > 1.8 && p.y < 4.2 && p.z > .3) display = obj;
  });
  return display;
}
function addInteractivePod(args, group){
  const { scene, camera, renderer, setStatus=()=>{} } = args;
  const display = findCenterDisplay(group);
  const pod = new THREE.Group(); pod.name = "PHASE140 REIKI INTERACTIVE HOLOGRAM POD"; pod.position.set(0,.04,1.35); group.add(pod);
  const teal = new THREE.MeshBasicMaterial({ color:0x7dfff0, transparent:true, opacity:.72, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.92,.035,12,96), teal); ring.rotation.x = Math.PI/2; ring.userData.href=REIKI_ROOM_URL; pod.add(ring);
  const disk = new THREE.Mesh(new THREE.CircleGeometry(.86,80), new THREE.MeshBasicMaterial({ color:0x7dfff0, transparent:true, opacity:.10, depthWrite:false, side:THREE.DoubleSide })); disk.rotation.x=-Math.PI/2; pod.add(disk);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.30,.88,2.8,48,1,true), new THREE.MeshBasicMaterial({ color:0x7dfff0, transparent:true, opacity:.06, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending })); beam.position.y=1.42; pod.add(beam);
  const portalLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.6,.44), new THREE.MeshBasicMaterial({ map:labelTexture("ENTER",["Meditation Room"],"#7dfff0",false), transparent:true, side:THREE.DoubleSide, depthWrite:false })); portalLabel.position.set(0,.32,.92); portalLabel.userData.href=REIKI_ROOM_URL; pod.add(portalLabel);
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  renderer?.domElement?.addEventListener("pointerdown", ev=>{
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX-rect.left)/rect.width)*2-1; mouse.y = -((ev.clientY-rect.top)/rect.height)*2+1;
    ray.setFromCamera(mouse, camera);
    if(ray.intersectObjects([ring,disk,portalLabel], true)[0]) location.href = REIKI_ROOM_URL;
  }, { passive:true });
  const wp = new THREE.Vector3(), cp = new THREE.Vector3();
  const prior = scene.userData._tickWorld;
  if(!scene.userData._phase140PodTick){
    scene.userData._tickWorld = dt=>{
      prior?.(dt);
      camera?.getWorldPosition(cp); pod.getWorldPosition(wp); const near = cp.distanceTo(wp) < 7.2;
      ring.rotation.z += dt*.8; beam.material.opacity = near ? .18 : .045; disk.material.opacity = near ? .18 : .07;
      if(display){ display.visible = near; if(display.material) display.material.opacity = near ? .96 : .0; }
      if(near) setStatus("Reiki hologram active • touch pod to enter meditation room");
    };
    scene.userData._phase140PodTick = true;
  }
}
function refineReiki(args, group){
  if(!group || group.userData._phase140Refined) return;
  hideOlderReikiEntrance(group);
  addGlassStorefront(group);
  addLongCarpet(group);
  addStanchionsAndRopes(group);
  addChakraWalls(group);
  [[-3.0,.9],[-3.0,2.4],[-3.0,3.9],[-3.0,5.4],[-3.0,7.0],[3.0,.9],[3.0,2.4],[3.0,3.9],[3.0,5.4],[3.0,7.0]].forEach(([x,z],i)=>addPlant(group,x,z,.82+(i%3)*.08));
  addInteractivePod(args, group);
  group.userData._phase140Refined = true;
}
function theaterPanelTexture(){
  return labelTexture("VIBES THEATER",["Virtual Reality Movie Theater","Blue social cinema portal","Watch parties • trailers • events"],"#65b7ff",false);
}
function addVibesTheater(scene, sceneTargets={}, log=()=>{}){
  if(scene.userData._phase140VibesTheater) return scene.userData._phase140VibesTheater;
  const r = 39.4;
  let pos = new THREE.Vector3(0,0,r);
  const reiki = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  if(reiki?.look){ pos = reiki.look.clone().multiplyScalar(-1); pos.y=0; if(pos.length()<8) pos.set(0,0,r); }
  pos.setLength(Math.min(39.4, Math.max(34, pos.length())));
  const group = new THREE.Group(); group.name="PHASE140 BLUE VIBES THEATER STOREFRONT"; group.position.copy(pos);
  const face = new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), pos); face.y=0; face.normalize(); group.rotation.y = Math.atan2(face.x, face.z); scene.add(group);
  const blue = new THREE.MeshStandardMaterial({ color:0x5aaeff, roughness:.22, metalness:.42, emissive:0x0c57b8, emissiveIntensity:.68 });
  const glass = new THREE.MeshStandardMaterial({ color:0x88c8ff, transparent:true, opacity:.15, roughness:.04, metalness:.12, emissive:0x082b62, emissiveIntensity:.14, side:THREE.DoubleSide, depthWrite:false });
  const dark = new THREE.MeshStandardMaterial({ color:0x010612, roughness:.86, metalness:.05, emissive:0x050b26, emissiveIntensity:.30 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(12.0,5.6,.22), dark); back.position.set(0,2.95,-.18); group.add(back);
  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(11.4,5.05), glass); glassPane.position.set(0,2.95,-.04); group.add(glassPane);
  [[0,5.82,0,12.3,.18,.28],[-6.1,2.95,0,.18,5.55,.28],[6.1,2.95,0,.18,5.55,.28],[0,.28,0,12.0,.12,.24]].forEach(v=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(v[3],v[4],v[5]), blue); m.position.set(v[0],v[1],v[2]); group.add(m); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6,1.05), new THREE.MeshBasicMaterial({ map:theaterPanelTexture(), transparent:true, side:THREE.DoubleSide, depthWrite:false })); sign.position.set(0,5.1,.18); group.add(sign);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.9,2.55), new THREE.MeshBasicMaterial({ map:labelTexture("NOW SHOWING",["SVR Vibes Theater","Private movie room portal"],"#65b7ff",false), transparent:true, side:THREE.DoubleSide, depthWrite:false })); screen.position.set(0,2.88,.22); group.add(screen);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.4,8.5), new THREE.MeshStandardMaterial({ color:0x071a6f, roughness:.78, emissive:0x021041, emissiveIntensity:.18, side:THREE.DoubleSide })); carpet.rotation.x=-Math.PI/2; carpet.position.set(0,.03,3.9); group.add(carpet);
  for(let i=0;i<7;i++){ const light = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.4,16), blue); light.position.set(-3.2 + i*1.06, .95, 7.4); group.add(light); }
  scene.userData._phase140VibesTheater = { group };
  log?.("Phase 140 Vibes Theater opposite Reiki active");
  return scene.userData._phase140VibesTheater;
}

export async function applyPhase140LobbyReikiTheaterOverhaul(args = {}){
  const base = await applyPhase139UploadedAdsBackground(args);
  const scene = args.scene;
  if(!scene) return base;
  const planets = addCinematicPlanets(scene, args.log || (()=>{}));
  const reikiGroup = base?.group || scene.userData?._phase136Reiki?.group || scene.userData?._phase135ReikiWallAligned?.group;
  refineReiki(args, reikiGroup);
  addVibesTheater(scene, args.sceneTargets || {}, args.log || (()=>{}));
  args.setStatus?.("Phase 140 lobby, Reiki pod, theater, and cinematic planets active", { force:true });
  return { ...base, phase140Planets: planets, phase140Vibes: scene.userData._phase140VibesTheater };
}
