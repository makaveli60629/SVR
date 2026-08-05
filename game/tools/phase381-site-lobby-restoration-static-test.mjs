import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const root = read('index.html');
const hooks = read('site-public-hooks.js');
const site = read('site/index.html');
const androidLobby = read('game/android-lobby.html');
const androidStable = read('game/android-stable.html');
const quest = read('game/index.html');
const originalTable = read('game/modules/phase380_original_table_authority_lock.js');
const watchdog = read('game/modules/phase381_table_lobby_watchdog_lock.js');
const deploy = read('.github/workflows/deploy.yml');
const pages = read('.github/workflows/pages-live-publish.yml');
const gameManifest = JSON.parse(read('game/manifest.json'));
const androidRelease = JSON.parse(read('game/android-release.json'));
const update = JSON.parse(read('update/app-version.json'));
const webManifest = JSON.parse(read('manifest.webmanifest'));
const playerApi = JSON.parse(read('site/config/player-api.json'));

const requireText = (value, token, label) => assert.ok(value.includes(token), `${label} missing ${token}`);

requireText(root, 'SVR Poker | Public Launch Page', 'public launch');
requireText(root, 'id="binary-rain"', 'public launch');
requireText(root, 'Preview Site', 'public launch');
requireText(root, 'Preview Game', 'public launch compatibility label');
requireText(root, 'Launch VR Room', 'public launch');
requireText(root, 'data-svr-status="server"', 'server indicator');
requireText(root, 'data-svr-status="database"', 'database indicator');
requireText(root, 'data-svr-status="admin"', 'admin indicator');
requireText(root, 'data-svr-status="ai"', 'AI indicator');
requireText(root, 'data-svr-ask-ai', 'Ask AI button');
requireText(root, 'support-chat-bot.js?v=phase381', 'AI runtime');
assert.ok(!root.includes('DOWNLOAD APK'), 'APK must remain an interior-site button rather than replace the public launch page');

requireText(hooks, 'PHASE-381-PUBLIC-SERVER-DATABASE-ADMIN-AI-STATUS-LOCK', 'status bridge');
requireText(hooks, "admin === 'online' ? 'standby' : 'online'", 'admin/AI handoff');
requireText(hooks, "paintOne('ai', ai", 'AI indicator paint');
requireText(hooks, '/deploy-health.json', 'server probe');
requireText(hooks, '/site/config/player-api.json', 'database config');
requireText(hooks, "paintOne('database', 'standby', 'Database Standby')", 'truthful unconfigured database status');
requireText(hooks, "url.pathname = '/game/android-lobby.html'", 'Android lobby link normalization');
requireText(hooks, 'SVR_PHASE381_OPEN_AI_SUPPORT', 'AI open API');

requireText(site, 'PHASE-381-FULL-WEBSITE-HOMEPAGE-RESTORATION-LOCK', 'full homepage');
for (const token of ['Home','Login','Register','Profile','Store','Tournaments','About','Sponsors','Advertising','Billboards','Membership','Impact','Roadmap','Contact']) requireText(site, `>${token}<`, 'website navigation');
requireText(site, 'SVR Website', 'full website section');
requireText(site, 'Live Lobby View', 'live lobby preview');
requireText(site, 'Open Android Lobby', 'Android lobby button');
requireText(site, 'Download APK', 'app download button');
requireText(site, 'Ask AI Support', 'site AI support');
requireText(site, 'visitor-message-form', 'message form');
assert.ok(site.indexOf('SVR Website') > site.indexOf('Download APK'), 'app button must be one homepage feature, not the entire website');

