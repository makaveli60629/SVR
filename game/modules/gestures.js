import * as THREE from "three";
import { CONFIG } from "./config.js";

const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const tempD = new THREE.Vector3();

function joint(hand, name){
  return hand?.joints?.[name] || null;
}

function worldPos(hand, name, target){
  const j = joint(hand, name);
  if (!j) return null;
  j.getWorldPosition(target);
  return target;
}

export function isPinching(hand){
  const indexTip = joint(hand, "index-finger-tip");
  const thumbTip = joint(hand, "thumb-tip");
  if (!indexTip || !thumbTip) return false;
  indexTip.getWorldPosition(tempA);
  thumbTip.getWorldPosition(tempB);
  return tempA.distanceTo(tempB) < CONFIG.PINCH_DIST;
}

function tipDist(hand, tipName){
  const tip = joint(hand, tipName);
  const wrist = joint(hand, "wrist");
  if (!tip || !wrist) return Infinity;
  tip.getWorldPosition(tempA);
  wrist.getWorldPosition(tempB);
  return tempA.distanceTo(tempB);
}

function palmCurlScore(hand){
  const index = tipDist(hand, "index-finger-tip");
  const middle = tipDist(hand, "middle-finger-tip");
  const ring = tipDist(hand, "ring-finger-tip");
  const pinky = tipDist(hand, "pinky-finger-tip");
  return { index, middle, ring, pinky, avg: (index + middle + ring + pinky) / 4 };
}

export function isFist(hand){
  const t = CONFIG.FIST_TIP_TO_WRIST_MAX;
  const score = palmCurlScore(hand);
  const hardCurl = Math.max(0.079, t * 1.05);
  const softCurl = Math.max(0.087, t * 1.13);
  const thumb = tipDist(hand, "thumb-tip");
  const curledCount = [score.index, score.middle, score.ring, score.pinky].filter(v => v < hardCurl).length;

  const lockedFist = (
    score.index < softCurl &&
    score.middle < softCurl &&
    score.ring < softCurl &&
    score.pinky < softCurl &&
    score.avg < Math.max(0.083, t * 1.08) &&
    curledCount >= 3 &&
    thumb < Math.max(0.105, t * 1.34)
  );

  if (typeof window !== "undefined") {
    window.SVR_PHASE84_FIST_GESTURE_REFINEMENT = {
      phase: "PHASE-84-FIST-GESTURE-ACCURACY-REFINE",
      hardCurl,
      softCurl,
      curledCount,
      avg: Number.isFinite(score.avg) ? Number(score.avg.toFixed(4)) : null,
      active: lockedFist,
      note: "Slightly stricter fist detection to reduce accidental teleport toggles while preserving working fist teleport."
    };
  }

  return lockedFist;
}

export function isTwoFingerPoint(hand){
  const wrist = joint(hand, "wrist");
  if (!wrist) return false;
  const indexDist = tipDist(hand, "index-finger-tip");
  const middleDist = tipDist(hand, "middle-finger-tip");
  const ringDist = tipDist(hand, "ring-finger-tip");
  const pinkyDist = tipDist(hand, "pinky-finger-tip");
  const extended = Math.max(0.105, CONFIG.FIST_TIP_TO_WRIST_MAX * 1.34);
  const curled = Math.max(0.072, CONFIG.FIST_TIP_TO_WRIST_MAX * 1.08);
  return indexDist > extended && middleDist > extended && ringDist < curled && pinkyDist < curled;
}

export function isThreeFingerPinch(hand){
  const thumb = worldPos(hand, "thumb-tip", tempA);
  const index = worldPos(hand, "index-finger-tip", tempB);
  const middle = worldPos(hand, "middle-finger-tip", tempC);
  if (!thumb || !index || !middle) return false;
  const pinchDist = Math.max(CONFIG.PINCH_DIST * 1.35, 0.035);
  return thumb.distanceTo(index) < pinchDist && thumb.distanceTo(middle) < pinchDist;
}

function floorAimFrom(origin, dir){
  if (!origin || !dir || dir.lengthSq() < 1e-6) return null;
  if (dir.y > -0.055) dir.y = -0.055;
  dir.normalize();
  const t = (origin.y - 0.0) / (-dir.y);
  if (!isFinite(t) || t < 0.15) return null;
  const tClamped = Math.min(t, 180);
  return new THREE.Vector3(
    origin.x + dir.x * tClamped,
    0,
    origin.z + dir.z * tClamped
  );
}

export function twoFingerAimPoint(hand, camera = null){
  const index = worldPos(hand, "index-finger-tip", tempA);
  const middle = worldPos(hand, "middle-finger-tip", tempB);
  const wrist = worldPos(hand, "wrist", tempC);
  if (!index || !middle || !wrist) return null;

  const origin = tempD.copy(index).add(middle).multiplyScalar(0.5);
  const dir = origin.clone().sub(wrist).normalize();

  if (camera) {
    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    const flatDir = dir.clone();
    flatDir.y = 0;
    if (camForward.lengthSq() > 1e-5 && flatDir.lengthSq() > 1e-5 && flatDir.normalize().dot(camForward.normalize()) < -0.18) {
      dir.x *= -1;
      dir.z *= -1;
    }
  }

  return floorAimFrom(origin, dir);
}

export function aimPoint(hand){
  const tip = joint(hand, "index-finger-tip");
  const wrist = joint(hand, "wrist");
  if (!tip || !wrist) return null;

  const tipPos = new THREE.Vector3();
  const wristPos = new THREE.Vector3();
  const dir = new THREE.Vector3();

  tip.getWorldPosition(tipPos);
  wrist.getWorldPosition(wristPos);

  dir.copy(tipPos).sub(wristPos).normalize();
  return floorAimFrom(tipPos, dir);
}
