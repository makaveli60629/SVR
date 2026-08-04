const { chromium } = require('playwright');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const url = `${base}/game/index.html?platform=quest&acceptance=1&manual=1&v=phase374`;
const questUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/35.0.0.0.0 Chrome/126.0.0.0 Mobile VR Safari/537.36 Quest 3';
const ORIGINAL_TABLE = 'PHASE374_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY';
const LEGACY_TABLE = 'PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    userAgent: questUserAgent,
    viewport: { width: 1832, height: 1920 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const httpErrors = [];
  const requestFailures = [];

  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error?.message || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) {
      httpErrors.push({ status: response.status(), url: response.url() });
    }
  });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(base)) requestFailures.push({ url: request.url(), error: request.failure()?.errorText || 'failed' });
  });

  let result = null;
  let platform = null;
  let tableCompatibility = null;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => (
      typeof window.SVR_PHASE358_RUN_QUEST_FULL_GAME_ACCEPTANCE === 'function'
      && window.SVR_PHASE374_PHASE358_COMPAT_QA?.().pass === true
      && window.SVR_PHASE374_ORIGINAL_TABLE_QA?.().pass === true
    ), null, { timeout: 160000 });
    result = await page.evaluate(() => window.SVR_PHASE358_RUN_QUEST_FULL_GAME_ACCEPTANCE({
      runtimeTimeoutMs: 120000,
      handTimeoutMs: 75000,
      startupBudgetMs: 45000
    }));
    platform = await page.evaluate(() => {
      const state = window.SVR_PHASE340_PLATFORM_STATE || null;
      if (!state) return null;
      return {
        build: state.build,
        platform: state.platform,
        loaded: [...(state.loaded || [])],
        failed: [...(state.failed || [])],
        deferredLoaded: [...(state.deferredLoaded || [])],
        deferredFailed: [...(state.deferredFailed || [])],
        totalMs: state.totalMs,
        deferredTotalMs: state.deferredTotalMs,
        readyAt: state.readyAt,
        deferredReadyAt: state.deferredReadyAt,
        prewarm: state.prewarm
      };
    });
    tableCompatibility = await page.evaluate(() => ({
      compat: window.SVR_PHASE374_PHASE358_COMPAT_QA?.() || null,
      original: window.SVR_PHASE374_ORIGINAL_TABLE_QA?.() || null,
      uploaded: window.SVR_PHASE358_UPLOADED_TABLE_QA?.() || null,
      currentAuthority: window.SVR_TABLE_AUTHORITY?.name || null
    }));
  } finally {
    const report = {
      url,
      questUserAgent: true,
      result,
      platform,
      tableCompatibility,
      pageErrors,
      consoleErrors,
      httpErrors,
      requestFailures,
      checkedAt: new Date().toISOString()
    };
    console.log(JSON.stringify(report, null, 2));
    await browser.close();
    const acceptedTable = [ORIGINAL_TABLE, LEGACY_TABLE].includes(result?.table?.table)
      && result?.table?.uploadedTableAuthority === true
      && result?.table?.fallbackPresent === false;
    const pass = result?.pass === true
      && result?.platform === 'quest'
      && result?.hand?.pass === true
      && result?.hand?.phases?.includes('preflop')
      && result?.hand?.phases?.includes('flop')
      && result?.hand?.phases?.includes('turn')
      && result?.hand?.phases?.includes('river')
      && result?.hand?.phases?.includes('showdown')
      && result?.hand?.communityMax === 5
      && result?.hand?.holeCards === 2
      && result?.hand?.settlement?.totalStacks === 6000
      && result?.nextHand?.advanced === true
      && acceptedTable
      && Boolean(result?.table?.potDisplay)
      && tableCompatibility?.compat?.pass === true
      && tableCompatibility?.original?.pass === true
      && tableCompatibility?.currentAuthority === ORIGINAL_TABLE
      && result?.input?.handsPrimary === true
      && result?.input?.controllerFallback === true
      && result?.input?.androidRoots === 0
      && result?.renderer?.xrEnabled === true
      && result?.renderer?.shadows === false
      && result?.physicalQuestSessionTested === false
      && platform?.prewarm?.method === 'quest-incremental-frame-compilation'
      && pageErrors.length === 0
      && consoleErrors.length === 0
      && httpErrors.length === 0
      && requestFailures.length === 0;
    if (!pass) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});