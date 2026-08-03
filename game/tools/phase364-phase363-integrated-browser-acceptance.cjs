const { chromium } = require('playwright');

const BASE = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36';

async function waitFor(page, evaluator, timeout = 120000) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeout) {
    try {
      last = await page.evaluate(evaluator);
      if (last) return last;
    } catch {}
    await page.waitForTimeout(250);
  }
  throw new Error(`Timed out waiting for Android runtime: ${JSON.stringify(last)}`);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: ANDROID_UA,
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const requestFailures = [];
  const httpErrors = [];

  page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error)));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => {
    if (request.url().startsWith(BASE)) requestFailures.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
  });
  page.on('response', (response) => {
    if (response.url().startsWith(BASE) && response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });

  const url = `${BASE}/game/android.html?channel=stable&manual=1&v=phase364`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitFor(page, () => {
      const ready = typeof window.SVR_PHASE363_JOIN_TABLE === 'function'
        && typeof window.SVR_PHASE363_LEAVE_TABLE === 'function'
        && typeof window.SVR_PHASE363_RAISE_TO === 'function'
        && typeof window.SVR_PHASE363_CONFIGURE_RAISE === 'function'
        && typeof window.SVR_PHASE363_CONSISTENCY_QA === 'function'
        && typeof window.SVR_PHASE355_RUN_FULL_HAND_QA === 'function'
        && typeof window.SVR_PHASE364_ANDROID_SEAT === 'function'
        && typeof window.SVR_PHASE364_QA === 'function';
      return ready ? true : null;
    });

    const lobbyBefore = await page.evaluate(() => ({
      joined: Boolean(window.SVR_PHASE363_STATE?.joined),
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
      cards: Number(window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0),
      join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null
    }));
    if (lobbyBefore.joined || lobbyBefore.cards !== 0 || lobbyBefore.join?.pass !== true) {
      throw new Error(`Android lobby contract failed: ${JSON.stringify(lobbyBefore)}`);
    }

    await page.evaluate(() => window.SVR_PHASE363_JOIN_TABLE('phase364-integrated-acceptance'));
    await waitFor(page, () => {
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      return window.SVR_PHASE363_STATE?.joined === true
        && Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0) >= 1
        && Number(audit?.players?.[0]?.hand?.length || 0) === 2
        ? true : null;
    }, 30000);

    const seat = await waitFor(page, () => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      const q = window.SVR_PHASE364_QA?.();
      const cameraY = Number(window.__SVR_CAMERA__?.position?.y || 0);
      const targetY = Number(q?.measuredTable?.maxY || 0) + 0.55;
      return q?.tablePass && q?.androidJoined && Math.abs(cameraY - targetY) <= 0.14
        ? { q, cameraY, targetY }
        : null;
    }, 15000);

    const raise = await page.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const deadline = performance.now() + 45000;
      const submitted = new Set();
      const previousPassive = window.SVR_POKER_QA_PASSIVE_BOTS;
      window.SVR_POKER_QA_PASSIVE_BOTS = true;
      try {
        while (performance.now() < deadline) {
          const state = window.SVR_PHASE336_POKER_STATE;
          if (!state) { await wait(100); continue; }
          if (['showdown', 'idle'].includes(String(state.phase || ''))) {
            return { pass: false, reason: 'hand-ended-before-raise', state: { handNo: state.handNo, phase: state.phase } };
          }
          if (state.waitingHuman === true) {
            const legal = (window.SVR_POKER_LEGAL_ACTIONS?.() || []).map((action) => String(action).toLowerCase());
            if (legal.includes('raise') || legal.includes('bet')) {
              const bounds = window.SVR_PHASE363_CONFIGURE_RAISE?.() || {};
              const minimum = Number(bounds.minimum || state.currentBet || 0);
              const maximum = Number(bounds.maximum || 0);
              const target = Math.min(maximum, Math.max(minimum, Number(state.currentBet || 0) + 40));
              const beforeActor = window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0] || {};
              const before = {
                street: String(state.phase || ''),
                currentBet: Number(state.currentBet || 0),
                committed: Number(beforeActor.committed || 0),
                legal,
                minimum,
                maximum,
                target
              };
              const accepted = window.SVR_PHASE363_RAISE_TO(target);
              await wait(500);
              const next = window.SVR_PHASE336_POKER_STATE;
              const afterActor = window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0] || {};
              const after = {
                street: String(next?.phase || ''),
                currentBet: Number(next?.currentBet || 0),
                committed: Number(afterActor.committed || 0),
                lastAction: String(afterActor.lastAction || '')
              };
              const streetAdvanced = after.street !== before.street;
              const raiseRecorded = /raise|bet/i.test(after.lastAction);
              const chipsAdvanced = after.committed > before.committed || after.currentBet >= target;
              return {
                pass: accepted !== false && target > before.currentBet && raiseRecorded && (chipsAdvanced || streetAdvanced),
                accepted,
                streetAdvanced,
                raiseRecorded,
                chipsAdvanced,
                before,
                after
              };
            }
            const key = `${state.handNo}:${state.phase}:${state.actionSeq}:${state.current}:${state.currentBet}`;
            if (!submitted.has(key)) {
              submitted.add(key);
              if (legal.includes('check')) window.SVR_POKER_ACTION?.('check');
              else if (legal.includes('call')) window.SVR_POKER_ACTION?.('call');
              else return { pass: false, reason: 'no-nonfold-path-to-raise', legal };
            }
          }
          await wait(120);
        }
        return { pass: false, reason: 'no-legal-raise-window' };
      } finally {
        if (previousPassive === undefined) delete window.SVR_POKER_QA_PASSIVE_BOTS;
        else window.SVR_POKER_QA_PASSIVE_BOTS = previousPassive;
      }
    });
    if (!raise?.pass) throw new Error(`Integrated legal raise failed: ${JSON.stringify(raise)}`);

    // This legacy driver intentionally runs a self-contained 6,000-chip compatibility hand.
    const fullHand = await page.evaluate(() => window.SVR_PHASE355_RUN_FULL_HAND_QA({ maxHands: 2, timeoutMs: 120000 }));
    if (!fullHand?.pass || Number(fullHand?.record?.totalStacks || 0) !== 6000) {
      throw new Error(`Isolated compatibility hand failed: ${JSON.stringify(fullHand)}`);
    }

    await page.evaluate(() => window.SVR_PHASE363_LEAVE_TABLE('phase364-integrated-acceptance'));
    const lobbyAfterLeave = await waitFor(page, () => {
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const cardsCleared = (audit?.players || []).every((player) => Array.isArray(player.hand) && player.hand.length === 0);
      return window.SVR_PHASE363_STATE?.joined === false
        && window.SVR_PHASE336_POKER_STATE?.phase === 'idle'
        && consistency?.lobbyCardsCleared === true
        && cardsCleared
        ? { consistency, audit, cardsCleared, join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null }
        : null;
    }, 15000);

    await page.evaluate(() => window.SVR_PHASE363_JOIN_TABLE('phase364-integrated-rejoin'));
    const freshRejoin = await waitFor(page, () => {
      window.SVR_PHASE364_ANDROID_SEAT?.(true);
      const state = window.SVR_PHASE336_POKER_STATE;
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const consistency = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const q364 = window.SVR_PHASE364_QA?.();
      const cameraY = Number(window.__SVR_CAMERA__?.position?.y || 0);
      const targetY = Number(q364?.measuredTable?.maxY || 0) + 0.55;
      return window.SVR_PHASE363_STATE?.joined === true
        && Number(state?.handNo || 0) === 1
        && state?.phase === 'preflop'
        && Number(audit?.players?.[0]?.hand?.length || 0) === 2
        && Number(consistency?.effectiveTableChips || 0) === 90000
        && Number(consistency?.expectedTableChips || 0) === 90000
        && consistency?.pass === true
        && q364?.tablePass === true
        && Math.abs(cameraY - targetY) <= 0.14
        ? { state: { handNo: state.handNo, phase: state.phase }, audit, consistency, phase364: q364, cameraY, targetY }
        : null;
    }, 30000);

    const filteredConsole = consoleErrors.filter((line) => !/favicon|WebXR.*not available|THREE\.WebGLRenderer/i.test(line));
    const filteredFailed = requestFailures.filter((line) => !/favicon/i.test(line));
    const report = {
      url,
      lobbyBefore,
      seat,
      raise,
      isolatedCompatibilityHand: fullHand,
      lobbyAfterLeave,
      freshRejoin,
      pageErrors,
      filteredConsole,
      filteredFailed,
      httpErrors,
      checkedAt: new Date().toISOString()
    };
    const pass = raise.pass === true
      && fullHand.pass === true
      && lobbyAfterLeave.cardsCleared === true
      && lobbyAfterLeave.join?.pass === true
      && freshRejoin.consistency.pass === true
      && freshRejoin.consistency.effectiveTableChips === 90000
      && freshRejoin.phase364.tablePass === true
      && pageErrors.length === 0
      && filteredConsole.length === 0
      && filteredFailed.length === 0
      && httpErrors.length === 0;
    console.log(JSON.stringify({ ...report, pass }, null, 2));
    if (!pass) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
