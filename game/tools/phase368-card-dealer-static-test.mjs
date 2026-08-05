import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const runtime = read('game/modules/phase368_card_dealer_animation_lock.js');
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
expect(runtime.includes('PHASE-368-CARD-DEALER-ANIMATION-LOCK'), 'missing build label');
expect(runtime.includes('optimizedFromUploadedFbx: true'), 'uploaded FBX provenance is not locked');
expect(runtime.includes('svr:poker-state'), 'dealer is not connected to poker state');
expect(runtime.includes('PHASE368_CARD_DEALER_ROOT'), 'dealer root is missing');
expect(runtime.includes('window.SVR_PHASE368_PLAY_CARD_DEALER'), 'manual dealer test hook is missing');
expect(motion.source?.name === 'Cards.fbx', 'motion source is not Cards.fbx');
expect(motion.source?.bytes === 2511648, 'source FBX byte count changed');
expect(motion.source?.fbxVersion === 7700, 'source FBX version changed');
expect(motion.source?.sha256 === '58bc92ee6c5b4d2ca6470451d1fd96aedfa62d065d651945eb981b6a1c964303', 'source FBX checksum changed');
expect(rotation.length === motion.frames * motion.bones.length * 3, 'rotation payload length mismatch');
expect(translation.length === motion.frames * 3, 'translation payload length mismatch');
expect(motion.bones.includes('LeftHand') && motion.bones.includes('RightHand'), 'hand motion is missing');

for (const route of ['game/index.html', 'game/camera3.html']) {
  const html = read(route);
  expect(html.includes('phase368_card_dealer_animation_lock.js'), `${route} does not load the Phase 368 dealer`);
}

const androidEntry = read('game/android.html');
const androidLobby = read('game/android-lobby.html');
const androidStable = read('game/android-stable.html');
expect(androidEntry.includes('android-lobby.html?v=phase381'), 'game/android.html does not redirect to the Phase 381 Android lobby');
expect(androidLobby.includes('PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK'), 'Phase 381 Android lobby build is missing');
expect(androidLobby.includes('phase368_card_dealer_animation_lock.js?v=phase381'), 'Phase 381 Android 3D lobby does not load the card dealer');
expect(androidLobby.includes('phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js?v=phase381'), 'Android lobby poker state is missing');
expect(
  androidStable.includes('PHASE-379-ANDROID-STANDALONE-JOIN-NOW-LOCK')
    || androidStable.includes('PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK'),
  'supported Android low-power build is missing'
);
expect(androidStable.includes('PHASE-381-ANDROID-SOUND-COMPACT-LOGO-CARDS-LOCK'), 'Phase 381 low-power presentation successor is missing');
expect(androidStable.includes('JOIN NOW'), 'Android JOIN NOW is missing');
expect(androidStable.includes('No cards, poker actions, or movement controls appear before joining.') || androidStable.includes('No cards are dealt before you join.'), 'Android pre-join protection is missing');
expect(!androidStable.includes('phase368_card_dealer_animation_lock.js'), 'low-power Android table must not load the heavy 3D dealer');

if (failures.length) {
  console.error(JSON.stringify({ pass: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-368-CARD-DEALER-ANIMATION-LOCK',
  successor: 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK',
  source: motion.source,
  optimizedBytes: Buffer.byteLength(motion.rotationBase64 + motion.translationBase64, 'utf8'),
  frames: motion.frames,
  bones: motion.bones.length,
  routes: ['desktop/quest 3D dealer', 'camera3 3D dealer', 'android Phase 381 3D lobby dealer', 'android Phase 380 low-power table without heavy dealer']
}, null, 2));
