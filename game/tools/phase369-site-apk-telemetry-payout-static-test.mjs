import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const market = read('site/js/market-ads.js');
const banner = read('site/js/phase369-apk-banner-telemetry.js');
const css = read('site/phase369-apk-banner-telemetry.css');
const payout = read('site/js/phase369-registration-payout-profile.js');
const login = read('site/login.html');
const admin = read('site/admin-app-analytics.html');
const adminJs = read('site/js/phase369-admin-app-analytics.js');
const openapi = read('backend/contracts/phase369-openapi.yaml');
const sql = read('backend/sql/004_app_install_telemetry_payout_profile.sql');
const cfn = read('infrastructure/aws/phase369-app-data-foundation.yml');

const checks = {
  cssLoaded: market.includes('phase369-apk-banner-telemetry.css?v=phase369'),
  bannerLoaded: market.includes('phase369-apk-banner-telemetry.js?v=phase369'),
  firstBanner: banner.includes('slide-00') && banner.includes('SVR POKER APP'),
  updateButton: banner.includes('CHECK FOR UPDATE') && banner.includes('SVR_CHECK_FOR_APP_UPDATE'),
  honestReleaseGate: banner.includes('current.releaseReady && current.apkUrl'),
  fitContain: css.includes('object-fit:contain!important'),
  localTelemetry: banner.includes('svr_phase369_telemetry_queue') && banner.includes('installationId'),
  apiTelemetry: banner.includes('/api/v1/telemetry/events'),
  payoutFields: payout.includes('Cash App tag') && payout.includes('ACH after identity verification'),
  payoutDisabled: payout.includes('automatedPayoutsEnabled: false'),
  loginLoadsPayout: login.includes('phase369-registration-payout-profile.js?v=phase369'),
  adminPrivate: admin.includes('noindex,nofollow') && adminJs.includes('svr_admin_token'),
  noRawIpUi: admin.includes('Raw IP addresses are not displayed'),
  apiContracts: openapi.includes('/api/v1/app/installations/register') && openapi.includes('/api/v1/player/payout-profile'),
  sqlPrivacy: sql.includes('last_ip_hash') && !sql.includes('raw_ip VARCHAR'),
  prizeHold: sql.includes('pending_compliance') && sql.includes('automated_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE'),
  awsFoundation: cfn.includes('AppInstallationsTable') && cfn.includes('PlayerPayoutProfilesTable')
};

const failed = Object.entries(checks).filter(([, pass]) => !pass);
console.log(JSON.stringify({ build: 'PHASE-369-SITE-APK-BANNER-TELEMETRY-PAYOUT-FOUNDATION', checks, pass: failed.length === 0 }, null, 2));
if (failed.length) {
  console.error('Failed:', failed.map(([name]) => name).join(', '));
  process.exit(1);
}
