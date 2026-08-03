import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
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
const roles = read('backend/phase370/sql/002_phase370_admin_test_role_assignment.sql');
const manifest = JSON.parse(read('docs/SVR_PHASE_369_371_MANIFEST.json'));

need(matrix, "PHASE-371-PUBLIC-APP-AI-MATRIX-POLISH-LOCK", 'matrix-build');
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
need(account, "request('/auth/register'", 'secure-register-client');
need(account, "request('/auth/login'", 'secure-login-client');
need(backend, "VALUES(@playerId,@displayName,@email,'player'", 'public-register-player-role');
forbid(login, 'cashappPassword', 'no-cashapp-password-field');
forbid(login, 'cashAppPin', 'no-cashapp-pin-field');
forbid(polish, 'name="cash', 'no-cashapp-form-field');

need(roles, "SET Role = 'admin'", 'admin-role-assignment');
need(roles, "SET Role = 'player'", 'test-player-role-assignment');
need(roles, 'does not create or store passwords', 'role-script-password-safety');
need(roles, 'REPLACE_WITH_ADMIN_EMAIL', 'admin-email-placeholder');
need(roles, 'REPLACE_WITH_TEST_PLAYER_EMAIL', 'test-email-placeholder');

if (manifest.phases?.length !== 4) errors.push('manifest:phase-count');
if (manifest.phases?.find((phase) => phase.phase === 370)?.cashAppCredentialsCollected !== false) errors.push('manifest:cashapp-truth');
if (manifest.phases?.find((phase) => phase.phase === 370)?.adminCredentialsCreated !== false) errors.push('manifest:admin-credential-truth');
if (manifest.truth?.physicalAndroidPlaytestRequired !== true) errors.push('manifest:device-test-truth');

const result = {
  build: 'PHASE-370-ACCOUNT-PROFILE-AVATAR-MOBILE-POLISH-LOCK / PHASE-371-PUBLIC-APP-AI-MATRIX-POLISH-LOCK',
  accountNavigation: 'distinct-login-and-register-desktop-and-mobile',
  errors,
  pass: errors.length === 0
};
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
