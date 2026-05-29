import * as THREE from "three";

const PHASE134_PLANETS = "PHASE-134-LOBBY-SKY-BILLBOARD-MOON-MARS";
let lastScene = null;
let installed = false;
let rig = null;

function makePlanetTexture(kind){
  const c = document.createElement("canvas");
  c.width = c.height = 768;
  const x = c.getContext("2d");
  const s = c.width;

  x.clearRect(0,0,s,s);
  x.save();
  x.beginPath();
  x.arc(s/2,s/2,s*.46,0,Math.PI*2);
  x.clip();

  if(kind === "moon"){
    const g = x.createRadialGradient(s*.36,s*.30,s*.03,s*.52,s*.52,s*.50);
    g.addColorStop(0,"#ffffff");
    g.addColorStop(.36,"#eef5ff");
    g.addColorStop(.70,"#aeb9c8");
    g.addColorStop(1,"#4b535f");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);
    [[.29,.35,.075],[.58,.28,.060],[.64,.58,.095],[.37,.69,.066],[.76,.41,.050],[.21,.62,.045],[.48,.49,.040]].forEach(([cx,cy,rr])=>{
      const r = s*rr;
      const cg = x.createRadialGradient(cx*s-r*.2,cy*s-r*.2,r*.05,cx*s,cy*s,r);
      cg.addColorStop(0,"rgba(255,255,255,.26)");
      cg.addColorStop(.45,"rgba(46,53,66,.44)");
      cg.addColorStop(1,"rgba(255,255,255,.04)");
      x.fillStyle = cg;
      x.beginPath(); x.arc(cx*s,cy*s,r,0,Math.PI*2); x.fill();
      x.strokeStyle = "rgba(255,255,255,.22)"; x.lineWidth = Math.max(2,r*.04); x.stroke();
    });
    for(let i=0;i<90;i++){
      x.fillStyle="rgba(55,62,74,.24)";
      x.beginPath(); x.arc(Math.random()*s,Math.random()*s,2+Math.random()*18,0,Math.PI*2); x.fill();
    }
  } else {
    const g = x.createRadialGradient(s*.40,s*.30,s*.03,s*.52,s*.52,s*.52);
    g.addColorStop(0,"#ffc58e");
    g.addColorStop(.34,"#e37a4c");
    g.addColorStop(.74,"#87301b");
    g.addColorStop(1,"#2b0b07");
    x.fillStyle = g;
    x.fillRect(0,0,s,s);
    for(let i=0;i<125;i++){
      x.fillStyle = i%4===0 ? "rgba(255,224,155,.28)" : "rgba(48,10,6,.30)";
      x.beginPath();
      x.ellipse(Math.random()*s,Math.random()*s,20+Math.random()*130,4+Math.random()*19,Math.random()*Math.PI,0,Math.PI*2);
      x.fill();
    }
    x.globalAlpha = .32;
    x.strokeStyle = "rgba(255,224,170,.42)";
    for(let i=0;i<45;i++){
      const y = Math.random()*s;
      x.lineWidth = 1+Math.random()*3;
      x.beginPath(); x.moveTo(0,y); x.bezierCurveTo(s*.25,y+Math.random()*70-35,s*.72,y+Math.random()*70-35,s,y+Math.random()*34-17); x.stroke();
    }
  }
  x.restore();

  // Soft edge glow inside alpha area.
  const edge = x.createRadialGradient(s/2,s/2,s*.38,s/2,s/2,s*.50);
  edge.addColorStop(0,"rgba(255,255,255,0)");
  edge.addColorStop(1,kind === "moon" ? "rgba(219,234,255,.25)" : "rgba(255,143,91,.23)");
  x.fillStyle = edge;
  x.beginPath(); x.arc(s/2,s/2,s*.50,0,Math.PI*2); x.fill();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function makeHalo(color){
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const x = c.getContext("2d");
  const r=(color>>16)&255,g=(color>>8)&255,b=color&255;
  const grad = x.createRadialGradient(256,256,30,256,256,252);
  grad.addColorStop(0,"rgba(255,255,255,.32)");
  grad.addColorStop(.28,`rgba(${r},${g},${b},.26)`);
  grad.addColorStop(1,"rgba(0,0,0,0)");
  x.fillStyle = grad; x.fillRect(0,0,512,512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function sprite(name, map, w, h, order){
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent:true, depthTest:false, depthWrite:false, toneMapped:false, blending:THREE.AdditiveBlending }));
  s.name = name;
  s.scale.set(w,h,1);
  s.renderOrder = order;
  s.frustumCulled = false;
  return s;
}

