import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const phase = read('game/modules/phase364_device_xr_geometry_spawn_lock.js');
const quarantine = read('game/modules/phase364_quest_eric_quarantine_watch.js');
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
requireText(phase, "TABLE_READY_GAP = 0.90");
requireText(phase, "spawnMode: 'table-ready-standing'");
requireText(phase, "scheduleStableSpawn('xr-session-start')");
requireText(phase, "headInsideTable");
requireText(phase, "bounceCorrectionsBlocked");
requireText(phase, "trapAuthority()");
requireText(phase, "optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']");
requireText(phase, "window.SVR_PHASE364_ENTER_VR");
requireText(phase, "window.SVR_PHASE364_LOBBY_SPAWN");
requireText(phase, "window.SVR_PHASE364_SEAT");
requireText(phase, "window.SVR_PHASE364_ANDROID_SEAT");
requireText(phase, "Dealer Eric remains hidden");
requireText(phase, "root.rotation.y = Math.atan2(-dx, -dz)");
forbidText(phase, 'frontZ + 3.15', 'distant Quest lobby spawn');
forbidText(phase, "setTimeout(() => lobbySpawn(true), 180); setTimeout(() => lobbySpawn(true), 850)", 'double forced XR recenter');
forbidText(phase, 'function installControllerRecovery', 'duplicate Phase 364 controller select authority');

requireText(quarantine, 'PHASE-364-QUEST-ERIC-QUARANTINE-WATCH');
requireText(quarantine, 'SVR_PHASE364_SANITIZE_NPCS');
requireText(quarantine, 'window.setInterval(sweep, 260)');
requireText(quarantine, 'SVR_PHASE364_ERIC_QUARANTINE_SWEEP');

requireText(core, 'renderer.xr.setReferenceSpaceType("local-floor")');
requireText(core, 'optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"]');
forbidText(core, 'requiredFeatures:', 'required XR floor feature');

requireText(manifest, "phase364_device_xr_geometry_spawn_lock.js");
requireText(manifest, "phase364-quest-critical-load-order");
if (!/export const VERSION = 'phase3(?:6[4-9]|[7-9][0-9])'/.test(manifest)) throw new Error('Platform version regressed below Phase 364');
if (!/phase(?:364|365)-android-critical-load-order/.test(manifest)) throw new Error('Missing protected Android geometry load-order validator');

const questPhaseIndex = quest.indexOf("phase364_device_xr_geometry_spawn_lock.js?v=phase364");
const questBootIndex = quest.indexOf("phase340_platform_core_loader.js?v=phase364");
const phase361Index = quest.indexOf("phase361_quest_lobby_play_seat_watch_npc_lock.js?v=phase364");
const quarantineIndex = quest.indexOf("phase364_quest_eric_quarantine_watch.js?v=phase364");
if (questPhaseIndex < 0 || questBootIndex <= questPhaseIndex) throw new Error('Quest Phase 364 must load before platform boot');
if (phase361Index < 0 || quarantineIndex <= phase361Index) throw new Error('Eric quarantine watcher must load after Phase 361 NPC creation');
requireText(quest, 'PHASE-364-QUEST-XR-ENTRY-TABLE-FLOOR-SPAWN-LOCK');
requireText(quest, 'SVR_PHASE364_LOBBY_SPAWN');
requireText(quest, 'SVR_PHASE364_ERIC_QUARANTINE_SWEEP');

const androidPhaseMatch = android.match(/phase364_device_xr_geometry_spawn_lock\.js\?v=(phase\d+)/);
const androidBootMatch = android.match(/phase340_platform_core_loader\.js\?v=(phase\d+)/);
if (!androidPhaseMatch || !androidBootMatch) throw new Error('Android Phase 364 geometry or platform loader missing');
const androidPhaseIndex = android.indexOf(androidPhaseMatch[0]);
const androidBootIndex = android.indexOf(androidBootMatch[0]);
if (androidBootIndex <= androidPhaseIndex) throw new Error('Android Phase 364 must load before platform boot');
requireText(android, 'SVR_PHASE364_ALIGN_TABLE');
requireText(android, 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK');
if (!/PHASE-36[4-9]-ANDROID|PHASE-365-ANDROID/.test(android)) throw new Error('Android release label regressed below Phase 364');

if (appManifest.apk_version_name !== '0.1.0-rc1' || appManifest.apk_version_code !== 1) throw new Error('APK lock changed');
if (appManifest.force_update || appManifest.show_update_prompt || !appManifest.manual_update_only) throw new Error('APK prompt policy changed');
if (Number(appManifest.phase || 0) < 364) throw new Error('Manifest phase regressed below 364');
if (appManifest.table_dimensions_meters?.length !== 2.74 || appManifest.table_dimensions_meters?.height !== 0.80 || appManifest.table_dimensions_meters?.depth !== 1.46) throw new Error('Phase 364 table dimensions changed');

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-364-DEVICE-XR-GEOMETRY-SPAWN-LOCK',
  currentPlatformPhase: appManifest.phase,
  tableMeters: [2.74, 0.80, 1.46],
  questSpawn: '0.90m outside south/front rail facing felt',
  xrEntry: 'single stable placement plus inside-table safety recovery',
  xrLocalFloorRequired: false,
  lateEricQuarantine: true,
  apk: `${appManifest.apk_version_name}/${appManifest.apk_version_code}`
}, null, 2));
