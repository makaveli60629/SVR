import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { throw new Error(message); };
const runtime = read('game/modules/phase348_ingame_player_avatar_presence_performance_lock.js');
const platform = read('game/modules/phase340_platform_manifest.js');
const gameManifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const androidEntry = read('game/android.html');
const standardEntry = read('game/index.html');

for (const path of ['game/assets/models/eric/eric.fbx', 'game/assets/models/claudia/claudia.fbx']) {
  if (!fs.existsSync(path)) fail(`Missing verified avatar body: ${path}`);
}

const requiredRuntimeTokens = [
  'PHASE-348-INGAME-PLAYER-AVATAR-PRESENCE-PERFORMANCE-LOCK',
  'PHASE348_LOCAL_PLAYER_AVATAR_ROOT',
  'window.SVR_PLAYER_AVATAR_PROFILE',
  'window.SVR_PHASE341_TABLE_LAYOUT',
  'current.seats[0]',
  'phase348-avatar-ready',
  'SVR_PHASE348_QA',
  'SVR_PHASE348_RELOAD',
  'SVR_PHASE348_RECENTER',
  "android: { updateHz: 24, animationHz: 18, maxEquipment: 6",
  "quest: { updateHz: 30, animationHz: 24, maxEquipment: 5",
  "desktop: { updateHz: 60, animationHz: 30, maxEquipment: 8"
];
for (const token of requiredRuntimeTokens) if (!runtime.includes(token)) fail(`Runtime token missing: ${token}`);

if (!runtime.includes('const ACTIVE = !CAMERA3')) fail('Camera 3 exclusion is not explicit.');
if (!runtime.includes('object.name === ROOT_NAME')) fail('Duplicate avatar root protection is missing.');
if (!runtime.includes('new FBXLoader()') || !runtime.includes('new GLTFLoader()')) fail('FBX/GLB loader support is incomplete.');
if (!runtime.includes('THREE.FrontSide')) fail('First-person interior-head protection is missing.');

const phase346Index = platform.indexOf('phase346_player_avatar_profile_bridge.js');
const phase348Index = platform.indexOf('phase348_ingame_player_avatar_presence_performance_lock.js');
const phase349Index = platform.indexOf('phase349_multiplayer_presence_seat_reconnect_lock.js');
if (phase346Index < 0 || phase348Index <= phase346Index) fail('Phase 348 must be declared after the Phase 346 profile bridge.');
if (phase349Index >= 0 && phase349Index <= phase348Index) fail('Presence must be declared after Phase 348.');
const platformVersion = Number(platform.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
if (platformVersion < 348) fail('Platform version regressed below Phase 348.');
const camera3Block = platform.slice(platform.indexOf('const CAMERA3 ='), platform.indexOf('function unique'));
if (camera3Block.includes('phase348_ingame_player_avatar_presence_performance_lock.js')) fail('Camera 3 must not load Phase 348.');
if (!platform.includes('avatarIndex <= profileIndex')) fail('Deferred avatar load-order validation is missing.');
if (!platform.includes('const QUEST_DEFERRED = [...LOBBY, ...SHARED_SOCIAL]')) fail('Quest avatar must be deferred after poker-ready lobby scheduling.');

if (Number(gameManifest.phase || 0) < 348) fail('game/manifest.json phase regressed below 348.');
if (!String(gameManifest.build || '').startsWith('PHASE-')) fail('Game manifest build is missing.');
if (gameManifest.apk_version_name !== '0.1.0-rc1' || gameManifest.apk_version_code !== 1) fail('APK version lock changed unexpectedly.');
if (gameManifest.release_ready !== false || gameManifest.force_update !== false || gameManifest.show_update_prompt !== false || gameManifest.manual_update_only !== true) fail('APK release/update policy changed unexpectedly.');

const releasePhase = Number(String(release.currentGameBuild || '').match(/PHASE-(\d+)/)?.[1] || 0);
if (releasePhase < 355) fail('Android release build regressed below Phase 355.');
if (!String(release.webEntry || '').includes('v=phase355')) fail('Android web entry no longer targets its certified release.');
if (release.releaseReady !== false || release.apkUrl !== '' || release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) fail('Android release gate is unsafe.');

if (!androidEntry.includes('PHASE-355-ANDROID-RUNTIME-SMOOTHNESS-HARDENING-LOCK')) fail('Android entry build changed outside the Android release lane.');
if (!androidEntry.includes('phase340_platform_core_loader.js?v=phase355')) fail('Android platform loader version changed unexpectedly.');
if (!androidEntry.includes('phase354_android_full_game_release_acceptance_lock.js')) fail('Android full-game acceptance module is missing.');
if (!standardEntry.includes('phase340_platform_core_loader.js?v=phase356')) fail('Quest/PC platform loader is not on Phase 356.');
if (!standardEntry.includes('PHASE-356-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK')) fail('Quest/PC entry build marker is missing.');

console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-348-INGAME-PLAYER-AVATAR-PRESENCE-PERFORMANCE-LOCK',
  globalBuild: gameManifest.build,
  androidReleaseBuild: release.currentGameBuild,
  platformVersion,
  verifiedModels: ['eric', 'claudia'],
  budgets: {
    android: { updateHz: 24, animationHz: 18, equipment: 6 },
    quest: { updateHz: 30, animationHz: 24, equipment: 5 },
    desktop: { updateHz: 60, animationHz: 30, equipment: 8 }
  },
  camera3Excluded: true,
  apkLocked: true
}, null, 2));
