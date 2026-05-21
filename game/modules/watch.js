import * as THREE from "three";
import { isPinching } from "./gestures.js";

const PHASE = "PHASE-177-WATCH-HOLOGRAM-LAUNCHER";
const V0 = new THREE.Vector3();
const V1 = new THREE.Vector3();
const V2 = new THREE.Vector3();
const V3 = new THREE.Vector3();
const M0 = new THREE.Matrix4();
const SCREEN_TILT_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.34);

function rr(c, x, y, w, h, r){
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function getJointWorld(hand, names){
  if (!hand?.joints) return null;
  for (const name of names){
    const joint = hand.joints[name];
    if (!joint) continue;
    joint.updateWorldMatrix?.(true, false);
    return joint.getWorldPosition(new THREE.Vector3());
  }
  return null;
}

function getActiveCamera(camera, renderer){
  if (renderer?.xr?.isPresenting) return renderer.xr.getCamera(camera);
  return camera || null;
}

function computeForearmPose(hand, camera, renderer, side = "left"){
  const wrist = getJointWorld(hand, ["wrist"]);
  const index = getJointWorld(hand, ["index-finger-metacarpal", "index-finger-phalanx-proximal", "index-finger-tip"]);
  const pinky = getJointWorld(hand, ["pinky-finger-metacarpal", "pinky-finger-phalanx-proximal", "pinky-finger-tip"]);
  if (!wrist || !index || !pinky) return null;

  const midpoint = V3.copy(index).add(pinky).multiplyScalar(0.5);
  const forearmDir = V0.copy(wrist).sub(midpoint).normalize();
  let acrossPalm = V1.copy(index).sub(pinky).normalize();
  let faceNormal = V2.crossVectors(acrossPalm, forearmDir).normalize();

  const activeCamera = getActiveCamera(camera, renderer);
  if (activeCamera){
    const camPos = new THREE.Vector3();
    activeCamera.getWorldPosition(camPos);
    if (faceNormal.dot(camPos.sub(wrist)) < 0) faceNormal.multiplyScalar(-1);
  }

  acrossPalm = new THREE.Vector3().crossVectors(faceNormal, forearmDir).normalize();
  if (side === "right") acrossPalm.multiplyScalar(-1);

  M0.makeBasis(forearmDir, acrossPalm, faceNormal);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(M0);
  quaternion.multiply(SCREEN_TILT_Q);

  const position = wrist.clone()
    .add(forearmDir.clone().multiplyScalar(0.092))
    .add(faceNormal.clone().multiplyScalar(0.020))
    .add(acrossPalm.clone().multiplyScalar(side === "left" ? -0.004 : 0.004));

  return { position, quaternion };
}

function holoButton(){
  return { id: "holo", label: "OPEN HOLOGRAM", x: 72, y: 156, w: 880, h: 208, font: 64, hold: 0.075, margin: 34 };
}

export function createWristWatch({ scene, camera = null, renderer = null, getState = ()=>({}), actions = {} }){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  const plateW = 0.232;
  const plateH = 0.124;

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(plateW, plateH, 0.004),
    new THREE.MeshStandardMaterial({ color: 0x0c1020, roughness: 0.28, metalness: 0.36, emissive: 0x18002a, emissiveIntensity: 0.14, transparent: true, opacity: 0.95 })
  );
  frame.position.z = -0.014;
  group.add(frame);

  const strapMat = new THREE.MeshStandardMaterial({ color: 0x151827, roughness: 0.58, metalness: 0.10, emissive: 0x05060a, emissiveIntensity: 0.03 });
  const strapL = new THREE.Mesh(new THREE.BoxGeometry(plateW * 0.16, plateH * 0.34, 0.002), strapMat);
  strapL.position.set(-plateW * 0.43, 0, -0.018);
  group.add(strapL);
  const strapR = strapL.clone();
  strapR.position.x = plateW * 0.43;
  group.add(strapR);

  const screenFront = new THREE.Mesh(
    new THREE.PlaneGeometry(plateW * 0.965, plateH * 0.965),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false, depthTest: false, toneMapped: false })
  );
  screenFront.renderOrder = 44;
  screenFront.position.z = 0.012;
  group.add(screenFront);

  let hoveredId = null;
  let pressed = false;
  let pinchTime = 0;
  let lastSig = "";
  let notice = "";
  let noticeUntil = 0;

  function drawButton(btn, hovered){
    ctx.save();
    const grd = ctx.createLinearGradient(btn.x, btn.y, btn.x + btn.w, btn.y + btn.h);
    grd.addColorStop(0, hovered ? "rgba(208,92,255,0.95)" : "rgba(122,34,255,0.70)");
    grd.addColorStop(1, hovered ? "rgba(246,226,127,0.80)" : "rgba(180,72,255,0.70)");
    ctx.fillStyle = grd;
    ctx.strokeStyle = hovered ? "#ffffff" : "rgba(246,226,127,0.86)";
    ctx.lineWidth = hovered ? 10 : 6;
    ctx.shadowColor = hovered ? "rgba(208,92,255,0.95)" : "rgba(180,72,255,0.55)";
    ctx.shadowBlur = hovered ? 28 : 16;
    rr(ctx, btn.x, btn.y, btn.w, btn.h, 34);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${btn.font}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 - 18);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.font = "bold 30px system-ui, Arial";
    ctx.fillText("BIG 3D MENU", btn.x + btn.w / 2, btn.y + btn.h / 2 + 52);
    ctx.restore();
  }

  function draw(force = false){
    const state = getState() || {};
    const poker = state.poker || {};
    const tp = window.SVR_ACTIVE_TELEPORT_HAND || {};
    const liveNotice = performance.now() < noticeUntil;
    const sig = JSON.stringify({ h: hoveredId, cash: state.cash, seat: state.seatLabel, seated: state.seated, holo: state.hologramVisible, tp: tp.state, tpHand: tp.active, pot: poker.pot, turn: poker.awaitingPlayer, liveNotice, sec: Math.floor(performance.now() / 500) });
    if (!force && sig === lastSig) return;
    lastSig = sig;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bg.addColorStop(0, "rgba(5,8,16,0.98)");
    bg.addColorStop(0.52, "rgba(34,10,60,0.98)");
    bg.addColorStop(1, "rgba(5,8,16,0.98)");
    ctx.fillStyle = bg;
    rr(ctx, 12, 12, 1000, 488, 36);
    ctx.fill();

    ctx.strokeStyle = tp.glow === "purple" ? "rgba(208,92,255,0.98)" : "rgba(180,140,255,0.72)";
    ctx.lineWidth = 7;
    rr(ctx, 12, 12, 1000, 488, 36);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px system-ui, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("SVR WATCH", 44, 58);

    ctx.fillStyle = "rgba(233,233,255,0.84)";
    ctx.font = "22px system-ui, Arial";
    ctx.fillText(`Seat: ${state.seated ? state.seatLabel : "Standing"} • Pot $${poker.pot || 0}`, 44, 104);

    ctx.textAlign = "right";
    ctx.fillStyle = "#7ff5c7";
    ctx.font = "bold 34px system-ui, Arial";
    ctx.fillText(`$${Number(state.cash || 0).toLocaleString()}`, 976, 58);

    ctx.textAlign = "left";
    ctx.fillStyle = tp.glow === "purple" ? "#f6e27f" : "rgba(233,233,255,0.82)";
    ctx.font = "bold 24px system-ui, Arial";
    const tpLine = tp.glow === "purple" ? `Teleport ON: ${String(tp.active || "hand").toUpperCase()}` : "Teleport OFF • look at fist + clench";
    ctx.fillText(tpLine, 44, 410);

    ctx.fillStyle = liveNotice ? "#f6e27f" : poker.awaitingPlayer ? "#f6e27f" : "rgba(233,233,255,0.76)";
    ctx.font = "22px system-ui, Arial";
    ctx.fillText(liveNotice ? notice : poker.awaitingPlayer ? "YOUR TURN — open hologram for poker controls" : "Open hologram for scenes, poker, audio, help", 44, 450);

    drawButton(holoButton(), hoveredId === "holo");
    tex.needsUpdate = true;
  }

  function localHit(local){
    const btn = holoButton();
    const x = ((local.x / plateW) + 0.5) * canvas.width;
    const y = ((-local.y / plateH) + 0.5) * canvas.height;
    const margin = btn.margin ?? 24;
    if (x < btn.x - margin || x > btn.x + btn.w + margin || y < btn.y - margin || y > btn.y + btn.h + margin) return null;
    return btn.id;
  }

  function activate(id){
    if (id !== "holo") return;
    actions.toggleHologram?.();
    notice = "Hologram opened";
    noticeUntil = performance.now() + 1600;
    draw(true);
  }

  function update(dt, leftHand, rightHand){
    const anchor = leftHand?.joints?.wrist ? leftHand : rightHand?.joints?.wrist ? rightHand : null;
    if (!anchor?.joints?.wrist){
      group.visible = false;
      hoveredId = null;
      draw(true);
      return;
    }

    const watchOnLeft = anchor === leftHand;
    const pose = computeForearmPose(anchor, camera, renderer, watchOnLeft ? "left" : "right");
    if (!pose){
      group.visible = false;
      hoveredId = null;
      draw(true);
      return;
    }

    group.visible = true;
    group.position.copy(pose.position);
    group.quaternion.copy(pose.quaternion);
    group.updateMatrixWorld(true);

    let nextHovered = null;
    let activeInput = null;
    let bestDepth = Infinity;
    const candidates = watchOnLeft ? [rightHand, leftHand] : [leftHand, rightHand];
    for (const candidate of candidates){
      const tip = candidate?.joints?.["index-finger-tip"];
      if (!tip) continue;
      const tipPos = new THREE.Vector3();
      tip.getWorldPosition(tipPos);
      const local = group.worldToLocal(tipPos.clone());
      if (local.z > -0.026 && local.z < 0.115 && Math.abs(local.x) < plateW * 0.92 && Math.abs(local.y) < plateH * 0.92){
        const hit = localHit(local);
        if (hit){
          const depth = Math.abs(local.z);
          if (depth < bestDepth){
            bestDepth = depth;
            nextHovered = hit;
            activeInput = candidate;
          }
        }
      }
    }

    hoveredId = nextHovered;
    const pinching = !!activeInput && isPinching(activeInput);
    if (hoveredId && pinching) pinchTime += dt;
    else if (!pinching) pinchTime = 0;

    if (hoveredId && pinching && !pressed && pinchTime > holoButton().hold){
      pressed = true;
      activate(hoveredId);
      pinchTime = 0;
    }
    if (!pinching) pressed = false;
    draw();
  }

  draw(true);
  window.SVR_PHASE177_WATCH_LAUNCHER = { phase: PHASE, mode: "large-hologram-launcher", smallButtonsRemoved: true };
  window.SVR_PHASE174_WATCH_TEXTURE = window.SVR_PHASE177_WATCH_LAUNCHER;
  window.SVR_PHASE165_WATCH_HOLOGRAM_BUTTON = window.SVR_PHASE177_WATCH_LAUNCHER;
  return { update, object: group };
}
