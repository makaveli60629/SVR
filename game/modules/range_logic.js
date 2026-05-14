import * as THREE from "three";
import { isPinching } from "./gestures.js";

const BUILD = "PHASE-92-PGA-TWO-HAND-GRIP-FACE-LOCK";
const SCORE_KEY = "svr_pga_range_training_points_v1";
const UP = new THREE.Vector3(0,1,0);
const TMP = new THREE.Vector3();
const TMP2 = new THREE.Vector3();
const TMP3 = new THREE.Vector3();
const TMP4 = new THREE.Vector3();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const CLUB_TARGET = new THREE.Object3D();

function makeTextTexture(title, subtitle, lines=[], accent='#7dff8a'){
  const c = document.createElement('canvas'); c.width=1024; c.height=512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,'#06150b'); g.addColorStop(1,'#0b0818'); x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=accent; x.lineWidth=8; x.strokeRect(18,18,c.width-36,c.height-36);
  x.fillStyle=accent; x.font='900 60px system-ui,Arial'; x.textAlign='center'; x.fillText(title,c.width/2,116);
  x.fillStyle='#ffffff'; x.font='700 38px system-ui,Arial'; x.fillText(subtitle,c.width/2,174);
  x.fillStyle='rgba(230,255,235,.88)'; x.font='30px system-ui,Arial';
  lines.forEach((l,i)=>x.fillText(l,c.width/2,250+i*46));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8; return tex;
}

function makeGroundTextTexture(title, subtitle='', accent='#f2c14e'){
  const c = document.createElement('canvas'); c.width=1024; c.height=512;
  const x = c.getContext('2d');
  x.clearRect(0,0,c.width,c.height);
  const g=x.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,'rgba(255,190,70,.95)'); g.addColorStop(.5,'rgba(255,232,126,.92)'); g.addColorStop(1,'rgba(255,170,42,.95)');
  x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle='rgba(255,255,255,.92)'; x.lineWidth=18; x.strokeRect(22,22,c.width-44,c.height-44);
  x.fillStyle='rgba(0,0,0,.88)'; x.textAlign='center'; x.textBaseline='middle';
  x.font='900 94px system-ui,Arial'; x.fillText(title,c.width/2,c.height/2-34);
  x.font='800 42px system-ui,Arial'; x.fillText(subtitle,c.width/2,c.height/2+70);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8; return tex;
}

function makeGrassTexture(){
  const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
  x.fillStyle='#0b3b16'; x.fillRect(0,0,512,512);
  for(let i=0;i<6000;i++){ const a=Math.random()*0.45; x.strokeStyle=`rgba(${55+Math.random()*80},${120+Math.random()*110},${55+Math.random()*75},${a})`; x.lineWidth=1; const px=Math.random()*512, py=Math.random()*512; x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.random()*8-4,py-Math.random()*14); x.stroke(); }
  for(let y=0;y<512;y+=64){ x.fillStyle='rgba(125,255,138,.06)'; x.fillRect(0,y,512,4); }
  const tex=new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(18,42); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}

function makeDisplacementTexture(){
  const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  x.fillStyle='#777'; x.fillRect(0,0,256,256);
  for(let i=0;i<1600;i++){ const v=90+Math.random()*120; x.fillStyle=`rgb(${v},${v},${v})`; x.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*3,1+Math.random()*3); }
  const tex=new THREE.CanvasTexture(c); tex.wrapS=tex.wrapT=THREE.RepeatWrapping; tex.repeat.set(18,42); return tex;
}

