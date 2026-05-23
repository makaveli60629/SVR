import * as THREE from "three";

const v = new THREE.Vector3();
const look = new THREE.Vector3();

export function detectNpcSceneKey(explicitKey = null){
  if (explicitKey) return explicitKey;
  if (typeof window !== "undefined" && window.SVR_SCENE_KEY) return String(window.SVR_SCENE_KEY);
  const name = (location.pathname.split("/").pop() || "index.html").replace(/\.html?$/i, "").toLowerCase();
  if (!name || name === "index") return "lobby";
  if (name === "range") return "pga-drive";
  return name;
}

export function shouldSpawnInScene(spawn, currentScene){
  if (!spawn || !currentScene) return false;
  if (spawn.scene === currentScene) return true;
  if (Array.isArray(spawn.scenes) && spawn.scenes.includes(currentScene)) return true;
  if (spawn.scene === "global") return true;
  return false;
}

export function resolveSeatPosition(spawn, seats = [], tableCenter = { x: 0, y: 0, z: 0 }){
  if (spawn.position) return { position: spawn.position, lookAt: spawn.lookAt || tableCenter };
  if (Number.isInteger(spawn.seatSlot) && seats?.[spawn.seatSlot]){
    const seat = seats[spawn.seatSlot];
    return {
      position: { x: seat.x || 0, y: 0, z: seat.z || 0 },
      lookAt: { x: tableCenter.x || 0, y: 1.15, z: tableCenter.z || 0 }
    };
  }
  if (spawn.path?.[0]) return { position: spawn.path[0], lookAt: spawn.path[1] || tableCenter };
  return { position: { x: 0, y: 0, z: 0 }, lookAt: tableCenter };
}

export function placeActorRoot(root, spawn, seats, tableCenter){
  const rec = resolveSeatPosition(spawn, seats, tableCenter);
  const p = rec.position || { x: 0, y: 0, z: 0 };
  root.position.set(p.x || 0, p.y || 0, p.z || 0);
  const target = rec.lookAt || spawn.lookAt;
  if (target){
    look.set(target.x || 0, target.y || 1.35, target.z || 0);
    root.lookAt(look);
  }
}

export function updateWalkLoop(actor, dt){
  const { spawn, root: actorRoot } = actor;
  if (!spawn.path || spawn.path.length < 2) return;
  const target = spawn.path[actor.pathIndex % spawn.path.length];
  v.set(target.x || 0, target.y || 0, target.z || 0);
  const pos = actorRoot.position;
  const dist = pos.distanceTo(v);
  if (dist < 0.08){ actor.pathIndex = (actor.pathIndex + 1) % spawn.path.length; return; }
  const step = Math.min(dist, (spawn.speed || 0.35) * dt);
  pos.lerp(v, step / Math.max(dist, 0.0001));
  look.copy(v); look.y = pos.y;
  actorRoot.lookAt(look);
}

export function applyIdleMotion(actor, now){
  const { spawn, model } = actor;
  if (!model) return;
  const phase = actor.phaseOffset || 0;
  const style = spawn.idleStyle || spawn.mode || "default";
  const rootBob = Math.sin(now * 2.2 + phase) * 0.008;
  model.position.y = rootBob;

  const parts = model.userData?._proceduralParts;
  if (!parts) return;

  const s = Math.sin(now * 3.2 + phase);
  const slow = Math.sin(now * 1.1 + phase);
  const breath = Math.sin(now * 0.75 + phase);
  if (parts.torso) parts.torso.scale.y = 1.05 + Math.max(0, breath) * 0.018;
  if (parts.head){
    parts.head.rotation.y = slow * 0.10;
    parts.head.rotation.x = Math.sin(now * 0.8 + phase) * 0.025;
  }

  if (style === "chip_reach"){
    const reach = Math.max(0, s);
    parts.armL.rotation.x = 0.18 + reach * 0.35;
    parts.armR.rotation.x = -0.05 + Math.max(0, -s) * 0.26;
    if (parts.handR) parts.handR.position.z = 0.08 + reach * 0.06;
    if (parts.chipR){ parts.chipR.position.z = 0.12 + reach * 0.08; parts.chipR.rotation.z += 0.045; }
    if (parts.cardL) parts.cardL.visible = false;
  } else if (style === "card_peek"){
    const peek = Math.max(0, Math.sin(now * 1.8 + phase));
    parts.armL.rotation.x = 0.12 + peek * 0.20;
    parts.armR.rotation.x = 0.12 + peek * 0.18;
    if (parts.handL) parts.handL.position.z = 0.08 + peek * 0.04;
    if (parts.cardL){ parts.cardL.visible = true; parts.cardL.rotation.z = Math.sin(now * 1.5 + phase) * 0.08; parts.cardL.position.y = 0.72 + peek * 0.035; }
    if (parts.chipR) parts.chipR.visible = false;
    if (parts.head) parts.head.rotation.x = -0.04 + peek * 0.05;
  } else if (style === "coach_point"){
    parts.armR.rotation.x = -0.28 + Math.sin(now * 1.5 + phase) * 0.08;
    parts.armR.rotation.z = -0.62;
    parts.armL.rotation.x = Math.sin(now * 1.7 + phase) * 0.08;
    if (parts.handR) parts.handR.position.set(0.42, 1.12, 0.18);
    if (parts.cardL) parts.cardL.visible = false;
    if (parts.chipR) parts.chipR.visible = false;
  } else if (style === "calm_breath"){
    parts.armL.rotation.x = 0.08 + breath * 0.035;
    parts.armR.rotation.x = 0.08 + breath * 0.035;
    if (parts.handL) parts.handL.position.y = 0.78 + breath * 0.018;
    if (parts.handR) parts.handR.position.y = 0.78 + breath * 0.018;
    if (parts.cardL) parts.cardL.visible = false;
    if (parts.chipR) parts.chipR.visible = false;
  } else {
    parts.armL.rotation.x = s * 0.18;
    parts.armR.rotation.x = -s * 0.18;
    parts.legL.rotation.x = -s * 0.13;
    parts.legR.rotation.x = s * 0.13;
    if (parts.cardL) parts.cardL.visible = false;
    if (parts.chipR) parts.chipR.visible = false;
  }
}

export function updateActorMotion(actor, dt, now){
  if (actor.spawn.mode === "walk_loop") updateWalkLoop(actor, dt);
  applyIdleMotion(actor, now);
}
