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
  hand: null,
  left: null,
  rejoined: null
};

function check(condition, message) {
  if (!condition) failures.push(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
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

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => (
    typeof window.SVR_PHASE363_QA === 'function'
    && typeof window.SVR_PHASE363_JOIN_CONTROL_QA === 'function'
    && typeof window.SVR_PHASE363_TABLE_QA === 'function'
    && window.SVR_PHASE363_STATE?.installedAt
  ), null, { timeout: 120000 });
  await page.waitForTimeout(1200);

  diagnostics.lobby = await page.evaluate(() => {
    const core = window.SVR_PHASE363_QA();
    const join = window.SVR_PHASE363_JOIN_CONTROL_QA();
    const table = window.SVR_PHASE363_TABLE_QA();
    const poker = window.SVR_RUN_PHASE336_POKER_AUDIT?.() || null;
    const seat = document.querySelector('#svr347Actions [data-ui="seat"]');
    return {
      core,
      join,
      table,
      poker,
      seatText: seat?.textContent?.trim() || null,
      bankrollText: document.querySelector('#svr363BankrollValue')?.textContent?.trim() || null,
      bankrollMeta: document.querySelector('#svr363BankrollMeta')?.textContent?.trim() || null,
      holeVisible: (() => { const node = document.querySelector('#svr347Hole'); return node ? getComputedStyle(node).display !== 'none' : false; })(),
      communityVisible: (() => { const node = document.querySelector('#svr347Community'); return node ? getComputedStyle(node).display !== 'none' : false; })(),
      bodyClass: document.body.className
    };
  });

  check(diagnostics.lobby.core.joined === false, 'Lobby boot is incorrectly joined');
  check(diagnostics.lobby.core.gameState === 'LOBBY', 'Lobby state is not LOBBY');
  check(diagnostics.lobby.core.totalChips === 90000, `Lobby total chips ${diagnostics.lobby.core.totalChips} != 90000`);
  check(diagnostics.lobby.core.stack === 15000, `Lobby bankroll ${diagnostics.lobby.core.stack} != 15000`);
  check(diagnostics.lobby.join.pass === true, 'Lobby does not have exactly one JOIN control');
  check(diagnostics.lobby.seatText === 'JOIN TABLE', `Lobby control says ${diagnostics.lobby.seatText}`);
  check(diagnostics.lobby.holeVisible === false, 'Hole cards are visible before JOIN');
  check(diagnostics.lobby.communityVisible === false, 'Community cards are visible before JOIN');
  check(diagnostics.lobby.table.pass === true, `Verified table failed: ${diagnostics.lobby.table.error || 'unknown'}`);
  check(diagnostics.lobby.table.emergencyFallbackPresent === false, 'Emergency table fallback is still present');
  check(diagnostics.lobby.core.fovValid === true, 'Android FOV is outside protected range');
  check(diagnostics.lobby.bankrollText?.includes('15,000'), 'Visible lobby bankroll does not show 15,000');

  await page.locator('#svr347Actions [data-ui="seat"]').click({ force: true });
  await page.waitForFunction(() => (
    window.SVR_PHASE363_STATE?.joined === true
    && window.SVR_PHASE336_POKER_STATE?.handNo >= 1
    && (window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0) === 2
  ), null, { timeout: 30000 });
  await page.waitForTimeout(450);

  diagnostics.joined = await page.evaluate(() => ({
    core: window.SVR_PHASE363_QA(),
    join: window.SVR_PHASE363_JOIN_CONTROL_QA(),
    table: window.SVR_PHASE363_TABLE_QA(),
    poker: window.SVR_RUN_PHASE336_POKER_AUDIT?.(),
    phase347: window.SVR_PHASE347_STATE || null,
    seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null,
    bankrollText: document.querySelector('#svr363BankrollValue')?.textContent?.trim() || null,
    holeVisible: (() => { const node = document.querySelector('#svr347Hole'); return node ? getComputedStyle(node).display !== 'none' : false; })(),
    audio: window.SVR_PHASE363_STATE?.audioEvents || {}
  }));

  check(diagnostics.joined.core.joined === true, 'JOIN did not enter seated mode');
  check(diagnostics.joined.join.visibleJoinControls === 1, 'JOIN created duplicate seat controls');
  check(diagnostics.joined.seatText === 'LEAVE TABLE', `Seated control says ${diagnostics.joined.seatText}`);
  check(diagnostics.joined.poker.players?.[0]?.hand?.length === 2, 'Human did not receive two cards after JOIN');
  check(diagnostics.joined.holeVisible === true, 'Hole card HUD is hidden after JOIN');
  check(diagnostics.joined.phase347?.seated === true, 'Phase 347 camera is not seated after JOIN');
  check(diagnostics.joined.core.totalChips === 90000, 'JOIN did not create a 90,000-chip table');
  check(diagnostics.joined.core.audioEvents?.sit_down >= 1, 'Sit-down audio was not triggered');
  check(diagnostics.joined.core.audioEvents?.card_deal >= 1, 'Card-deal audio was not triggered');

  diagnostics.hand = await page.evaluate(async () => {
    window.SVR_POKER_QA_PASSIVE_BOTS = true;
    const phases = new Set();
    const started = performance.now();
    let lastActionSignature = '';
    while (performance.now() - started < 90000) {
      const poker = window.SVR_PHASE336_POKER_STATE;
      phases.add(String(poker?.phase || 'idle'));
      if (poker?.phase === 'showdown' && Array.isArray(poker.winners) && poker.winners.length) break;
      if (poker?.waitingHuman) {
        const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
        const player = audit?.players?.[0] || {};
        const signature = [audit?.handNo, audit?.phase, audit?.current, audit?.actionSeq, audit?.currentBet, player.bet, player.stack].join(':');
        if (signature !== lastActionSignature) {
          lastActionSignature = signature;
          const legal = window.SVR_POKER_LEGAL_ACTIONS?.() || [];
          if (legal.includes('check')) window.SVR_POKER_ACTION('check');
          else if (legal.includes('call')) window.SVR_POKER_ACTION('call');
          else if (legal.includes('fold')) window.SVR_POKER_ACTION('fold');
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    await new Promise((resolve) => setTimeout(resolve, 850));
    window.SVR_POKER_QA_PASSIVE_BOTS = false;
    const audit = window.SVR_RUN_PHASE336_POKER_AUDIT?.();
    return {
      phases: [...phases],
      audit,
      core: window.SVR_PHASE363_QA(),
      audio: window.SVR_PHASE363_STATE?.audioEvents || {},
      winner: window.SVR_PHASE336_POKER_STATE?.winner || null,
      winners: window.SVR_PHASE336_POKER_STATE?.winners || [],
      elapsedMs: Math.round(performance.now() - started)
    };
  });

  for (const phase of ['preflop', 'flop', 'turn', 'river', 'showdown']) {
    check(diagnostics.hand.phases.includes(phase), `Full hand did not reach ${phase}`);
  }
  check((diagnostics.hand.winners || []).length > 0 || diagnostics.hand.winner, 'No winner was recorded');
  check(diagnostics.hand.core.totalChips === 90000, `Post-payout total ${diagnostics.hand.core.totalChips} != 90000`);
  check(diagnostics.hand.core.conservationValid === true, 'Payout conservation failed');
  check(diagnostics.hand.audio.win_pot >= 1, 'Winner audio was not triggered');
  check(diagnostics.hand.audio.chip_bet >= 1, 'Chip audio was not triggered');

  await page.locator('#svr347Actions [data-ui="seat"]').click({ force: true });
  await page.waitForFunction(() => window.SVR_PHASE363_STATE?.joined === false && window.SVR_PHASE336_POKER_STATE?.phase === 'idle', null, { timeout: 15000 });
  await page.waitForTimeout(350);

  diagnostics.left = await page.evaluate(() => ({
    core: window.SVR_PHASE363_QA(),
    join: window.SVR_PHASE363_JOIN_CONTROL_QA(),
    poker: window.SVR_RUN_PHASE336_POKER_AUDIT?.(),
    phase347: window.SVR_PHASE347_STATE || null,
    seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null,
    holeVisible: (() => { const node = document.querySelector('#svr347Hole'); return node ? getComputedStyle(node).display !== 'none' : false; })(),
    communityVisible: (() => { const node = document.querySelector('#svr347Community'); return node ? getComputedStyle(node).display !== 'none' : false; })()
  }));

  check(diagnostics.left.core.gameState === 'LOBBY', 'LEAVE did not return to LOBBY');
  check(diagnostics.left.phase347?.seated === false, 'LEAVE did not release seated camera');
  check(diagnostics.left.seatText === 'JOIN TABLE', 'LEAVE did not restore JOIN label');
  check(diagnostics.left.holeVisible === false && diagnostics.left.communityVisible === false, 'Cards remain visible after LEAVE');
  check(diagnostics.left.core.stack === 15000, 'LEAVE did not restore fresh 15,000 bankroll');
  check(diagnostics.left.core.totalChips === 90000, 'LEAVE did not restore 90,000 table bankroll');
  check((diagnostics.left.poker.players || []).every((player) => player.hand.length === 0), 'Player cards remain in engine after LEAVE');

  await page.locator('#svr347Actions [data-ui="seat"]').click({ force: true });
  await page.waitForFunction(() => (
    window.SVR_PHASE363_STATE?.joined === true
    && window.SVR_PHASE336_POKER_STATE?.handNo === 1
    && (window.SVR_RUN_PHASE336_POKER_AUDIT?.()?.players?.[0]?.hand?.length || 0) === 2
  ), null, { timeout: 30000 });

  diagnostics.rejoined = await page.evaluate(() => ({
    core: window.SVR_PHASE363_QA(),
    poker: window.SVR_RUN_PHASE336_POKER_AUDIT?.(),
    seatText: document.querySelector('#svr347Actions [data-ui="seat"]')?.textContent?.trim() || null
  }));

  check(diagnostics.rejoined.core.joined === true, 'Rejoin failed');
  check(diagnostics.rejoined.poker.handNo === 1, 'Rejoin did not start a fresh hand 1');
  check(diagnostics.rejoined.core.totalChips === 90000, 'Rejoin table bankroll is not 90,000');
  check(diagnostics.rejoined.poker.players.length === 6, 'Rejoin table does not have six players');
  check(diagnostics.rejoined.poker.players.every((player) => player.stack + player.contributed <= 15000), 'A player exceeds the 15,000 starting bankroll after rejoin');

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
