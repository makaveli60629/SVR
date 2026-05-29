import * as THREE from "three";
import { isPinching, isFist } from "./gestures.js";

const PHASE147 = "PHASE-147-HAND-SEAT-INTERACTION";
let installed = false;
let lastScene = null;
let seatLayer = null;
let seatPads = [];
let activeSeat = -1;
let seated = false;
let holdStart = 0;
let lastActionAt = 0;

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();

function makeTextTexture(title, sub){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 420;
  const x = c.getContext("2d");
  x.fillStyle = "rgba(3,4,8,.94)";
  x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "#71f7ff";
  x.lineWidth = 12;
  x.strokeRect(24,24,c.width-48,c.height-48);
  x.strokeStyle = "#b48cff";
  x.lineWidth = 6;
  x.strokeRect(62,62,c.width-124,c.height-124);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#fff7e3";
  x.font = "900 68px Arial";
  x.fillText(title,c.width/2,170);
  x.fillStyle = "#71f7ff";
  x.font = "800 32px Arial";
  x.fillText(sub,c.width/2,260);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function seatPositionFromRecord(seat, i){
  if (seat && Number.isFinite(seat.x) && Number.isFinite(seat.z)) return new THREE.Vector3(seat.x,0,seat.z);
  const angle = (i / 6) * Math.PI * 2 + Math.PI / 2;
  return new THREE.Vector3(Math.cos(angle)*3.1,0,Math.sin(angle)*3.1);
}

function makeSeatPad(pos, label, index){
  const root = new THREE.Group();
  root.name = `PHASE147_HAND_SEAT_PAD_${index}`;
  root.position.copy(pos);
  root.userData.seatIndex = index;
  root.frustumCulled = false;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(.42,.64,64),
    new THREE.MeshBasicMaterial({ color: 0x71f7ff, transparent:true, opacity:.72, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending })
  );
  ring.name = `PHASE147_SEAT_RING_${index}`;
  ring.rotation.x = -Math.PI/2;
  ring.position.y = .035;
  ring.renderOrder = 235000;
  root.add(ring);

  const disk = new THREE.Mesh(
    new THREE.CircleGeometry(.42,48),
    new THREE.MeshBasicMaterial({ color: 0x12081d, transparent:true, opacity:.55, side:THREE.DoubleSide, depthWrite:false })
  );
  disk.rotation.x = -Math.PI/2;
  disk.position.y = .025;
  disk.renderOrder = 234999;
  root.add(disk);

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85,.78),
    new THREE.MeshBasicMaterial({ map: makeTextTexture(label || `SEAT ${index+1}`, "PINCH/FIST TO SIT"), transparent:true, side:THREE.DoubleSide, depthTest:false, depthWrite:false, toneMapped:false })
  );
  sign.name = `PHASE147_SEAT_SIGN_${index}`;
  sign.position.set(0,1.15,0);
  sign.renderOrder = 235001;
  root.add(sign);

  const glow = new THREE.PointLight(0x71f7ff, 1.25, 3.1, 2);
  glow.position.set(0,.45,0);
  root.add(glow);

  root.userData.ring = ring;
  root.userData.sign = sign;
  root.userData.glow = glow;
  return root;
}

function getTip(hand){
  const j = hand?.joints?.["index-finger-tip"] || hand?.joints?.["wrist"];
  if (!j) return null;
  j.getWorldPosition(tmp);
  return tmp;
}

function controllerTrigger(proxy){
  const gp = proxy?.userData?.gamepad || proxy?.userData?.inputSource?.gamepad || proxy?.userData?.controller?.inputSource?.gamepad;
  if (!gp) return 0;
  return Math.max(gp.buttons?.[0]?.value || 0, gp.buttons?.[1]?.value || 0);
}

function handActive(hand){
  return !!hand?.joints && (isPinching(hand) || isFist(hand));
}

function interactActive(hand, controller){
  if (handActive(hand)) return true;
  return controllerTrigger(controller) > .35;
}

function sourcePosition(hand, controller){
  const tip = getTip(hand);
  if (tip) return tip;
  const c = controller?.userData?.controller;
  if (c){ c.getWorldPosition(tmp); return tmp; }
  return null;
}

function nearestSeatFromPoint(p){
  let best = null;
  for (const pad of seatPads){
    const dx = p.x - pad.position.x;
    const dz = p.z - pad.position.z;
    const d = Math.hypot(dx,dz);
    if (!best || d < best.dist) best = { pad, dist:d, index:pad.userData.seatIndex };
  }
  return best;
}

function faceTableYawFromSeat(pos, center){
  const dx = center.x - pos.x;
  const dz = center.z - pos.z;
  return Math.atan2(dx, dz);
}

