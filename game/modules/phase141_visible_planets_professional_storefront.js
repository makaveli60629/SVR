import * as THREE from "three";
import { applyPhase140Final } from "./phase140_final_wrapper.js";

const REIKI_ROOM_URL = "./reiki.html?v=phase141-professional-storefront";

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
function rounded(ctx, x, y, w, h, r){
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
function signTexture(title, lines = [], accent = "#7dfff0", approval = false){
  return canvasTexture(1200, 620, (ctx, w, h)=>{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#02070b");
    g.addColorStop(.50, "#11031d");
    g.addColorStop(1, "#020405");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 14;
    rounded(ctx, 28, 28, w - 56, h - 56, 38);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f8ffff";
    ctx.font = "900 76px system-ui, Arial";
    ctx.fillText(title, w / 2, 128, w - 90);
    ctx.fillStyle = "#dffff8";
    ctx.font = "800 38px system-ui, Arial";
    let y = 235;
    lines.forEach((line)=>{ ctx.fillText(line, w / 2, y, w - 100); y += 58; });
    if (approval){
      ctx.fillStyle = "rgba(215,0,34,.34)";
      rounded(ctx, 250, h - 118, w - 500, 70, 22);
      ctx.fill();
      ctx.strokeStyle = "#ff2d49";
      ctx.lineWidth = 5;
      rounded(ctx, 250, h - 118, w - 500, 70, 22);
      ctx.stroke();
      ctx.fillStyle = "#ffd5db";
      ctx.font = "900 30px system-ui, Arial";
      ctx.fillText("AWAITING APPROVAL", w / 2, h - 83);
    }
  });
}
function planetTexture(kind){
  const w = kind === "earth" ? 2048 : 1024;
  const h = kind === "earth" ? 1024 : 512;
  return canvasTexture(w, h, (ctx, W, H)=>{
    if (kind === "earth"){
      const ocean = ctx.createLinearGradient(0, 0, W, H);
      ocean.addColorStop(0, "#06245f");
      ocean.addColorStop(.35, "#0f57a2");
      ocean.addColorStop(.75, "#0b3779");
      ocean.addColorStop(1, "#041642");
      ctx.fillStyle = ocean;
      ctx.fillRect(0, 0, W, H);
      const land = [
        [250, 320, 260, 110, -0.22], [555, 505, 220, 125, .50], [1015, 360, 330, 145, -.38],
        [1340, 635, 230, 105, .20], [1705, 340, 210, 92, .08], [165, 680, 150, 75, .45]
      ];
      land.forEach((p, i)=>{
        ctx.fillStyle = i % 2 ? "rgba(61,168,88,.94)" : "rgba(93,190,116,.90)";
        ctx.beginPath(); ctx.ellipse(...p, 0, Math.PI * 2); ctx.fill();
      });
      ctx.fillStyle = "rgba(255,255,255,.26)";
      for(let i = 0; i < 36; i++){
        ctx.beginPath();
        ctx.ellipse((i * 149 + 90) % W, 90 + (i * 83) % 800, 170 + (i % 5) * 38, 17 + (i % 4) * 9, i * .31, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,255,255,.13)";
      ctx.lineWidth = 9;
      for(let y = 72; y < H; y += 110){
        ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * .25, y - 28, W * .55, y + 28, W, y - 10); ctx.stroke();
      }
    } else if (kind === "moon"){
      ctx.fillStyle = "#dddde2"; ctx.fillRect(0, 0, W, H);
      for(let i=0; i<96; i++){
        ctx.fillStyle = `rgba(58,60,72,${.10 + (i % 8) * .026})`;
        ctx.beginPath(); ctx.arc((i * 97) % W, (i * 61) % H, 8 + (i % 10) * 6, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#7d2d1b"); g.addColorStop(.46, "#c86a3d"); g.addColorStop(1, "#ef985e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(74,18,8,.38)";
      for(let i=0; i<64; i++){
        ctx.beginPath(); ctx.ellipse((i * 89) % W, (i * 53) % H, 42 + (i % 7) * 18, 11 + (i % 5) * 8, i * .34, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,210,120,.16)";
      ctx.lineWidth = 10;
      for(let y=60; y<H; y+=92){ ctx.beginPath(); ctx.moveTo(0,y); ctx.bezierCurveTo(W*.35,y+36,W*.58,y-30,W,y+12); ctx.stroke(); }
    }
  });
}
function glowTexture(core, edge){
  return canvasTexture(256, 256, (ctx, w, h)=>{
    const g = ctx.createRadialGradient(w/2, h/2, 6, w/2, h/2, w/2);
    g.addColorStop(0, core); g.addColorStop(.30, "rgba(255,255,255,.60)"); g.addColorStop(1, edge);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}
function hidePriorPlanetsAndSkyGuides(scene, keep){
  const p = new THREE.Vector3();
  scene.traverse((obj)=>{
    if (!obj || obj === keep || keep.children.includes(obj)) return;
    obj.getWorldPosition?.(p);
    if (p.y < 28) return;
    const radius = obj.isMesh ? (obj.geometry?.parameters?.radius || 0) : 0;
    const isGuideLine = obj.isLine || obj.type === "Line" || obj.type === "LineLoop";
    const oldPlanetMesh = obj.isMesh && radius >= 3.0;
    const oldSkySprite = obj.isSprite && Math.max(obj.scale.x || 0, obj.scale.y || 0) > 18;
    const oldSkyLight = obj.isPointLight && p.length() > 70;
    if (isGuideLine || oldPlanetMesh || oldSkySprite || oldSkyLight) obj.visible = false;
  });
}
function addShowcasePlanets(scene, log=()=>{}){
  if (scene.userData._phase141ShowcasePlanets) return scene.userData._phase141ShowcasePlanets;
  if (scene.userData._phase140Planets?.group) scene.userData._phase140Planets.group.visible = false;
  if (scene.userData._phase137StablePlanets?.group) scene.userData._phase137StablePlanets.group.visible = false;
  if (scene.userData._phase136Solar?.group) scene.userData._phase136Solar.group.visible = false;
  const group = new THREE.Group(); group.name = "PHASE141 VISIBLE SHOWCASE EARTH MOON MARS"; scene.add(group);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(32, 80, 48), new THREE.MeshStandardMaterial({ map:planetTexture("earth"), roughness:.65, metalness:.01, emissive:0x07162e, emissiveIntensity:.10 }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9.4, 56, 32), new THREE.MeshStandardMaterial({ map:planetTexture("moon"), roughness:.92, metalness:.01, emissive:0x101018, emissiveIntensity:.05 }));
  const mars = new THREE.Mesh(new THREE.SphereGeometry(12.2, 56, 32), new THREE.MeshStandardMaterial({ map:planetTexture("mars"), roughness:.78, metalness:.02, emissive:0x2a0804, emissiveIntensity:.06 }));
  const earthHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture("rgba(118,205,255,.95)","rgba(28,80,255,0)"), transparent:true, opacity:.22, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture("rgba(255,255,245,.90)","rgba(185,205,255,0)"), transparent:true, opacity:.16, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture("rgba(255,150,92,.92)","rgba(255,70,40,0)"), transparent:true, opacity:.17, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  earthHalo.scale.set(132,132,1); moonHalo.scale.set(45,45,1); marsHalo.scale.set(58,58,1);
  const light = new THREE.PointLight(0xc7e6ff, 1.55, 420, 1.65);
  group.add(earth, moon, mars, earthHalo, moonHalo, marsHalo, light);
  const state = { group, earth, moon, mars, update(dt=0){
    hidePriorPlanetsAndSkyGuides(scene, group);
    const t = performance.now() * .001;
    const earthOrbit = t * .0042;
    const earthRadius = 92;
    const baseY = 76 + Math.sin(t * .035) * 3;
    earth.position.set(Math.cos(earthOrbit) * earthRadius, baseY, Math.sin(earthOrbit) * earthRadius * .62);
    earth.rotation.y += dt * .025;
    earth.rotation.z = .23;
    const moonOrbit = t * .030;
    moon.position.set(earth.position.x + Math.cos(moonOrbit) * 58, earth.position.y + 13 + Math.sin(moonOrbit * .8) * 5, earth.position.z + Math.sin(moonOrbit) * 44);
    moon.rotation.y += dt * .035;
    const marsOrbit = t * .014;
    const marsDistance = 95 + Math.sin(t * .018) * 54;
    mars.position.set(earth.position.x + Math.cos(marsOrbit) * marsDistance, earth.position.y + 22 + Math.sin(marsOrbit * .75) * 8, earth.position.z + Math.sin(marsOrbit) * marsDistance * .70);
    mars.rotation.y += dt * .030;
    earthHalo.position.copy(earth.position); moonHalo.position.copy(moon.position); marsHalo.position.copy(mars.position); light.position.copy(earth.position);
  }};
  scene.userData._phase141ShowcasePlanets = state;
  log?.("Phase 141 visible showcase planets active");
  return state;
}
function getReikiGroup(result, scene){
  return result?.group || scene.userData?._phase136Reiki?.group || scene.userData?._phase135ReikiWallAligned?.group || null;
}
function hideOldFacade(group){
  group.traverse((obj)=>{
    if(!obj?.isMesh) return;
    const n = String(obj.name || "");
    if(n.includes("PHASE140 GLASS") || n.includes("PHASE140 GOLD STANCHION") || n.includes("PHASE140 SAGGING") || n.includes("PHASE140 LONGER") || n.includes("PHASE140 REIKI ROPELINE")) obj.visible = false;
  });
}
function addProfessionalFacade(args, group){
  if(!group || group.userData._phase141ProfessionalFacade) return;
  hideOldFacade(group);
  const teal = new THREE.MeshStandardMaterial({ color:0x7dfff0, roughness:.20, metalness:.48, emissive:0x1aa899, emissiveIntensity:.75 });
  const gold = new THREE.MeshStandardMaterial({ color:0xd8b45a, roughness:.24, metalness:.78, emissive:0x382407, emissiveIntensity:.18 });
  const red = new THREE.MeshStandardMaterial({ color:0xb30622, roughness:.46, metalness:.02, emissive:0x4f020c, emissiveIntensity:.35 });
  const glass = new THREE.MeshStandardMaterial({ color:0xb8fff8, transparent:true, opacity:.20, roughness:.02, metalness:.10, emissive:0x0c3b36, emissiveIntensity:.18, side:THREE.DoubleSide, depthWrite:false });
  const black = new THREE.MeshStandardMaterial({ color:0x020608, roughness:.82, metalness:.06, emissive:0x030d10, emissiveIntensity:.25 });
  const facadeBack = new THREE.Mesh(new THREE.BoxGeometry(12.5, 5.7, .18), black); facadeBack.name="PHASE141 PROFESSIONAL REIKI BLACK FACADE"; facadeBack.position.set(0,2.96,.04); group.add(facadeBack);
  const glassLeft = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 4.25), glass); glassLeft.name="PHASE141 PROFESSIONAL GLASS LEFT"; glassLeft.position.set(-4.18,2.78,.22); group.add(glassLeft);
  const glassRight = glassLeft.clone(); glassRight.name="PHASE141 PROFESSIONAL GLASS RIGHT"; glassRight.position.x=4.18; group.add(glassRight);
  const centerGlass = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 4.45), glass); centerGlass.name="PHASE141 PROFESSIONAL ENTRY GLASS"; centerGlass.position.set(0,2.82,.20); group.add(centerGlass);
  [[0,5.88,.28,12.7,.16,.24],[-6.32,2.95,.28,.16,5.65,.24],[6.32,2.95,.28,.16,5.65,.24],[0,.22,.28,12.5,.12,.22],[-2.0,2.95,.30,.12,4.45,.20],[2.0,2.95,.30,.12,4.45,.20]].forEach(v=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(v[3],v[4],v[5]), teal); m.position.set(v[0],v[1],v[2]); group.add(m); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.15), new THREE.MeshBasicMaterial({ map:signTexture("TRUEITIVE REIKI",["Wellness lounge • meditation portal","Founder presentation hub"],"#7dfff0",true), transparent:true, side:THREE.DoubleSide, depthWrite:false })); sign.name="PHASE141 PREMIUM TRUEITIVE MARQUEE"; sign.position.set(0,5.10,.50); group.add(sign);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.72, 12.6), new THREE.MeshStandardMaterial({ color:0x97081e, roughness:.70, emissive:0x30030a, emissiveIntensity:.18, side:THREE.DoubleSide })); carpet.name="PHASE141 PREMIUM NARROW RED CARPET"; carpet.rotation.x=-Math.PI/2; carpet.position.set(0,.041,4.95); group.add(carpet);
  [-1,1].forEach(side=>{ const trim = new THREE.Mesh(new THREE.BoxGeometry(.055,.052,12.58), gold); trim.position.set(side*1.42,.078,4.95); group.add(trim); });
  const ropeZ = [-.15,1.35,2.95,4.65,6.45,8.35,10.05];
  for(const side of [-1,1]){
    const pts=[];
    ropeZ.forEach(z=>{ const x=side*1.72; const pole=new THREE.Group(); pole.name="PHASE141 PREMIUM GOLD STANCHION"; pole.position.set(x,0,z); group.add(pole); const base=new THREE.Mesh(new THREE.CylinderGeometry(.23,.32,.12,32),gold); base.position.y=.06; pole.add(base); const stem=new THREE.Mesh(new THREE.CylinderGeometry(.052,.066,1.06,28),gold); stem.position.y=.58; pole.add(stem); const cap=new THREE.Mesh(new THREE.SphereGeometry(.17,28,18),gold); cap.position.y=1.16; pole.add(cap); pts.push(new THREE.Vector3(x,.98,z)); });
    for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1]; const mid=a.clone().lerp(b,.5); mid.y-=.25; const curve=new THREE.CatmullRomCurve3([a,mid,b]); const rope=new THREE.Mesh(new THREE.TubeGeometry(curve,36,.052,18,false),red); rope.name="PHASE141 SAGGING RED VELVET ROPE"; group.add(rope); }
  }
  for(let i=0;i<14;i++){
    const side=i<7?-1:1; const z=.55+(i%7)*1.32; const plant=new THREE.Group(); plant.name="PHASE141 PROFESSIONAL LUSH PLANT"; plant.position.set(side*2.95,0,z); group.add(plant); const pot=new THREE.Mesh(new THREE.CylinderGeometry(.20,.28,.40,22), new THREE.MeshStandardMaterial({ color:0x23130f, roughness:.78 })); pot.position.y=.2; plant.add(pot); const leafMat=new THREE.MeshStandardMaterial({ color:0x21965b, roughness:.58, emissive:0x052e1c, emissiveIntensity:.22, side:THREE.DoubleSide }); for(let j=0;j<9;j++){ const leaf=new THREE.Mesh(new THREE.PlaneGeometry(.18,.90),leafMat); leaf.position.y=.78; leaf.rotation.y=j/9*Math.PI*2; leaf.rotation.x=-.78; plant.add(leaf); }
  }
  const podBase = new THREE.Mesh(new THREE.CylinderGeometry(.85,1.12,.32,64), gold); podBase.name="PHASE141 HOLOGRAM POD GOLD BASE"; podBase.position.set(0,.18,1.32); group.add(podBase);
  const podGlass = new THREE.Mesh(new THREE.CylinderGeometry(.74,.92,1.9,64,1,true), new THREE.MeshBasicMaterial({ color:0x7dfff0, transparent:true, opacity:.075, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending })); podGlass.name="PHASE141 HOLOGRAM POD GLASS BEAM"; podGlass.position.set(0,1.18,1.32); group.add(podGlass);
  const portal = new THREE.Mesh(new THREE.TorusGeometry(1.02,.045,12,112), new THREE.MeshBasicMaterial({ color:0x7dfff0, transparent:true, opacity:.82, depthWrite:false, blending:THREE.AdditiveBlending })); portal.name="PHASE141 MEDITATION PORTAL FLOOR RING"; portal.rotation.x=Math.PI/2; portal.position.set(0,.38,1.32); group.add(portal);
  portal.userData.href=REIKI_ROOM_URL;
  const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2();
  args.renderer?.domElement?.addEventListener("pointerdown", ev=>{ const rect=args.renderer.domElement.getBoundingClientRect(); mouse.x=((ev.clientX-rect.left)/rect.width)*2-1; mouse.y=-((ev.clientY-rect.top)/rect.height)*2+1; ray.setFromCamera(mouse,args.camera); if(ray.intersectObject(portal,true)[0]) location.href=REIKI_ROOM_URL; }, { passive:true });
  group.userData._phase141ProfessionalFacade = true;
}
function addOppositeTheaterUpgrade(scene, log=()=>{}){
  const theater = scene.userData._phase140VibesTheater?.group;
  if(!theater || theater.userData._phase141TheaterPolished) return;
  const blue = new THREE.MeshStandardMaterial({ color:0x5bb8ff, roughness:.20, metalness:.45, emissive:0x0b65d1, emissiveIntensity:.84 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.8,1.25), new THREE.MeshBasicMaterial({ map:signTexture("VIBES THEATER",["VR cinema • movie nights","blue immersive screening room"],"#65b7ff",false), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  sign.name="PHASE141 POLISHED VIBES THEATER MARQUEE"; sign.position.set(0,5.28,.48); theater.add(sign);
  for(let i=0;i<9;i++){ const tube=new THREE.Mesh(new THREE.BoxGeometry(.08,2.2,.08),blue); tube.position.set(-4.0+i,1.55,7.2); theater.add(tube); }
  theater.userData._phase141TheaterPolished = true;
  log?.("Phase 141 Vibes Theater polish active");
}

export async function applyPhase141VisiblePlanetsProfessionalStorefront(args = {}){
  const result = await applyPhase140Final(args);
  const scene = args.scene;
  if(!scene) return result;
  const planets = addShowcasePlanets(scene, args.log || (()=>{}));
  const reikiGroup = getReikiGroup(result, scene);
  addProfessionalFacade(args, reikiGroup);
  addOppositeTheaterUpgrade(scene, args.log || (()=>{}));
  if(!scene.userData._phase141TickWrapped){
    const previousTick = scene.userData._tickWorld;
    scene.userData._tickWorld = (dt)=>{ previousTick?.(dt); planets.update?.(dt); };
    scene.userData._phase141TickWrapped = true;
  }
  args.setStatus?.("Phase 141 planets visible and storefront professional", { force:true });
  return { ...result, phase141Planets: planets };
}
