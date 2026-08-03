import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const profileRecovery = read('site/js/phase350-profile-avatar-recovery.js');
const profilePage = read('site/profile.html');
const profileShowroom = fs.existsSync('site/js/phase351-profile-showroom.js') ? read('site/js/phase351-profile-showroom.js') : '';
const phase356Legend = fs.existsSync('site/js/phase356-profile-legend-pedestal.js') ? read('site/js/phase356-profile-legend-pedestal.js') : '';
const camera3 = read('game/modules/phase350_camera3_visibility_lighting_lock.js');
const androidDedupe = read('game/modules/phase350_android_controller_dom_deduplication_lock.js');
const platform = read('game/modules/phase340_platform_manifest.js');
const matrix = read('matrix.js');
const roadmap = read('site/roadmap.html');
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const registry = JSON.parse(read('site/data/public-page-registry.json'));
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(label); };

for (const [token, label] of [
  ['drawFallback', 'profile-fallback-drawing'],
  ['AVATAR_MODEL', 'profile-model-timeout'],
  ['ResizeObserverFallback', 'profile-resize-observer-fallback'],
  ['fallback-ready', 'profile-fallback-status'],
  ['SVR_PHASE350_PROFILE_AVATAR_RETRY', 'profile-retry-api'],
  ['SVR_PHASE350_PROFILE_AVATAR_QA', 'profile-avatar-qa']
]) need(profileRecovery, token, label);
const originalRecoveryLoaded = profilePage.includes('phase350-profile-avatar-recovery.js?v=phase350');
const showroomLoaded = profilePage.includes('phase351-profile-showroom.js?v=phase351');
if (!originalRecoveryLoaded && !showroomLoaded) errors.push('profile-recovery-successor-missing');
if (showroomLoaded) {
  for (const [token, label] of [
    ['drawFallback', 'showroom-fallback-drawing'],
    ['AVATAR_MODEL', 'showroom-model-timeout'],
    ['ResizeObserverFallback', 'showroom-resize-observer-fallback'],
    ['SVR_PHASE350_PROFILE_AVATAR_RETRY', 'showroom-phase350-retry-alias'],
    ['SVR_PHASE350_PROFILE_AVATAR_QA', 'showroom-phase350-qa-alias']
  ]) need(profileShowroom, token, label);
  need(profilePage, 'id="showroomRetry"', 'profile-visible-retry-button');
} else need(profilePage, 'id="avatarRetry"', 'profile-visible-retry-button');
if (profilePage.includes('phase346-profile-avatar-preview.js')) errors.push('old-profile-preview-still-loaded');
if (Number(manifest.phase || 0) >= 356) {
  need(matrix, 'phase356-profile-legend-pedestal.js', 'phase356-profile-legend-injection');
  need(phase356Legend, 'PHASE356_LEGEND_PEDESTAL', 'phase356-profile-legend-pedestal');
  need(phase356Legend, '/game/assets/models/eric/eric.fbx', 'phase356-profile-verified-model');
  need(phase356Legend, 'proceduralLegend', 'phase356-profile-fallback');
}

for (const token of ['PHASE350_CAMERA3_LIGHTING_ROOT', 'new THREE.HemisphereLight', 'new THREE.AmbientLight', 'new THREE.DirectionalLight', 'new THREE.PointLight', 'toneMappingExposure = 1.22', 'shadowMap.enabled = false', 'SVR_PHASE350_CAMERA3_QA']) need(camera3, token, `camera3-${token}`);
for (const token of ["const AUTHORITY_ID = 'svr347Root'", '#svr326Root', '#svr343Hud', 'new MutationObserver', 'node.remove', 'SVR_PHASE350_ANDROID_CONTROLLER_QA', 'visibleLegacyRoots === 0', 'externalSticks === 0']) need(androidDedupe, token, `android-dedupe-${token}`);

const platformVersion = Number(platform.match(/export const VERSION = 'phase(\d+)'/)?.[1] || 0);
if (platformVersion < 350) errors.push('platform-version-regressed');
for (const [token, label] of [
  ['phase350_android_controller_dom_deduplication_lock.js', 'android-dedupe-manifest'],
  ['phase350_camera3_visibility_lighting_lock.js', 'camera3-lighting-manifest'],
  ['phase350-android-dedupe-not-last', 'android-dedupe-final-validator'],
  ['phase350-camera3-light-not-last', 'camera3-lighting-final-validator'],
  ['phase364-android-critical-load-order', 'android-load-order-label'],
  ['phase350-camera3-load-order', 'camera3-load-order-label'],
  ['deferredManifestFor', 'android-deferred-export'],
  ['const ANDROID_DEFERRED = []', 'phase356-zero-background-work']
]) need(platform, token, label);

const androidFinal = platform.split('const ANDROID_FINAL = [')[1]?.split('];')[0] || '';
if (!androidFinal.trim().endsWith("'modules/phase350_android_controller_dom_deduplication_lock.js'")) errors.push('android-dedupe-not-final-in-array');
const camera3Array = platform.split('const CAMERA3 = [')[1]?.split('];')[0] || '';
if (!camera3Array.trim().endsWith("'modules/phase350_camera3_visibility_lighting_lock.js'")) errors.push('camera3-lighting-not-final-in-array');

for (const [token, label] of [
  ['Phase 351', 'roadmap-phase351'],
  ['Production Account Deployment', 'roadmap-account-deployment'],
  ['Live Presence and Social Lobby', 'roadmap-presence'],
  ['Server-Authoritative Poker Rooms', 'roadmap-poker-authority'],
  ['APK RC2', 'roadmap-apk'],
  ['Shared Production Blueprint', 'roadmap-unity']
]) need(roadmap, token, label);

if (registry.build !== 'PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK') errors.push('registry-build');
if (!registry.canonicalPages.some((entry) => entry.path === 'site/roadmap.html' && entry.required === true)) errors.push('roadmap-not-canonical');
if (!registry.canonicalPages.some((entry) => entry.path === 'index.html' && entry.required === true)) errors.push('root-home-not-canonical');
if (Number(manifest.phase || 0) < 360 || !/^PHASE-(?:360|3[6-9]\d)-/.test(String(manifest.build || ''))) errors.push('phase360-or-successor-manifest');
const protectedAndroidAuthority = release.protectedAndroidAuthority || release.currentGameBuild;
if (protectedAndroidAuthority !== 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK') errors.push('protected-android-authority');
if (manifest.apk_version_name !== '0.1.0-rc1' || manifest.apk_version_code !== 1) errors.push('apk-version');
if (manifest.release_ready !== false || manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-apk-policy');
if (release.releaseReady !== false || release.apkUrl !== '' || release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-apk-policy');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  protectedBuild: 'PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK',
  successorWebBuild: manifest.build,
  protectedAndroidAuthority,
  profileAvatar: Number(manifest.phase || 0) >= 356 ? 'phase356-live-legend-pedestal-over-phase351-showroom' : showroomLoaded ? 'phase351-showroom-successor' : 'phase350-recovery',
  camera3: 'dedicated-lighting-final-authority',
  androidController: 'physical-dom-deduplication-final-authority',
  roadmap: 'ordered-major-milestones',
  apkLocked: true
}, null, 2));
