const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 915, height: 412 },
    userAgent: ANDROID_UA,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });
  const errors = [];
  const failed = [];
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(`page:${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console:${message.text()}`); });
  page.on('requestfailed', (request) => failed.push(`request:${request.url()}::${request.failure()?.errorText || 'failed'}`));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === BASE && response.status() >= 400) failed.push(`http:${response.status()}:${response.url()}`);
  });

  await page.addInitScript(() => {
    localStorage.setItem('svr_phase345_demo_player_v1', JSON.stringify({
      playerId: 'phase366-browser-player',
      displayName: 'LIVE CAM PLAYER',
      email: '',
      role: 'player',
      playMoney: 50000,
      dailyStreak: 2,
      lastRewardClaim: null,
      avatarUrl: null,
      equippedOutfit: {
        schemaVersion: 1,
        modelId: 'eric',
        palette: 'midnight',
        headwear: 'cap',
        eyewear: 'none',
        top: 'jacket',
        shoes: 'sneakers',
        accessory: 'watch'
      },
      inventory: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      demoMode: true
    }));
  });

  await page.goto(`${BASE}/site/profile.html?v=phase366`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE366_PROFILE_CAMERA_QA === 'function', null, { timeout: 30000 });
  const profileInitial = await page.evaluate(() => window.SVR_PHASE366_PROFILE_CAMERA_QA());
  for (const mode of ['portrait', 'outfit', 'orbit', 'full']) {
    await page.click(`[data-camera-mode="${mode}"]`);
    await page.waitForTimeout(100);
  }
  const profileFinal = await page.evaluate(() => ({
    qa: window.SVR_PHASE366_PROFILE_CAMERA_QA_STATE,
    state: window.SVR_PHASE366_PROFILE_CAMERA_STATE,
    mode: document.querySelector('[data-camera-mode][aria-pressed="true"]')?.dataset.cameraMode,
    toolbar: document.querySelectorAll('#svr366LiveCameraToolbar [data-camera-mode]').length,
    vrLink: document.querySelector('#svr366LiveCameraToolbar a[href*="avatar-vr.html"]')?.getAttribute('href'),
    siteLink: document.querySelector('#svr366LiveCameraToolbar a[href*="avatar.html"]')?.getAttribute('href'),
    bodyBuild: document.body.dataset.build
  }));

  await page.goto(`${BASE}/game/android.html?channel=stable&v=phase366`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE366_DEVICE_QA === 'function', null, { timeout: 90000 });
  await page.evaluate(() => window.SVR_PHASE366_DEVICE_CALIBRATE());
  const lobby = await page.evaluate(() => window.SVR_PHASE366_DEVICE_QA());
  await page.evaluate(() => window.SVR_PHASE363_JOIN_TABLE?.('phase366-browser'));
  await page.waitForFunction(() => Boolean(window.SVR_PHASE363_STATE?.joined), null, { timeout: 20000 });
  await page.waitForTimeout(700);
  const seated = await page.evaluate(() => window.SVR_PHASE366_DEVICE_QA());
  await page.setViewportSize({ width: 412, height: 915 });
  await page.waitForTimeout(700);
  const portrait = await page.evaluate(() => window.SVR_PHASE366_DEVICE_QA());

  const result = {
    pass: Boolean(
      profileInitial?.pass
      && profileFinal.qa?.pass
      && profileFinal.mode === 'full'
      && profileFinal.toolbar === 4
      && /avatar-vr\.html/.test(profileFinal.vrLink || '')
      && /avatar\.html/.test(profileFinal.siteLink || '')
      && profileFinal.bodyBuild === 'PHASE-366-ANDROID-PHYSICAL-DEVICE-PROFILE-LIVE-CAMERA-LOCK'
      && lobby?.singleController
      && seated?.singleController
      && seated?.seatedNavigationClean
      && portrait?.viewportWidth === 412
      && portrait?.viewportHeight === 915
      && portrait?.viewportUpdates >= lobby?.viewportUpdates
      && errors.length === 0
      && failed.length === 0
    ),
    profile: { initial: profileInitial, final: profileFinal },
    android: { lobby, seated, portrait },
    errors,
    failed
  };

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.pass) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
