import * as THREE from "three";
import { CONFIG } from "./config.js";

const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();

export function isPinching(hand){
  const indexTip = hand?.joints?.["index-finger-tip"];
  const thumbTip = hand?.joints?.["thumb-tip"];
  if (!indexTip || !thumbTip) return false;
  indexTip.getWorldPosition(tempA);
  thumbTip.getWorldPosition(tempB);
  return tempA.distanceTo(tempB) < CONFIG.PINCH_DIST;
}

function tipDist(hand, tipName){
  const tip = hand?.joints?.[tipName];
  const wrist = hand?.joints?.["wrist"];
  if (!tip || !wrist) return Infinity;
  tip.getWorldPosition(tempA);
  wrist.getWorldPosition(tempB);
  return tempA.distanceTo(tempB);
}

export function isFist(hand){
  const t = CONFIG.FIST_TIP_TO_WRIST_MAX;
  return (
    tipDist(hand, "index-finger-tip") < t &&
    tipDist(hand, "middle-finger-tip") < t &&
    tipDist(hand, "ring-finger-tip") < t &&
    tipDist(hand, "pinky-finger-tip") < t
  );
}

export function aimPoint(hand){
  const tip = hand?.joints?.["index-finger-tip"];
  const wrist = hand?.joints?.["wrist"];
  if (!tip || !wrist) return null;

  const tipPos = new THREE.Vector3();
  const wristPos = new THREE.Vector3();
  const dir = new THREE.Vector3();

  tip.getWorldPosition(tipPos);
  wrist.getWorldPosition(wristPos);

  dir.copy(tipPos).sub(wristPos).normalize();
  if (dir.y > -0.05) dir.y = -0.05;
  dir.normalize();

  const t = (tipPos.y - 0.0) / (-dir.y);
  if (!isFinite(t) || t < 0.15) return null;

  const tClamped = Math.min(t, 180);
  return new THREE.Vector3(
    tipPos.x + dir.x * tClamped,
    0,
    tipPos.z + dir.z * tClamped
  );
}