function makePlanetTexture(kind='moon'){
  const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d');
  const moon = kind === 'moon';
  const g=x.createRadialGradient(190,170,24,256,256,230);
  if (moon){ g.addColorStop(0,'#ffffff'); g.addColorStop(.55,'#eaf2ff'); g.addColorStop(1,'#9aa8c0'); }
  else { g.addColorStop(0,'#ffd0a0'); g.addColorStop(.5,'#ff7a45'); g.addColorStop(1,'#762615'); }
  x.fillStyle=g; x.beginPath(); x.arc(256,256,210,0,Math.PI*2); x.fill();
  if (moon){ x.fillStyle='rgba(65,80,105,.24)'; [[185,205,24],[302,154,35],[324,320,24],[145,320,16],[375,250,20]].forEach(([px,py,r])=>{ x.beginPath(); x.arc(px,py,r,0,Math.PI*2); x.fill(); }); }
  else { x.strokeStyle='rgba(70,20,10,.34)'; x.lineWidth=10; for(let i=0;i<7;i++){ x.beginPath(); x.ellipse(255,175+i*38,150-i*9,10+i%2*5,0.15*i,0,Math.PI*2); x.stroke(); } }
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}

function addRangeMoonMarsSky(root){
  const sky = new THREE.Group(); sky.name = 'SVR_RANGE_MOON_MARS_HIGH_SKY_PHASE78'; root.add(sky);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(3.2,96), new THREE.MeshBasicMaterial({ map:makePlanetTexture('moon'), transparent:true, side:THREE.DoubleSide, depthWrite:false, toneMapped:false }));
  moon.position.set(-12,21,-46); sky.add(moon);
  const mars = new THREE.Mesh(new THREE.CircleGeometry(1.65,96), new THREE.MeshBasicMaterial({ map:makePlanetTexture('mars'), transparent:true, side:THREE.DoubleSide, depthWrite:false, toneMapped:false }));
  mars.position.set(10,22.4,-52); sky.add(mars);
  const moonHalo = new THREE.Mesh(new THREE.RingGeometry(3.55,3.72,128), new THREE.MeshBasicMaterial({ color:0xddeaff, transparent:true, opacity:.28, side:THREE.DoubleSide, depthWrite:false })); moonHalo.position.copy(moon.position); sky.add(moonHalo);
  const marsHalo = new THREE.Mesh(new THREE.RingGeometry(1.88,2.02,128), new THREE.MeshBasicMaterial({ color:0xff8b5a, transparent:true, opacity:.24, side:THREE.DoubleSide, depthWrite:false })); marsHalo.position.copy(mars.position); sky.add(marsHalo);
  const moonLight = new THREE.PointLight(0xddeaff,2.4,95,1.7); moonLight.position.copy(moon.position); root.add(moonLight);
  const marsLight = new THREE.PointLight(0xff8b5a,1.1,70,1.9); marsLight.position.copy(mars.position); root.add(marsLight);
  return (t)=>{ moon.rotation.z = Math.sin(t*.05)*.05; mars.rotation.z += .003; moonHalo.material.opacity=.24+Math.sin(t*.18)*.04; marsHalo.material.opacity=.20+Math.sin(t*.22)*.04; };
}

function createTarget(group, z, label, color, points=100){
  const base = new THREE.Group(); base.position.set(0,0,z); group.add(base);
  const green = new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,0.05,96), new THREE.MeshStandardMaterial({ color:0x1d8a36, roughness:0.92, metalness:0.02, emissive:color, emissiveIntensity:0.04 }));
  green.position.y=0.035; base.add(green);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.6,2.22,96), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.78, side:THREE.DoubleSide }));
  ring.rotation.x=-Math.PI/2; ring.position.y=.075; base.add(ring);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.8,12), new THREE.MeshBasicMaterial({ color:0xffffff })); pole.position.set(.2,.92,-.1); base.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(.75,.42), new THREE.MeshBasicMaterial({ color, side:THREE.DoubleSide })); flag.position.set(.58,1.45,-.1); flag.rotation.y=.12; base.add(flag);
  const tex = makeTextTexture(label, 'TARGET GREEN', [`+${points} LOCAL POINTS`, 'hit = purple burst'], '#'+color.toString(16).padStart(6,'0'));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7,.85), new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide, transparent:true })); sign.position.set(-2.9,1.35,0); sign.rotation.y=.28; base.add(sign);
  return { z, radius:2.25, group:base, hit:false, color, points, label };
}

