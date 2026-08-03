import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const requireText = (content, text, label) => {
  if (!content.includes(text)) throw new Error(`${label}: missing ${text}`);
};
const forbidText = (content, text, label) => {
  if (content.includes(text)) throw new Error(`${label}: forbidden ${text}`);
};

const manifest = read('game/modules/phase340_platform_manifest.js');
const loader = read('game/modules/phase340_platform_core_loader.js');
const runtime = read('game/modules/phase356_android_real_device_freeze_recovery_lock.js');
const android = read('game/android.html');
const matrix = read('matrix.js');
const support = read('support-chat-bot.js');
const profileLegend = read('site/js/phase356-profile-legend-pedestal.js');
const backend = read('backend/phase345/src/server.js');
const release = JSON.parse(read('game/android-release.json'));
const webManifest = JSON.parse(read('game/manifest.json'));
const backendPackage = JSON.parse(read('backend/phase345/package.json'));
const unityBlueprint = JSON.parse(read('docs/PHASE-356-PLATFORM-UNITY-BLUEPRINT.json'));

// The shared manifest may advance for Quest/table-policy successors. Preserve
// the Phase 356 Android runtime contract rather than freezing the global version.
const platformVersion = Number(manifest.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
if (platformVersion < 361) throw new Error('Shared platform version regressed below Phase 361');
if (!/^PHASE-(?:361|36[2-9]|3[7-9]\d)-/.test(manifest.match(/export const BUILD = '([^']+)'/)?.[1] || '')) throw new Error('Shared platform successor build missing');
requireText(manifest, 'phase356_android_real_device_freeze_recovery_lock.js', 'phase356-runtime');
requireText(manifest, 'const ANDROID_DEFERRED = []', 'android-deferred-disabled');
forbidText(manifest.split('const ANDROID_FOUNDATION = [')[1].split('];')[0], 'phase355_android_runtime_smoothness_hardening_lock.js', 'retired-runtime');

const recoveryIndex = manifest.indexOf('phase356_android_real_device_freeze_recovery_lock.js');
const mainIndex = manifest.indexOf("'main.js'", recoveryIndex);
if (recoveryIndex < 0 || mainIndex <= recoveryIndex) throw new Error('Phase 356 recovery must load before main.js');

requireText(loader, "if (state.platform === 'android')", 'android-prewarm-branch');
requireText(loader, "method: 'android-incremental-frame-compilation'", 'android-incremental-shaders');
requireText(loader, "release('phase356-android-real-device-ready')", 'phase356-release');

requireText(runtime, 'inspected < 240', 'bounded-scene-inspection');
requireText(runtime, 'gap > 1800', 'frame-gap-watchdog');
requireText(runtime, 'webglcontextlost', 'webgl-recovery');
requireText(runtime, 'PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS', 'lightweight-avatars');
requireText(runtime, 'renderer.setPixelRatio(target)', 'renderer-budget');
requireText(runtime, "window.SVR_PHASE356_ENTER_LOW_POWER", 'low-power-api');

requireText(android, 'Continue Low Power', 'recovery-button');
requireText(android, 'Reload Table', 'reload-button');
requireText(android, "apkVersionName:'0.1.0-rc1'", 'apk-version-lock');
requireText(android, 'forceUpdate:false', 'force-update-lock');
requireText(android, 'showUpdatePrompt:false', 'update-prompt-lock');

if (release.realDeviceValidation?.pending !== true || release.realDeviceValidation?.ownerPlaytestRequired !== true) throw new Error('Real-device playtest must remain pending');
if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) throw new Error('APK update policy changed');
if (release.apkVersionName !== '0.1.0-rc1' || release.apkVersionCode !== 1) throw new Error('APK version lock changed');
if (Number(webManifest.phase || 0) < 356 || webManifest.apk_version_code !== 1) throw new Error('Web manifest phase/APK regression');
if (Number(webManifest.phase || 0) < 360 || !/^PHASE-(?:360|36[1-9]|3[7-9]\d)-/.test(String(webManifest.build || ''))) throw new Error('Phase 360 or successor Android/web build missing');
const protectedAndroidAuthority = release.protectedAuthorities?.androidTableStatus || release.protectedAndroidAuthority || release.currentGameBuild;
if (protectedAndroidAuthority !== 'PHASE-357') throw new Error('Protected Android Phase 357 authority changed');
if (!android.includes(webManifest.build)) throw new Error('Android page is missing successor release marker');

requireText(matrix, 'phraseIntervalSeconds = reducedMotion ? 18 : coarsePointer ? 12 : 9', 'secret-phrase-slowdown');
requireText(matrix, 'phraseStaggerSeconds', 'secret-letter-stagger');
requireText(matrix, 'phase356-profile-legend-pedestal.js', 'profile-legend-injection');
forbidText(matrix, 'resize();\n  spawnPhrase();', 'no-immediate-secret-phrase');

requireText(profileLegend, '/game/assets/models/eric/eric.fbx', 'verified-legend-model');
requireText(profileLegend, 'PHASE356_LEGEND_PEDESTAL', 'legend-pedestal');
requireText(profileLegend, 'proceduralLegend', 'legend-fallback');
requireText(profileLegend, 'renderer.setPixelRatio', 'profile-mobile-budget');

requireText(support, '/api/ai/support', 'gpt-endpoint');
requireText(support, 'minmax(0,1fr)', 'readable-message-layout');
requireText(support, 'overflow-y:auto', 'scrollable-replies');
requireText(support, 'white-space:pre-wrap', 'reply-line-preservation');
requireText(support, 'platform()', 'platform-context');
requireText(support, 'SVR offline knowledge', 'offline-fallback');

requireText(backend, "import OpenAI from 'openai'", 'openai-sdk');
requireText(backend, "app.post('/api/ai/support'", 'support-api-route');
requireText(backend, 'client.responses.create', 'responses-api');
requireText(backend, 'store: false', 'response-storage-disabled');
requireText(backend, 'OPENAI_API_KEY', 'server-key');
if (!backendPackage.dependencies?.openai) throw new Error('OpenAI package missing');

if (unityBlueprint.phase !== 356 || unityBlueprint.apkPolicy.apkVersionCode !== 1) throw new Error('Unity blueprint lock mismatch');
if (!unityBlueprint.sharedAuthorities.includes('poker-rules')) throw new Error('Poker authority missing from Unity blueprint');

console.log(JSON.stringify({
  pass: true,
  protectedPhase: 356,
  sharedManifestSuccessor: platformVersion,
  currentPhase: webManifest.phase,
  successorWebBuild: webManifest.build,
  protectedAndroidAuthority,
  android: {
    deferredModules: 0,
    shaderPrecompile: 'disabled-on-android',
    lightweightAvatars: 5,
    realDevicePlaytestPending: true,
    apkVersionName: release.apkVersionName,
    apkVersionCode: release.apkVersionCode
  },
  site: {
    matrixSecretIntervalSeconds: { desktop: 9, mobile: 12, reducedMotion: 18 },
    profileLegend: 'Eric local FBX with procedural fallback',
    gptEndpoint: '/api/ai/support',
    readableReplies: true
  }
}, null, 2));