function sitAt(index){
  const game = window.SVR_GAME;
  const tp = game?.tp;
  const world = game?.world || {};
  const seats = world.seats || [];
  const center = world.tableCenter || new THREE.Vector3(0,0,0);
  const seat = seats[index] || {};
  const pos = seatPositionFromRecord(seat, index);
  const yaw = faceTableYawFromSeat(pos, center);

  if (tp?.setPlayerPose) tp.setPlayerPose(pos.x, -0.42, pos.z);
  if (tp?.setPlayerYaw) tp.setPlayerYaw(yaw);
  else if (game?.camera) game.camera.lookAt(center.x, 1.15, center.z);

  activeSeat = index;
  seated = true;
  window.SVR_SEAT_STATE = { seated:true, seatIndex:index, label: seat.label || `Seat ${index+1}`, phase:PHASE147 };
  window.dispatchEvent(new CustomEvent("svr-seat-change", { detail: window.SVR_SEAT_STATE }));
}

function leaveSeat(){
  const game = window.SVR_GAME;
  const tp = game?.tp;
  if (tp?.setPlayerPose) tp.setPlayerPose(0,0,4.8);
  activeSeat = -1;
  seated = false;
  window.SVR_SEAT_STATE = { seated:false, seatIndex:-1, label:"Standing", phase:PHASE147 };
  window.dispatchEvent(new CustomEvent("svr-seat-change", { detail: window.SVR_SEAT_STATE }));
}

function install(scene){
  if (!scene || installed || !window.SVR_GAME?.world) return;
  installed = true;
  const game = window.SVR_GAME;
  const seats = game.world?.seats || [];
  seatLayer = new THREE.Group();
  seatLayer.name = "PHASE147_HAND_SEAT_INTERACTION_LAYER";
  seatLayer.frustumCulled = false;
  seatPads = seats.map((seat,i)=>{
    const pos = seatPositionFromRecord(seat,i);
    const pad = makeSeatPad(pos, seat.label || `SEAT ${i+1}`, i);
    seatLayer.add(pad);
    return pad;
  });
  scene.add(seatLayer);
  window.SVR_SEAT_STATE = { seated:false, seatIndex:-1, label:"Standing", phase:PHASE147 };
  console.log(`[${PHASE147}] installed`, seatPads.length, "interactive seat pads");
}

function updatePads(now){
  const center = window.SVR_GAME?.world?.tableCenter || new THREE.Vector3(0,0,0);
  for (const pad of seatPads){
    const i = pad.userData.seatIndex;
    const active = i === activeSeat;
    const hot = pad.userData.hot || false;
    const ring = pad.userData.ring;
    const sign = pad.userData.sign;
    const glow = pad.userData.glow;
    pad.lookAt(center.x, pad.position.y, center.z);
    if (sign) sign.lookAt(window.SVR_GAME?.camera?.position || center);
    const pulse = .58 + Math.sin(now*.006 + i)*.18;
    if (ring){
      ring.material.color.setHex(active ? 0xffd77b : hot ? 0x78ff9f : 0x71f7ff);
      ring.material.opacity = active ? .96 : hot ? .9 : .55 + pulse*.25;
      ring.scale.setScalar(active ? 1.18 : hot ? 1.10 : 1.0);
    }
    if (glow){
      glow.color.setHex(active ? 0xffd77b : hot ? 0x78ff9f : 0x71f7ff);
      glow.intensity = active ? 2.2 : hot ? 2.8 : 1.1;
    }
  }
}

function update(){
  const game = window.SVR_GAME;
  const scene = game?.scene || lastScene;
  install(scene);
  if (!installed) return;

  const hands = game?.hands;
  const lh = hands?.getLeftHand?.();
  const rh = hands?.getRightHand?.();
  const lc = hands?.getLeftController?.();
  const rc = hands?.getRightController?.();
  const sources = [
    { hand: rh, controller: rc },
    { hand: lh, controller: lc }
  ];

  const now = performance.now();
  let hot = null;
  let isActive = false;
  for (const s of sources){
    const p = sourcePosition(s.hand, s.controller);
    if (!p) continue;
    const n = nearestSeatFromPoint(p);
    if (n && n.dist < .78){ hot = n; isActive = interactActive(s.hand, s.controller); break; }
  }

  seatPads.forEach(p=>p.userData.hot = hot?.pad === p);
  if (hot && isActive){
    if (!holdStart) holdStart = now;
    if (now - holdStart > 260 && now - lastActionAt > 900){
      if (seated && activeSeat === hot.index) leaveSeat();
      else sitAt(hot.index);
      lastActionAt = now;
      holdStart = 0;
    }
  } else {
    holdStart = 0;
  }
  updatePads(now);
}

const oldRender = THREE.WebGLRenderer.prototype.render;
if (!THREE.WebGLRenderer.prototype.__svrPhase147SeatInteraction){
  THREE.WebGLRenderer.prototype.__svrPhase147SeatInteraction = true;
  THREE.WebGLRenderer.prototype.render = function(scene,camera){
    lastScene = scene || lastScene;
    update();
    return oldRender.call(this,scene,camera);
  };
}
setInterval(update,500);
console.log(`[${PHASE147}] loaded`);
