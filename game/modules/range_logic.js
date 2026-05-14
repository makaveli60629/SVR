import * as THREE from "three";
import { isPinching } from "./gestures.js";

const BUILD = "PHASE-77-PGA-STANDALONE-RANGE-TRACER-LOCK";
const UP = new THREE.Vector3(0,1,0);
const TMP = new THREE.Vector3();
const TMP2 = new THREE.Vector3();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();

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

function createTarget(group, z, label, color){
  const base = new THREE.Group(); base.position.set(0,0,z); group.add(base);
  const green = new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,0.05,96), new THREE.MeshStandardMaterial({ color:0x1d8a36, roughness:0.92, metalness:0.02, emissive:color, emissiveIntensity:0.04 }));
  green.position.y=0.035; base.add(green);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.6,2.22,96), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.78, side:THREE.DoubleSide }));
  ring.rotation.x=-Math.PI/2; ring.position.y=.075; base.add(ring);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.8,12), new THREE.MeshBasicMaterial({ color:0xffffff })); pole.position.set(.2,.92,-.1); base.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(.75,.42), new THREE.MeshBasicMaterial({ color, side:THREE.DoubleSide })); flag.position.set(.58,1.45,-.1); flag.rotation.y=.12; base.add(flag);
  const tex = makeTextTexture(label, 'TARGET GREEN', ['hit = purple burst'], '#'+color.toString(16).padStart(6,'0'));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7,.85), new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide, transparent:true })); sign.position.set(-2.9,1.35,0); sign.rotation.y=.28; base.add(sign);
  return { z, radius:2.25, group:base, hit:false, color };
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
function gripActive(rightHand,rightController){
  const handGrip = rightHand && (isPinching(rightHand) || getJoint(rightHand,'middle-finger-tip'));
  const controllerGrip = (rightController?.userData?.squeeze || 0) > .25 || (rightController?.userData?.trigger || 0) > .35;
  return !!controllerGrip || (!!rightHand && isPinching(rightHand));
}