requireText(androidLobby, 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK', 'Android lobby');
requireText(androidLobby, 'ENTER VR LOBBY', 'Android lobby entry');
requireText(androidLobby, "bootPlatform({ forcedPlatform:'android' })", 'Android platform boot');
requireText(androidLobby, 'phase363_android_integrated_lobby_audio_gyro_bankroll_lock.js', 'Android lobby/audio authority');
requireText(androidLobby, 'phase365_android_seated_ux_branding_gyro_alignment_lock.js', 'Android seated UX');
requireText(androidLobby, 'phase380_original_table_authority_lock.js', 'Android original table');
requireText(androidLobby, 'phase381_table_lobby_watchdog_lock.js', 'Android table watchdog');
requireText(androidLobby, 'unlockSound()', 'Android audio unlock');
requireText(androidLobby, "SVR_PHASE363_LEAVE_TABLE?.('phase381-lobby-start')", 'Android starts in lobby');
requireText(androidLobby, '/game/android-stable.html?v=phase381', 'low-power recovery route');

requireText(androidStable, 'PHASE-380-ANDROID-PLAYABLE-POKER-PRESENTATION-LOCK', 'protected low-power build');
requireText(androidStable, 'PHASE-381-ANDROID-SOUND-COMPACT-LOGO-CARDS-LOCK', 'low-power successor');
requireText(androidStable, 'No cards, poker actions, or movement controls appear before joining.', 'prejoin protection');
requireText(androidStable, "RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A']", 'card ranks');
requireText(androidStable, 'function scoreFive(cards)', 'hand evaluator');
requireText(androidStable, 'function bestHand(cards)', 'seven-card evaluator');
requireText(androidStable, 'function burn()', 'burn cards');
requireText(androidStable, "<img src=\"/logo.png\" alt=\"SVR card back\">", 'logo card backs');
requireText(androidStable, 'bot-name', 'compact opponent name');
requireText(androidStable, 'bot-stack', 'compact opponent stack');
requireText(androidStable, 'bot-cards', 'two opponent cards');
requireText(androidStable, 'function tone(', 'poker sound');
requireText(androidStable, 'SOUND ON', 'sound control');
requireText(androidStable, 'movementControlsWhileSeated:0', 'seated movement lock');

requireText(quest, 'phase381_table_lobby_watchdog_lock.js?v=phase381', 'Quest table watchdog import');
requireText(quest, 'SVR_PHASE381_TABLE_WATCHDOG_TICK', 'Quest watchdog use');
requireText(originalTable, "params.get('platform') === 'android'", 'original table Android activation');
requireText(originalTable, 'if (!table.parent && worldRoot()?.isObject3D) worldRoot().add(table)', 'original table reattach');
requireText(watchdog, 'PHASE-381-ANDROID-QUEST-LOBBY-TABLE-WATCHDOG-LOCK', 'watchdog build');
requireText(watchdog, "setInterval(() => tick('interval'), 1800)", 'continuous table recovery');
requireText(watchdog, 'PHASE379_PROCEDURAL_TABLE_AUTHORITY', 'fallback cleanup');
requireText(watchdog, 'SVR_PHASE381_TABLE_WATCHDOG_QA', 'watchdog QA');

assert.equal(gameManifest.phase, 381);
assert.equal(gameManifest.start_url, './android-lobby.html?v=phase381');
assert.equal(gameManifest.android_canonical_entry, './android-lobby.html?v=phase381');
assert.equal(gameManifest.android_low_power_entry, './android-stable.html?v=phase381');
assert.equal(gameManifest.android_sound_enabled, true);
assert.equal(gameManifest.android_compact_opponent_panels, true);
assert.equal(gameManifest.android_logo_card_backs, true);
assert.equal(gameManifest.force_update, false);
assert.equal(gameManifest.show_update_prompt, false);
assert.equal(gameManifest.manual_update_only, true);

assert.equal(androidRelease.webEntry, '/game/android-lobby.html?v=phase381');
assert.equal(androidRelease.lowPowerEntry, '/game/android-stable.html?v=phase381');
assert.equal(androidRelease.tablePolicy.lobbyBeforeSeating, true);
assert.equal(androidRelease.tablePolicy.soundEnabled, true);
assert.equal(androidRelease.tablePolicy.twoLogoCardBacksPerOpponent, true);
assert.equal(androidRelease.forceUpdate, false);
assert.equal(androidRelease.showUpdatePrompt, false);
assert.equal(androidRelease.manualUpdateOnly, true);

assert.equal(update.build, 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK');
assert.equal(update.androidLobbyUrl, '/game/android-lobby.html?v=phase381');
assert.equal(update.siteUrl, '/site/index.html?v=phase381');
assert.equal(update.fullWebsiteHomepage, true);
assert.equal(update.publicStatusLights, true);
assert.equal(update.aiOnlineWhenAdminOffline, true);

assert.equal(webManifest.start_url, '/?source=pwa-phase381');
assert.ok(webManifest.shortcuts.some((shortcut) => shortcut.url === '/game/android-lobby.html?v=phase381'));
assert.ok(webManifest.shortcuts.some((shortcut) => shortcut.url === '/site/index.html?v=phase381'));
assert.equal(playerApi.provider, 'aws');
assert.equal(playerApi.database, 'dynamodb');
assert.equal(playerApi.identity, 'cognito');

requireText(deploy, '/support-chat-bot.js', 'deploy sparse checkout');
requireText(deploy, '/site-local-counter.js', 'deploy sparse checkout');
requireText(deploy, 'cp source/support-chat-bot.js publish/support-chat-bot.js', 'AI deploy copy');
requireText(deploy, 'cp source/site-local-counter.js publish/site-local-counter.js', 'site counter deploy copy');
requireText(deploy, 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK', 'deploy health');
requireText(deploy, '"fullWebsiteHomepage": true', 'deploy homepage proof');
requireText(deploy, '"questTableWatchdog": true', 'deploy table proof');
requireText(pages, 'PHASE-381-FULL-WEBSITE-HOMEPAGE-RESTORATION-LOCK', 'Pages homepage verification');
requireText(pages, 'PHASE-381-ANDROID-VR-LOBBY-SOUND-TABLE-LOCK', 'Pages Android lobby verification');

console.log(JSON.stringify({
  pass: true,
  build: 'PHASE-381-SITE-LOBBY-RESTORATION-LOCK',
  public: { serverStatus: true, databaseStatus: true, adminAiHandoff: true, askAi: true },
  website: { fullHomepage: true, appIsButton: true, liveLobbyPreview: true },
  android: { vrLobbyFirst: true, sound: true, compactOpponentPanels: true, logoCardBacks: true, lowPowerRecovery: true },
  quest: { originalTableFirst: true, continuousTableWatchdog: true },
  backend: { provider: playerApi.provider, database: playerApi.database, configured: Boolean(playerApi.apiBase) }
}, null, 2));
