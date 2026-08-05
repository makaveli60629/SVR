import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const json = (path) => JSON.parse(read(path));

const root = read('index.html');
const site = read('site/index.html');
const profile = read('site/profile.html');
const avatar = read('site/avatar.html');
const account = read('site/js/phase366-player-account-resilience.js');
const avatarLock = read('site/js/phase384-avatar-site-lock.js');
const catalog = json('site/data/avatar-catalog.json');
const game = read('game/index.html');
const quest = read('game/modules/phase384_quest_quickplay_polish.js');
const phase381 = read('game/modules/phase381_vr_runtime_lock.js');
const android = read('game/android-stable.html');
const manifest = json('game/manifest.json');
const app = json('update/app-version.json');

assert.match(root, /PHASE-384-ERIC-QUEST-ANDROID-POLISH-LOCK/);
assert.match(root, /site\/index\.html\?v=phase384/);
assert.match(site, /PHASE-383-FULL-SITE-HOMEPAGE-RESTORE-LOCK/);
assert.match(profile, /profileShowroomCanvas/);
assert.match(avatar, /avatarCanvas/);
assert.match(account, /DEFAULT_AVATAR_URL/);
assert.match(account, /assets\/models\/eric\/eric\.fbx/);
assert.match(avatarLock, /PHASE-384-ERIC-DEFAULT-AVATAR-SITE-LOCK/);
assert.match(avatarLock, /removeGeneratedEquipment/);
assert.match(avatarLock, /top: 'none'/);
assert.equal(catalog.defaultOutfit.modelId, 'eric');
assert.equal(catalog.defaultOutfit.top, 'none');
assert.equal(catalog.defaultOutfit.shoes, 'none');
assert.equal(catalog.defaultOutfit.accessory, 'none');

assert.match(game, /PHASE-384-QUEST-ERIC-TABLE-QUICKPLAY-POLISH-LOCK/);
assert.match(game, /phase381_vr_runtime_lock/);
assert.match(game, /phase384_quest_quickplay_polish/);
assert.match(phase381, /SVR_PHASE381_PLAY_ERIC/);
assert.match(phase381, /phase368_card_dealer_motion/);
assert.match(quest, /questSingleEric|duplicateEricsHidden|dedupeDealer/);
assert.match(quest, /svrPhase384ExternalSkeletonHidden/);
assert.match(quest, /PHASE384_PROFESSIONAL_SVR_FELT/);
assert.match(quest, /PHASE384_SVR_TABLE_LOGO/);
assert.match(quest, /SVR_PHASE373_STABLE_SEAT/);
assert.match(quest, /SVR_PHASE381_PLAY_ERIC/);

assert.match(android, /PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK/);
assert.match(android, /PHASE-384-ANDROID-ONE-PAGE-3D-CHIP-WINNER-LOCK/);
assert.match(android, /No cards, poker actions, or movement controls appear before joining\./);
assert.match(android, /RANKS=\['2','3','4','5','6','7','8','9','10','J','Q','K','A'\]/);
assert.match(android, /function scoreFive\(cards\)/);
assert.match(android, /function bestHand\(cards\)/);
assert.match(android, /function burn\(\)/);
assert.match(android, /<img src="\/logo\.png" alt="SVR">/);
assert.match(android, /<span class="suit">\$\{suit\}<\/span>/);
assert.doesNotMatch(android, /class="corner br"/);
assert.match(android, /chip-flight/);
assert.match(android, /winnerFlashAndSound:true/);
assert.match(android, /onePageFit:true/);
assert.match(android, /movementControlsWhileSeated:0/);

assert.equal(manifest.build, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK');
assert.equal(manifest.android_one_page_fit, true);
assert.equal(manifest.android_card_back_svr_logo, true);
assert.equal(manifest.android_single_centered_suit, true);
assert.equal(manifest.android_chip_animation, true);
assert.equal(manifest.android_winner_flash_sound, true);
assert.equal(manifest.quest_single_eric_dealer, true);
assert.equal(manifest.quest_external_skeleton_hidden, true);
assert.equal(manifest.quest_svr_logo_on_table, true);
assert.equal(manifest.profile_default_eric, true);
assert.equal(manifest.force_update, false);
assert.equal(manifest.show_update_prompt, false);

assert.equal(app.build, 'PHASE-384-ERIC-QUEST-ANDROID-POLISH-LOCK');
assert.equal(app.gameBuild, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK');
assert.equal(app.apkVersionName, '0.1.0-rc2');
assert.equal(app.apkVersionCode, 2);
assert.equal(app.forceUpdate, false);
assert.equal(app.showUpdatePrompt, false);
assert.equal(app.manualUpdateOnly, true);

console.log(JSON.stringify({
  pass: true,
  build: app.build,
  siteBuild: app.siteBuild,
  profile: { defaultEric: true, generatedBoxClothingDisabled: true },
  quest: { oneEricDealer: true, externalSkeletonHidden: true, dealerMotion: true, feltAndLogo: true, quickPlaySeat: true },
  android: { onePageFit: true, logoCardBack: true, centeredSuit: true, chipAnimation: true, winnerFlashSound: true, threeDimensionalPresentation: true },
  apk: { version: app.apkVersionName, code: app.apkVersionCode, forceUpdate: app.forceUpdate }
}, null, 2));
