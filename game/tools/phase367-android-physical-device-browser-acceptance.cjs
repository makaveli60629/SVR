'use strict';

const { chromium } = require('playwright');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const url = `${base}/game/android.html?channel=stable&v=phase367&acceptance=phase367`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 915, height: 412 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE367_DEVICE_QA === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE365_QA === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE363_JOIN_TABLE === 'function', null, { timeout: 120000 });
  await page.waitForSelector('#svr347Root', { timeout: 120000 });
  await page.waitForSelector('#svr347Move', { timeout: 30000 });
  await page.waitForSelector('#svr347Look', { timeout: 30000 });
  await page.waitForSelector('#svr347Actions', { timeout: 30000 });
  await page.waitForFunction(() => window.SVR_PHASE367_DEVICE_QA?.().pass === true, null, { timeout: 30000 });

  const baseline = await page.evaluate(() => ({
    device: window.SVR_PHASE367_DEVICE_QA(),
    phase365: window.SVR_PHASE365_QA(),
    css: {
      width: getComputedStyle(document.documentElement).getPropertyValue('--svr367-vw').trim(),
      height: getComputedStyle(document.documentElement).getPropertyValue('--svr367-vh').trim(),
      scale: getComputedStyle(document.documentElement).getPropertyValue('--svr367-ui-scale').trim()
    },
    viewport: {
      width: window.visualViewport?.width || innerWidth,
      height: window.visualViewport?.height || innerHeight
    }
  }));

  await page.evaluate(() => {
    const fire = (selector, pointerId) => {
      const target = document.querySelector(selector);
      if (!target) return;
      target.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId,
        pointerType: 'touch',
        clientX: target.getBoundingClientRect().left + 12,
        clientY: target.getBoundingClientRect().top + 12,
        bubbles: true,
        cancelable: true
      }));
      target.dispatchEvent(new PointerEvent('pointerup', {
        pointerId,
        pointerType: 'touch',
        bubbles: true,
        cancelable: true
      }));
    };
    fire('#svr347Move', 71);
    fire('#svr347Look', 72);
    fire('#svr347Actions button:not([disabled])', 73);
  });
  await page.waitForTimeout(250);

  await page.setViewportSize({ width: 412, height: 915 });
  await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));
    window.visualViewport?.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(700);
  const portrait = await page.evaluate(() => ({
    device: window.SVR_PHASE367_DEVICE_QA(),
    css: {
      width: getComputedStyle(document.documentElement).getPropertyValue('--svr367-vw').trim(),
      height: getComputedStyle(document.documentElement).getPropertyValue('--svr367-vh').trim()
    },
    app: document.querySelector('#app')?.getBoundingClientRect().toJSON?.() || null
  }));

  await page.setViewportSize({ width: 915, height: 412 });
  await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));
    window.visualViewport?.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(700);

  await page.evaluate(() => window.SVR_PHASE363_JOIN_TABLE('phase367-browser-acceptance'));
  await page.waitForFunction(() => (
    window.SVR_PHASE363_STATE?.joined === true
    && document.body.classList.contains('svr365-seated')
    && document.body.classList.contains('svr367-seated')
  ), null, { timeout: 30000 });
  await page.waitForTimeout(1100);

  const beforeBurst = await page.evaluate(() => window.SVR_PHASE367_DEVICE_QA());
  await page.evaluate(() => {
    for (let index = 0; index < 8; index += 1) {
      window.dispatchEvent(new Event('resize'));
      window.visualViewport?.dispatchEvent(new Event('resize'));
      window.SVR_PHASE367_DEVICE_STABILIZE?.();
    }
  });
  await page.waitForTimeout(1350);

  const seated = await page.evaluate(() => {
    const visible = (element) => {
      if (!element) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.02 && rect.width > 1 && rect.height > 1;
    };
    const navigation = [...document.querySelectorAll('button,a')]
      .filter((element) => /^(LOBBY|CENTER|CENTER VIEW)$/i.test((element.textContent || '').trim()))
      .filter(visible);
    return {
      device: window.SVR_PHASE367_DEVICE_QA(),
      phase365: window.SVR_PHASE365_QA(),
      displays: {
        move: getComputedStyle(document.querySelector('#svr347Move')).display,
        look: getComputedStyle(document.querySelector('#svr347Look')).display
      },
      visibleNavigation: navigation.length,
      rootCount: document.querySelectorAll('#svr347Root').length,
      moveCount: document.querySelectorAll('#svr347Move').length,
      lookCount: document.querySelectorAll('#svr347Look').length,
      actionPanelCount: document.querySelectorAll('#svr347Actions').length,
      bodyClasses: document.body.className
    };
  });

  await page.evaluate(() => window.SVR_PHASE363_LEAVE_TABLE?.('phase367-browser-acceptance'));
  await page.waitForFunction(() => window.SVR_PHASE363_STATE?.joined === false, null, { timeout: 30000 });
  await page.waitForTimeout(350);
  const lobbyReturn = await page.evaluate(() => ({
    device: window.SVR_PHASE367_DEVICE_QA(),
    moveDisplay: getComputedStyle(document.querySelector('#svr347Move')).display,
    lookDisplay: getComputedStyle(document.querySelector('#svr347Look')).display
  }));

  const localFailedRequests = failedRequests.filter((entry) => entry.includes(base));
  const stabilizationDelta = Number(seated.device?.stabilizationApplied || 0) - Number(beforeBurst?.stabilizationApplied || 0);
  const checks = [
    [baseline.device?.pass === true, 'baseline-device-qa'],
    [baseline.phase365?.pass === true, 'baseline-phase365-qa'],
    [baseline.device?.controllerRoots === 1 && baseline.device?.moveControls === 1 && baseline.device?.lookControls === 1 && baseline.device?.actionPanels === 1, 'single-existing-controller'],
    [Number(baseline.device?.moveTouches || 0) === 0, 'touch-baseline-clean'],
    [Number(portrait.device?.moveTouches || 0) >= 1 && Number(portrait.device?.lookTouches || 0) >= 1 && Number(portrait.device?.actionTouches || 0) >= 1, 'physical-touch-metrics'],
    [portrait.css.width.endsWith('px') && portrait.css.height.endsWith('px'), 'portrait-viewport-css'],
    [Number(portrait.device?.viewportWidth || 0) >= 400 && Number(portrait.device?.viewportHeight || 0) >= 890, 'portrait-viewport-dimensions'],
    [Number(seated.device?.viewportWidth || 0) >= 890 && Number(seated.device?.viewportHeight || 0) >= 400, 'landscape-viewport-dimensions'],
    [seated.device?.safeAreaReady === true, 'safe-area-ready'],
    [seated.rootCount === 1 && seated.moveCount === 1 && seated.lookCount === 1 && seated.actionPanelCount === 1, 'single-controller-after-join'],
    [seated.displays.move === 'none' && seated.displays.look === 'none', 'sticks-hidden-seated'],
    [seated.visibleNavigation === 0 && Number(seated.device?.visibleNavigationWhileSeated || 0) === 0, 'navigation-hidden-seated'],
    [stabilizationDelta <= 2, 'stabilization-rate-limited'],
    [Number(seated.device?.stabilizationSkipped || 0) >= 1, 'stabilization-burst-skipped'],
    [seated.phase365?.pass === true, 'phase365-still-green-seated'],
    [lobbyReturn.moveDisplay !== 'none' && lobbyReturn.lookDisplay !== 'none', 'controls-return-lobby'],
    [pageErrors.length === 0, 'no-page-errors'],
    [consoleErrors.length === 0, 'no-console-errors'],
    [localFailedRequests.length === 0, 'no-local-request-failures']
  ];
  const failures = checks.filter(([pass]) => !pass).map(([, label]) => label);
  const result = {
    build: 'PHASE-367-ANDROID-PHYSICAL-DEVICE-VIEWPORT-TOUCH-ACCEPTANCE-LOCK',
    baseline,
    portrait,
    beforeBurst,
    seated,
    lobbyReturn,
    stabilizationDelta,
    pageErrors,
    consoleErrors,
    failedRequests,
    failures,
    pass: failures.length === 0
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
