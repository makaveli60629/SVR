import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { throw new Error(message); };
const runtime = read('game/modules/phase348_ingame_player_avatar_presence_performance_lock.js');
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
if (phase346Index < 0 || phase348Index <= phase346Index) fail('Phase 348 must load after the Phase 346 profile bridge.');
if (!platform.includes("export const VERSION = 'phase348'")) fail('Platform version is not Phase 348.');
const camera3Block = platform.slice(platform.indexOf('const CAMERA3 ='), platform.indexOf('function unique'));
if (camera3Block.includes('phase348_ingame_player_avatar_presence_performance_lock.js')) fail('Camera 3 must not load Phase 348.');
if (!platform.includes("avatarIndex !== normalized.length - 1")) fail('Android final avatar load-order validation is missing.');

if (gameManifest.phase !== 348) fail('game/manifest.json phase must be 348.');
if (gameManifest.build !== 'PHASE-348-INGAME-PLAYER-AVATAR-PRESENCE-PERFORMANCE-LOCK') fail('Game manifest build mismatch.');
if (gameManifest.apk_version_name !== '0.1.0-rc1' || gameManifest.apk_version_code !== 1) fail('APK version lock changed unexpectedly.');
if (gameManifest.release_ready !== false || gameManifest.force_update !== false || gameManifest.show_update_prompt !== false || gameManifest.manual_update_only !== true) fail('APK release/update policy changed unexpectedly.');

if (release.currentGameBuild !== gameManifest.build) fail('Android release build mismatch.');
if (release.releaseReady !== false || release.apkUrl !== '' || release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) fail('Android release gate is unsafe.');
if (!release.webEntry.includes('v=phase348')) fail('Android web entry is not Phase 348.');

for (const [name, html] of [['android', androidEntry], ['standard', standardEntry]]) {
  if (!html.includes('PHASE-348-INGAME-PLAYER-AVATAR-PRESENCE-PERFORMANCE-LOCK')) fail(`${name} entry build mismatch.`);
  if (!html.includes('phase340_platform_core_loader.js?v=phase348')) fail(`${name} entry loader is not cache-busted to Phase 348.`);
}

console.log(JSON.stringify({
  pass: true,
  build: gameManifest.build,
  platformVersion: 'phase348',
  verifiedModels: ['eric', 'claudia'],
  budgets: {
    android: { updateHz: 24, animationHz: 18, equipment: 6 },
    quest: { updateHz: 30, animationHz: 24, equipment: 5 },
    desktop: { updateHz: 60, animationHz: 30, equipment: 8 }
  },
  camera3Excluded: true,
  apkLocked: true
}, null, 2));
