import fs from 'node:fs';
const read=path=>fs.readFileSync(path,'utf8');
const app=read('game/app.html'),site=read('site/index.html'),logic=read('game/modules/app-v1.js');
const release=JSON.parse(read('update/app-v1-release.json')),tournaments=JSON.parse(read('game/data/tournaments-v1.json'));
const ids=[...app.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
const checks={
  versionOne:release.productVersion==='1.0.0'&&release.web.versionCode===10000,
  optionalUpdates:release.mandatory===false&&release.policy.interruptActiveHand===false,
  serviceWorkerUpdater:logic.includes('registration.update()'),
  singleAppDownload:(app.match(/id="appDownload"/g)||[]).length===1,
  noDuplicateIds:new Set(ids).size===ids.length,
  compactTournamentList:tournaments.tournaments.length>0&&tournaments.tournaments.length<=3,
  prototypeTruth:tournaments.prototype===true&&tournaments.sharedRegistrationBackendLive===false,
  siteHasSingleGetApp:(site.match(/>Get the App</g)||[]).length===1,
  noFloatingAppDownload:!site.includes('phase383-mobile-dock')&&!site.includes('Download APK RC2')
};
const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
console.log(JSON.stringify({build:'SVR-POKER-V1-PROTOTYPE',checks,failed},null,2));
if(failed.length)process.exit(1);