function install(scene){
  if(!scene || installed) return false;
  installed = true;

  // Hide prior planet experiments only, not signage.
  scene.traverse((o)=>{
    const n = String(o?.name || "");
    if(/PHASE13[123]_.*MOON|PHASE13[123]_.*MARS|SVR_NORTH_SKY_MOON_MARS|SVR_TEXTURED_MOON|SVR_TEXTURED_MARS/.test(n)){
      if(!/PHASE134/.test(n)) o.visible = false;
    }
  });

  const group = new THREE.Group();
  group.name = "PHASE134_LOBBY_HIGH_SKY_PLANETS";
  group.frustumCulled = false;

  const moonHalo = sprite("PHASE134_MOON_HIGH_SKY_HALO", makeHalo(0xdbeaff), 31, 31, 330000);
  const moon = sprite("PHASE134_MOON_HIGH_SKY_VISIBLE", makePlanetTexture("moon"), 13.8, 13.8, 330001);
  const marsHalo = sprite("PHASE134_MARS_HIGH_SKY_HALO", makeHalo(0xff8f5b), 25, 25, 330002);
  const mars = sprite("PHASE134_MARS_HIGH_SKY_VISIBLE", makePlanetTexture("mars"), 9.8, 9.8, 330003);
  group.add(moonHalo, moon, marsHalo, mars);
  scene.add(group);
  rig = { group, moonHalo, moon, marsHalo, mars };
  scene.userData.phase134LobbyPlanets = rig;
  console.log(`[${PHASE134_PLANETS}] installed`);
  return true;
}

function update(scene, camera){
  if(!scene) return;
  install(scene);
  if(!rig) return;

  const t = performance.now() * .001;
  // Fixed lobby coordinates: high north sky, but within normal lobby render range.
  const moonX = -16 + Math.sin(t*.045)*3.2;
  const moonY = 42 + Math.sin(t*.060)*0.9;
  const moonZ = -34 + Math.cos(t*.035)*1.8;
  const marsX = 18 + Math.sin(t*.038 + 1.1)*3.0;
  const marsY = 50 + Math.sin(t*.052 + .8)*0.8;
  const marsZ = -39 + Math.cos(t*.032 + .5)*1.6;

  rig.moon.position.set(moonX, moonY, moonZ);
  rig.moonHalo.position.copy(rig.moon.position);
  rig.mars.position.set(marsX, marsY, marsZ);
  rig.marsHalo.position.copy(rig.mars.position);

  rig.moon.material.rotation = (rig.moon.material.rotation || 0) + .0018;
  rig.mars.material.rotation = (rig.mars.material.rotation || 0) + .0024;

  if(camera?.far && camera.far < 250){ camera.far = 250; camera.updateProjectionMatrix?.(); }
  rig.group.visible = true;
  rig.group.frustumCulled = false;
}

const originalRender = THREE.WebGLRenderer.prototype.render;
if(!THREE.WebGLRenderer.prototype.__svrPhase134LobbyPlanets){
  THREE.WebGLRenderer.prototype.__svrPhase134LobbyPlanets = true;
  THREE.WebGLRenderer.prototype.render = function(scene,camera){
    lastScene = scene || lastScene;
    update(lastScene,camera);
    return originalRender.call(this,scene,camera);
  };
}
setInterval(()=>update(lastScene,null),600);
console.log(`[${PHASE134_PLANETS}] loaded`);
