import * as THREE from "three";
import { createTeleportRig as baseRig } from "./teleport_phase103_standing_direct_lock.js?v=phase103-standing-direct-base";
import { isFist, isPinching } from "./gestures.js";

const LABEL = "PHASE-298-HAND-TELEPORT-RELEASE-COMMIT-LOCK";
const TARGET_NAME = "PHASE292_PINCH_RELEASE_TELEPORT_LOGO_TARGET";
const RELEASE_CACHE_MS = 2400;
const MIN_MOVE_DELTA = 0.22;
const COMMIT_COOLDOWN_MS = 260;

function handHeld(hand){
  if (!hand?.joints) return false;
  try { return !!(isPinching(hand) || isFist(hand)); } catch { return false; }
}

function anyHandHeld(args){
  return handHeld(args?.leftHand) || handHeld(args?.rightHand);
}

function distXZ(a, b){
  if (!a || !b) return Infinity;
  return Math.hypot(Number(a.x || 0) - Number(b.x || 0), Number(a.z || 0) - Number(b.z || 0));
}

export function createTeleportRig(opts){
  const rig = baseRig(opts);
  const originalUpdate = rig.update.bind(rig);
  const scene = opts?.scene;
  const cached = new THREE.Vector3();
  let hasCachedTarget = false;
  let cachedAt = 0;
  let wasHandAiming = false;
  let lastForcedCommit = 0;

  function cacheVisibleTarget(){
    const marker = scene?.getObjectByName?.(TARGET_NAME);
    if (!marker || marker.visible === false) return false;
    marker.updateWorldMatrix?.(true, false);
    marker.getWorldPosition(cached);
    cached.y = Number.isFinite(cached.y) ? cached.y : 0;
    hasCachedTarget = true;
    cachedAt = performance.now();
    return true;
  }

  function commitCachedTarget(reason, beforePose, afterPose){
    const now = performance.now();
    if (!hasCachedTarget || now - cachedAt > RELEASE_CACHE_MS) return false;
    if (now - lastForcedCommit < COMMIT_COOLDOWN_MS) return false;
    const moved = distXZ(beforePose, afterPose);
    if (moved > MIN_MOVE_DELTA) return false;
    const ok = rig.setPlayerXZ?.(cached.x, cached.z);
    lastForcedCommit = now;
    window.SVR_PHASE298_HAND_TELEPORT_RELEASE_COMMIT_LOCK = {
      build: LABEL,
      active: true,
      forcedCommit: !!ok,
      reason,
      targetX: Number(cached.x.toFixed(2)),
      targetZ: Number(cached.z.toFixed(2)),
      beforeX: Number((beforePose?.x || 0).toFixed(2)),
      beforeZ: Number((beforePose?.z || 0).toFixed(2)),
      afterX: Number((afterPose?.x || 0).toFixed(2)),
      afterZ: Number((afterPose?.z || 0).toFixed(2)),
      movedBeforeFallback: Number(moved.toFixed(3)),
      phase103Base: true,
      siteTouched: false,
      pokerLogicTouched: false,
      checkedAt: new Date().toISOString()
    };
    return !!ok;
  }

  rig.update = (args = {}) => {
    const handIsHeldBefore = anyHandHeld(args);
    if (handIsHeldBefore) cacheVisibleTarget();
    const beforePose = rig.getPlayerPose?.();
    const wasAimingBefore = wasHandAiming;

    originalUpdate(args);

    const handIsHeldAfter = anyHandHeld(args);
    const afterPose = rig.getPlayerPose?.();
    const markerStillVisible = cacheVisibleTarget();
    const releasedThisFrame = wasAimingBefore && !handIsHeldAfter;

    if (releasedThisFrame){
      commitCachedTarget(markerStillVisible ? "release-after-marker-refresh" : "release-after-marker-hidden", beforePose, afterPose);
      hasCachedTarget = false;
    }

    wasHandAiming = handIsHeldAfter || markerStillVisible || (!!rig.isEnabled?.() && handIsHeldBefore);

    window.SVR_PHASE298_HAND_TELEPORT_RELEASE_STATUS = {
      build: LABEL,
      active: true,
      handIsHeldBefore,
      handIsHeldAfter,
      wasHandAiming,
      cachedTarget: hasCachedTarget,
      markerStillVisible,
      lastCachedAgeMs: hasCachedTarget ? Math.round(performance.now() - cachedAt) : null,
      releaseCommitsOnLetGo: true,
      phase103Base: true,
      checkedAt: new Date().toISOString()
    };
  };

  const originalOnSessionStart = rig.onSessionStart?.bind(rig);
  if (originalOnSessionStart){
    rig.onSessionStart = async (...args) => {
      hasCachedTarget = false;
      wasHandAiming = false;
      lastForcedCommit = 0;
      return await originalOnSessionStart(...args);
    };
  }

  window.SVR_PHASE298_HAND_TELEPORT_RELEASE_COMMIT_LOCK = {
    build: LABEL,
    active: true,
    wrapperInstalled: true,
    releaseCommitsLastValidTarget: true,
    phase103Base: true,
    siteTouched: false,
    pokerLogicTouched: false,
    checkedAt: new Date().toISOString()
  };

  return rig;
}
