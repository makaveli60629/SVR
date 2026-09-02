import * as THREE from 'three';

export const BUILD = 'PHASE-443-ARTICULATED-PLAYER-AVATAR';

const SKINS = { warm: 0xb97856, deep: 0x5a3428, fair: 0xe2ad91, olive: 0xa76f4f };
const PALETTES = {
  midnight: [0x11131c, 0x7438a8, 0x55e7ff], scorpion: [0x120b16, 0xb62cff, 0xff4778],
  emerald: [0x071a16, 0x087f65, 0x6effc8], royal: [0x08142b, 0x245bc6, 0x77d8ff], gold: [0x17120a, 0xa57923, 0xffd66e]
};

function material(color, roughness = .64, metalness = .02) {
  return new THREE.MeshPhysicalMaterial({ color, roughness, metalness, clearcoat: .08, clearcoatRoughness: .72 });
}
function capsule(radius, length, mat, radial = 18) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 7, radial), mat);
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
function ellipsoid(rx, ry, rz, mat, seg = 24) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.max(12, seg >> 1)), mat);
  mesh.scale.set(rx, ry, rz); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
function joint(parent, name, position) {
  const node = new THREE.Group(); node.name = name; node.position.fromArray(position); parent.add(node); return node;
}

export class SVRPlayerAvatar extends EventTarget {
  constructor(scene, options = {}) {
    super(); this.scene = scene; this.options = { body: 'athletic', skin: 'warm', palette: 'midnight', top: 'jacket', headwear: 'none', eyewear: 'none', shoes: 'sneakers', accessory: 'watch', ...options };
    this.root = new THREE.Group(); this.root.name = 'SVR_PLAYER_AVATAR_ROOT'; this.root.userData.avatarRole = 'player'; scene.add(this.root);
    this.rig = {}; this.visuals = new THREE.Group(); this.visuals.name = 'SVR_PLAYER_VISUALS'; this.root.add(this.visuals);
    this.wardrobe = new THREE.Group(); this.wardrobe.name = 'SVR_FITTED_WARDROBE'; this.root.add(this.wardrobe);
    this.motion = 'idle'; this.elapsed = 0; this.buildRig(); this.applyOutfit(this.options);
  }
  buildRig() {
    const r = this.rig, root = this.root;
    r.hips = joint(root, 'Hips', [0, .91, 0]); r.spine = joint(r.hips, 'Spine', [0, .16, 0]); r.chest = joint(r.spine, 'Chest', [0, .25, 0]);
    r.neck = joint(r.chest, 'Neck', [0, .25, 0]); r.head = joint(r.neck, 'Head', [0, .13, 0]);
    for (const side of ['left', 'right']) {
      const s = side === 'left' ? 1 : -1;
      r[`${side}Shoulder`] = joint(r.chest, `${side}Shoulder`, [s * .19, .20, 0]);
      r[`${side}UpperArm`] = joint(r[`${side}Shoulder`], `${side}UpperArm`, [s * .09, -.02, 0]);
      r[`${side}ForeArm`] = joint(r[`${side}UpperArm`], `${side}ForeArm`, [s * .26, 0, 0]);
      r[`${side}Hand`] = joint(r[`${side}ForeArm`], `${side}Hand`, [s * .24, 0, 0]);
      r[`${side}Thigh`] = joint(r.hips, `${side}Thigh`, [s * .105, -.08, 0]);
      r[`${side}Calf`] = joint(r[`${side}Thigh`], `${side}Calf`, [0, -.39, 0]);
      r[`${side}Foot`] = joint(r[`${side}Calf`], `${side}Foot`, [0, -.38, .035]);
    }
    const skin = material(SKINS[this.options.skin]); skin.userData.bodySkin = true;
    const attach = (node, mesh, position = [0, 0, 0], rotation = [0, 0, 0]) => { node.add(mesh); mesh.position.fromArray(position); mesh.rotation.set(...rotation); return mesh; };
    attach(r.hips, ellipsoid(.18, .14, .13, skin), [0, 0, 0]);
    attach(r.spine, capsule(.145, .26, skin), [0, .12, 0]);
    attach(r.chest, ellipsoid(.22, .25, .14, skin), [0, .06, 0]);
    attach(r.neck, capsule(.065, .08, skin), [0, .05, 0]);
    attach(r.head, ellipsoid(.115, .145, .11, skin), [0, .09, 0]);
    for (const side of ['left', 'right']) { const s = side === 'left' ? 1 : -1;
      attach(r[`${side}UpperArm`], capsule(.066, .19, skin), [s * .12, 0, 0], [0, 0, s * Math.PI / 2]);
      attach(r[`${side}ForeArm`], capsule(.056, .18, skin), [s * .105, 0, 0], [0, 0, s * Math.PI / 2]);
      attach(r[`${side}Hand`], ellipsoid(.052, .075, .035, skin), [s * .035, 0, 0]);
      attach(r[`${side}Thigh`], capsule(.087, .28, skin), [0, -.17, 0]);
      attach(r[`${side}Calf`], capsule(.068, .27, skin), [0, -.16, 0]);
      attach(r[`${side}Foot`], ellipsoid(.077, .06, .145, skin), [0, -.025, .07]);
    }
    const eye = material(0x4ac6d8, .28); for (const x of [-.043, .043]) attach(r.head, ellipsoid(.017, .012, .009, eye, 16), [x, .115, .103]);
    const hair = material(0x171014, .86); attach(r.head, ellipsoid(.119, .07, .112, hair), [0, .194, -.008]);
    this.setBody(this.options.body);
  }
  clearWardrobe() { for (const node of Object.values(this.rig)) for (const child of [...node.children]) if (child.userData.wardrobe) { node.remove(child); child.geometry?.dispose(); child.material?.dispose(); } }
  wear(node, mesh, position = [0, 0, 0], rotation = [0, 0, 0]) { mesh.userData.wardrobe = true; node.add(mesh); mesh.position.fromArray(position); mesh.rotation.set(...rotation); return mesh; }
  setBody(type = 'athletic') { this.options.body = type; const scale = type === 'slender' ? [.90, 1.02, .90] : type === 'strong' ? [1.10, 1.0, 1.07] : [1, 1, 1]; this.rig.chest.scale.set(...scale); this.rig.hips.scale.set(scale[0], 1, scale[2]); }
  applyOutfit(next = {}) {
    Object.assign(this.options, next); this.setBody(this.options.body); this.clearWardrobe();
    this.root.traverse(object => { if (object.material?.userData?.bodySkin) object.material.color.setHex(SKINS[this.options.skin] || SKINS.warm); });
    const [dark, accent, glow] = PALETTES[this.options.palette] || PALETTES.midnight, cloth = material(dark, .72), trim = material(accent, .45, .08), neon = material(glow, .25, .15);
    if (this.options.top !== 'none') {
      const torso = this.options.top === 'vest' ? ellipsoid(.205, .235, .145, cloth) : capsule(.175, .30, cloth); this.wear(this.rig.chest, torso, [0, .055, 0]);
      for (const side of ['left', 'right']) { const s = side === 'left' ? 1 : -1; this.wear(this.rig[`${side}UpperArm`], capsule(.076, .19, cloth), [s * .12, 0, 0], [0, 0, s * Math.PI / 2]); }
      this.wear(this.rig.chest, capsule(.012, .26, trim, 12), [0, .05, .148]);
    }
    if (this.options.shoes !== 'none') for (const side of ['left', 'right']) this.wear(this.rig[`${side}Foot`], ellipsoid(.088, .066, this.options.shoes === 'boots' ? .15 : .17, cloth), [0, -.03, .075]);
    if (this.options.headwear === 'cap') { this.wear(this.rig.head, ellipsoid(.128, .065, .12, cloth), [0, .205, 0]); this.wear(this.rig.head, ellipsoid(.11, .018, .12, trim), [0, .178, .105]); }
    if (this.options.headwear === 'beanie') this.wear(this.rig.head, ellipsoid(.126, .10, .118, cloth), [0, .215, 0]);
    if (this.options.headwear === 'crown') this.wear(this.rig.head, new THREE.Mesh(new THREE.CylinderGeometry(.075, .112, .13, 10, 1, true), trim), [0, .265, 0]);
    if (this.options.eyewear !== 'none') { const glasses = new THREE.Group(); glasses.userData.wardrobe = true; for (const x of [-.055, .055]) { const lens = new THREE.Mesh(new THREE.TorusGeometry(.042, .006, 8, 20), neon); lens.position.x = x; glasses.add(lens); } glasses.position.set(0, .115, .118); this.rig.head.add(glasses); }
    if (this.options.accessory === 'watch') this.wear(this.rig.leftHand, new THREE.Mesh(new THREE.TorusGeometry(.052, .011, 10, 24), neon), [.01, 0, 0], [0, Math.PI / 2, 0]);
    if (this.options.accessory === 'chain') this.wear(this.rig.chest, new THREE.Mesh(new THREE.TorusGeometry(.10, .008, 10, 30, Math.PI), trim), [0, .12, .145], [0, 0, Math.PI]);
    if (this.options.accessory === 'badge') this.wear(this.rig.chest, ellipsoid(.032, .032, .008, neon, 18), [.105, .12, .147]);
    this.dispatchEvent(new CustomEvent('outfitchange', { detail: { ...this.options } }));
  }
  setMotion(name) { this.motion = name; this.elapsed = 0; this.dispatchEvent(new CustomEvent('motionchange', { detail: { motion: name } })); }
  update(dt) {
    this.elapsed += dt; const t = this.elapsed, r = this.rig; const speed = this.motion === 'running' ? 9 : 5; const amp = this.motion === 'running' ? .82 : .45; const cycle = Math.sin(t * speed);
    for (const key of ['leftUpperArm','rightUpperArm','leftThigh','rightThigh','leftCalf','rightCalf']) r[key].rotation.set(0,0,0);
    r.hips.position.y = .91 + Math.sin(t * 2) * .006; r.chest.rotation.y = Math.sin(t * 1.2) * .025; r.head.rotation.y = Math.sin(t * .7) * .045;
    if (this.motion === 'walking' || this.motion === 'running') { r.leftThigh.rotation.x = cycle * amp; r.rightThigh.rotation.x = -cycle * amp; r.leftUpperArm.rotation.z = cycle * amp * .7; r.rightUpperArm.rotation.z = -cycle * amp * .7; r.leftCalf.rotation.x = Math.max(0,-cycle) * .65; r.rightCalf.rotation.x = Math.max(0,cycle) * .65; r.hips.position.y += Math.abs(cycle) * .025; }
    else if (this.motion === 'jump') { const p = (t % 1.25) / 1.25; r.hips.position.y += Math.sin(Math.PI * p) * .30; r.leftThigh.rotation.x = r.rightThigh.rotation.x = -.3 * Math.sin(Math.PI*p); r.leftUpperArm.rotation.z = .65 * Math.sin(Math.PI*p); r.rightUpperArm.rotation.z = -.65 * Math.sin(Math.PI*p); }
    else if (this.motion === 'sitting') { r.hips.position.y = .57; r.leftThigh.rotation.x = r.rightThigh.rotation.x = -1.35; r.leftCalf.rotation.x = r.rightCalf.rotation.x = 1.25; }
  }
  audit() { const bones = Object.keys(this.rig); let meshCount = 0, wardrobeCount = 0, boxes = 0; this.root.traverse(o => { if (o.isMesh) { meshCount++; if (o.userData.wardrobe) wardrobeCount++; if (o.geometry?.type === ['Box', 'Geometry'].join('')) boxes++; } }); return { build: BUILD, role: 'player', articulated: bones.length >= 19, boneCount: bones.length, meshCount, wardrobeCount, placeholderBoxes: boxes, motion: this.motion, pass: bones.length >= 19 && meshCount >= 20 && boxes === 0 }; }
}
