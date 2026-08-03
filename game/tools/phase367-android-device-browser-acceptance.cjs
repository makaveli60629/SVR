'use strict';

const { chromium } = require('playwright');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const url = `${base}/game/android.html?channel=stable&v=phase367&acceptance=phase367`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 915, height: 412 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36',
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => errors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console:${message.text()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(base)) failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
  });
  page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) failedRequests.push(`HTTP ${response.status()} ${response.url()}`);
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE367_DEVICE_QA === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE363_JOIN_TABLE === 'function', null, { timeout: 120000 });
  await page.waitForSelector('#svr347Root', { timeout: 120000 });
  await page.waitForSelector('#svr347Move', { timeout: 120000 });
  await page.waitForSelector('#svr347Look', { timeout: 120000 });

  await page.evaluate(() => {
    const fire = (element, id) => {
      element?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: id, pointerType: 'touch', clientX: 1, clientY: 1 }));
      element?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: id, pointerType: 'touch', clientX: 1, clientY: 1 }));
    };
    fire(document.querySelector('#svr347Move'), 701);
    fire(document.querySelector('#svr347Look'), 702);
    fire(document.querySelector('#svr347Actions button'), 703);
    window.SVR_PHASE367_DEVICE_CALIBRATE?.();
  });
  await page.waitForTimeout(250);
  const landscapeLobby = await page.evaluate(() => window.SVR_PHASE367_DEVICE_QA());

  await page.evaluate(() => window.SVR_PHASE363_JOIN_TABLE('phase367-browser-acceptance'));
  await page.waitForFunction(() => (
    window.SVR_PHASE363_STATE?.joined === true
    && document.body.classList.contains('svr365-seated')
    && document.body.classList.contains('svr367-seated')
  ), null, { timeout: 30000 });
  await page.waitForTimeout(1000);
  const landscapeSeated = await page.evaluate(() => window.SVR_PHASE367_DEVICE_QA());

  await page.setViewportSize({ width: 412, height: 915 });
  await page.waitForTimeout(1200);
  const portraitSeated = await page.evaluate(() => window.SVR_PHASE367_DEVICE_QA());

  await page.setViewportSize({ width: 915, height: 412 });
  await page.waitForTimeout(1200);
  const landscapeReturn = await page.evaluate(() => window.SVR_PHASE367_DEVICE_QA());

  const checks = [
    [landscapeLobby?.pass === true, 'landscape-lobby-runtime-qa'],
    [landscapeLobby?.singleController === true, 'single-controller-landscape'],
    [landscapeLobby?.controllerRoots === 1 && landscapeLobby?.moveControls === 1 && landscapeLobby?.lookControls === 1, 'one-root-move-look'],
    [landscapeLobby?.moveTouches >= 1 && landscapeLobby?.lookTouches >= 1 && landscapeLobby?.actionTouches >= 1, 'physical-pointer-metrics'],
    [landscapeSeated?.seated === true && landscapeSeated?.seatedNavigationClean === true, 'seated-navigation-clean'],
    [portraitSeated?.seated === true && portraitSeated?.singleController === true, 'portrait-controller-protected'],
    [portraitSeated?.viewportWidth <= 430 && portraitSeated?.viewportHeight >= 880, 'portrait-viewport-calibrated'],
    [portraitSeated?.viewportUpdates > landscapeSeated?.viewportUpdates, 'portrait-update-recorded'],
    [portraitSeated?.stabilizationRequests >= landscapeSeated?.stabilizationRequests, 'orientation-stabilization-requested'],
    [portraitSeated?.stabilizationApplied <= portraitSeated?.stabilizationRequests, 'stabilization-bounded'],
    [landscapeReturn?.viewportWidth >= 880 && landscapeReturn?.viewportHeight <= 430, 'landscape-return-calibrated'],
    [landscapeReturn?.visibleNavigationWhileSeated === 0, 'navigation-stays-hidden'],
    [errors.length === 0, 'no-browser-errors'],
    [failedRequests.length === 0, 'no-same-origin-request-failures']
  ];
  const failures = checks.filter(([pass]) => !pass).map(([, label]) => label);
  const result = {
    build: 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-ACCEPTANCE-LOCK',
    pass: failures.length === 0,
    failures,
    landscapeLobby,
    landscapeSeated,
    portraitSeated,
    landscapeReturn,
    errors,
    failedRequests
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