function makeClub(){
  const club = new THREE.Group(); club.name='svr-range-club';
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.05,16), new THREE.MeshStandardMaterial({ color:0xdde7ff, roughness:.38, metalness:.55 })); shaft.rotation.x=Math.PI/2; shaft.position.z=-.45; club.add(shaft);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.28,16), new THREE.MeshStandardMaterial({ color:0x111111, roughness:.72 })); grip.rotation.x=Math.PI/2; grip.position.z=.2; club.add(grip);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.42,.12,.16), new THREE.MeshStandardMaterial({ color:0xbad7ff, roughness:.28, metalness:.75, emissive:0x102040, emissiveIntensity:.25 })); head.position.set(.12,-.02,-1.02); club.add(head);
  const glow = new THREE.PointLight(0x7dff8a,.7,3,2); glow.position.set(.12,.02,-1.02); club.add(glow);
  club.userData.head = head;
  return club;
}

function addFirework(scene, pos, color=0xb48cff){
  const group = new THREE.Group(); group.position.copy(pos); scene.add(group);
  const parts=[];
  for(let i=0;i<54;i++){
    const m = new THREE.Mesh(new THREE.SphereGeometry(.045,8,8), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.95 }));
    m.userData.vel = new THREE.Vector3((Math.random()-.5)*4, Math.random()*3.2+1.2, (Math.random()-.5)*4);
    group.add(m); parts.push(m);
  }
  group.userData.life=1.25; group.userData.tick=(dt)=>{ group.userData.life-=dt; for(const p of parts){ p.position.addScaledVector(p.userData.vel,dt); p.userData.vel.y-=4.0*dt; p.material.opacity=Math.max(0,group.userData.life/1.25); } if(group.userData.life<=0) scene.remove(group); };
  const arr=scene.userData._rangeFx || (scene.userData._rangeFx=[]); arr.push(group);
}

function haptic(source, strength=.55, ms=45){
  const gp = source?.userData?.inputSource?.gamepad || source?.userData?.gamepad || source?.inputSource?.gamepad || null;
  const actuator = gp?.hapticActuators?.[0] || gp?.hapticActuator || null;
  try{ actuator?.pulse?.(strength,ms); }catch{}
}

function getJoint(hand, key){ const j=hand?.joints?.[key]; if(!j) return null; j.updateWorldMatrix?.(true,false); return j; }
function getWorld(obj){ if(!obj) return null; obj.updateWorldMatrix?.(true,false); return obj.getWorldPosition(new THREE.Vector3()); }
function controllerGripActive(controller){ return ((controller?.userData?.squeeze || 0) > .25) || ((controller?.userData?.trigger || 0) > .35); }
function handGripActive(hand){ return !!hand && isPinching(hand); }
function getGripObjectFromHand(hand){ return getJoint(hand,'wrist') || getJoint(hand,'index-finger-metacarpal') || getJoint(hand,'index-finger-tip') || null; }
function gripPose(hand, controller, label='right'){
  if (controllerGripActive(controller)){
    controller.updateWorldMatrix?.(true,false);
    return { label, type:'controller', source:controller, object:controller, pos:controller.getWorldPosition(new THREE.Vector3()), quat:controller.getWorldQuaternion(new THREE.Quaternion()) };
  }
  if (handGripActive(hand)){
    const obj = getGripObjectFromHand(hand);
    if (!obj) return null;
    obj.updateWorldMatrix?.(true,false);
    return { label, type:'hand', source:hand, object:obj, pos:obj.getWorldPosition(new THREE.Vector3()), quat:obj.getWorldQuaternion(new THREE.Quaternion()) };
  }
  return null;
}
function gripActive(rightHand,rightController){
  return !!gripPose(rightHand, rightController, 'right');
}

