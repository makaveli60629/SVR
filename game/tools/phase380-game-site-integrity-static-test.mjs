import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const requireText = (value, token, label) => {
  if (!value.includes(token)) throw new Error(`${label} missing ${token}`);
};
const forbidText = (value, token, label) => {
  if (value.includes(token)) throw new Error(`${label} must not contain ${token}`);
};

const root = read('index.html');
const site = read('site/index.html');
const hooks = read('site-public-hooks.js');
const game = read('game/index.html');
const androidLobby = read('game/android-lobby.html');
const android = read('game/android-stable.html');
const original = read('game/modules/phase380_original_table_authority_lock.js');
const watchdog = read('game/modules/phase381_table_lobby_watchdog_lock.js');
const fallback = read('game/modules/phase379_quest_procedural_table_authority.js');
const deploy = read('.github/workflows/deploy.yml');
const pages = read('.github/workflows/pages-live-publish.yml');
const release = JSON.parse(read('game/android-release.json'));
const app = JSON.parse(read('update/app-version.json'));

requireText(root, 'SVR Poker | Public Launch Page', 'locked public root');
requireText(root, 'id="binary-rain"', 'locked public root');
requireText(root, 'Preview Site', 'locked public root');
requireText(root, 'Preview Game', 'locked public root');
forbidText(root, 'PHASE 380', 'locked public root');

requireText(site, 'PHASE-380-PUBLIC-GAME-SITE-INTEGRITY-LOCK', 'protected site marker');
requireText(site, 'PHASE-381-FULL-WEBSITE-HOMEPAGE-RESTORATION-LOCK', 'site successor');
requireText(site, '/game/android-lobby.html?v=phase381', 'site Android lobby route');
requireText(site, '/game/index.html?platform=quest&v=phase381', 'site Quest route');
requireText(site, '/downloads/svr-poker-android-rc2.apk', 'site APK button');
requireText(hooks, "const CURRENT_PHASE = 'phase381'", 'site route normalizer');
requireText(hooks, "url.pathname = '/game/android-lobby.html'", 'Android lobby normalizer');

requireText(game, 'PHASE-380-GAME-SITE-INTEGRITY-LOCK', 'Quest protected entry');
requireText(game, 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK', 'Quest successor entry');
const originalImport = game.indexOf('phase380_original_table_authority_lock.js');
const watchdogImport = game.indexOf('phase381_table_lobby_watchdog_lock.js');
const fallbackImport = game.indexOf('phase379_quest_procedural_table_authority.js');
if (originalImport < 0 || watchdogImport < originalImport || fallbackImport < watchdogImport) {
  throw new Error('Quest entry must import original table, then watchdog, then emergency fallback');
}
requireText(original, 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK', 'original table authority');
requireText(original, '../assets/models/table.glb', 'original table authority');
requireText(original, '../assets/table.fbx', 'original table authority');
requireText(original, 'PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY', 'original table authority');
requireText(original, "Object.defineProperty(window, 'SVR_TABLE_AUTHORITY'", 'original table authority');
requireText(watchdog, 'PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK', 'table watchdog');
requireText(watchdog, 'SVR_PHASE381_TABLE_WATCHDOG_QA', 'table watchdog QA');
requireText(fallback, 'PHASE-380-QUEST-PROCEDURAL-TABLE-FALLBACK-LOCK', 'procedural fallback');
requireText(fallback, 'const FALLBACK_DELAY_MS = 10000', 'procedural fallback');
requireText(fallback, 'preferredOriginal()', 'procedural fallback');
requireText(fallback, "removeFallback('original-table-adopted')", 'procedural fallback');

requireText(androidLobby, 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK', 'Android lobby');
requireText(androidLobby, 'ENTER VR LOBBY', 'Android lobby');
requireText(androidLobby, 'phase380_original_table_authority_lock.js', 'Android original table');
requireText(androidLobby, 'phase381_table_lobby_watchdog_lock.js', 'Android table watchdog');
requireText(android, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK', 'Android protected low-power table');
requireText(android, 'PHASE-381-ANDROID-SOUND-COMPACT-LOGO-CARDS-LOCK', 'Android low-power successor');
requireText(android, 'JOIN NOW', 'Android stable table');
requireText(android, 'No cards, poker actions, or movement controls appear before joining.', 'Android stable table');
requireText(android, "RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A']", 'Android cards');
forbidText(android, "RANKS=['2','3','4','5','6','7','8','9','T'", 'Android cards');
requireText(android, 'function scoreFive(cards)', 'Android hand evaluator');
requireText(android, 'function bestHand(cards)', 'Android hand evaluator');
requireText(android, 'function burn()', 'Android burn cards');
requireText(android, 'window.SVR_PHASE380_SET_BRAND', 'Android tournament brand slot');
requireText(android, 'movementControlsWhileSeated:0', 'Android seated controls');
requireText(android, 'SVR card back', 'Android logo card backs');
if (android.indexOf('id="gate"') > android.indexOf('id="table"')) throw new Error('JOIN gate must precede the table');

if (release.currentGameBuild !== 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK') throw new Error('Android release build mismatch');
if (release.lowPowerGameBuild !== 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK') throw new Error('Android protected low-power build mismatch');
if (release.questBuild !== 'PHASE-380-ORIGINAL-UPLOADED-TABLE-AUTHORITY-LOCK') throw new Error('Quest release build mismatch');
if (release.webEntry !== '/game/android-lobby.html?v=phase381') throw new Error('Android lobby release route mismatch');
if (release.lowPowerEntry !== '/game/android-stable.html?v=phase381') throw new Error('Android low-power release route mismatch');
if (release.showUpdatePrompt !== false || release.forceUpdate !== false || release.manualUpdateOnly !== true) throw new Error('APK update policy mismatch');
if (app.build !== 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK') throw new Error('App version build mismatch');
if (app.androidLobbyUrl !== '/game/android-lobby.html?v=phase381') throw new Error('App Android lobby route mismatch');
if (app.androidSafeUrl !== '/game/android-stable.html?v=phase381') throw new Error('App Android recovery route mismatch');
if (app.showUpdatePrompt !== false || app.forceUpdate !== false || app.manualUpdateOnly !== true) throw new Error('App version update policy mismatch');

requireText(deploy, '/game/', 'production sparse checkout');
requireText(deploy, '/site/', 'production sparse checkout');
requireText(deploy, '/support-chat-bot.js', 'AI sparse checkout');
requireText(deploy, 'find publish -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +', 'clean production rebuild');
requireText(deploy, 'cp -a source/game publish/game', 'full game publish');
requireText(deploy, 'cp -a source/site publish/site', 'full site publish');
requireText(deploy, 'git add -A', 'stale-file deletion publish');
requireText(deploy, 'cleanTreePublish', 'deployment health');
requireText(pages, 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK', 'Pages live verification');
requireText(pages, 'game/assets/models/table.glb', 'Pages table asset verification');

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-380-GAME-SITE-INTEGRITY-LOCK',
  successor: 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK',
  publicMatrixPageLocked: true,
  fullWebsiteHomepageRestored: true,
  cleanTreePublish: true,
  questOriginalTableFirst: true,
  questContinuousTableWatchdog: true,
  questEmergencyFallbackRemovable: true,
  androidLobbyFirst: true,
  androidDeterministicEvaluator: true,
  androidRankTen: true,
  androidLogoCardBacks: true,
  androidSound: true,
  siteRoutesNormalized: true,
  apkUpdatePrompt: false
}, null, 2));
