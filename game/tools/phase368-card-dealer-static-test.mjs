import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const legacyRuntime = read('game/modules/phase368_card_dealer_animation_lock.js');
const successorRuntime = read('game/modules/phase381_vr_runtime_lock.js');
const motionSource = read('game/modules/phase368_card_dealer_motion.js');

const transformed = motionSource.replace('export const DEALER_MOTION =', 'globalThis.DEALER_MOTION =');
const context = {};
vm.createContext(context);
vm.runInContext(transformed, context);
const motion = context.DEALER_MOTION;
const decodeInt16 = (value) => {
  const bytes = Buffer.from(value, 'base64');
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
};
const rotation = decodeInt16(motion.rotationBase64);
const translation = decodeInt16(motion.translationBase64);

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
expect(legacyRuntime.includes('PHASE-368-CARD-DEALER-ANIMATION-LOCK'), 'missing protected Phase 368 build label');
expect(legacyRuntime.includes('optimizedFromUploadedFbx: true'), 'uploaded FBX provenance is not locked');
expect(legacyRuntime.includes('svr:poker-state'), 'protected dealer motion is not connected to poker state');
expect(legacyRuntime.includes('window.SVR_PHASE368_PLAY_CARD_DEALER'), 'protected manual dealer test hook is missing');
expect(successorRuntime.includes('PHASE-381-VR-SEAT-ERIC-AUDIO-OVERLAY-LOCK'), 'Phase 381 Eric successor runtime missing');
expect(successorRuntime.includes("assets/models/eric/eric.fbx"), 'Phase 381 does not load the approved Eric mesh');
expect(successorRuntime.includes("phase368_card_dealer_motion.js"), 'Phase 381 does not reuse the optimized uploaded dealer motion');
expect(successorRuntime.includes('SVR_PHASE381_PLAY_ERIC'), 'Phase 381 manual Eric motion hook missing');
expect(successorRuntime.includes('hideOldSkeletons'), 'Phase 381 does not remove the replaced procedural skeleton');
expect(motion.source?.name === 'Cards.fbx', 'motion source is not Cards.fbx');
expect(motion.source?.bytes === 2511648, 'source FBX byte count changed');
expect(motion.source?.fbxVersion === 7700, 'source FBX version changed');
expect(motion.source?.sha256 === '58bc92ee6c5b4d2ca6470451d1fd96aedfa62d065d651945eb981b6a1c964303', 'source FBX checksum changed');
expect(rotation.length === motion.frames * motion.bones.length * 3, 'rotation payload length mismatch');
expect(translation.length === motion.frames * 3, 'translation payload length mismatch');
expect(motion.bones.includes('LeftHand') && motion.bones.includes('RightHand'), 'hand motion is missing');

const game = read('game/index.html');
const camera3 = read('game/camera3.html');
expect(game.includes('phase381_vr_runtime_lock.js'), 'game/index.html does not load the Phase 381 Eric dealer successor');
expect(!game.includes("import('./modules/phase368_card_dealer_animation_lock.js"), 'game/index.html must not load the separate procedural dealer skeleton');
expect(camera3.includes('phase368_card_dealer_animation_lock.js'), 'camera3.html does not preserve the lightweight preview dealer');

const androidEntry = read('game/android.html');
const androidStable = read('game/android-stable.html');
expect(androidEntry.includes('android-stable.html?v=phase379') || androidEntry.includes('android-stable.html?v=phase380'), 'game/android.html does not redirect to a supported stable Android table');
expect(androidStable.includes('PHASE-379-ANDROID-STANDALONE-JOIN-NOW-LOCK') || androidStable.includes('PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK'), 'supported Android stable build is missing');
expect(androidStable.includes('JOIN NOW'), 'Android JOIN NOW is missing');
expect(androidStable.includes('No cards, poker actions, or movement controls appear before joining.') || androidStable.includes('No cards are dealt before you join.'), 'Android pre-join protection is missing');
expect(!androidStable.includes('phase368_card_dealer_animation_lock.js'), 'lightweight Android table must not load the heavy 3D dealer');

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-368-CARD-DEALER-ANIMATION-LOCK',
  successor: 'PHASE-381-VR-SEAT-ERIC-AUDIO-OVERLAY-LOCK',
  source: motion.source,
  optimizedBytes: Buffer.byteLength(motion.rotationBase64 + motion.translationBase64, 'utf8'),
  frames: motion.frames,
  bones: motion.bones.length,
  routes: ['desktop/quest approved Eric mesh dealer', 'camera3 protected preview dealer', 'android Phase 380 lightweight table']
}, null, 2));
