import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const html = read('game/avatar-vr.html');
const runtime = read('game/modules/phase353_vr_avatar_dressing_room_live_pedestal_lock.js');
const entry = read('game/avatar.html');
const catalog = JSON.parse(read('site/data/avatar-catalog.json'));
const registry = JSON.parse(read('site/data/public-page-registry.json'));
const manifest = JSON.parse(read('game/manifest.json'));
const release = JSON.parse(read('game/android-release.json'));
const errors = [];
const requireText = (source, token, label) => { if (!source.includes(token)) errors.push(label); };

for (const token of [
  'avatarVrCanvas',
  'data-preset="0"',
  'data-preset="1"',
  'data-preset="2"',
  'data-preset="3"',
  'Pause Pedestal',
  'Save Avatar',
  'phase353_vr_avatar_dressing_room_live_pedestal_lock.js'
]) requireText(html, token, `html:${token}`);
if (!/\/site\/profile\.html\?v=phase(?:353|3[6-9]\d)/.test(html)) errors.push('html:profile-successor-route');

for (const token of [
  "import { VRButton }",
  'renderer.xr.enabled = true',
  'PHASE353_MOVING_PEDESTAL_ROOT',
  'PHASE353_PEDESTAL_RING',
  'renderer.xr.getController',
  "controller.addEventListener('select'",
  'selectorMeshes.length === 4',
  'account.updateProfile',
  'FBXLoader',
  'GLTFLoader',
  'SVR_PHASE353_QA',
  'SVR_PHASE353_APPLY_PRESET',
  'SVR_PHASE353_SAVE'
]) requireText(runtime, token, `runtime:${token}`);

if (!/\.\/avatar-vr\.html\?v=phase(?:353|3[6-9]\d)/.test(entry)) errors.push('entry-redirect');
if (catalog.avatarModels.length < 2) errors.push('verified-body-count');
if (catalog.presets.length < 4) errors.push('starter-preset-count');
for (const id of ['table-ready', 'scorpion-vip', 'founder', 'social-lounge']) {
  if (!catalog.presets.some((preset) => preset.id === id)) errors.push(`missing-preset:${id}`);
}
if (!registry.canonicalPages.some((item) => item.path === 'game/avatar-vr.html' && item.required === true)) errors.push('vr-room-not-canonical');
if (manifest.apk_version_name !== '0.1.0-rc1' || manifest.apk_version_code !== 1) errors.push('apk-version');
if (manifest.force_update !== false || manifest.show_update_prompt !== false || manifest.manual_update_only !== true) errors.push('manifest-update-policy');
if (release.forceUpdate !== false || release.showUpdatePrompt !== false || release.manualUpdateOnly !== true) errors.push('release-update-policy');

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-353-VR-AVATAR-DRESSING-ROOM-LIVE-PEDESTAL-LOCK',
  currentRoutePhase: Number(html.match(/v=phase(\d+)/)?.[1] || 353),
  verifiedBodies: catalog.avatarModels.map((item) => item.id),
  starterLooks: catalog.presets.slice(0, 4).map((item) => item.id),
  movingPedestal: true,
  webXR: true,
  profileConnected: true,
  apkLocked: true
}, null, 2));
