'use strict';

const { chromium } = require('playwright');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const url = `${base}/game/android.html?channel=stable&v=phase372&acceptance=phase365`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 915, height: 412 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1
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
  await page.waitForFunction(() => typeof window.SVR_PHASE372_QA === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE372_SYNC_ANDROID_ENTRY === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE365_QA === 'function', null, { timeout: 120000 });
  await page.waitForFunction(() => typeof window.SVR_PHASE363_JOIN_TABLE === 'function', null, { timeout: 120000 });
  await page.waitForSelector('#svr347Move', { timeout: 120000 });
  await page.waitForSelector('#svr347Look', { timeout: 120000 });
  await page.waitForFunction(() => Boolean(window.__SVR_CAMERA__ && window.SVR_TABLE_AUTHORITY), null, { timeout: 120000 });

  const entrySyncResult = await page.evaluate(() => window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.('phase365-browser-preflight'));
  await page.waitForFunction(() => {
    const button = document.getElementById('svr372Primary');
    return !Boolean(window.SVR_PHASE363_STATE?.joined)
      && !Boolean(window.SVR_PHASE363_JOINED_IMMEDIATE)
      && Boolean(button?.offsetParent)
      && button.disabled === false
      && /JOIN TABLE/i.test(button.textContent || '')
      && window.SVR_PHASE372_QA?.().pass === true;
  }, null, { timeout: 15000 });

  const entryBeforeTest = await page.evaluate(() => {
    const qa = window.SVR_PHASE372_QA?.() || null;
    const entry = document.getElementById('svr372Entry');
    const button = document.getElementById('svr372Primary');
    const visible = Boolean(button?.offsetParent);
    const enabled = Boolean(button && !button.disabled && /JOIN TABLE/i.test(button.textContent || ''));
    if (entry) {
      entry.dataset.phase365ControllerIsolation = '1';
      entry.style.setProperty('display', 'none', 'important');
    }
    return { qa, visible, enabled };
  });
  if (!entryBeforeTest.visible || !entryBeforeTest.enabled || entryBeforeTest.qa?.pass !== true) throw new Error('Phase 372 visible JOIN entry was not ready after the authoritative synchronizer ran.');
  await page.waitForTimeout(120);

  const lobbyBefore = await page.evaluate(() => ({
    camera: window.__SVR_CAMERA__.position.toArray(),
    moveDisplay: getComputedStyle(document.querySelector('#svr347Move')).display,
    lookDisplay: getComputedStyle(document.querySelector('#svr347Look')).display,
    rootCount: document.querySelectorAll('#svr347Root').length,
    moveCount: document.querySelectorAll('#svr347Move').length,
    lookCount: document.querySelectorAll('#svr347Look').length
  }));

  const movementGesture = await page.evaluate(() => {
    const target = document.querySelector('#svr347Move');
    if (!target) return { pass: false, reason: 'move-target-missing' };
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const common = {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerType: 'touch',
      pointerId: 3651,
      isPrimary: true,
      width: 12,
      height: 12,
      pressure: 0.7,
      buttons: 1
    };
    target.dispatchEvent(new PointerEvent('pointerdown', { ...common, clientX: x, clientY: y }));
    target.dispatchEvent(new PointerEvent('pointermove', { ...common, clientX: x - rect.width * 0.30, clientY: y }));
    return { pass: true, x, y, width: rect.width, height: rect.height };
  });
  if (!movementGesture.pass) throw new Error(`Android MOVE gesture could not start: ${JSON.stringify(movementGesture)}`);
  await page.waitForTimeout(720);
  await page.evaluate(() => {
    const target = document.querySelector('#svr347Move');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerType: 'touch',
      pointerId: 3651,
      isPrimary: true,
      clientX: rect.left + rect.width * 0.20,
      clientY: rect.top + rect.height / 2,
      pressure: 0,
      buttons: 0
    }));
  });

  const lobbyAfter = await page.evaluate(() => ({ camera: window.__SVR_CAMERA__.position.toArray() }));
  const movementDistance = Math.hypot(
    lobbyAfter.camera[0] - lobbyBefore.camera[0],
    lobbyAfter.camera[2] - lobbyBefore.camera[2]
  );

  await page.evaluate(() => {
    const entry = document.getElementById('svr372Entry');
    if (!entry) return;
    entry.style.removeProperty('display');
    delete entry.dataset.phase365ControllerIsolation;
  });

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

  await page.evaluate(() => window.SVR_PHASE365_REFRESH_CARD_BRAND?.());
  await page.waitForFunction(() => window.SVR_PHASE365_CARD_BRAND_QA?.().pass === true, null, { timeout: 12000 });
  await page.waitForTimeout(180);

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
      cardBrand: window.SVR_PHASE365_CARD_BRAND_QA?.() || null,
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
  await page.evaluate(() => window.SVR_PHASE372_SYNC_ANDROID_ENTRY?.('phase365-browser-after-leave'));
  await page.waitForFunction(() => Boolean(document.getElementById('svr372Primary')?.offsetParent), null, { timeout: 15000 });
  await page.waitForTimeout(350);
  const lobbyReturn = await page.evaluate(() => ({
    moveDisplay: getComputedStyle(document.querySelector('#svr347Move')).display,
    lookDisplay: getComputedStyle(document.querySelector('#svr347Look')).display,
    phase372EntryVisible: Boolean(document.getElementById('svr372Primary')?.offsetParent),
    phase372: window.SVR_PHASE372_QA?.() || null
  }));

  const result = {
    build: 'PHASE-365-ANDROID-SEATED-UX-BRANDING-GYRO-ALIGNMENT-LOCK',
    successor: 'PHASE-372-LIVE-ENTRY-RECOVERY-AWS-AUTODEPLOY-LOCK',
    entrySyncResult,
    entryBeforeTest,
    movementGesture,
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
    [entrySyncResult !== false, 'phase372-entry-sync-accepted'],
    [entryBeforeTest.visible && entryBeforeTest.enabled && entryBeforeTest.qa?.pass === true, 'phase372-entry-visible-before-test'],
    [movementGesture.pass === true, 'touch-movement-gesture-dispatched'],
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
    [seated.cardBrand?.pass === true && seated.cardBrand?.brandedCards >= 3, 'card-backs-branded'],
    [replacementBrand.includes('QA TOURNAMENT'), 'brand-replaceable'],
    [seated.gyroEvents >= 1, 'gyro-event-consumed'],
    [seated.qa?.pass === true, 'runtime-qa'],
    [lobbyReturn.moveDisplay !== 'none' && lobbyReturn.lookDisplay !== 'none', 'sticks-return-after-leave'],
    [lobbyReturn.phase372EntryVisible === true && lobbyReturn.phase372?.pass === true, 'phase372-entry-restored-after-leave'],
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