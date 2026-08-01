import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const profileRecovery = read('site/js/phase350-profile-avatar-recovery.js');
const profilePage = read('site/profile.html');
const camera3 = read('game/modules/phase350_camera3_visibility_lighting_lock.js');
const androidDedupe = read('game/modules/phase350_android_controller_dom_deduplication_lock.js');
const platform = read('game/modules/phase340_platform_manifest.js');
const roadmap = read('site/roadmap.html');
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const registry = JSON.parse(read('site/data/public-page-registry.json'));
const errors = [];
const requireText = (source, text, label) => { if (!source.includes(text)) errors.push(label); };

requireText(profileRecovery, "drawFallback", 'profile-fallback-drawing');
requireText(profileRecovery, "AVATAR_MODEL", 'profile-model-timeout');
requireText(profileRecovery, "ResizeObserverFallback", 'profile-resize-observer-fallback');
requireText(profileRecovery, "fallback-ready", 'profile-fallback-status');
requireText(profileRecovery, "SVR_PHASE350_PROFILE_AVATAR_RETRY", 'profile-retry-api');
requireText(profileRecovery, "SVR_PHASE350_PROFILE_AVATAR_QA", 'profile-avatar-qa');
requireText(profilePage, "phase350-profile-avatar-recovery.js?v=phase350", 'profile-recovery-loaded');
if (profilePage.includes('phase346-profile-avatar-preview.js')) errors.push('old-profile-preview-still-loaded');
requireText(profilePage, 'id="avatarRetry"', 'profile-visible-retry-button');

for (const token of [
  'PHASE350_CAMERA3_LIGHTING_ROOT',
  'new THREE.HemisphereLight',
  'new THREE.AmbientLight',
  'new THREE.DirectionalLight',
  'new THREE.PointLight',
  'toneMappingExposure = 1.22',
  'shadowMap.enabled = false',
  'SVR_PHASE350_CAMERA3_QA'
]) requireText(camera3, token, `camera3-${token}`);

for (const token of [
  "const AUTHORITY_ID = 'svr347Root'",
  "#svr326Root",
  "#svr343Hud",
  "new MutationObserver",
  "node.remove",
  "SVR_PHASE350_ANDROID_CONTROLLER_QA",
  "visibleLegacyRoots === 0",
  "externalSticks === 0"
]) requireText(androidDedupe, token, `android-dedupe-${token}`);

requireText(platform, "export const VERSION = 'phase350'", 'platform-version');
requireText(platform, 'phase350_android_controller_dom_deduplication_lock.js', 'android-dedupe-manifest');
requireText(platform, 'phase350_camera3_visibility_lighting_lock.js', 'camera3-lighting-manifest');
requireText(platform, 'dedupeIndex !== normalized.length - 1', 'android-dedupe-final-validator');
requireText(platform, 'lightIndex !== normalized.length - 1', 'camera3-lighting-final-validator');
requireText(platform, 'phase350-android-load-order', 'android-load-order-label');
requireText(platform, 'phase350-camera3-load-order', 'camera3-load-order-label');

requireText(roadmap, 'Phase 351 — Production Account Deployment', 'roadmap-phase351');
requireText(roadmap, 'Phase 352 — Live Presence and Social Lobby', 'roadmap-phase352');
requireText(roadmap, 'Phase 354 — Server-Authoritative Poker Rooms', 'roadmap-phase354');
requireText(roadmap, 'Phase 355 — APK RC2', 'roadmap-phase355');
requireText(roadmap, 'Phase 356 — Shared Production Blueprint', 'roadmap-phase356');

if (registry.build !== 'PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK') errors.push('registry-build');
if (!registry.canonicalPages.some((entry) => entry.path === 'site/roadmap.html' && entry.required === true)) errors.push('roadmap-not-canonical');
if (!registry.canonicalPages.some((entry) => entry.path === 'index.html' && entry.required === true)) errors.push('root-home-not-canonical');

if (manifest.phase !== 350 || manifest.build !== 'PHASE-350-PROFILE-CAMERA3-ANDROID-SITE-INTEGRITY-LOCK') errors.push('manifest-build');
if (release.currentGameBuild !== manifest.build) errors.push('release-build');
if (!release.webEntry.includes('v=phase350') || !release.previewEntry.includes('v=phase350')) errors.push('release-routes');
if (manifest.apk_version_name !== '0.1.0-rc1' || manifest.apk_version_code !== 1) errors.push('apk-version');
if (manifest.release_ready !== false || manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-apk-policy');
if (release.releaseReady !== false || release.apkUrl !== '' || release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-apk-policy');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  build: manifest.build,
  profileAvatar: 'fallback-first-with-bounded-3d-upgrade',
  camera3: 'dedicated-lighting-authority',
  androidController: 'physical-dom-deduplication',
  roadmap: 'phases-351-through-356',
  apkLocked: true
}, null, 2));
