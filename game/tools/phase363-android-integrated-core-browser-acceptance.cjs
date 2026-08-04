const { chromium } = require('playwright');

const base = process.env.SVR_TEST_BASE || 'http://127.0.0.1:4173';
const url = `${base}/game/android.html?channel=stable&v=phase363&phase363qa=1`;
const failures = [];
const diagnostics = {
  url,
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
  badResponses: [],
  lobby: null,
  joined: null,
  raise: null,
  hand: null,
  left: null,
  rejoined: null,
  callButton: null,
  fatal: null
};

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function tap(locator) {
  try { await locator.tap({ force: true, timeout: 10000 }); }
  catch { await locator.click({ force: true, timeout: 10000 }); }
}

async function snapshot(page) {
  return page.evaluate(() => ({
    core: window.SVR_PHASE363_QA?.() || null,
    join: window.SVR_PHASE363_JOIN_CONTROL_QA?.() || null,
    table: window.SVR_PHASE363_TABLE_QA?.() || null,
    street: window.SVR_PHASE363_STREET_RAISE_QA?.() || null,
    raiseCapture: window.SVR_PHASE363_RAISE_UI_CAPTURE_QA?.() || null,
    consistency: window.SVR_PHASE363_CONSISTENCY_QA?.() || null,
    poker: window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null,
    phase347: window.SVR_PHASE347_STATE || null,
    seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null,
    bankrollText: document.querySelector('#svr363BankrollValue')?.textContent?.trim() || null,
    bankrollMeta: document.querySelector('#svr363BankrollMeta')?.textContent?.trim() || null,
    holeVisible: (() => {
      const node = document.querySelector('#svr347Hole');
      return node ? getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' : false;
    })(),
    communityVisible: (() => {
      const node = document.querySelector('#svr347Community');
      return node ? getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden' : false;
    })(),
    raisePanelOpen: document.getElementById('svr347Raise')?.classList.contains('open') || false,
    audio: window.SVR_PHASE363_STATE?.audioEvents || {},
    rawState: {
      handNo: Number(window.SVR_PHASE336_POKER_STATE?.handNo || 0),
      phase: window.SVR_PHASE336_POKER_STATE?.phase || null,
      community: window.SVR_PHASE336_POKER_STATE?.community?.map((card) => card?.id) || [],
      burnCount: window.SVR_PHASE336_POKER_STATE?.burn?.length || 0,
      currentBet: Number(window.SVR_PHASE336_POKER_STATE?.currentBet || 0),
      waitingHuman: Boolean(window.SVR_PHASE336_POKER_STATE?.waitingHuman),
      winners: window.SVR_PHASE336_POKER_STATE?.winners || []
    }
  }));
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 16; SM-A166U) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(String(error?.stack || error)));
  page.on('requestfailed', (request) => diagnostics.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText || 'failed' }));
  page.on('response', (response) => {
    if (response.status() >= 400) diagnostics.badResponses.push({ url: response.url(), status: response.status() });
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => (
      typeof window.SVR_PHASE363_QA === 'function'
      && typeof window.SVR_PHASE363_JOIN_CONTROL_QA === 'function'
      && typeof window.SVR_PHASE363_TABLE_QA === 'function'
      && typeof window.SVR_PHASE363_STREET_RAISE_QA === 'function'
      && typeof window.SVR_PHASE363_RAISE_UI_CAPTURE_QA === 'function'
      && typeof window.SVR_PHASE363_CONSISTENCY_QA === 'function'
      && window.SVR_PHASE363_STATE?.installedAt
    ), null, { timeout: 120000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => { window.SVR_POKER_QA_PASSIVE_BOTS = true; });

    diagnostics.lobby = await snapshot(page);
    check(diagnostics.lobby.core?.joined === false, 'Lobby boot is incorrectly joined');
    check(diagnostics.lobby.core?.gameState === 'LOBBY', 'Lobby state is not LOBBY');
    check(diagnostics.lobby.core?.totalChips === 90000, `Lobby total chips ${diagnostics.lobby.core?.totalChips} != 90000`);
    check(diagnostics.lobby.core?.stack === 15000, `Lobby bankroll ${diagnostics.lobby.core?.stack} != 15000`);
    check(diagnostics.lobby.join?.pass === true, 'Lobby does not have exactly one JOIN control');
    check(diagnostics.lobby.seatText === 'JOIN TABLE', `Lobby control says ${diagnostics.lobby.seatText}`);
    check(diagnostics.lobby.holeVisible === false, 'Hole cards are visible before JOIN');
    check(diagnostics.lobby.communityVisible === false, 'Community cards are visible before JOIN');
    check(diagnostics.lobby.table?.pass === true, `Verified table failed: ${diagnostics.lobby.table?.error || 'unknown'}`);
    check(diagnostics.lobby.table?.emergencyFallbackPresent === false, 'Emergency table fallback is still present');
    check(diagnostics.lobby.core?.fovValid === true, 'Android FOV is outside protected range');
    check(diagnostics.lobby.bankrollText?.includes('15,000'), 'Visible lobby bankroll does not show 15,000');
    check(diagnostics.lobby.raiseCapture?.pass === true, 'Raise capture authority is not ready');

    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STATE?.joined === true
      && window.SVR_PHASE336_POKER_STATE?.handNo >= 1
      && (window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0) === 2
    ), null, { timeout: 30000 });
    await page.waitForFunction(() => (
      window.SVR_PHASE336_POKER_STATE?.phase === 'preflop'
      && window.SVR_PHASE336_POKER_STATE?.waitingHuman === true
      && (window.SVR_POKER_LEGAL_ACTIONS?.() || []).some((action) => action === 'raise' || action === 'bet')
    ), null, { timeout: 30000 });

    diagnostics.joined = await snapshot(page);
    check(diagnostics.joined.core?.joined === true, 'JOIN did not enter seated mode');
    check(diagnostics.joined.join?.pass === true, 'JOIN created duplicate or mislabeled seat controls');
    check(diagnostics.joined.seatText === 'LEAVE TABLE', `Seated control says ${diagnostics.joined.seatText}`);
    check(diagnostics.joined.poker?.players?.[0]?.hand?.length === 2, 'Human did not receive two cards after JOIN');
    check(diagnostics.joined.holeVisible === true, 'Hole-card HUD is hidden after JOIN');
    check(diagnostics.joined.phase347?.seated === true, 'Phase 347 camera is not seated after JOIN');
    check(diagnostics.joined.core?.totalChips === 90000, 'JOIN did not create a 90,000-chip table');
    check(diagnostics.joined.audio?.sit_down >= 1, 'Sit-down audio was not triggered');
    check(diagnostics.joined.audio?.card_deal >= 1, 'Card-deal audio was not triggered');

    const preRaise = await page.evaluate(() => ({
      phase: window.SVR_PHASE336_POKER_STATE?.phase,
      communityCount: window.SVR_PHASE336_POKER_STATE?.community?.length || 0,
      burnCount: window.SVR_PHASE336_POKER_STATE?.burn?.length || 0,
      currentBet: Number(window.SVR_PHASE336_POKER_STATE?.currentBet || 0),
      playerBet: Number(window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.bet || 0),
      actionSeq: Number(window.SVR_PHASE336_POKER_STATE?.actionSeq || 0)
    }));
    check(preRaise.phase === 'preflop', 'Raise test did not begin preflop');
    check(preRaise.communityCount === 0 && preRaise.burnCount === 0, 'Cards were exposed before the preflop betting round completed');

    await tap(page.locator('#svr347Actions [data-ui="raise"]'));
    await page.waitForFunction(() => document.getElementById('svr347Raise')?.classList.contains('open'), null, { timeout: 10000 });
    const raiseTarget = await page.evaluate(() => {
      const slider = document.getElementById('svr347RaiseSlider');
      const minimum = Number(slider?.min || 0);
      const maximum = Number(slider?.max || minimum);
      const target = Math.min(maximum, Math.max(minimum, minimum));
      if (slider) {
        slider.value = String(target);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return target;
    });
    await tap(page.locator('#svr347RaiseConfirm'));
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STREET_RAISE_STATE?.lastRaise?.accepted === true
      && window.SVR_PHASE363_STREET_RAISE_STATE?.lastRaise?.increasedBet === true
    ), null, { timeout: 10000 });

    diagnostics.raise = await snapshot(page);
    check(diagnostics.raise.street?.lastRaiseWorked === true, 'RAISE did not increase the human bet');
    check(diagnostics.raise.street?.lastRaise?.phase === 'preflop', 'RAISE was not executed during preflop');
    check(diagnostics.raise.street?.lastRaise?.target === raiseTarget, 'RAISE used a different amount than the selected slider value');
    check(diagnostics.raise.street?.lastRaise?.target < 15000, 'Minimum RAISE incorrectly committed the entire bankroll');
    check(diagnostics.raise.raisePanelOpen === false, 'Raise drawer did not close after a successful raise');

    const phases = new Set(['preflop']);
    const humanActions = { preflop: ['raise'] };
    const started = Date.now();
    let lastActionSignature = '';
    while (Date.now() - started < 90000) {
      const status = await page.evaluate(() => {
        const poker = window.SVR_PHASE336_POKER_STATE || {};
        const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.() || {};
        const player = audit.players?.[0] || {};
        return {
          phase: String(poker.phase || 'idle'),
          handNo: Number(poker.handNo || 0),
          waitingHuman: Boolean(poker.waitingHuman),
          winners: poker.winners || [],
          actionSeq: Number(poker.actionSeq || 0),
          currentBet: Number(poker.currentBet || 0),
          playerBet: Number(player.bet || 0),
          playerStack: Number(player.stack || 0),
          legal: window.SVR_POKER_LEGAL_ACTIONS?.() || []
        };
      });
      phases.add(status.phase);
      if (status.phase === 'showdown' && status.winners.length) break;
      if (status.waitingHuman) {
        const signature = [status.handNo, status.phase, status.actionSeq, status.currentBet, status.playerBet, status.playerStack].join(':');
        if (signature !== lastActionSignature) {
          lastActionSignature = signature;
          let type = null;
          let selector = null;
          if (status.legal.includes('check')) {
            type = 'check';
            selector = '#svr347Actions [data-action="check"]';
          } else if (status.legal.includes('call')) {
            type = 'call';
            selector = '#svr347Actions [data-action="call"]';
          } else if (status.legal.includes('allin')) {
            type = 'allin';
            selector = '#svr347Actions [data-action="allin"]';
          }
          if (!selector) {
            failures.push(`No usable human action during ${status.phase}: ${status.legal.join(',')}`);
            break;
          }
          humanActions[status.phase] = [...(humanActions[status.phase] || []), type];
          await tap(page.locator(selector));
        }
      }
      await page.waitForTimeout(45);
    }
    await page.waitForTimeout(700);

    diagnostics.hand = await snapshot(page);
    diagnostics.hand.phases = [...phases];
    diagnostics.hand.humanActions = humanActions;
    for (const phase of ['preflop', 'flop', 'turn', 'river', 'showdown']) {
      check(phases.has(phase), `Full hand did not reach ${phase}`);
    }
    for (const phase of ['preflop', 'flop', 'turn', 'river']) {
      check((humanActions[phase] || []).length >= 1, `Human did not receive and complete a betting action on ${phase}`);
    }
    check(diagnostics.hand.street?.streetOrderPass === true, `Street order failed: ${(diagnostics.hand.street?.streetOrder || []).join(' -> ')}`);
    check(diagnostics.hand.street?.burnSequencePass === true, 'Burn-card sequence did not match flop/turn/river rules');
    check(diagnostics.hand.street?.streetSnapshots?.preflop?.communityCount === 0, 'Preflop exposed community cards');
    check(diagnostics.hand.street?.streetSnapshots?.flop?.communityCount === 3, 'Flop did not expose exactly three cards');
    check(diagnostics.hand.street?.streetSnapshots?.flop?.burnCount >= 1, 'Flop was not preceded by a burn card');
    check(diagnostics.hand.street?.streetSnapshots?.turn?.communityCount === 4, 'Turn did not expose exactly one additional card');
    check(diagnostics.hand.street?.streetSnapshots?.turn?.burnCount >= 2, 'Turn was not preceded by the second burn card');
    check(diagnostics.hand.street?.streetSnapshots?.river?.communityCount === 5, 'River did not expose exactly one additional card');
    check(diagnostics.hand.street?.streetSnapshots?.river?.burnCount >= 3, 'River was not preceded by the third burn card');
    check((diagnostics.hand.rawState?.winners || []).length > 0, 'No winner was recorded');
    check(diagnostics.hand.core?.totalChips === 90000, `Post-payout total ${diagnostics.hand.core?.totalChips} != 90000`);
    check(diagnostics.hand.core?.conservationValid === true, 'Payout conservation failed');
    check(diagnostics.hand.audio?.win_pot >= 1, 'Winner audio was not triggered');
    check(diagnostics.hand.audio?.chip_bet >= 1, 'Chip audio was not triggered');

    await page.waitForTimeout(700);
    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STATE?.joined === false
      && window.SVR_PHASE336_POKER_STATE?.phase === 'idle'
      && window.SVR_PHASE363_CONSISTENCY_QA?.()?.lobbyCardsCleared === true
    ), null, { timeout: 15000 });
    await page.waitForTimeout(300);

    diagnostics.left = await snapshot(page);
    check(diagnostics.left.core?.gameState === 'LOBBY', 'LEAVE did not return to LOBBY');
    check(diagnostics.left.phase347?.seated === false, 'LEAVE did not release the seated camera');
    check(diagnostics.left.seatText === 'JOIN TABLE', 'LEAVE did not restore JOIN TABLE label');
    check(diagnostics.left.join?.pass === true, 'LEAVE produced duplicate or mislabeled join controls');
    check(diagnostics.left.holeVisible === false && diagnostics.left.communityVisible === false, 'Cards remain visible after LEAVE');
    check(diagnostics.left.core?.stack === 15000, 'LEAVE did not restore the fresh 15,000 bankroll');
    check(diagnostics.left.core?.totalChips === 90000, 'LEAVE did not restore the 90,000 table bankroll');
    check(diagnostics.left.consistency?.lobbyCardsCleared === true, 'Engine cards remain after LEAVE');
    check((diagnostics.left.poker?.players || []).every((player) => player.hand.length === 0), 'Poker audit still exposes cards after LEAVE');

    await page.waitForTimeout(700);
    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    await page.waitForFunction(() => (
      window.SVR_PHASE363_STATE?.joined === true
      && window.SVR_PHASE336_POKER_STATE?.handNo === 1
      && (window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0) === 2
    ), null, { timeout: 30000 });
    await page.waitForFunction(() => window.SVR_PHASE336_POKER_STATE?.waitingHuman === true, null, { timeout: 30000 });

    diagnostics.rejoined = await snapshot(page);
    check(diagnostics.rejoined.core?.joined === true, 'Rejoin failed');
    check(diagnostics.rejoined.poker?.handNo === 1, 'Rejoin did not start a fresh hand 1');
    check(diagnostics.rejoined.core?.totalChips === 90000, 'Rejoin table bankroll is not 90,000');
    check(diagnostics.rejoined.poker?.players?.length === 6, 'Rejoin table does not have six players');
    check(diagnostics.rejoined.poker?.players?.every((player) => player.stack + player.contributed <= 15000), 'A player exceeds the 15,000 starting bankroll after rejoin');

    const callBefore = await page.evaluate(() => {
      const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
      return {
        legal: window.SVR_POKER_LEGAL_ACTIONS?.() || [],
        actionSeq: Number(window.SVR_PHASE336_POKER_STATE?.actionSeq || 0),
        bet: Number(audit?.players?.[0]?.bet || 0),
        contributed: Number(audit?.players?.[0]?.contributed || 0)
      };
    });
    check(callBefore.legal.includes('call'), `CALL was not legal on the fresh preflop test: ${callBefore.legal.join(',')}`);
    if (callBefore.legal.includes('call')) {
      await tap(page.locator('#svr347Actions [data-action="call"]'));
      await page.waitForFunction(({ actionSeq, bet, contributed }) => {
        const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
        const player = audit?.players?.[0] || {};
        return Number(window.SVR_PHASE336_POKER_STATE?.actionSeq || 0) > actionSeq
          && (Number(player.bet || 0) > bet || Number(player.contributed || 0) > contributed);
      }, callBefore, { timeout: 10000 });
    }
    diagnostics.callButton = await snapshot(page);
    check(diagnostics.callButton.poker?.players?.[0]?.contributed > callBefore.contributed, 'CALL button did not commit chips');

    await page.waitForTimeout(700);
    await tap(page.locator('#svr347Actions [data-ui="seat"]'));
    await page.waitForFunction(() => window.SVR_PHASE363_STATE?.joined === false, null, { timeout: 15000 });
  } catch (error) {
    diagnostics.fatal = String(error?.stack || error);
    failures.push(`Fatal acceptance error: ${diagnostics.fatal}`);
    try { diagnostics.crashSnapshot = await snapshot(page); } catch {}
  }

  const ignoredBadResponses = diagnostics.badResponses.filter((entry) => !/favicon\.ico/i.test(entry.url));
  const ignoredFailedRequests = diagnostics.failedRequests.filter((entry) => !/favicon\.ico/i.test(entry.url));
  check(diagnostics.pageErrors.length === 0, `Page errors: ${diagnostics.pageErrors.join(' | ')}`);
  check(diagnostics.consoleErrors.length === 0, `Console errors: ${diagnostics.consoleErrors.join(' | ')}`);
  check(ignoredFailedRequests.length === 0, `Failed requests: ${JSON.stringify(ignoredFailedRequests)}`);
  check(ignoredBadResponses.length === 0, `HTTP errors: ${JSON.stringify(ignoredBadResponses)}`);

  const result = {
    pass: failures.length === 0,
    build: 'PHASE-363-ANDROID-CANONICAL-TABLE-JOIN-BANKROLL-AUDIO-LOCK',
    failures,
    diagnostics
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.pass) process.exit(1);
})().catch((error) => {
  console.error(error?.stack || error);
  process.exit(1);
});
