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
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
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
        && typeof window.SVR_PHASE363_STREET_RAISE_QA === 'function'
        && typeof window.SVR_PHASE363_CONSISTENCY_QA === 'function'
        && typeof window.SVR_PHASE363_JOIN_CONTROL_QA === 'function'
        && typeof window.SVR_PHASE355_RUN_FULL_HAND_QA === 'function'
        && typeof window.SVR_PHASE364_ANDROID_SEAT === 'function'
        && typeof window.SVR_PHASE364_QA === 'function';
      return ready ? true : null;
    });

    const lobbyBefore = await page.evaluate(() => ({
      joined: Boolean(window.SVR_PHASE363_STATE?.joined),
      gameState: window.SVR_PHASE363_STATE?.gameState || null,
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
      join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
      consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null,
      cards: window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0
    }));

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
      return q?.tablePass === true
        && q?.androidJoined === true
        && Math.abs(cameraY - targetY) <= 0.14
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
              const actorBefore = window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0] || {};
              const before = {
                street: state.phase,
                currentBet: Number(state.currentBet || 0),
                committed: Number(actorBefore.committed || 0),
                legal,
                minimum,
                maximum,
                target
              };
              const accepted = window.SVR_PHASE363_RAISE_TO(target);
              await wait(450);
              const next = window.SVR_PHASE336_POKER_STATE;
              const actorAfter = window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0] || {};
              const after = {
                street: next?.phase || null,
                currentBet: Number(next?.currentBet || 0),
                committed: Number(actorAfter.committed || 0),
                lastAction: actorAfter.lastAction || null
              };
              return {
                pass: accepted !== false
                  && target > before.currentBet
                  && after.committed > before.committed
                  && (after.currentBet >= target || /raise|bet/i.test(String(after.lastAction || ''))),
                before,
                after,
                accepted
              };
            }

            const key = `${state.handNo}:${state.phase}:${state.actionSeq}:${state.current}:${state.currentBet}`;
            if (!submitted.has(key)) {
              submitted.add(key);
              if (legal.includes('check')) window.SVR_POKER_ACTION?.('check');
              else if (legal.includes('call')) window.SVR_POKER_ACTION?.('call');
              else return { pass: false, reason: 'no-nonfold-path-to-raise', legal, state: { handNo: state.handNo, phase: state.phase } };
            }
          }
          await wait(120);
        }
        return {
          pass: false,
          reason: 'no-legal-raise-window',
          legal: (window.SVR_POKER_LEGAL_ACTIONS?.() || []).map(String),
          state: window.SVR_PHASE336_POKER_STATE || null
        };
      } finally {
        if (previousPassive === undefined) delete window.SVR_POKER_QA_PASSIVE_BOTS;
        else window.SVR_POKER_QA_PASSIVE_BOTS = previousPassive;
      }
    });

    if (!raise?.pass) throw new Error(`Integrated legal raise failed: ${JSON.stringify(raise)}`);

    const fullHand = await page.evaluate(() => window.SVR_PHASE355_RUN_FULL_HAND_QA({ maxHands: 2, timeoutMs: 120000 }));
    if (!fullHand?.pass) throw new Error(`Integrated full hand failed: ${JSON.stringify(fullHand)}`);

    const settled = await waitFor(page, () => {
      const q = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const state = window.SVR_PHASE336_POKER_STATE;
      return q?.pass === true && ['showdown', 'idle'].includes(String(state?.phase || ''))
        ? {
            phase: state?.phase || null,
            handNo: Number(state?.handNo || 0),
            consistency: q,
            streetRaise: window.SVR_PHASE363_STREET_RAISE_QA?.() || null,
            raiseUi: window.SVR_PHASE363_RAISE_UI_CAPTURE_QA?.() || null,
            phase364: window.SVR_PHASE364_QA?.() || null,
            audit: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null
          }
        : null;
    }, 20000);

    await page.evaluate(() => window.SVR_PHASE363_LEAVE_TABLE('phase364-integrated-acceptance'));
    const lobbyAfterLeave = await waitFor(page, () => {
      const q = window.SVR_PHASE363_CONSISTENCY_QA?.();
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      const cardsCleared = (audit?.players || []).every((player) => Array.isArray(player.hand) && player.hand.length === 0);
      return window.SVR_PHASE363_STATE?.joined === false
        && window.SVR_PHASE336_POKER_STATE?.phase === 'idle'
        && q?.lobbyCardsCleared === true
        && cardsCleared
        ? { q, audit, cardsCleared, join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null }
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
      fullHand,
      settled,
      lobbyAfterLeave,
      freshRejoin,
      pageErrors,
      consoleErrors,
      filteredConsole,
      requestFailures,
      filteredFailed,
      httpErrors,
      checkedAt: new Date().toISOString()
    };

    const pass = lobbyBefore.joined === false
      && lobbyBefore.cards === 0
      && lobbyBefore.join?.pass === true
      && seat.q.tablePass === true
      && raise.pass === true
      && fullHand.pass === true
      && settled.consistency.pass === true
      && Number(settled.consistency.effectiveTableChips || 0) === 90000
      && Number(settled.consistency.expectedTableChips || 0) === 90000
      && settled.streetRaise?.pass === true
      && settled.streetRaise?.streetOrderPass === true
      && settled.streetRaise?.burnSequencePass === true
      && settled.phase364?.tablePass === true
      && lobbyAfterLeave.cardsCleared === true
      && lobbyAfterLeave.join?.pass === true
      && freshRejoin.state.handNo === 1
      && freshRejoin.state.phase === 'preflop'
      && freshRejoin.audit.players[0].hand.length === 2
      && freshRejoin.consistency.pass === true
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
