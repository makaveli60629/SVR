import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const app=read('game/app.html'),site=read('site/index.html'),siteLogic=read('site/phase392-site-polish.js'),logic=read('game/modules/app-v1.js');
const release=JSON.parse(read('update/app-v1-release.json')),tournaments=JSON.parse(read('game/data/tournaments-v1.json'));
const ids=[...app.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
const checks={
  versionOne:release.productVersion==='1.0.0'&&release.web.versionCode===10000,
  optionalUpdates:release.mandatory===false&&release.policy.interruptActiveHand===false,
  nativeReleaseLocked:release.releaseLocked===true&&release.nativeApkRebuild===false,
  serviceWorkerUpdater:logic.includes('registration.update()'),
  remembersDismissal:logic.includes('svr_dismissed_update_code'),
  singleAppDownload:(app.match(/id="appDownload"/g)||[]).length===1,
  noDuplicateIds:new Set(ids).size===ids.length,
  compactTournamentList:tournaments.tournaments.length>0&&tournaments.tournaments.length<=3,
  prototypeTruth:tournaments.prototype===true&&tournaments.sharedRegistrationBackendLive===false,
  siteHeaderAppButton:(siteLogic.match(/phase445-app-button/g)||[]).length>=2,
  noDuplicateSiteAppPromotions:!site.includes('../game/app.html'),
  noFloatingAppDownload:!site.includes('phase383-mobile-dock')&&!site.includes('Download APK RC2')&&!siteLogic.includes("id='phase392FloatingTools'")
};
const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
console.log(JSON.stringify({build:'PHASE-445-V1-RELEASE-CHANNEL-HARDENING',checks,failed},null,2));
if(failed.length)process.exit(1);
