(function () {
  "use strict";

  const MODULE_NAME = "SVRHubUserFriendly";
  const PHASE = 253;

  const defaultCards = [
    {
      title: "Enter SVR Game",
      subtitle: "Launch the main VR poker space",
      href: "../index.html",
      action: "game",
      emoji: "🎮"
    },
    {
      title: "Poker Room",
      subtitle: "Jump straight to the table",
      href: "../scorpion.html",
      action: "poker",
      emoji: "♠️"
    },
    {
      title: "Moon / Mars Test",
      subtitle: "Check locomotion and low-gravity movement",
      href: "../index.html?scene=mars",
      action: "locomotion",
      emoji: "🪐"
    },
    {
      title: "Watch + Status",
      subtitle: "Verify watch, chips, profile, and module health",
      href: "../index.html?panel=watch",
      action: "watch",
      emoji: "⌚"
    },
    {
      title: "Profile / Avatar",
      subtitle: "Local avatar bridge and player data",
      href: "../index.html?panel=profile",
      action: "profile",
      emoji: "🧍"
    },
    {
      title: "Diagnostics",
      subtitle: "Open runtime health tools",
      href: "../index.html?debug=1",
      action: "diagnostics",
      emoji: "🛠️"
    }
  ];

  const state = {
    phase: PHASE,
    initialized: false,
    cards: defaultCards,
    compact: false,
    errors: []
  };

  function log(message, data) {
    if (data !== undefined) console.log(`[${MODULE_NAME}] ${message}`, data);
    else console.log(`[${MODULE_NAME}] ${message}`);
  }

  function recordError(scope, error) {
    state.errors.push({
      scope,
      message: error && error.message ? error.message : String(error),
      time: new Date().toISOString()
    });
    console.error(`[${MODULE_NAME}] ${scope}`, error);
  }

  function installCss() {
    if (document.getElementById("svr-hub-user-friendly-css")) return;

    const style = document.createElement("style");
    style.id = "svr-hub-user-friendly-css";
    style.textContent = `
      :root {
        --svr-hub-bg: #020611;
        --svr-hub-panel: rgba(2, 14, 28, .78);
        --svr-hub-card: rgba(6, 26, 44, .74);
        --svr-hub-border: rgba(0, 247, 255, .24);
        --svr-hub-text: #e8ffff;
        --svr-hub-muted: #9ed6e7;
      }
      body.svr-hub-friendly {
        min-height: 100vh;
        margin: 0;
        background:
          radial-gradient(circle at 20% 10%, rgba(0,247,255,.18), transparent 30%),
          radial-gradient(circle at 80% 20%, rgba(104,90,255,.16), transparent 35%),
          linear-gradient(145deg, #020611, #06101d 56%, #020611);
        color: var(--svr-hub-text);
        font-family: system-ui, Segoe UI, Arial, sans-serif;
      }
      .svr-hub-shell {
        width: min(1120px, calc(100vw - 28px));
        margin: 0 auto;
        padding: 26px 0 40px;
      }
      .svr-hub-hero {
        border: 1px solid var(--svr-hub-border);
        border-radius: 28px;
        padding: clamp(18px, 4vw, 34px);
        background: linear-gradient(145deg, rgba(0,12,26,.82), rgba(0,38,54,.54));
        box-shadow: 0 0 60px rgba(0,247,255,.12);
        margin-bottom: 18px;
      }
      .svr-hub-kicker {
        display: inline-flex;
        gap: 8px;
        align-items: center;
        padding: 7px 11px;
        border: 1px solid rgba(0,247,255,.28);
        border-radius: 999px;
        color: #a9faff;
        background: rgba(0,0,0,.24);
        font-size: 13px;
      }
      .svr-hub-title {
        margin: 14px 0 8px;
        font-size: clamp(34px, 6vw, 72px);
        letter-spacing: -.04em;
        line-height: .96;
      }
      .svr-hub-subtitle {
        margin: 0;
        color: var(--svr-hub-muted);
        font-size: clamp(16px, 2vw, 21px);
        max-width: 760px;
      }
      .svr-hub-help-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }
      .svr-hub-pill {
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 999px;
        padding: 8px 11px;
        color: #dff;
        background: rgba(255,255,255,.05);
        font-size: 13px;
      }
      .svr-hub-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
      }
      .svr-hub-card {
        display: block;
        min-height: 142px;
        padding: 18px;
        border: 1px solid var(--svr-hub-border);
        border-radius: 22px;
        background: var(--svr-hub-card);
        color: var(--svr-hub-text);
        text-decoration: none;
        box-shadow: 0 16px 44px rgba(0,0,0,.28);
        transition: transform .16s ease, border-color .16s ease, background .16s ease;
      }
      .svr-hub-card:hover,
      .svr-hub-card:focus,
      .svr-hub-card[data-svr-focused="true"] {
        transform: translateY(-3px) scale(1.015);
        border-color: rgba(0,247,255,.72);
        background: rgba(8, 42, 64, .82);
      }
      .svr-hub-card-emoji {
        font-size: 30px;
        margin-bottom: 12px;
      }
      .svr-hub-card h2 {
        margin: 0 0 8px;
        font-size: 20px;
      }
      .svr-hub-card p {
        margin: 0;
        color: var(--svr-hub-muted);
        font-size: 14px;
      }
      .svr-hub-status {
        margin-top: 16px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
      }
      .svr-hub-status-card {
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 18px;
        padding: 12px;
        background: rgba(0,0,0,.22);
        color: #cceff8;
        font-size: 13px;
      }
      .svr-hub-status-card strong {
        display: block;
        color: #fff;
        margin-bottom: 4px;
      }
      @media (max-width: 640px) {
        .svr-hub-shell { width: min(100% - 20px, 1120px); padding-top: 12px; }
        .svr-hub-card { min-height: 112px; }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureShell() {
    document.body.classList.add("svr-hub-friendly");

    let shell = document.getElementById("svr-hub-shell");
    if (shell) return shell;

    shell = document.createElement("main");
    shell.id = "svr-hub-shell";
    shell.className = "svr-hub-shell";

    shell.innerHTML = `
      <section class="svr-hub-hero">
        <div class="svr-hub-kicker">SVR Hub • Phase ${PHASE}</div>
        <h1 class="svr-hub-title">Choose where you want to go.</h1>
        <p class="svr-hub-subtitle">Simple hub navigation for mouse, keyboard, VR controllers, and hand/controller ray selection.</p>
        <div class="svr-hub-help-row">
          <span class="svr-hub-pill">Controller stick / D-pad: move</span>
          <span class="svr-hub-pill">Trigger / A: select</span>
          <span class="svr-hub-pill">Hands/controllers: point + select</span>
          <span class="svr-hub-pill">Keyboard: arrows + Enter</span>
        </div>
      </section>
      <section id="svr-hub-grid" class="svr-hub-grid" aria-label="SVR hub destinations"></section>
      <section class="svr-hub-status" aria-label="SVR hub status">
        <div class="svr-hub-status-card"><strong>Input</strong><span id="svr-hub-input-status">Hybrid ready</span></div>
        <div class="svr-hub-status-card"><strong>Watch</strong><span id="svr-hub-watch-status">Ready when loaded</span></div>
        <div class="svr-hub-status-card"><strong>Profile</strong><span id="svr-hub-profile-status">Local profile bridge</span></div>
      </section>
    `;

    const originalMain = document.querySelector("main, #app, #root, .hub, .hub-app");
    if (originalMain && originalMain.parentElement && originalMain.children.length > 0) {
      originalMain.setAttribute("data-svr-original-hub", "true");
      originalMain.style.display = "none";
    }

    document.body.appendChild(shell);
    return shell;
  }

  function renderCards() {
    const shell = ensureShell();
    const grid = shell.querySelector("#svr-hub-grid");
    if (!grid) return;

    grid.innerHTML = state.cards.map(function (card, index) {
      const href = card.href || "#";
      const title = card.title || "Hub Item";
      const subtitle = card.subtitle || "Open";
      const action = card.action || title.toLowerCase().replace(/\s+/g, "-");
      const emoji = card.emoji || "◇";

      return `
        <a class="svr-hub-card" href="${href}" data-svr-nav="hub-card" data-hub-action="${action}" data-scene-link="${action}" data-svr-card-index="${index}">
          <div class="svr-hub-card-emoji" aria-hidden="true">${emoji}</div>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </a>
      `;
    }).join("");
  }

  function updateStatus() {
    const input = document.getElementById("svr-hub-input-status");
    const watch = document.getElementById("svr-hub-watch-status");
    const profile = document.getElementById("svr-hub-profile-status");

    if (input) {
      const nav = window.SVRHandControllerNavigation && window.SVRHandControllerNavigation.state;
      if (nav) {
        input.textContent = nav.controllerConnected ? "Controller detected" : nav.handTrackingLikely ? "Hand tracking ready" : "Keyboard/mouse ready";
      }
    }

    if (watch) {
      watch.textContent = window.SVRWatch ? "Watch loaded" : "Watch waiting";
    }

    if (profile) {
      const bridge = window.SVRProfileAvatarBridge;
      if (bridge && bridge.getProfile) {
        const profileData = bridge.getProfile();
        profile.textContent = profileData.displayName || "Local player";
      }
    }
  }

  function installActionHandler() {
    window.addEventListener("svr:nav-activate", function (event) {
      const detail = event.detail || {};
      const action = detail.action || "";

      if (action === "diagnostics" && window.SVRModuleHealth && window.SVRModuleHealth.toggle) {
        window.SVRModuleHealth.toggle(true);
      }

      if (action === "watch" && window.SVRWatch && window.SVRWatch.show) {
        window.SVRWatch.show();
      }
    });
  }

  function init() {
    if (state.initialized) return state;

    installCss();
    renderCards();
    installActionHandler();
    updateStatus();

    window.setInterval(updateStatus, 3000);

    state.initialized = true;
    log("ready", state);

    window.dispatchEvent(new CustomEvent("svr:hub-friendly-ready", { detail: state }));
    return state;
  }

  window[MODULE_NAME] = {
    init,
    state,
    renderCards,
    updateStatus,
    setCards: function (cards) {
      state.cards = Array.isArray(cards) && cards.length ? cards : defaultCards;
      renderCards();
      return state.cards;
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();