import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { throw new Error(message); };
const runtime = read('game/modules/phase348_ingame_player_avatar_presence_performance_lock.js');
const androidRuntime = read('game/modules/phase356_android_real_device_freeze_recovery_lock.js');
const platform = read('game/modules/phase340_platform_manifest.js');
const gameManifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const androidEntry = read('game/android.html');
const standardEntry = read('game/index.html');

for (const path of [
  'game/assets/models/eric/eric.fbx',
  'game/assets/models/claudia/claudia.fbx'
]) {
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
for (const token of requiredRuntimeTokens) {
  if (!runtime.includes(token)) fail(`Runtime token missing: ${token}`);
}

if (!runtime.includes('const ACTIVE = !CAMERA3')) fail('Camera 3 exclusion is not explicit.');
if (!runtime.includes("object.name === ROOT_NAME")) fail('Duplicate avatar root protection is missing.');
if (!runtime.includes('new FBXLoader()') || !runtime.includes('new GLTFLoader()')) fail('FBX/GLB loader support is incomplete.');
if (!runtime.includes('THREE.FrontSide')) fail('First-person interior-head protection is missing.');

const phase346Index = platform.indexOf('phase346_player_avatar_profile_bridge.js');
const phase348Index = platform.indexOf('phase348_ingame_player_avatar_presence_performance_lock.js');
const phase349Index = platform.indexOf('phase349_multiplayer_presence_seat_reconnect_lock.js');
if (phase346Index < 0 || phase348Index <= phase346Index) fail('Phase 348 must remain after the Phase 346 profile bridge for Quest and desktop.');
if (phase349Index >= 0 && phase349Index <= phase348Index) fail('Later presence modules must remain after Phase 348 for Quest and desktop.');
const platformVersion = Number(platform.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
if (platformVersion < 348) fail('Platform version regressed below Phase 348.');
const camera3Block = platform.slice(platform.indexOf('const CAMERA3 ='), platform.indexOf('function unique'));
if (camera3Block.includes('phase348_ingame_player_avatar_presence_performance_lock.js')) fail('Camera 3 must not load Phase 348.');
if (!platform.includes('const ANDROID_DEFERRED = []')) fail('Android must disable background FBX avatar loading in Phase 356.');
if (!platform.includes('phase356_android_real_device_freeze_recovery_lock.js')) fail('Android Phase 356 recovery runtime is missing.');
if (!platform.includes('phase356-android-background-deferred-work')) fail('Android zero-background-work validation is missing.');
for (const token of ['PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS', 'PHASE356_BOT_AVATAR_', 'renderer.setPixelRatio(target)', 'inspected < 240']) {
  if (!androidRuntime.includes(token)) fail(`Android lightweight avatar token missing: ${token}`);
}

if (Number(gameManifest.phase || 0) < 348) fail('game/manifest.json phase regressed below 348.');
if (!String(gameManifest.build || '').startsWith('PHASE-')) fail('Game manifest build is missing.');
if (gameManifest.apk_version_name !== '0.1.0-rc1' || gameManifest.apk_version_code !== 1) fail('APK version lock changed unexpectedly.');
if (gameManifest.release_ready !== false || gameManifest.force_update !== false || gameManifest.show_update_prompt !== false || gameManifest.manual_update_only !== true) fail('APK release/update policy changed unexpectedly.');

if (release.currentGameBuild !== 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK') fail('Protected Android Phase 357 authority changed.');
if (release.releaseReady !== false || release.apkUrl !== '' || release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) fail('Android release gate is unsafe.');
if (!release.webEntry.includes('v=phase357')) fail('Protected Android web entry changed unexpectedly.');
if (Number(gameManifest.phase || 0) >= 356 && release.realDeviceValidation?.pending !== true) fail('Real Android validation must remain pending until owner testing.');

if (!androidEntry.includes(gameManifest.build)) fail('Android successor release marker is missing.');
if (!androidEntry.includes('phase340_platform_core_loader.js')) fail('Android platform loader is missing.');
if (Number(gameManifest.phase || 0) >= 354 && !androidEntry.includes('phase354_android_full_game_release_acceptance_lock.js')) fail('Android Phase 354 acceptance module is missing.');
if (!standardEntry.includes('phase340_platform_core_loader.js')) fail('Quest/PC platform loader is missing.');
if (!standardEntry.includes('PHASE-')) fail('Quest/PC entry build marker is missing.');

console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-348-INGAME-PLAYER-AVATAR-PRESENCE-PERFORMANCE-LOCK',
  protectedAndroidAuthority: release.currentGameBuild,
  successorWebBuild: gameManifest.build,
  platformVersion,
  verifiedModels: ['eric', 'claudia'],
  budgets: {
    android: { mode: 'phase356-five-lightweight-table-avatars', fbxBackgroundLoading: false },
    quest: { updateHz: 30, animationHz: 24, equipment: 5 },
    desktop: { updateHz: 60, animationHz: 30, equipment: 8 }
  },
  camera3Excluded: true,
  apkLocked: true
}, null, 2));
