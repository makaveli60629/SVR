'use strict';

const { chromium } = require('playwright');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const url = `${base}/game/android.html?channel=stable&v=phase365&acceptance=phase365`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 915, height: 412 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => errors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console:${message.text()}`);
  });
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE365_QA === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE363_JOIN_TABLE === 'function', null, { timeout: 120000 });
  await page.waitForSelector('#svr347Move', { timeout: 120000 });
  await page.waitForSelector('#svr347Look', { timeout: 120000 });
  await page.waitForFunction(() => Boolean(window.__SVR_CAMERA__ && window.SVR_TABLE_AUTHORITY), null, { timeout: 120000 });

  const lobbyBefore = await page.evaluate(() => ({
    camera: window.__SVR_CAMERA__.position.toArray(),
    moveDisplay: getComputedStyle(document.querySelector('#svr347Move')).display,
    lookDisplay: getComputedStyle(document.querySelector('#svr347Look')).display,
    rootCount: document.querySelectorAll('#svr347Root').length,
    moveCount: document.querySelectorAll('#svr347Move').length,
    lookCount: document.querySelectorAll('#svr347Look').length
  }));

  const moveBox = await page.locator('#svr347Move').boundingBox();
  if (!moveBox) throw new Error('MOVE stick has no layout box');
  await page.mouse.move(moveBox.x + moveBox.width / 2, moveBox.y + moveBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(moveBox.x + moveBox.width / 2 - moveBox.width * 0.28, moveBox.y + moveBox.height / 2, { steps: 4 });
  await page.waitForTimeout(520);
  await page.mouse.up();

  const lobbyAfter = await page.evaluate(() => ({ camera: window.__SVR_CAMERA__.position.toArray() }));
  const movementDistance = Math.hypot(
    lobbyAfter.camera[0] - lobbyBefore.camera[0],
    lobbyAfter.camera[2] - lobbyBefore.camera[2]
  );

  await page.evaluate(() => window.SVR_PHASE363_JOIN_TABLE('phase365-browser-acceptance'));
  await page.waitForFunction(() => (
    window.SVR_PHASE363_JOINED_IMMEDIATE === true
    && window.SVR_PHASE363_STATE?.joined === true
    && document.body.classList.contains('svr365-seated')
  ), null, { timeout: 30000 });
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    const event = new Event('deviceorientation');
    Object.defineProperties(event, {
      alpha: { value: 24 },
      beta: { value: 8 },
      gamma: { value: 0 }
    });
    window.dispatchEvent(event);
  });
  await page.waitForTimeout(650);

  await page.evaluate(() => window.SVR_PHASE365_SYNC?.());
  await page.waitForTimeout(450);

  const seated = await page.evaluate(() => {
    const scene = window.__SVR_SCENE__;
    let tags = 0;
    scene?.traverse?.((object) => {
      if (/^PHASE365_NAME_TAG_/.test(object?.name || '')) tags += 1;
    });
    const navVisible = [...document.querySelectorAll('[data-svr365-nav-hidden="1"]')]
      .filter((element) => getComputedStyle(element).display !== 'none').length;
    const brand = document.querySelector('#svr365BrandSlot');
    const pot = scene?.getObjectByName?.('PHASE365_ANDROID_CLEAN_POT_DISPLAY');
    return {
      qa: window.SVR_PHASE365_QA?.(),
      phase363State: window.SVR_PHASE363_STATE || null,
      joinedImmediate: window.SVR_PHASE363_JOINED_IMMEDIATE,
      table: window.SVR_PHASE365_TABLE_ALIGNMENT,
      moveDisplay: getComputedStyle(document.querySelector('#svr347Move')).display,
      lookDisplay: getComputedStyle(document.querySelector('#svr347Look')).display,
      navVisible,
      nameTags: tags,
      brandText: brand?.textContent?.trim() || '',
      pot: pot ? {
        name: pot.name,
        opacity: pot.material?.opacity,
        scale: pot.scale.toArray(),
        depthWrite: pot.material?.depthWrite
      } : null,
      gyroEvents: window.SVR_PHASE365_STATE?.gyroEvents || 0,
      camera: window.__SVR_CAMERA__?.position?.toArray?.() || null
    };
  });

  await page.evaluate(() => window.SVR_PHASE365_SET_BRAND?.({ id: 'qa', name: 'QA TOURNAMENT', logoUrl: 'assets/ui/logo.png' }));
  await page.waitForTimeout(150);
  const replacementBrand = await page.locator('#svr365BrandSlot').innerText();

  await page.evaluate(() => window.SVR_PHASE363_LEAVE_TABLE?.('phase365-browser-acceptance'));
  await page.waitForFunction(() => (
    window.SVR_PHASE363_JOINED_IMMEDIATE === false
    && !document.body.classList.contains('svr365-seated')
  ), null, { timeout: 30000 });
  await page.waitForTimeout(350);
  const lobbyReturn = await page.evaluate(() => ({
    moveDisplay: getComputedStyle(document.querySelector('#svr347Move')).display,
    lookDisplay: getComputedStyle(document.querySelector('#svr347Look')).display
  }));

  const result = {
    build: 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK',
    lobbyBefore,
    movementDistance: +movementDistance.toFixed(4),
    seated,
    replacementBrand,
    lobbyReturn,
    errors,
    failedRequests,
    pass: true
  };

  const checks = [
    [lobbyBefore.rootCount === 1, 'single-controller-root'],
    [lobbyBefore.moveCount === 1 && lobbyBefore.lookCount === 1, 'single-move-look'],
    [lobbyBefore.moveDisplay !== 'none' && lobbyBefore.lookDisplay !== 'none', 'lobby-sticks-visible'],
    [movementDistance > 0.015, 'lobby-stick-moves-camera'],
    [seated.phase363State?.joined === true && seated.joinedImmediate === true, 'join-state-persists'],
    [seated.moveDisplay === 'none' && seated.lookDisplay === 'none', 'seated-sticks-hidden'],
    [seated.navVisible === 0, 'seated-navigation-hidden'],
    [Math.abs(Number(seated.table?.referenceLineY ?? 99)) < 0.01, 'table-reference-line-floor'],
    [seated.pot?.name === 'PHASE365_ANDROID_CLEAN_POT_DISPLAY', 'clean-pot-authority'],
    [Number(seated.pot?.opacity || 0) > 0 && seated.pot?.depthWrite === false, 'transparent-pot-material'],
    [seated.nameTags === 5, 'five-avatar-name-tags'],
    [seated.brandText.includes('SVR POKER'), 'svr-brand-visible'],
    [replacementBrand.includes('QA TOURNAMENT'), 'brand-replaceable'],
    [seated.gyroEvents >= 1, 'gyro-event-consumed'],
    [seated.qa?.pass === true, 'runtime-qa'],
    [lobbyReturn.moveDisplay !== 'none' && lobbyReturn.lookDisplay !== 'none', 'sticks-return-after-leave'],
    [errors.length === 0, 'no-page-console-errors'],
    [failedRequests.filter((entry) => entry.includes(base)).length === 0, 'no-local-request-failures']
  ];
  const failures = checks.filter(([pass]) => !pass).map(([, label]) => label);
  result.failures = failures;
  result.pass = failures.length === 0;
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
  if (!result.pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