export function createRangeExperience({ scene, camera, renderer, statusCb=()=>{}, scoreCb=()=>{} }={}){
  scene.background = new THREE.Color(0x020406);
  scene.fog = new THREE.FogExp2(0x03080a,0.014);
  scene.userData.SVR_BUILD = BUILD;
  const root = new THREE.Group(); root.name='SVR_PGA_STANDALONE_RANGE_ROOT_PHASE92_TWO_HAND_GRIP'; scene.add(root);
  scene.userData.SVR_PGA_STANDALONE_SCENE = true;
  scene.userData.SVR_RANGE_STANCE_MAT_LOCK = { playerStart:{x:0,y:0,z:0.42}, ball:{x:0,y:0.19,z:-1.35}, route:'game/range.html' };
  const tickSky = addRangeMoonMarsSky(root);

  const hemi = new THREE.HemisphereLight(0xb2f7ff,0x07120b,1.3); root.add(hemi);
  const moon = new THREE.DirectionalLight(0xd8e9ff,2.0); moon.position.set(-7,14,8); root.add(moon);
  const neon = new THREE.PointLight(0x7dff8a,2.6,28,2); neon.position.set(0,4,4); root.add(neon);

  const turf = new THREE.Mesh(new THREE.PlaneGeometry(28,86,80,180), new THREE.MeshStandardMaterial({ map:makeGrassTexture(), displacementMap:makeDisplacementTexture(), displacementScale:.075, color:0xffffff, roughness:.98, metalness:0 }));
  turf.rotation.x=-Math.PI/2; turf.position.z=-31; root.add(turf);
  const laneMat = new THREE.MeshBasicMaterial({ color:0x7dff8a, transparent:true, opacity:.16, side:THREE.DoubleSide });
  [-3,0,3].forEach(x=>{ const line=new THREE.Mesh(new THREE.PlaneGeometry(.055,70),laneMat); line.rotation.x=-Math.PI/2; line.position.set(x,.035,-31); root.add(line); });

  const teeBay = new THREE.Mesh(new THREE.BoxGeometry(4.6,.09,2.4), new THREE.MeshStandardMaterial({ color:0x121420, roughness:.6, metalness:.18, emissive:0x071824, emissiveIntensity:.35 }));
  teeBay.position.set(0,.045,0.15); root.add(teeBay);
  const teeGlow = new THREE.Mesh(new THREE.RingGeometry(.55,.75,64), new THREE.MeshBasicMaterial({ color:0x7dff8a, transparent:true, opacity:.8, side:THREE.DoubleSide })); teeGlow.rotation.x=-Math.PI/2; teeGlow.position.set(0,.105,-1.35); root.add(teeGlow);

  const stanceMat = new THREE.Mesh(new THREE.PlaneGeometry(2.45,1.35), new THREE.MeshBasicMaterial({ map:makeGroundTextTexture('STAND HERE','AIM AT BALL'), transparent:true, side:THREE.DoubleSide, toneMapped:false }));
  stanceMat.rotation.x=-Math.PI/2; stanceMat.position.set(0,.118,0.42); root.add(stanceMat);
  const leftFoot = new THREE.Mesh(new THREE.PlaneGeometry(.28,.68), new THREE.MeshBasicMaterial({ color:0x111111, transparent:true, opacity:.62, side:THREE.DoubleSide })); leftFoot.rotation.x=-Math.PI/2; leftFoot.rotation.z=.08; leftFoot.position.set(-.42,.125,.35); root.add(leftFoot);
  const rightFoot = leftFoot.clone(); rightFoot.rotation.z=-.08; rightFoot.position.set(.42,.125,.35); root.add(rightFoot);
  const aimLine = new THREE.Mesh(new THREE.PlaneGeometry(.055,4.15), new THREE.MeshBasicMaterial({ color:0xf2c14e, transparent:true, opacity:.72, side:THREE.DoubleSide, toneMapped:false }));
  aimLine.rotation.x=-Math.PI/2; aimLine.position.set(0,.132,-1.25); root.add(aimLine);
  const ballArrow = new THREE.Mesh(new THREE.ConeGeometry(.13,.42,24), new THREE.MeshBasicMaterial({ color:0xf2c14e, transparent:true, opacity:.9, toneMapped:false }));
  ballArrow.rotation.x=-Math.PI/2; ballArrow.position.set(0,.18,-1.62); root.add(ballArrow);

  const targets=[createTarget(root,-18,'100 YD',0x7dff8a,100), createTarget(root,-36,'200 YD',0xffdd55,200), createTarget(root,-56,'300 YD',0xb48cff,300)];
  const boardTex = makeTextTexture('SVR PGA RANGE','PHASE 92 TWO-HAND GRIP',['two hands = shaft vector','lead wrist roll opens/closes face','ball tracer + auto-tee','Lobby button returns to index.html'],'#7dff8a');
  const board = new THREE.Mesh(new THREE.PlaneGeometry(7.8,3.9),new THREE.MeshBasicMaterial({ map:boardTex, side:THREE.DoubleSide })); board.position.set(-7,3,-5.2); board.rotation.y=.45; root.add(board);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(32,12), new THREE.MeshBasicMaterial({ color:0x050812, transparent:true, opacity:.82, side:THREE.DoubleSide })); backWall.position.set(0,5,-66); root.add(backWall);
  for(let i=0;i<140;i++){ const star=new THREE.Mesh(new THREE.SphereGeometry(.022+Math.random()*.035,6,6), new THREE.MeshBasicMaterial({ color: Math.random()<.75?0xb48cff:0x7dff8a, transparent:true, opacity:.55+Math.random()*.4 })); star.position.set((Math.random()-.5)*42,2+Math.random()*10,-18-Math.random()*50); root.add(star); }

  const ballMat = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:.38, metalness:.04, emissive:0x091a12, emissiveIntensity:.08 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.135,32,16), ballMat); ball.name = 'svr-pga-ball'; root.add(ball);
  const club = makeClub(); root.add(club);
  scene.userData.SVR_PGA_RANGE_REFS = { ball, club, root, targets };
  const clubRest = new THREE.Vector3(1.05,.92,-0.45);
  const ballStart = new THREE.Vector3(0,.19,-1.35);
  const ballVel = new THREE.Vector3();
  const lastHead = new THREE.Vector3(); const headVel = new THREE.Vector3();
  let tracerOn = true, hitLock=.0, autoTeeTimer=0, shots=0, best=0;
  let dualGripWasActive = false;
  const trailPts = Array.from({length:80},()=>ballStart.clone());
  const trailGeom = new THREE.BufferGeometry().setFromPoints(trailPts);
  const trail = new THREE.Line(trailGeom, new THREE.LineBasicMaterial({ color:0xb48cff, transparent:true, opacity:.85 })); root.add(trail);

  function readScore(){
    try { return Math.max(0, parseInt(localStorage.getItem(SCORE_KEY) || '0', 10) || 0); }
    catch { return 0; }
  }
  function writeScore(value){
    try { localStorage.setItem(SCORE_KEY, String(Math.max(0, Math.floor(value || 0)))); }
    catch {}
  }
  function emitScore(){ scoreCb({ points: readScore(), bestTarget: best, shots, build: BUILD }); }
  function awardLocalPoints(target){
    const next = readScore() + target.points;
    writeScore(next);
    best = Math.max(best, target.points);
    emitScore();
  }

  function resetBall(){ ball.position.copy(ballStart); ballVel.set(0,0,0); autoTeeTimer=0; targets.forEach(t=>t.hit=false); trailPts.forEach(p=>p.copy(ballStart)); trailGeom.setFromPoints(trailPts); statusCb('Auto-tee: ball ready'); emitScore(); }
  resetBall();

  function toggleTracer(){ tracerOn=!tracerOn; trail.visible=tracerOn; return tracerOn; }

  function applyDualHandGrip(dt, lead, trail){
    const shaft = TMP.subVectors(trail.pos, lead.pos);
    const gripDistance = shaft.length();
    if (gripDistance < .075) return false;
    const dir = shaft.normalize();
    const targetPos = TMP2.copy(lead.pos).addScaledVector(dir, -.045);

    const leadUp = TMP3.set(0,1,0).applyQuaternion(lead.quat).normalize();
    const trailUp = TMP4.set(0,1,0).applyQuaternion(trail.quat).normalize();
    CLUB_TARGET.up.copy(leadUp.multiplyScalar(.72).add(trailUp.multiplyScalar(.28)).normalize());
    CLUB_TARGET.position.copy(targetPos);
    CLUB_TARGET.lookAt(trail.pos);
    E.setFromQuaternion(lead.quat, 'XYZ');
    const wristRoll = THREE.MathUtils.clamp(E.z, -.85, .85);
    CLUB_TARGET.rotateZ(wristRoll * .55);

    const a = 1 - Math.pow(.0008, Math.max(dt, .001));
    club.position.lerp(targetPos, a);
    club.quaternion.slerp(CLUB_TARGET.quaternion, a);
    club.userData.SVR_PHASE92_DUAL_HAND_GRIP = true;
    club.userData.SVR_PHASE92_GRIP_DISTANCE = gripDistance;
    club.userData.SVR_PHASE92_WRIST_ROLL = wristRoll;
    return true;
  }

  function updateClub(dt,leftHand,rightHand,leftController,rightController){
    const rightPose = gripPose(rightHand, rightController, 'right');
    const leftPose = gripPose(leftHand, leftController, 'left');
    const dual = !!(leftPose && rightPose);
    let active = dual || !!rightPose || !!leftPose;
    let anchor = null;

    if (dual){
      // Right-handed golf default: left hand is the top/lead anchor, right hand trails and controls the shaft line.
      const ok = applyDualHandGrip(dt, leftPose, rightPose);
      anchor = rightPose.source || leftPose.source;
      if (ok && !dualGripWasActive){
        dualGripWasActive = true;
        haptic(leftPose.source,.20,32);
        haptic(rightPose.source,.22,36);
        statusCb('Two-hand grip locked: clubface follows wrist roll');
      }
      leftPose.source.userData.isSqueezing = true;
      rightPose.source.userData.isSqueezing = true;
    } else {
      dualGripWasActive = false;
      const pose = rightPose || leftPose;
      if (pose){
        anchor = pose.source;
        club.position.copy(pose.pos);
        club.quaternion.copy(pose.quat);
        club.rotateX(-0.92);
        club.translateZ(-.12);
        club.userData.SVR_PHASE92_DUAL_HAND_GRIP = false;
        pose.source.userData.isSqueezing = true;
      } else {
        club.position.lerp(clubRest,.12);
        club.rotation.set(-.55,.18,-.18);
        club.userData.SVR_PHASE92_DUAL_HAND_GRIP = false;
      }
    }

    const headWorld = getWorld(club.userData.head) || club.position.clone();
    headVel.copy(headWorld).sub(lastHead).multiplyScalar(1/Math.max(dt,.001));
    lastHead.copy(headWorld);
    return { active, anchor, headWorld, speed:headVel.length(), dualGrip: dual };
  }

  function desktopSwing(dt){
    const t = performance.now()*.001;
    if (!renderer.xr.isPresenting){
      const p = new THREE.Vector3(.72 + Math.sin(t*1.8)*.18, .82 + Math.abs(Math.sin(t*1.8))*.32, -1.36 + Math.cos(t*1.8)*.28);
      club.position.lerp(p,.06); club.rotation.set(-1.0+Math.sin(t*1.8)*.35,0.06,0.18);
    }
  }

  function applyHit(info){
    if (hitLock>0 || ballVel.length()>0.4) return;
    const dist = info.headWorld.distanceTo(ball.position);
    if (dist > .55 || info.speed < 1.7) return;
    const sweet = THREE.MathUtils.clamp(1 - dist/.55, .15, 1.0);
    const forward = new THREE.Vector3(0,0,-1).applyQuaternion(club.quaternion).normalize();
    if (forward.z > -.1) forward.set(0,0,-1);
    const faceRoll = THREE.MathUtils.clamp(club.userData.SVR_PHASE92_WRIST_ROLL || 0, -.85, .85);
    const sideShape = info.dualGrip ? faceRoll * 1.15 : 0;
    forward.x += sideShape;
    forward.normalize();
    const power = THREE.MathUtils.clamp(info.speed * 0.78 * sweet, 3.5, 17.5);
    ballVel.copy(forward).multiplyScalar(power);
    ballVel.y = THREE.MathUtils.clamp(power*.32 + sweet*1.4, 1.4, 7.2);
    hitLock=.28; autoTeeTimer=0; shots++;
    scene.userData.SVR_PGA_LAST_IMPACT = { t: performance.now(), speed: info.speed, ball: ball.position.clone(), head: info.headWorld.clone(), dualGrip: !!info.dualGrip, faceRoll, build: BUILD };
    haptic(info.anchor,.7,55);
    statusCb(`Shot ${shots}: ${Math.round(power*12)} yd impulse - sweet ${Math.round(sweet*100)}% - ${info.dualGrip ? 'two-hand face control' : 'single-hand swing'}`);
  }

  function updateBall(dt){
    if (hitLock>0) hitLock-=dt;
    const moving = ballVel.lengthSq()>.0001;
    if (moving){
      ballVel.y -= 9.81*dt;
      ballVel.multiplyScalar(1 - Math.min(dt*.055,.018));
      ball.position.addScaledVector(ballVel,dt);
      if (ball.position.y < .14){
        ball.position.y=.14;
        if (Math.abs(ballVel.y)>1.0) ballVel.y *= -.33; else ballVel.y=0;
        ballVel.x*=.72; ballVel.z*=.72;
      }
      if (ball.position.z < -76 || ball.position.y < -2 || ball.position.length()>110){ autoTeeTimer = Math.max(autoTeeTimer,1.1); }
      for(const target of targets){
        if (!target.hit && Math.abs(ball.position.z-target.z)<2.2 && Math.hypot(ball.position.x, ball.position.z-target.z)<target.radius && ball.position.y<1.1){
          target.hit=true; addFirework(scene,new THREE.Vector3(target.group.position.x,1.05,target.z),target.color); awardLocalPoints(target); statusCb(`Target hit: ${target.label} - +${target.points} local training points - no wallet connection`); haptic({userData:{}},.3,30);
        }
      }
      if (tracerOn){ trailPts.shift(); trailPts.push(ball.position.clone()); trailGeom.setFromPoints(trailPts); }
      if (ballVel.length()<.08 && ball.position.distanceTo(ballStart)>1.2) autoTeeTimer += dt;
    }
    if (autoTeeTimer>2.0) resetBall();
  }

  function updateFx(dt){
    const fx = scene.userData._rangeFx || [];
    for(let i=fx.length-1;i>=0;i--){ const g=fx[i]; if(!g.parent){ fx.splice(i,1); continue; } g.userData.tick?.(dt); if(!g.parent) fx.splice(i,1); }
  }

  return {
    resetBall,
    toggleTracer,
    refreshScore: emitScore,
    clearLocalScore(){ writeScore(0); best=0; shots=0; emitScore(); statusCb('Local training score cleared'); },
    update(dt,{ leftHand=null,rightHand=null,leftController=null,rightController=null }={}){
      desktopSwing(dt);
      const info = updateClub(dt,leftHand,rightHand,leftController,rightController);
      applyHit(info);
      updateBall(dt);
      updateFx(dt);
      tickSky?.(performance.now()*0.001);
      const cameraTarget = renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera;
      scene.userData._camera = cameraTarget;
    }
  };
}

export { BUILD as PHASE77_RANGE_BUILD };
