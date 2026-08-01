import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const runtime = read('game/modules/phase357_android_table_status_showdown_ante_lock.js');
const directCamera = read('game/modules/phase357_android_direct_camera_seat_fix.js');
const android = read('game/android.html');
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const errors = [];

function requireText(source, needle, label) {
  if (!source.includes(needle)) errors.push(label);
}

requireText(runtime, 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK', 'build-label');
requireText(runtime, 'function desiredSeatCamera', 'close-seat-target');
requireText(runtime, 'metrics.depth * 0.5 + edgeOffset', 'table-edge-distance');
requireText(runtime, 'function moveRigByWorldDelta', 'xr-camera-world-delta-correction');
requireText(runtime, "button.dataset?.ui === 'seat'", 'sit-button-intercept');
requireText(runtime, "button.id === 'svr347Recenter'", 'recenter-button-intercept');
requireText(runtime, 'svr357TurnPanel', 'turn-panel');
requireText(runtime, 'svr357Bets', 'six-player-bet-strip');
requireText(runtime, 'TO CALL', 'amount-to-call-indicator');
requireText(runtime, 'actor?.lastAction', 'last-action-indicator');
requireText(runtime, 'svr357Showdown', 'showdown-panel');
requireText(runtime, 'WINNING CARDS:', 'winning-cards-display');
requireText(runtime, 'winner.label', 'winning-hand-name');
requireText(runtime, 'BOARD:', 'community-board-display');
requireText(runtime, 'ANTE UP • NEXT HAND', 'ante-up-prompt');
requireText(runtime, 'window.SVR_POKER_NEXT_HAND?.()', 'authoritative-next-hand');
requireText(runtime, 'playerBetIndicators === 6', 'six-player-qa');
requireText(runtime, "window.SVR_PHASE357_QA", 'runtime-qa');
requireText(runtime, "window.SVR_PHASE357_RECENTER", 'recenter-api');
requireText(runtime, "window.SVR_PHASE357_ANTE_UP", 'ante-api');

requireText(directCamera, 'PHASE-357-ANDROID-DIRECT-CAMERA-SEAT-FIX', 'direct-camera-build');
requireText(directCamera, 'renderer()?.xr?.isPresenting', 'xr-exclusion');
requireText(directCamera, 'camera.position.x = local.x', 'direct-camera-x');
requireText(directCamera, 'camera.position.z = local.z', 'direct-camera-z');
requireText(directCamera, "'seat-transition' : 'seated-watchdog'", 'seat-transition-correction');
requireText(directCamera, 'window.SVR_PHASE357_DIRECT_CAMERA_CORRECT', 'direct-camera-api');
requireText(directCamera, 'window.SVR_PHASE357_DIRECT_CAMERA_QA', 'direct-camera-qa');

const bootIndex = android.indexOf("await bootPlatform({forcedPlatform:'android'})");
const phase357Index = android.indexOf("phase357_android_table_status_showdown_ante_lock.js?v=phase357");
const directCameraIndex = android.indexOf("phase357_android_direct_camera_seat_fix.js?v=phase357");
if (bootIndex < 0 || phase357Index <= bootIndex) errors.push('phase357-must-load-after-platform-boot');
if (directCameraIndex <= phase357Index) errors.push('direct-camera-fix-must-load-last');
requireText(android, 'data-build="PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK"', 'android-page-build');
requireText(android, 'manifest.json?v=phase357', 'android-manifest-cache-version');

if (manifest.phase !== 357) errors.push('manifest-phase');
if (manifest.build !== 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK') errors.push('manifest-build');
if (!String(manifest.start_url || '').includes('v=phase357')) errors.push('manifest-start-url');
if (release.currentGameBuild !== manifest.build) errors.push('release-manifest-build-mismatch');
if (!String(release.webEntry || '').includes('v=phase357')) errors.push('release-web-entry');
if (release.realDeviceValidation?.phase !== 357 || release.realDeviceValidation?.pending !== true) errors.push('owner-playtest-pending');

if (manifest.apk_version_name !== '0.1.0-rc1' || manifest.apk_version_code !== 1) errors.push('manifest-apk-version');
if (manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-apk-policy');
if (release.apkVersionName !== '0.1.0-rc1' || release.apkVersionCode !== 1) errors.push('release-apk-version');
if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-apk-policy');
if (release.releaseReady !== false || release.apkUrl !== '') errors.push('unverified-apk-exposed');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  pass: true,
  build: manifest.build,
  closeSeat: 'direct-non-xr-camera-to-south-table-edge-with-xr-rig-preserved',
  turnDisplay: ['active player', 'current bet', 'amount to call', 'last action', 'six player bet strip'],
  showdown: ['winner', 'amount won', 'hand name', 'winner hole cards', 'community board'],
  continuation: 'immediate ante-up prompt starts authoritative next hand',
  apk: {
    versionName: release.apkVersionName,
    versionCode: release.apkVersionCode,
    manualUpdateOnly: release.manualUpdateOnly
  }
}, null, 2));
