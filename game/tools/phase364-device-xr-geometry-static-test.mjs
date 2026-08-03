import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const phase = read('game/modules/phase364_device_xr_geometry_spawn_lock.js');
const core = read('game/modules/core_scene.js');
const manifest = read('game/modules/phase340_platform_manifest.js');
const quest = read('game/index.html');
const android = read('game/android.html');
const appManifest = JSON.parse(read('game/manifest.json'));

const requireText = (source, token, label = token) => {
  if (!source.includes(token)) throw new Error(`Missing ${label}`);
};
const forbidText = (source, token, label = token) => {
  if (source.includes(token)) throw new Error(`Forbidden ${label}`);
};

requireText(phase, "length: 2.74");
requireText(phase, "depth: 1.46");
requireText(phase, "height: 0.80");
requireText(phase, "trapAuthority()");
requireText(phase, "optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']");
requireText(phase, "window.SVR_PHASE364_ENTER_VR");
requireText(phase, "window.SVR_PHASE364_LOBBY_SPAWN");
requireText(phase, "window.SVR_PHASE364_SEAT");
requireText(phase, "window.SVR_PHASE364_ANDROID_SEAT");
requireText(phase, "Dealer Eric remains hidden");
requireText(phase, "value.rotation.y = Math.atan2(-dx, -dz)");
forbidText(phase, 'function installControllerRecovery', 'duplicate Phase 364 controller select authority');

requireText(core, 'renderer.xr.setReferenceSpaceType("local-floor")');
requireText(core, 'optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]');
forbidText(core, 'requiredFeatures:', 'required XR floor feature');

requireText(manifest, "VERSION = 'phase364'");
requireText(manifest, "phase364_device_xr_geometry_spawn_lock.js");
requireText(manifest, "phase364-quest-critical-load-order");
requireText(manifest, "phase364-android-critical-load-order");

const questPhaseIndex = quest.indexOf("phase364_device_xr_geometry_spawn_lock.js?v=phase364");
const questBootIndex = quest.indexOf("phase340_platform_core_loader.js?v=phase364");
if (questPhaseIndex < 0 || questBootIndex <= questPhaseIndex) throw new Error('Quest Phase 364 must load before platform boot');
requireText(quest, 'PHASE-364-QUEST-XR-ENTRY-TABLE-FLOOR-SPAWN-LOCK');
requireText(quest, 'SVR_PHASE364_LOBBY_SPAWN');

const androidPhaseIndex = android.indexOf("phase364_device_xr_geometry_spawn_lock.js?v=phase364");
const androidBootIndex = android.indexOf("phase340_platform_core_loader.js?v=phase364");
if (androidPhaseIndex < 0 || androidBootIndex <= androidPhaseIndex) throw new Error('Android Phase 364 must load before platform boot');
requireText(android, 'SVR_PHASE364_ALIGN_TABLE');
requireText(android, 'PHASE-364-ANDROID-TABLE-FLOOR-SEAT-ALIGNMENT-LOCK');

if (appManifest.apk_version_name !== '0.1.0-rc1' || appManifest.apk_version_code !== 1) throw new Error('APK lock changed');
if (appManifest.force_update || appManifest.show_update_prompt || !appManifest.manual_update_only) throw new Error('APK prompt policy changed');
if (appManifest.phase !== 364) throw new Error('Manifest phase is not 364');

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-364-DEVICE-XR-GEOMETRY-SPAWN-LOCK',
  tableMeters: [2.74, 0.80, 1.46],
  xrLocalFloorRequired: false,
  apk: `${appManifest.apk_version_name}/${appManifest.apk_version_code}`
}, null, 2));
