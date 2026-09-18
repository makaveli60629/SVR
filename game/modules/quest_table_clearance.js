import * as THREE from 'three';

const BUILD = 'PHASE-460-QUEST-TABLE-ZERO-OVERLAY-LOCK';
const SUSPICIOUS = /LEGACY|DUPLICATE|EXTRA|FLOATING|TABLETOP|TOPPER|COVER|PROTECTIVE|HOLOGRAM|OVERLAY|PRESENTATION|BRANDING.*PLANE|SURFACE.*PLANE/i;

function belongsTo(object, root) {
  for (let p = object; p; p = p.parent) if (p === root) return true;
  return false;
}

function visible(object) {
  for (let p = object; p; p = p.parent) if (p.visible === false) return false;
  return true;
}

function gameplay(object) {
  for (let p = object; p; p = p.parent) {
    // Phase 440 marks the complete approved table root. Inheriting that marker
    // here protected stale cover meshes nested under the table and let the old
    // clearance audit report a false pass. Protect actual game pieces only.
    if (p.userData?.svrUserInterface) return true;
    if (/CARD|CHIP|POT|HAND|BUTTON|CONTROL|INTERACTION|DEAL|PLAYER|ERIC|PASS.?LINE|CENTER.*LOGO|SAFE.?DECAL/i.test(p.name || '')) return true;
  }
  return false;
}

function isNativeFelt(object, records) {
  for (const rec of records) {
    const mesh = rec?.mesh;
    if (!mesh) continue;
    if (object === mesh || belongsTo(object, mesh) || belongsTo(mesh, object)) return true;
  }
  return false;
}

function markHidden(object, reason) {
  if (!object) return false;
  object.visible = false;
  object.userData = {
    ...(object.userData || {}),
    svrQuestObstructionRemoved: true,
    svrPhase460ZeroOverlay: true,
    svrPhase460Reason: reason,
    build: BUILD
  };
  return true;
}

// Phase 459 only inspected objects outside the authoritative table group. That
// allowed a stale internal tabletop/cover mesh to remain above the real felt
// while QA still reported a clean table. Phase 460 protects native felt,
// gameplay objects and approved decals, then removes broad thin cover surfaces
// both inside and outside the table authority.
export function clearQuestTableObstructions(scene, runtime) {
  const table = runtime?.table;
  const tableRoot = table?.group || null;
  const feltRecords = table?.nativeFeltRecords || [];
  const felt = new THREE.Box3();
  for (const rec of feltRecords) {
    rec?.mesh?.updateWorldMatrix?.(true, false);
    if (rec?.mesh) felt.expandByObject(rec.mesh, true);
  }
  if (felt.isEmpty()) return { build: BUILD, checked: false, removed: 0, internal: 0, external: 0 };

  let forced = 0;
  for (const cover of table?.hiddenCoverRecords || []) {
    if (cover?.visible !== false && markHidden(cover, 'hidden-cover-record')) forced++;
  }
  for (const object of [table?.presentationGroup, table?.brandingMesh]) {
    if (object?.visible !== false && markHidden(object, 'presentation-overlay')) forced++;
  }

  const feltSize = felt.getSize(new THREE.Vector3());
  const box = new THREE.Box3();
  let internal = 0;
  let external = 0;

  scene.traverse(object => {
    if (!object?.isMesh || !visible(object) || gameplay(object) || isNativeFelt(object, feltRecords)) return;
    if (belongsTo(object, runtime?.dealer?.group) || belongsTo(object, runtime?.dealer?.propGroup)) return;

    object.updateWorldMatrix?.(true, false);
    box.setFromObject(object, true);
    if (box.isEmpty()) return;

    const overlapX = Math.min(box.max.x, felt.max.x) - Math.max(box.min.x, felt.min.x);
    const overlapZ = Math.min(box.max.z, felt.max.z) - Math.max(box.min.z, felt.min.z);
    if (overlapX <= 0 || overlapZ <= 0) return;

    const broadX = overlapX >= feltSize.x * 0.52;
    const broadZ = overlapZ >= feltSize.z * 0.52;
    const veryBroad = overlapX >= feltSize.x * 0.78 && overlapZ >= feltSize.z * 0.78;
    const height = box.max.y - box.min.y;
    const thin = height <= 0.105;
    const veryThin = height <= 0.055;
    const nearSurface = box.min.y >= felt.max.y - 0.008 && box.max.y <= felt.max.y + 0.75;
    const hovering = box.min.y >= felt.max.y + 0.010 && box.max.y <= felt.max.y + 0.55;
    const label = `${object.name || ''} ${object.material?.name || ''}`;
    const suspicious = SUSPICIOUS.test(label);
    const insideTable = Boolean(tableRoot && belongsTo(object, tableRoot));

    const removeInternal = insideTable && nearSurface && broadX && broadZ && thin && (suspicious || (veryBroad && veryThin && hovering));
    const removeExternal = !insideTable && nearSurface && broadX && broadZ && thin;
    if (!removeInternal && !removeExternal) return;

    if (markHidden(object, removeInternal ? 'internal-table-cover' : 'external-table-cover')) {
      if (removeInternal) internal++;
      else external++;
    }
  });

  const result = {
    build: BUILD,
    checked: true,
    removed: forced + internal + external,
    forced,
    internal,
    external,
    feltTop: Number(felt.max.y.toFixed(4)),
    checkedAt: new Date().toISOString()
  };
  window.SVR_PHASE460_TABLE_CLEARANCE = result;
  return result;
}
