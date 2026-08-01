import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const status = JSON.parse(read('docs/SVR_RELEASE_STATUS.json'));
const android = JSON.parse(read('game/android-release.json'));
const quest = JSON.parse(read('game/quest-release.json'));
const manifest = JSON.parse(read('game/manifest.json'));
const roadmap = read('site/roadmap.html');
const errors = [];

const requireText = (source, text, label) => {
  if (!source.includes(text)) errors.push(label);
};

if (status.projectPhase !== 359 || status.build !== 'PHASE-359-RELEASE-CONSOLIDATION-BLOCKER-LOCK') errors.push('status-build');
if (status.platforms?.androidWeb?.phase !== 357) errors.push('android-phase');
if (status.platforms?.questWebXR?.phase !== 358) errors.push('quest-phase');
if (status.platforms?.camera3?.status !== 'spectator-only') errors.push('camera3-truth');
if (status.gameAuthority?.serverAuthoritativePoker !== false) errors.push('server-poker-overclaim');
if (status.gameAuthority?.serverAuthoritativeCards !== false) errors.push('server-card-overclaim');
if (status.gameAuthority?.serverAuthoritativeBalances !== false) errors.push('server-balance-overclaim');
if (status.presence?.pokerStateSynchronized !== false) errors.push('presence-overclaim');
if (status.accounts?.productionHttpsDeployment !== 'blocked-external-infrastructure') errors.push('account-deployment-truth');
if (status.presence?.productionHttpsDeployment !== 'blocked-external-infrastructure') errors.push('presence-deployment-truth');
if (!Array.isArray(status.remainingExternalGates) || status.remainingExternalGates.length < 7) errors.push('external-gates');
for (const gate of ['ANDROID_REAL_DEVICE','QUEST_PHYSICAL_ACCEPTANCE','PRODUCTION_ACCOUNT_DEPLOYMENT','PRODUCTION_PRESENCE_DEPLOYMENT','SERVER_AUTHORITATIVE_POKER','APK_RC2','UNITY_PRODUCTION_CLIENT']) {
  if (!status.remainingExternalGates?.some((entry) => entry.id === gate)) errors.push(`missing-gate-${gate}`);
}

if (status.androidApk?.versionName !== '0.1.0-rc1' || status.androidApk?.versionCode !== 1) errors.push('status-apk-version');
if (status.androidApk?.releaseReady !== false || status.androidApk?.forceUpdate !== false || status.androidApk?.showUpdatePrompt !== false || status.androidApk?.manualUpdateOnly !== true) errors.push('status-apk-policy');
if (android.apkVersionName !== '0.1.0-rc1' || android.apkVersionCode !== 1) errors.push('android-apk-version');
if (android.releaseReady !== false || android.forceUpdate !== false || android.showUpdatePrompt !== false || android.manualUpdateOnly !== true) errors.push('android-apk-policy');
if (android.currentGameBuild !== 'PHASE-357-ANDROID-TABLE-STATUS-SHOWDOWN-ANTE-LOCK') errors.push('android-release-build');
if (android.realDeviceValidation?.pending !== true) errors.push('android-physical-pending');
if (quest.phase !== 358 || quest.build !== 'PHASE-358-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK') errors.push('quest-release-build');
if (quest.browserAcceptance?.passed !== true || quest.browserAcceptance?.totalTableChips !== 6000 || quest.browserAcceptance?.nextHand?.advanced !== true) errors.push('quest-browser-acceptance');
if (quest.physicalQuestAcceptance?.pending !== true || quest.physicalQuestAcceptance?.requiresHeadset !== true) errors.push('quest-physical-pending');
if (quest.productTruth?.serverAuthoritativePoker !== false) errors.push('quest-server-overclaim');
if (manifest.phase !== 357 || manifest.build !== android.currentGameBuild) errors.push('android-manifest-authority');

requireText(roadmap, 'PHASE-359-RELEASE-CONSOLIDATION-BLOCKER-LOCK', 'roadmap-build');
requireText(roadmap, '../game/android.html?channel=stable&v=phase357', 'roadmap-android-route');
requireText(roadmap, '../game/index.html?platform=quest&v=phase358', 'roadmap-quest-route');
requireText(roadmap, '../game/camera3.html?v=phase350', 'roadmap-camera3-route');
requireText(roadmap, 'Server-authoritative multiplayer is not complete', 'roadmap-server-truth');
requireText(roadmap, 'Production accounts', 'roadmap-accounts');
requireText(roadmap, 'Presence and seats', 'roadmap-presence');
requireText(roadmap, 'Native Android APK RC2', 'roadmap-apk');
requireText(roadmap, 'Unity production client', 'roadmap-unity');
requireText(roadmap, '/docs/SVR_RELEASE_STATUS.json', 'roadmap-machine-record');

for (const forbidden of [
  /AZURE_SQL_CONNECTION_STRING\s*=\s*Server=/i,
  /OPENAI_API_KEY\s*=\s*sk-/i,
  /ADMIN_JWT_SECRET\s*=\s*[^\s<]{16,}/i,
  /STRIPE_SECRET_KEY\s*=\s*sk_live_/i,
  /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i
]) {
  if (forbidden.test(roadmap) || forbidden.test(JSON.stringify(status))) errors.push(`secret-pattern-${forbidden.source}`);
}

if (errors.length) {
  console.error(JSON.stringify({ pass: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  pass: true,
  build: status.build,
  completedWebReleases: {
    android: status.platforms.androidWeb,
    quest: {
      ...status.platforms.questWebXR,
      certifiedStartupMs: quest.browserAcceptance.startupMs,
      chipConservation: quest.browserAcceptance.totalTableChips
    },
    camera3: status.platforms.camera3
  },
  externalGates: status.remainingExternalGates.map((entry) => entry.id),
  productTruth: {
    localPlayMoney: true,
    serverAuthoritativePoker: false,
    physicalAndroidPending: true,
    physicalQuestPending: true,
    apkRc2Blocked: true
  }
}, null, 2));
