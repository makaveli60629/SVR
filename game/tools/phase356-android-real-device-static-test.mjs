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
const androidRedirect = read('game/android.html');
const androidStable = read('game/android-stable.html');
const matrix = read('matrix.js');
const support = read('support-chat-bot.js');
const sitePortal = read('site/index.html');
const profile = read('site/profile.html');
const profileLegend = read('site/js/phase356-profile-legend-pedestal.js');
const profileWatchdog = read('site/js/phase366-profile-live-camera-watchdog.js');
const backend = read('backend/phase345/src/server.js');
const release = JSON.parse(read('game/android-release.json'));
const webManifest = JSON.parse(read('game/manifest.json'));
const backendPackage = JSON.parse(read('backend/phase345/package.json'));
const unityBlueprint = JSON.parse(read('docs/PHASE-356-PLATFORM-UNITY-BLUEPRINT.json'));

// Preserve the optional Phase 356 full-3D Android recovery module.
const platformVersion = Number(manifest.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
if (platformVersion < 367) throw new Error('Shared platform version regressed below Phase 367');
requireText(manifest, 'phase356_android_real_device_freeze_recovery_lock.js', 'phase356-runtime');
requireText(manifest, 'const ANDROID_DEFERRED = []', 'android-deferred-disabled');
forbidText(manifest.split('const ANDROID_FOUNDATION = [')[1].split('];')[0], 'phase355_android_runtime_smoothness_hardening_lock.js', 'retired-runtime');
const recoveryIndex = manifest.indexOf('phase356_android_real_device_freeze_recovery_lock.js');
const mainIndex = manifest.indexOf("'main.js'", recoveryIndex);
if (recoveryIndex < 0 || mainIndex <= recoveryIndex) throw new Error('Phase 356 recovery must load before main.js in optional 3D mode');

requireText(loader, "if (state.platform === 'android')", 'android-prewarm-branch');
requireText(loader, "method: 'android-incremental-frame-compilation'", 'android-incremental-shaders');
requireText(loader, "release('phase356-android-real-device-ready')", 'phase356-release');
requireText(runtime, 'inspected < 240', 'bounded-scene-inspection');
requireText(runtime, 'gap > 1800', 'frame-gap-watchdog');
requireText(runtime, 'webglcontextlost', 'webgl-recovery');
requireText(runtime, 'PHASE356_ANDROID_LIGHTWEIGHT_TABLE_AVATARS', 'lightweight-avatars');
requireText(runtime, 'renderer.setPixelRatio(target)', 'renderer-budget');
requireText(runtime, 'window.SVR_PHASE356_ENTER_LOW_POWER', 'low-power-api');

// Production Android authority is now the standalone Phase 380 table, so
// obsolete recovery buttons are intentionally not required in the active entry.
requireText(androidRedirect, 'PHASE-354-ANDROID-FULL-GAME-RELEASE-ACCEPTANCE-LOCK', 'full-game-certification');
requireText(androidRedirect, 'android-stable.html?v=phase380', 'stable-redirect');
requireText(androidStable, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK', 'phase380-android');
requireText(androidStable, 'JOIN NOW', 'join-now');
requireText(androidStable, 'movementControlsWhileSeated:0', 'seated-controls-hidden');
requireText(androidStable, 'function scoreFive(cards)', 'deterministic-evaluator');
requireText(androidStable, 'function burnCard()', 'burn-cards');
requireText(androidStable, 'visualViewport', 'visual-viewport');
requireText(androidStable, 'env(safe-area-inset-top)', 'safe-area');
forbidText(androidStable, 'Continue Low Power', 'obsolete-recovery-button');
forbidText(androidStable, 'Reload Table', 'obsolete-reload-button');

if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) throw new Error('APK update policy changed');
if (!release.releaseReady || release.apkVersionName !== '0.1.0-rc2' || release.apkVersionCode !== 2) throw new Error('Current RC2 release contract changed');
if (release.webEntry !== '/game/android-stable.html?v=phase380') throw new Error('Current Android web entry changed');
if (!release.tablePolicy?.joinRequiredBeforeDeal || !release.tablePolicy?.cardsHiddenBeforeJoin) throw new Error('Join-before-deal policy changed');
if (!release.tablePolicy?.deterministicHandEvaluator || !release.tablePolicy?.burnCards) throw new Error('Poker policy changed');
if (webManifest.phase !== 380 || webManifest.build !== 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK') throw new Error('Phase 380 Android manifest authority changed');
if (webManifest.apk_version_name !== '0.1.0-rc2' || webManifest.apk_version_code !== 2) throw new Error('Web manifest RC2 contract changed');
if (!webManifest.release_ready || webManifest.force_update || webManifest.show_update_prompt || !webManifest.manual_update_only) throw new Error('Web manifest APK policy changed');
if (webManifest.quest_runtime_build !== 'PHASE-381-VR-SEAT-ERIC-AUDIO-OVERLAY-LOCK') throw new Error('Phase 381 Quest successor missing');

const phase371MatrixSuccessor = matrix.includes('PHASE-371-PUBLIC-APP-AI-MATRIX-POLISH-LOCK')
  && matrix.includes('phraseLettersIndividuallyStaggered: true')
  && matrix.includes('AI ACTIVE');
const lockedMatrixSuccessor = matrix.includes('phraseStaggerSeconds') && matrix.includes('I LOVE SHY') && matrix.includes('I LOVE SCARLETT');
if (!phase371MatrixSuccessor && !lockedMatrixSuccessor) throw new Error('Locked Matrix presentation missing');
forbidText(matrix, 'resize();\n  spawnPhrase();', 'no-immediate-secret-phrase');

requireText(profile, 'PHASE-374-PROFILE-MOBILE-AVATAR-MENU-RECOVERY-LOCK', 'profile-phase374');
requireText(profile, 'phase366-profile-live-camera-watchdog.js', 'profile-watchdog-route');
requireText(profileLegend, '/game/assets/models/eric/eric.fbx', 'verified-legend-model');
requireText(profileLegend, 'PHASE356_LEGEND_PEDESTAL', 'legend-pedestal');
requireText(profileWatchdog, 'PHASE-366-PROFILE-LIVE-CAMERA-DRESSING-ROOM-RELIABILITY-LOCK', 'watchdog-phase366');

requireText(support, '/api/ai/support', 'gpt-endpoint');
requireText(support, 'SVR offline knowledge', 'offline-fallback');
requireText(sitePortal, 'SVR AI CONCIERGE', 'site-local-ai');
requireText(sitePortal, 'SERVER', 'server-meter');
requireText(sitePortal, 'GAME DATA', 'game-data-meter');
requireText(sitePortal, 'DRESSING ROOM — ERIC', 'eric-dressing-room-link');
requireText(backend, "import OpenAI from 'openai'", 'openai-sdk');
requireText(backend, "app.post('/api/ai/support'", 'support-api-route');
requireText(backend, 'client.responses.create', 'responses-api');
requireText(backend, 'store: false', 'response-storage-disabled');
requireText(backend, 'OPENAI_API_KEY', 'server-key');
if (!backendPackage.dependencies?.openai) throw new Error('OpenAI package missing');

if (unityBlueprint.phase !== 356 || unityBlueprint.apkPolicy.apkVersionCode !== 1) throw new Error('Historical Unity blueprint lock mismatch');
if (!unityBlueprint.sharedAuthorities.includes('poker-rules')) throw new Error('Poker authority missing from Unity blueprint');

console.log(JSON.stringify({
  pass: true,
  protectedPhase: 356,
  sharedManifestSuccessor: platformVersion,
  androidAuthority: webManifest.build,
  questSuccessor: webManifest.quest_runtime_build,
  architecture: 'Phase 380 standalone Android plus protected optional Phase 356 full-3D recovery',
  android: {
    joinRequiredBeforeDeal: true,
    movementControlsWhileSeated: 0,
    apkVersionName: release.apkVersionName,
    apkVersionCode: release.apkVersionCode
  },
  site: {
    matrixLocked: true,
    localAiConcierge: true,
    backendGptEndpoint: '/api/ai/support',
    ericDressingRoom: true,
    serverMeters: true
  }
}, null, 2));
