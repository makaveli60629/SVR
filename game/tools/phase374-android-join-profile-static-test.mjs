import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const android = read('game/modules/phase374_android_join_table_app_recovery_lock.js');
const profileCss = read('site/css/phase374-profile-mobile-recovery.css');
const profileJs = read('site/js/phase374-profile-mobile-recovery.js');

const checks = {
  build: android.includes('PHASE-374-ANDROID-JOIN-TABLE-APP-RECOVERY-LOCK'),
  joinNow: android.includes("'JOIN NOW'"),
  noDealBeforeJoin: android.includes('blockedDeals') && android.includes('installDealGuards'),
  emergencyTable: android.includes('PHASE374_ANDROID_EMERGENCY_TABLE'),
  tableAuthority: android.includes('window.SVR_TABLE_AUTHORITY'),
  frameRecovery: android.includes('longFrameGaps') && android.includes('applyRendererBudget'),
  mobileCanvasSeparated: profileCss.includes('order:1') && profileCss.includes('order:2'),
  noHorizontalMenu: profileCss.includes('overflow:visible!important'),
  mobileControlsGrid: profileCss.includes('.showroom-controls') && profileCss.includes('grid-template-columns'),
  profileAssetRecovery: profileJs.includes('/game/assets/models/eric/eric.fbx?v=phase374'),
  profileQa: profileJs.includes('SVR_PHASE374_PROFILE_QA')
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { build: 'PHASE-374-ANDROID-JOIN-PROFILE-STATIC-GATE', checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
