import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const join=read('game/modules/phase368_android_join_card_gyro_ux_lock.js');
const tournament=read('game/modules/phase368_android_spectator_tournament_voice_lock.js');
const android=read('game/android.html');
const manifest=JSON.parse(read('game/manifest.json'));
const release=JSON.parse(read('game/android-release.json'));
const profilePatch=read('site/js/phase368-profile-avatar-texture-fit-lock.js');
const demoBridge=read('site/js/phase345-demo-activity-persistence.js');
const checks={
  joinBuild:join.includes('PHASE-368-ANDROID-JOIN-CARD-GYRO-UX-LOCK'),
  tournamentBuild:tournament.includes('PHASE-368-ANDROID-SPECTATOR-TOURNAMENT-VOICE-LOCK'),
  androidLoadsAfter367:android.indexOf('phase368_android_join_card_gyro_ux_lock.js?v=phase368')>android.indexOf('phase367_android_physical_device_viewport_touch_acceptance_lock.js?v=phase367'),
  tournamentLoadsLast:android.indexOf('phase368_android_spectator_tournament_voice_lock.js?v=phase368')>android.indexOf('phase368_android_join_card_gyro_ux_lock.js?v=phase368'),
  singleJoinControl:join.includes('singleJoinControl')&&join.includes("'SIT AT TABLE'")&&join.includes("'JOIN TABLE'"),
  sticksHidden:join.includes('svr368-seated #svr347Move')&&join.includes('svr368-seated #svr347Look'),
  gyroPreserved:manifest.gyro_touch_hybrid===true&&manifest.android_gyro_head_look===true,
  tenRank:join.includes("v==='T'?'10':v"),
  cardCorners:join.includes('svr368-corner top')&&join.includes('svr368-corner bottom')&&join.includes('svr368-pip'),
  spectator:tournament.includes('PHASE368_SPECTATOR_CARD_TAGS')&&tournament.includes('const reveal=!joined()'),
  tournament:tournament.includes('single-funded-player')&&tournament.includes('♛')&&tournament.includes('15000'),
  profileTextures:profilePatch.includes('restoreRealTextures')&&profilePatch.includes("top: 'none'"),
  profilePatchLoadsFirst:demoBridge.includes("await import('./phase368-profile-avatar-texture-fit-lock.js?v=phase368')")&&demoBridge.indexOf('await import')<demoBridge.indexOf('const ACTIVITY_KEY'),
  apkPolicy:release.apkVersionName==='0.1.0-rc1'&&release.apkVersionCode===1&&release.forceUpdate===false&&release.showUpdatePrompt===false&&release.manualUpdateOnly===true,
  multiplayerTruth:release.avatarProfileProtection?.cloudBankrollAuthority===false&&tournament.includes('serverAuthoritativeMultiplayer:false')
};
const failed=Object.entries(checks).filter(([,v])=>!v);
console.log(JSON.stringify({build:'PHASE-368-ANDROID-TOURNAMENT-AVATAR-CARD-UX-LOCK',protectedManifestPhase:manifest.phase,checks,pass:!failed.length},null,2));
if(failed.length){console.error('Failed:',failed.map(([k])=>k).join(', '));process.exit(1)}
