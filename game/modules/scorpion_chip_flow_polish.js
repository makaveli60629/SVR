/*
 * SVR Poker — Phase 101 Scorpion Chip Flow + Winner Moment Polish
 * Game-side only. No website / SQL changes.
 * Adds a lightweight, non-breaking polish layer that listens for poker/table events.
 */
(function () {
  'use strict';

  const BUILD = 'PHASE-101-SCORPION-CHIP-FLOW-WINNER-MOMENT-LOCK';
  const root = window;
  const doc = document;

  const state = {
    build: BUILD,
    loadedAt: new Date().toISOString(),
    enabled: true,
    lastAction: null,
    lastWinner: null,
    lastError: null,
    chipMoves: [],
    history: []
  };

  root.SVR = root.SVR || {};
  root.SVR.phase101 = state;
  root.SVR_SCORPION_CHIP_FLOW_POLISH = state;

  function safe(fn) {
    try { return fn(); }
    catch (error) {
      state.lastError = String(error && error.message ? error.message : error);
      console.warn('[SVR Phase101]', error);
      return null;
    }
  }

  function isScorpionContext() {
    const path = String(location.pathname || '').toLowerCase();
    const hash = String(location.hash || '').toLowerCase();
    const bodyText = String(doc.body && doc.body.dataset && doc.body.dataset.scene || '').toLowerCase();
    return path.includes('scorpion') || hash.includes('scorpion') || bodyText.includes('scorpion') || true;
  }

  function ensureStyle() {
    if (doc.getElementById('svr-phase101-style')) return;
    const style = doc.createElement('style');
    style.id = 'svr-phase101-style';
    style.textContent = `
      #svr-phase101-chip-panel {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 9998;
        width: min(360px, calc(100vw - 36px));
        pointer-events: none;
        font-family: Arial, Helvetica, sans-serif;
        color: #f7e7ff;
        text-shadow: 0 0 8px rgba(160, 60, 255, .8);
      }
      #svr-phase101-chip-panel .svr-card {
        margin-top: 8px;
        padding: 10px 12px;
        border: 1px solid rgba(196, 105, 255, .55);
        border-radius: 12px;
        background: rgba(10, 0, 26, .70);
        box-shadow: 0 0 18px rgba(135, 40, 220, .35);
        backdrop-filter: blur(4px);
      }
      #svr-phase101-winner {
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
        color: #fff4b8;
      }
      #svr-phase101-flow {
        font-size: 13px;
        line-height: 1.35;
        opacity: .95;
      }
      #svr-phase101-history {
        max-height: 92px;
        overflow: hidden;
        font-size: 12px;
        line-height: 1.35;
        opacity: .9;
      }
      .svr-phase101-chip-pop {
        position: fixed;
        z-index: 9997;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: radial-gradient(circle, #ffe98a 0%, #d38b12 45%, #7d3600 100%);
        box-shadow: 0 0 12px rgba(255, 210, 80, .9);
        pointer-events: none;
        animation: svrPhase101ChipPop 900ms ease-out forwards;
      }
      @keyframes svrPhase101ChipPop {
        0% { transform: translateY(0) scale(.75); opacity: 0; }
        18% { opacity: 1; }
        100% { transform: translateY(-44px) scale(1.25); opacity: 0; }
      }
    `;
    doc.head.appendChild(style);
  }

  function ensurePanel() {
    ensureStyle();
    let panel = doc.getElementById('svr-phase101-chip-panel');
    if (panel) return panel;
    panel = doc.createElement('div');
    panel.id = 'svr-phase101-chip-panel';
    panel.innerHTML = `
      <div id="svr-phase101-winner" class="svr-card" hidden></div>
      <div id="svr-phase101-flow" class="svr-card">Chip flow polish armed.</div>
      <div id="svr-phase101-history" class="svr-card" hidden></div>
    `;
    doc.body.appendChild(panel);
    return panel;
  }

  function addHistory(line) {
    if (!line) return;
    state.history.unshift({ time: new Date().toISOString(), line: String(line) });
    state.history = state.history.slice(0, 8);
    const box = ensurePanel().querySelector('#svr-phase101-history');
    if (!box) return;
    box.hidden = false;
    box.innerHTML = state.history.map(item => `<div>${escapeHtml(item.line)}</div>`).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function setFlow(text) {
    const el = ensurePanel().querySelector('#svr-phase101-flow');
    if (el) el.textContent = text;
  }

  function showWinner(detail) {
    const winner = detail && (detail.winner || detail.player || detail.name) || 'Winner';
    const hand = detail && (detail.hand || detail.handName || detail.result) || 'Winning hand';
    const pot = detail && (detail.pot || detail.amount || detail.potAmount) || '';
    state.lastWinner = { winner, hand, pot, time: new Date().toISOString() };
    const el = ensurePanel().querySelector('#svr-phase101-winner');
    if (el) {
      el.hidden = false;
      el.textContent = pot ? `WINNER: ${winner} • ${hand} • POT ${pot}` : `WINNER: ${winner} • ${hand}`;
      window.setTimeout(() => { if (el) el.hidden = true; }, 5200);
    }
    addHistory(pot ? `${winner} wins ${pot} with ${hand}` : `${winner} wins with ${hand}`);
    popChips(9);
  }

  function popChips(count) {
    safe(() => {
      for (let i = 0; i < count; i += 1) {
        const chip = doc.createElement('div');
        chip.className = 'svr-phase101-chip-pop';
        chip.style.left = `${Math.round(window.innerWidth * .5 + (Math.random() * 120 - 60))}px`;
        chip.style.top = `${Math.round(window.innerHeight * .56 + (Math.random() * 60 - 30))}px`;
        chip.style.animationDelay = `${i * 45}ms`;
        doc.body.appendChild(chip);
        window.setTimeout(() => chip.remove(), 1300 + i * 45);
      }
    });
  }

  function recordChipMove(type, detail) {
    const move = { type, detail: detail || {}, time: new Date().toISOString() };
    state.chipMoves.push(move);
    state.chipMoves = state.chipMoves.slice(-24);
    const amount = detail && (detail.amount || detail.value || detail.pot || detail.potAmount);
    const label = amount ? `${type}: ${amount}` : type;
    state.lastAction = move;
    setFlow(label);
    addHistory(label);
    if (/winner|sweep|vacuum|payout/i.test(type)) popChips(7);
    else popChips(3);
  }

  function onEvent(name, handler) {
    window.addEventListener(name, event => safe(() => handler(event.detail || {})), { passive: true });
  }

  function installEventHooks() {
    onEvent('svr:poker:action', detail => recordChipMove(detail.action || 'Poker action', detail));
    onEvent('svr:poker:bet', detail => recordChipMove('Bet to line', detail));
    onEvent('svr:poker:call', detail => recordChipMove('Call staged to pot', detail));
    onEvent('svr:poker:raise', detail => recordChipMove('Raise staged to pot', detail));
    onEvent('svr:poker:pot', detail => recordChipMove('Pot updated', detail));
    onEvent('svr:poker:pot-sweep', detail => recordChipMove('Pot sweep to winner', detail));
    onEvent('svr:poker:winner', showWinner);
    onEvent('svr:poker:showdown', detail => {
      addHistory('Showdown');
      if (detail && (detail.winner || detail.hand)) showWinner(detail);
    });
    onEvent('svr:poker:hand-history', detail => addHistory(detail.line || detail.text || detail.action));
  }

  function exposeApi() {
    state.api = {
      recordChipMove,
      showWinner,
      addHistory,
      setFlow,
      popChips
    };
  }

  function init() {
    if (!isScorpionContext()) return;
    ensurePanel();
    installEventHooks();
    exposeApi();
    setFlow('Phase 101 chip flow polish ready.');
    addHistory('Phase 101 chip flow polish loaded');
    console.info('[SVR]', BUILD, 'loaded');
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
