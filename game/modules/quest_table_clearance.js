import * as THREE from 'three';

function belongsTo(object, root) {
  for (let p = object; p; p = p.parent) if (p === root) return true;
  return false;
}
function visible(object) {
  for (let p = object; p; p = p.parent) if (!p.visible) return false;
  return true;
}
function gameplay(object) {
  for (let p = object; p; p = p.parent) {
    if (p.userData?.svrUserInterface || p.userData?.svrPhase441Approved) return true;
    if (/CARD|CHIP|POT|HAND|BUTTON|CONTROL|INTERACTION|DEAL|PLAYER|ERIC/i.test(p.name || '')) return true;
  }
  return false;
}

// Test the space above the felt, including unnamed imported planes. Native
// table structure, people, tracked UI, cards and chips remain owned by their
// modules. Remove only broad, thin external surfaces overlapping the felt.
export function clearQuestTableObstructions(scene, runtime) {
  const table = runtime?.table;
  const felt = new THREE.Box3();
  for (const rec of table?.nativeFeltRecords || []) {
    rec.mesh.updateWorldMatrix(true, false);
    felt.expandByObject(rec.mesh, true);
  }
  if (felt.isEmpty()) return { checked: false, removed: 0 };
  const size = felt.getSize(new THREE.Vector3());
  const box = new THREE.Box3();
  let removed = 0;
  scene.traverse(object => {
    if (!object.isMesh || !visible(object) || belongsTo(object, table.group) || gameplay(object)) return;
    if (belongsTo(object, runtime.dealer?.group) || belongsTo(object, runtime.dealer?.propGroup)) return;
    object.updateWorldMatrix(true, false);
    box.setFromObject(object, true);
    if (box.isEmpty()) return;
    const overlapX = Math.min(box.max.x, felt.max.x) - Math.max(box.min.x, felt.min.x);
    const overlapZ = Math.min(box.max.z, felt.max.z) - Math.max(box.min.z, felt.min.z);
    const broad = overlapX >= size.x * .5 && overlapZ >= size.z * .5;
    const thin = box.max.y - box.min.y <= .10;
    const above = box.min.y >= felt.max.y + .008 && box.max.y <= felt.max.y + 1.0;
    if (!broad || !thin || !above) return;
    object.visible = false;
    object.userData.svrQuestObstructionRemoved = true;
    removed++;
  });
  return { checked: true, removed };
}
