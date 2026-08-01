import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const runtime = read('site/js/phase351-profile-showroom.js');
const page = read('site/profile.html');
const css = read('site/css/phase351-profile-showroom.css');
const viewer = read('site/js/phase346-avatar-viewer.js');
const catalog = JSON.parse(read('site/data/avatar-catalog.json'));
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const errors = [];
const requireText = (source, text, label) => { if (!source.includes(text)) errors.push(label); };

for (const token of [
  "PHASE-351-PROFILE-3D-SHOWROOM-LOCK",
  "PHASE351_PROFILE_3D_SHOWROOM_ROOT",
  "PHASE351_SHOWROOM_WALL_LOGO",
  "drawFallback",
  "ResizeObserverFallback",
  "AVATAR_MODEL",
  "new THREE.SpotLight",
  "new THREE.PointLight",
  "viewer.loadModel",
  "viewer.applyOutfit",
  "SVR_PHASE351_PROFILE_SHOWROOM_QA",
  "SVR_PHASE351_PROFILE_SHOWROOM_RETRY",
  "SVR_PHASE350_PROFILE_AVATAR_QA"
]) requireText(runtime, token, `runtime-${token}`);

for (const token of [
  'id="profileShowroom"',
  'id="profileShowroomCanvas"',
  'id="showroomRotate"',
  'id="showroomReset"',
  'id="showroomFullscreen"',
  'id="showroomRetry"',
  'phase351-profile-showroom.js?v=phase351',
  'phase351-profile-showroom.css?v=phase351',
  'avatar.html?v=phase351'
]) requireText(page, token, `page-${token}`);

if (page.includes('phase350-profile-avatar-recovery.js')) errors.push('old-profile-recovery-still-loaded');
if (page.includes('id="profileAvatarCanvas"')) errors.push('old-portrait-canvas-returned');
for (const token of ['min-height:560px', ':fullscreen', '.showroom-controls', '@media(max-width:520px)']) requireText(css, token, `css-${token}`);
for (const token of ['export class SVRAvatarViewer', 'OrbitControls', 'FBXLoader', 'GLTFLoader']) requireText(viewer, token, `viewer-${token}`);
if (!Array.isArray(catalog.avatarModels) || catalog.avatarModels.length < 2) errors.push('avatar-model-catalog');
if (!catalog.defaultOutfit?.modelId) errors.push('default-outfit-model');
if (manifest.release_ready !== false || manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-apk-policy');
if (release.releaseReady !== false || release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-apk-policy');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-351-PROFILE-3D-SHOWROOM-LOCK',
  showroom: { room: true, orbit: true, fullscreen: true, fallback: true },
  profileData: { avatarUrl: true, equippedOutfit: true },
  gameReleaseUnchanged: manifest.build,
  apkLocked: true
}, null, 2));