export function createRangeExperience({ scene, camera, renderer, statusCb=()=>{} }={}){
  scene.background = new THREE.Color(0x020406);
  scene.fog = new THREE.FogExp2(0x03080a,0.014);
  scene.userData.SVR_BUILD = BUILD;
  const root = new THREE.Group(); root.name='SVR_PGA_STANDALONE_RANGE_ROOT'; scene.add(root);

  const hemi = new THREE.HemisphereLight(0xb2f7ff,0x07120b,1.3); root.add(hemi);
  const moon = new THREE.DirectionalLight(0xd8e9ff,2.0); moon.position.set(-7,14,8); root.add(moon);
  const neon = new THREE.PointLight(0x7dff8a,2.6,28,2); neon.position.set(0,4,4); root.add(neon);

  const turf = new THREE.Mesh(new THREE.PlaneGeometry(28,86,80,180), new THREE.MeshStandardMaterial({ map:makeGrassTexture(), displacementMap:makeDisplacementTexture(), displacementScale:.075, color:0xffffff, roughness:.98, metalness:0 }));
  turf.rotation.x=-Math.PI/2; turf.position.z=-31; root.add(turf);
  const laneMat = new THREE.MeshBasicMaterial({ color:0x7dff8a, transparent:true, opacity:.16, side:THREE.DoubleSide });
  [-3,0,3].forEach(x=>{ const line=new THREE.Mesh(new THREE.PlaneGeometry(.055,70),laneMat); line.rotation.x=-Math.PI/2; line.position.set(x,.035,-31); root.add(line); });

  const teeBay = new THREE.Mesh(new THREE.BoxGeometry(4.6,.09,2.4), new THREE.MeshStandardMaterial({ color:0x121420, roughness:.6, metalness:.18, emissive:0x071824, emissiveIntensity:.35 }));
  teeBay.position.set(0,.045,4.5); root.add(teeBay);
  const teeGlow = new THREE.Mesh(new THREE.RingGeometry(.55,.75,64), new THREE.MeshBasicMaterial({ color:0x7dff8a, transparent:true, opacity:.8, side:THREE.DoubleSide })); teeGlow.rotation.x=-Math.PI/2; teeGlow.position.set(0,.105,3.55); root.add(teeGlow);

  const targets=[createTarget(root,-12,'50 YD',0x7dff8a), createTarget(root,-26,'100 YD',0xffdd55), createTarget(root,-42,'150 YD',0xb48cff)];
  const boardTex = makeTextTexture('SVR PGA RANGE','STANDALONE PRIVATE SCENE',['dynamic turf • target greens','ball tracer • auto-tee','right-hand club grip','Lobby button returns to index.html'],'#7dff8a');
  const board = new THREE.Mesh(new THREE.PlaneGeometry(7.8,3.9),new THREE.MeshBasicMaterial({ map:boardTex, side:THREE.DoubleSide })); board.position.set(-7,3,-1); board.rotation.y=.45; root.add(board);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(32,12), new THREE.MeshBasicMaterial({ color:0x050812, transparent:true, opacity:.82, side:THREE.DoubleSide })); backWall.position.set(0,5,-48); root.add(backWall);
  for(let i=0;i<140;i++){ const star=new THREE.Mesh(new THREE.SphereGeometry(.022+Math.random()*.035,6,6), new THREE.MeshBasicMaterial({ color: Math.random()<.75?0xb48cff:0x7dff8a, transparent:true, opacity:.55+Math.random()*.4 })); star.position.set((Math.random()-.5)*42,2+Math.random()*10,-18-Math.random()*50); root.add(star); }

  const ballMat = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:.38, metalness:.04, emissive:0x091a12, emissiveIntensity:.08 });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.135,32,16), ballMat); root.add(ball);
  const club = makeClub(); root.add(club);
  const clubRest = new THREE.Vector3(1.35,.92,4.25);
  const ballStart = new THREE.Vector3(0,.19,3.55);
  const ballVel = new THREE.Vector3();
  const lastHead = new THREE.Vector3(); const headVel = new THREE.Vector3();
  let tracerOn = true, hitLock=.0, autoTeeTimer=0, shots=0, best=0;
  const trailPts = Array.from({length:80},()=>ballStart.clone());
  const trailGeom = new THREE.BufferGeometry().setFromPoints(trailPts);
  const trail = new THREE.Line(trailGeom, new THREE.LineBasicMaterial({ color:0xb48cff, transparent:true, opacity:.85 })); root.add(trail);

  function resetBall(){ ball.position.copy(ballStart); ballVel.set(0,0,0); autoTeeTimer=0; targets.forEach(t=>t.hit=false); trailPts.forEach(p=>p.copy(ballStart)); trailGeom.setFromPoints(trailPts); statusCb('Auto-tee: ball ready'); }
  resetBall();

  function toggleTracer(){ tracerOn=!tracerOn; trail.visible=tracerOn; return tracerOn; }

  function updateClub(dt,rightHand,rightController){
    let active = gripActive(rightHand,rightController);
    let anchor = null;
    if (rightController && ((rightController.userData.squeeze||0)>.25 || (rightController.userData.trigger||0)>.35)) anchor=rightController;
    else if (rightHand && isPinching(rightHand)) anchor=getJoint(rightHand,'wrist') || getJoint(rightHand,'index-finger-tip');
    if (anchor){
      anchor.updateWorldMatrix?.(true,false);
      anchor.getWorldPosition(club.position);
      anchor.getWorldQuaternion(club.quaternion);
      club.rotateX(-0.92);
      club.translateZ(-.12);
    } else {
      club.position.lerp(clubRest,.12);
      club.rotation.set(-.55,.18,-.18);
    }
    const headWorld = getWorld(club.userData.head) || club.position.clone();
    headVel.copy(headWorld).sub(lastHead).multiplyScalar(1/Math.max(dt,.001));
    lastHead.copy(headWorld);
    return { active, anchor, headWorld, speed:headVel.length() };
  }

  function desktopSwing(dt){
    // A simple visible desktop club arc. Mouse button controls backswing; fast movement can still hit.
    const t = performance.now()*.001;
    if (!renderer.xr.isPresenting){
      const p = new THREE.Vector3(.72 + Math.sin(t*1.8)*.18, .75 + Math.abs(Math.sin(t*1.8))*.32, 3.1 + Math.cos(t*1.8)*.28);
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
    const power = THREE.MathUtils.clamp(info.speed * 0.78 * sweet, 3.5, 17.5);
    ballVel.copy(forward).multiplyScalar(power);
    ballVel.y = THREE.MathUtils.clamp(power*.32 + sweet*1.4, 1.4, 7.2);
    hitLock=.28; autoTeeTimer=0; shots++;
    haptic(info.anchor,.7,55);
    statusCb(`Shot ${shots}: ${Math.round(power*12)} yd impulse • sweet ${Math.round(sweet*100)}%`);
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
      if (ball.position.z < -51 || ball.position.y < -2 || ball.position.length()>92){ autoTeeTimer = Math.max(autoTeeTimer,1.1); }
      for(const target of targets){
        if (!target.hit && Math.abs(ball.position.z-target.z)<2.2 && Math.hypot(ball.position.x, ball.position.z-target.z)<target.radius && ball.position.y<1.1){
          target.hit=true; addFirework(scene,new THREE.Vector3(target.group.position.x,1.05,target.z),target.color); best=Math.max(best, Math.round(Math.abs(target.z)*3.3)); statusCb(`Target hit: ${Math.round(Math.abs(target.z)*3.3)} yards • purple burst`); haptic({userData:{}},.3,30);
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
    update(dt,{ rightHand=null,rightController=null }={}){
      desktopSwing(dt);
      const info = updateClub(dt,rightHand,rightController);
      applyHit(info);
      updateBall(dt);
      updateFx(dt);
      const cameraTarget = renderer.xr.isPresenting ? renderer.xr.getCamera(camera) : camera;
      scene.userData._camera = cameraTarget;
    }
  };
}

export { BUILD as PHASE77_RANGE_BUILD };
