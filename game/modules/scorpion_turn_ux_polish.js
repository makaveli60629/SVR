/*
  SVR Poker — Phase 102 Scorpion Turn UX + Player Decision Lock
  Game-side-only helper. Lightweight runtime guard/polish layer.
  It does not replace the poker engine; it listens for poker/table events and
  improves turn prompts, legal-action state visibility, and timeout feedback.
*/
(function () {
  'use strict';

  const PHASE = 'PHASE-102-SCORPION-TURN-UX-PLAYER-DECISION-LOCK';
  const globalRoot = window.SVR || (window.SVR = {});
  const state = globalRoot.scorpionTurnUX = globalRoot.scorpionTurnUX || {
    phase: PHASE,
    loadedAt: new Date().toISOString(),
    lastTurn: null,
    lastActionState: null,
    lastTimer: null,
    warnings: [],
    events: []
  };

  const ACTION_RULES = {
    noBet: ['CHECK', 'BET', 'FOLD'],
    facingBet: ['CALL', 'RAISE', 'FOLD'],
    allIn: ['WAITING'],
    handEnded: ['NEXT HAND']
  };

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function ensurePanel() {
    let panel = document.getElementById('svr-scorpion-turn-ux-panel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'svr-scorpion-turn-ux-panel';
    panel.setAttribute('aria-live', 'polite');
    panel.innerHTML = `
      <div class="svr-turn-title">SCORPION TABLE</div>
      <div class="svr-turn-main">WAITING</div>
      <div class="svr-turn-sub">Pot -- • Stack -- • Call --</div>
      <div class="svr-turn-actions"></div>
    `;

    const style = document.createElement('style');
    style.id = 'svr-scorpion-turn-ux-style';
    style.textContent = `
      #svr-scorpion-turn-ux-panel{
        position:fixed; left:50%; bottom:18px; transform:translateX(-50%);
        z-index:9999; min-width:300px; max-width:min(92vw,560px);
        padding:10px 14px; border:1px solid rgba(174,92,255,.75);
        border-radius:16px; background:rgba(8,4,20,.76); color:#f5ecff;
        font-family:system-ui,Segoe UI,Arial,sans-serif; text-align:center;
        box-shadow:0 0 22px rgba(136,73,255,.45); pointer-events:none;
        backdrop-filter:blur(7px); letter-spacing:.02em;
      }
      #svr-scorpion-turn-ux-panel .svr-turn-title{font-size:11px; opacity:.86; color:#c7a7ff;}
      #svr-scorpion-turn-ux-panel .svr-turn-main{font-size:22px; font-weight:800; margin-top:2px;}
      #svr-scorpion-turn-ux-panel .svr-turn-sub{font-size:13px; opacity:.92; margin-top:2px;}
      #svr-scorpion-turn-ux-panel .svr-turn-actions{display:flex; gap:7px; justify-content:center; flex-wrap:wrap; margin-top:7px;}
      #svr-scorpion-turn-ux-panel .svr-action-pill{
        border:1px solid rgba(255,255,255,.28); border-radius:999px; padding:3px 9px;
        background:rgba(255,255,255,.09); font-size:12px; font-weight:700;
      }
      #svr-scorpion-turn-ux-panel.svr-warning{border-color:#ffcf5e; box-shadow:0 0 26px rgba(255,191,62,.75);}
      #svr-scorpion-turn-ux-panel.svr-critical{border-color:#ff5e7a; box-shadow:0 0 28px rgba(255,74,116,.8);}
      @media (max-width:700px){#svr-scorpion-turn-ux-panel{bottom:10px; font-size:12px}.svr-turn-main{font-size:18px!important}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(panel);
    return panel;
  }

  function legalActionsFromDetail(detail) {
    if (!detail) return ACTION_RULES.noBet;
    if (detail.handEnded || detail.phase === 'ended' || detail.state === 'handEnded') return ACTION_RULES.handEnded;
    if (detail.allIn || detail.state === 'allIn') return ACTION_RULES.allIn;
    if (detail.facingBet || Number(detail.toCall || detail.callAmount || 0) > 0) return ACTION_RULES.facingBet;
    return ACTION_RULES.noBet;
  }

  function updatePanel(detail) {
    const panel = ensurePanel();
    const seconds = Number(detail?.seconds ?? detail?.time ?? detail?.timer ?? 20);
    const isPlayer = detail?.isPlayerTurn !== false && (detail?.player === 'USER' || detail?.seat === 'player' || detail?.isPlayerTurn || detail?.active === 'player');
    const actions = detail?.legalActions || legalActionsFromDetail(detail);
    const toCall = detail?.toCall ?? detail?.callAmount ?? '--';
    const pot = detail?.pot ?? detail?.potAmount ?? '--';
    const stack = detail?.stack ?? detail?.playerStack ?? '--';
    const minRaise = detail?.minRaise ?? detail?.minimumRaise ?? '--';

    const main = panel.querySelector('.svr-turn-main');
    const sub = panel.querySelector('.svr-turn-sub');
    const actionBox = panel.querySelector('.svr-turn-actions');

    panel.classList.toggle('svr-warning', seconds <= 5 && seconds > 0);
    panel.classList.toggle('svr-critical', seconds <= 0 || detail?.autoFold || detail?.timeout);

    if (detail?.autoFold) main.textContent = 'AUTO-FOLD';
    else if (detail?.autoCheck) main.textContent = 'AUTO-CHECK';
    else if (isPlayer) main.textContent = `YOUR TURN — ${Math.max(0, seconds)}`;
    else main.textContent = detail?.label || 'TABLE WAITING';

    sub.textContent = `Pot ${pot} • Stack ${stack} • Call ${toCall} • Min Raise ${minRaise}`;
    actionBox.innerHTML = '';
    actions.forEach((a) => {
      const pill = document.createElement('span');
      pill.className = 'svr-action-pill';
      pill.textContent = String(a).toUpperCase();
      actionBox.appendChild(pill);
    });

    state.lastTurn = { detail, renderedAt: new Date().toISOString() };
  }

  function pulseSeat(detail) {
    const selectors = [
      '[data-seat="player"]', '#player-seat', '.player-seat', '.svr-player-seat',
      '[data-active-seat="player"]'
    ];
    qsa(selectors.join(',')).forEach((el) => {
      el.classList.add('svr-active-turn-seat');
      if (!document.getElementById('svr-active-turn-seat-style')) {
        const style = document.createElement('style');
        style.id = 'svr-active-turn-seat-style';
        style.textContent = `.svr-active-turn-seat{outline:2px solid #ffd86b!important; filter:drop-shadow(0 0 10px #ffd86b)!important;}`;
        document.head.appendChild(style);
      }
      clearTimeout(el.__svrTurnGlowTimer);
      el.__svrTurnGlowTimer = setTimeout(() => el.classList.remove('svr-active-turn-seat'), 1300);
    });
  }

  function record(name, detail) {
    state.events.push({ name, detail, at: new Date().toISOString() });
    if (state.events.length > 50) state.events.shift();
  }

  function handleTurnEvent(evt) {
    const detail = evt.detail || {};
    record(evt.type, detail);
    updatePanel(detail);
    pulseSeat(detail);
  }

  function handleActionEvent(evt) {
    const detail = evt.detail || {};
    record(evt.type, detail);
    state.lastActionState = { detail, at: new Date().toISOString() };
    if (detail.autoFold || detail.action === 'auto-fold') updatePanel({ ...detail, autoFold: true, seconds: 0 });
    if (detail.autoCheck || detail.action === 'auto-check') updatePanel({ ...detail, autoCheck: true, seconds: 0 });
  }

  window.addEventListener('svr:poker:turn', handleTurnEvent);
  window.addEventListener('svr:poker:timer', handleTurnEvent);
  window.addEventListener('svr:poker:action-state', handleTurnEvent);
  window.addEventListener('svr:poker:action', handleActionEvent);
  window.addEventListener('svr:poker:auto-check', handleActionEvent);
  window.addEventListener('svr:poker:auto-fold', handleActionEvent);

  window.SVR_PHASE_102_TURN_UX = {
    phase: PHASE,
    rules: ACTION_RULES,
    update: updatePanel,
    state
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => updatePanel({ label: 'SCORPION UX READY', seconds: 20 }));
  } else {
    updatePanel({ label: 'SCORPION UX READY', seconds: 20 });
  }
})();
