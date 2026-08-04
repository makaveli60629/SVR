import * as THREE from "three";
import { applyPhase137PlanetStabilizer } from "./reiki_phase137_planet_stabilizer.js";

function isChildOf(obj, parent){
  let p = obj;
  while (p){
    if (p === parent) return true;
    p = p.parent;
  }
  return false;
}

function hideOldPolesRopesAndCarpet(scene, group){
  const pos = new THREE.Vector3();
  scene.traverse((obj)=>{
    if (!obj?.isMesh || isChildOf(obj, group)) return;
    obj.getWorldPosition(pos);
    const local = group.worldToLocal(pos.clone());
    const inReikiWalkway = Math.abs(local.x) < 5.8 && local.y < 2.4 && local.z > -1.2 && local.z < 8.4;
    if (!inReikiWalkway) return;
    const type = String(obj.geometry?.type || "");
    const isPole = type.includes("Cylinder") && local.y < 1.65;
    const isRope = type.includes("Cylinder") && Math.abs(local.y - 1.0) < 0.55;
    const isLowPlaque = local.y < 0.35 && (obj.material?.map || type.includes("Plane") || type.includes("Circle"));
    if (isPole || isRope || isLowPlaque) obj.visible = false;
  });

  group.traverse((obj)=>{
    if (!obj?.isMesh) return;
    const type = String(obj.geometry?.type || "");
    if (type.includes("Plane") && obj.position.y < 0.08 && obj.position.z > 0.0) obj.visible = false;
  });
}

function makeCarpetTexture(){
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#5f0616");
  g.addColorStop(0.48, "#9c0925");
  g.addColorStop(1, "#4d0614");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,.08)";
  for (let y = 80; y < canvas.height; y += 110){
    ctx.fillRect(54, y, canvas.width - 108, 5);
  }
  ctx.strokeStyle = "rgba(255,220,170,.40)";
  ctx.lineWidth = 18;
  ctx.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);
  ctx.strokeStyle = "rgba(125,255,240,.26)";
  ctx.lineWidth = 8;
  ctx.strokeRect(58, 58, canvas.width - 116, canvas.height - 116);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function addBentRope(group, side = 1){
  const points = [
    new THREE.Vector3(side * 1.72, 0.82, -0.12),
    new THREE.Vector3(side * 2.10, 0.92, 1.85),
    new THREE.Vector3(side * 2.18, 0.88, 4.35),
    new THREE.Vector3(side * 1.60, 0.78, 7.78)
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 52, 0.045, 14, false);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xc90826,
    roughness: 0.36,
    metalness: 0.12,
    emissive: 0x5c0612,
    emissiveIntensity: 0.42
  });
  const rope = new THREE.Mesh(geo, mat);
  rope.name = side < 0 ? "PHASE138 BENT RED ROPE LEFT" : "PHASE138 BENT RED ROPE RIGHT";
  group.add(rope);

  const glow = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 52, 0.082, 14, false),
    new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide })
  );
  glow.name = side < 0 ? "PHASE138 RED ROPE GLOW LEFT" : "PHASE138 RED ROPE GLOW RIGHT";
  group.add(glow);
  return rope;
}

function addRefinedCarpetAndRopes(group){
  if (group.userData._phase138CarpetRopeRefined) return;
  const carpetMat = new THREE.MeshStandardMaterial({
    map: makeCarpetTexture(),
    color: 0xffffff,
    roughness: 0.80,
    metalness: 0.02,
    emissive: 0x260008,
    emissiveIntensity: 0.10,
    side: THREE.DoubleSide
  });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.18, 10.8), carpetMat);
  carpet.name = "PHASE138 LONG NARROW REIKI CARPET";
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.024, 3.86);
  carpet.renderOrder = 7;
  group.add(carpet);

  const trimMat = new THREE.MeshStandardMaterial({ color: 0xe1c16e, roughness: 0.35, metalness: 0.55, emissive: 0x3c2b09, emissiveIntensity: 0.22 });
  const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 10.82), trimMat);
  leftTrim.name = "PHASE138 CARPET GOLD TRIM LEFT";
  leftTrim.position.set(-1.63, 0.055, 3.86);
  const rightTrim = leftTrim.clone();
  rightTrim.name = "PHASE138 CARPET GOLD TRIM RIGHT";
  rightTrim.position.x = 1.63;
  group.add(leftTrim, rightTrim);

  addBentRope(group, -1);
  addBentRope(group, 1);
  group.userData._phase138CarpetRopeRefined = true;
}

export function applyPhase138CarpetRopeRefine(args = {}){
  const result = applyPhase137PlanetStabilizer(args);
  const group = result?.group || args.scene?.userData?._phase136Reiki?.group || args.scene?.userData?._phase135ReikiWallAligned?.group;
  if (args.scene && group){
    hideOldPolesRopesAndCarpet(args.scene, group);
    addRefinedCarpetAndRopes(group);
    args.setStatus?.("Phase 138 Reiki carpet and bent ropes refined", { force: true });
  }
  return result;
}
