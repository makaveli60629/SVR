import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const errors = [];
const need = (source, token, label = token) => { if (!source.includes(token)) errors.push(`missing:${label}`); };
const forbid = (source, token, label = token) => { if (source.includes(token)) errors.push(`forbidden:${label}`); };

const matrix = read('matrix.js');
const viewer = read('site/js/phase346-avatar-viewer.js');
const polish = read('site/js/phase370-account-profile-mobile-polish.js');
const css = read('site/css/phase370-account-profile-mobile-clean.css');
const login = read('site/login.html');
const account = read('site/js/phase345-player-account-client.js');
const backend = read('backend/phase345/src/server.js');
const aws = read('infrastructure/aws/phase372-player-account-foundation.yml');
const config = JSON.parse(read('site/config/player-api.json'));
const manifest = JSON.parse(read('docs/SVR_PHASE_369_371_MANIFEST.json'));

need(matrix, 'PHASE-371-PUBLIC-APP-AI-MATRIX-POLISH-LOCK', 'matrix-build');
need(matrix, 'slide-android-app', 'android-app-first-slide');
need(matrix, 'Android Playtest Ready', 'android-banner-copy');
need(matrix, "ai.innerHTML = '<span class=\"ai-dot\"></span><span>AI ACTIVE</span>'", 'ai-active-status');
need(matrix, 'phraseStaggerSeconds = coarsePointer ? 1.05 : 0.88', 'independent-letter-stagger');
need(matrix, 'const spacing = fontSize * 1.28', 'thinner-column-spacing');
need(matrix, 'profileLegendModule: false', 'legend-disabled-state');
forbid(matrix, 'phase356-profile-legend-pedestal.js', 'old-legend-injector');

need(viewer, "POLISH_BUILD = 'PHASE-370-ACCOUNT-PROFILE-AVATAR-MOBILE-POLISH-LOCK'", 'viewer-polish-build');
need(viewer, 'svrTexturedMaterial', 'textured-material-marker');
need(viewer, 'copy.color?.set?.(0xffffff)', 'texture-neutral-color');
need(viewer, 'PHASE370_DEFAULT_ERIC_FALLBACK', 'default-eric-fallback');
need(viewer, 'this.autoRotate = Boolean(autoRotate)', 'avatar-auto-rotate');
need(viewer, 'texturesPreserved', 'texture-audit');

need(polish, 'function installAccountLinks()', 'account-navigation-installer');
need(polish, "login.textContent = 'Login'", 'distinct-login-link');
need(polish, "register.textContent = 'Register'", 'distinct-register-link');
need(polish, "accountHref('login')", 'login-route');
need(polish, "accountHref('register')", 'register-route');
need(polish, 'function menuSignature(links)', 'menu-signature');
need(polish, 'panel.dataset.svr370Signature === signature', 'idempotent-menu-refresh');
need(polish, 'panel.dataset.svr370Signature = signature', 'menu-signature-store');
need(polish, 'menuSignatureReady', 'menu-signature-qa');
need(polish, 'rebuildMenuPanel()', 'mobile-menu-account-sync');
need(polish, 'desktopLoginLinks', 'desktop-login-qa');
need(polish, 'menuLoginLinks', 'mobile-login-qa');
need(polish, 'state.accountLinksInstalled', 'account-links-pass-contract');
need(polish, 'svr370-menu-button', 'mobile-menu');
need(polish, 'SVR LEGEND / ERIC', 'legend-text-cleanup');
need(polish, 'profileShowroomCanvas', 'profile-avatar-portrait');
need(polish, 'Cash App <strong>$SVRhelp</strong>', 'cashapp-handle-notice');
need(polish, 'Never enter a Cash App password, PIN, or card number', 'cashapp-safety-copy');
need(css, '@media(max-width:900px),(pointer:coarse)', 'mobile-breakpoint');
need(css, '.showroom-status-card,.showroom-hint{display:none!important}', 'profile-overlay-cleanup');

need(login, 'id="loginForm"', 'login-display');
need(login, 'id="registerForm"', 'registration-display');
need(login, 'Checking AWS player API', 'aws-login-presentation');
need(login, 'Default avatar: Eric', 'eric-default-presentation');
need(account, "request('/auth/register'", 'secure-register-client');
need(account, "request('/auth/login'", 'secure-login-client');
need(backend, "VALUES(@playerId,@displayName,@email,'player'", 'public-register-player-role');
forbid(login, 'cashappPassword', 'no-cashapp-password-field');
forbid(login, 'cashAppPin', 'no-cashapp-pin-field');
forbid(polish, 'name="cash', 'no-cashapp-form-field');

need(aws, 'AWS::Cognito::UserPool', 'cognito-user-pool');
need(aws, 'AWS::Cognito::UserPoolClient', 'cognito-web-client');
need(aws, 'GroupName: admin', 'protected-admin-group');
need(aws, 'AWS::DynamoDB::Table', 'dynamodb-tables');
need(aws, 'DeletionProtectionEnabled: true', 'aws-deletion-protection');
need(aws, 'PointInTimeRecoveryEnabled: true', 'aws-point-in-time-recovery');
forbid(aws, 'GenerateSecret: true', 'no-public-client-secret');
if (exists('backend/phase370/sql/002_phase370_admin_test_role_assignment.sql')) errors.push('obsolete-azure-role-script-present');
if (config.provider !== 'aws') errors.push('config:provider');
if (config.identity !== 'cognito') errors.push('config:identity');
if (config.database !== 'dynamodb') errors.push('config:database');
if (config.apiBase !== '') errors.push('config:api-endpoint-must-remain-empty-until-approved');

if (manifest.activePhase !== 373) errors.push('manifest:active-phase');
if (manifest.phases?.length !== 6) errors.push('manifest:phase-count');
if (manifest.phases?.find((phase) => phase.phase === 370)?.cashAppCredentialsCollected !== false) errors.push('manifest:cashapp-truth');
if (manifest.phases?.find((phase) => phase.phase === 373)?.seatedTeleportDisabled !== true) errors.push('manifest:phase373-quest-lock');
if (manifest.accounts?.provider !== 'aws' || manifest.accounts?.identity !== 'cognito' || manifest.accounts?.database !== 'dynamodb') errors.push('manifest:aws-authority');
if (manifest.accounts?.azureRetired !== true) errors.push('manifest:azure-retired');
if (manifest.truth?.physicalAndroidPlaytestRequired !== true || manifest.truth?.physicalQuestPlaytestRequired !== true) errors.push('manifest:device-test-truth');

const result = {
  build: 'PHASE-370/371-PROTECTED-BY-PHASE-373-AWS',
  accountNavigation: 'distinct-login-and-register-desktop-and-mobile',
  accountProvider: config.provider,
  identity: config.identity,
  database: config.database,
  activePhase: manifest.activePhase,
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);