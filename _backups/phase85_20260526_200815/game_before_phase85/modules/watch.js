(function () {
  "use strict";

  const MODULE_NAME = "SVRWatch";
  const PHASE = 251;

  const state = {
    initialized: false,
    visible: true,
    attached: false,
    mode: "hud",
    lastUpdate: "",
    errors: [],
    stats: {
      phase: PHASE,
      scene: "auto",
      locomotion: "unknown",
      health: "online",
      chips: 0,
      table: "SVR",
      time: ""
    },
    elements: {
      hud: null,
      wristPanel: null
    }
  };

  function log(message, data) {
    if (data !== undefined) {
      console.log(`[${MODULE_NAME}] ${message}`, data);
    } else {
      console.log(`[${MODULE_NAME}] ${message}`);
    }
  }

  function warn(message, data) {
    if (data !== undefined) {
      console.warn(`[${MODULE_NAME}] ${message}`, data);
    } else {
      console.warn(`[${MODULE_NAME}] ${message}`);
    }
  }

  function recordError(scope, error) {
    const item = {
      scope,
      message: error && error.message ? error.message : String(error),
      time: new Date().toISOString()
    };
    state.errors.push(item);
    console.error(`[${MODULE_NAME}] ${scope}`, error);
  }

  function safeText(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback || "";
    return String(value);
  }

  function detectScene() {
    try {
      if (window.SVRMoonMarsLocomotion && typeof window.SVRMoonMarsLocomotion.getSceneName === "function") {
        return window.SVRMoonMarsLocomotion.getSceneName();
      }

      const sceneEl = document.querySelector("[data-svr-scene], [data-scene], a-scene");
      const sceneAttr = sceneEl
        ? sceneEl.getAttribute("data-svr-scene") || sceneEl.getAttribute("data-scene") || ""
        : "";

      const raw = `${location.pathname} ${location.search} ${location.hash} ${sceneAttr}`.toLowerCase();

      if (raw.includes("moon") || raw.includes("lunar")) return "moon";
      if (raw.includes("mars") || raw.includes("martian")) return "mars";
      if (raw.includes("poker")) return "poker";
      return "svr";
    } catch (error) {
      recordError("detectScene", error);
      return "svr";
    }
  }

  function detectLocomotion() {
    try {
      if (window.SVRMoonMarsLocomotion && typeof window.SVRMoonMarsLocomotion.getMode === "function") {
        return window.SVRMoonMarsLocomotion.getMode();
      }
      return "smooth";
    } catch (error) {
      recordError("detectLocomotion", error);
      return "unknown";
    }
  }

  function getChipCount() {
    try {
      const possible =
        window.SVR_CHIPS ||
        window.svrChips ||
        window.playerChips ||
        window.SVRPlayerChips ||
        0;

      const parsed = Number(possible);
      return Number.isFinite(parsed) ? parsed : 0;
    } catch (_) {
      return 0;
    }
  }

  function readVersion() {
    const current =
      window.SVR_PHASE ||
      window.SVRPhase ||
      window.SVR_PHASE_LABEL ||
      PHASE;

    return safeText(current, PHASE);
  }

  function styleHud(hud) {
    hud.style.position = "fixed";
    hud.style.right = "12px";
    hud.style.bottom = "12px";
    hud.style.zIndex = "99999";
    hud.style.width = "230px";
    hud.style.maxWidth = "calc(100vw - 24px)";
    hud.style.boxSizing = "border-box";
    hud.style.padding = "12px";
    hud.style.borderRadius = "16px";
    hud.style.border = "1px solid rgba(0, 255, 255, 0.36)";
    hud.style.background = "linear-gradient(145deg, rgba(2,8,18,0.88), rgba(0,28,44,0.72))";
    hud.style.color = "#dfffff";
    hud.style.font = "12px/1.35 system-ui, Segoe UI, Arial, sans-serif";
    hud.style.boxShadow = "0 0 28px rgba(0,255,255,0.16)";
    hud.style.backdropFilter = "blur(10px)";
    hud.style.pointerEvents = "auto";
    hud.style.userSelect = "none";
  }

  function createHud() {
    let hud = document.getElementById("svr-watch-hud");

    if (!hud) {
      hud = document.createElement("div");
      hud.id = "svr-watch-hud";
      hud.setAttribute("data-svr-watch", "hud");
      styleHud(hud);
      document.body.appendChild(hud);
    }

    state.elements.hud = hud;
    return hud;
  }

  function renderHud() {
    const hud = createHud();

    if (!state.visible) {
      hud.style.display = "none";
      return hud;
    }

    hud.style.display = "block";

    const scene = safeText(state.stats.scene, "svr");
    const locomotion = safeText(state.stats.locomotion, "smooth");
    const health = safeText(state.stats.health, "online");
    const chips = safeText(state.stats.chips, "0");
    const time = safeText(state.stats.time, "--:--");

    hud.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <strong style="font-size:13px;letter-spacing:.06em;color:#ffffff;">SVR WATCH</strong>
        <span style="font-size:10px;padding:3px 7px;border-radius:999px;border:1px solid rgba(0,255,255,.35);color:#9ff;">P${PHASE}</span>
      </div>
      <div style="height:1px;background:linear-gradient(90deg,rgba(0,255,255,.45),rgba(0,255,255,0));margin-bottom:8px;"></div>
      <div style="display:grid;grid-template-columns:72px 1fr;gap:5px 8px;">
        <span style="color:#85d9e9;">Time</span><span>${time}</span>
        <span style="color:#85d9e9;">Scene</span><span>${scene}</span>
        <span style="color:#85d9e9;">Move</span><span>${locomotion}</span>
        <span style="color:#85d9e9;">Chips</span><span>${chips}</span>
        <span style="color:#85d9e9;">Status</span><span>${health}</span>
      </div>
      <div style="margin-top:9px;color:#7fc7d8;font-size:10px;">Press W to hide/show â€¢ Press L for locomotion</div>
    `;

    return hud;
  }

  function createAFramePanel() {
    try {
      if (!window.AFRAME) return null;

      let panel = document.getElementById("svr-watch-wrist-panel");
      if (panel) {
        state.elements.wristPanel = panel;
        return panel;
      }

      const scene = document.querySelector("a-scene");
      if (!scene) return null;

      panel = document.createElement("a-entity");
      panel.id = "svr-watch-wrist-panel";
      panel.setAttribute("data-svr-watch", "wrist");
      panel.setAttribute("visible", state.visible ? "true" : "false");
      panel.setAttribute("position", "0 -0.05 -0.08");
      panel.setAttribute("rotation", "-75 0 0");
      panel.setAttribute("scale", "0.18 0.18 0.18");

      const bg = document.createElement("a-plane");
      bg.setAttribute("width", "1.28");
      bg.setAttribute("height", "0.72");
      bg.setAttribute("color", "#04131d");
      bg.setAttribute("opacity", "0.86");
      bg.setAttribute("material", "side: double; shader: flat");

      const text = document.createElement("a-text");
      text.id = "svr-watch-wrist-text";
      text.setAttribute("value", "SVR WATCH");
      text.setAttribute("align", "left");
      text.setAttribute("anchor", "left");
      text.setAttribute("baseline", "top");
      text.setAttribute("color", "#dfffff");
      text.setAttribute("width", "1.18");
      text.setAttribute("position", "-0.56 0.3 0.01");

      panel.appendChild(bg);
      panel.appendChild(text);

      const hand =
        document.querySelector("#leftHand") ||
        document.querySelector("[hand-controls='left']") ||
        document.querySelector("[laser-controls='hand: left']") ||
        document.querySelector("[tracked-controls*='left']");

      if (hand) {
        hand.appendChild(panel);
        state.attached = true;
        state.mode = "wrist";
      } else {
        scene.appendChild(panel);
        panel.setAttribute("position", "-0.35 1.35 -0.85");
        state.attached = false;
        state.mode = "scene";
      }

      state.elements.wristPanel = panel;
      return panel;
    } catch (error) {
      recordError("createAFramePanel", error);
      return null;
    }
  }

  function renderAFramePanel() {
    try {
      const panel = createAFramePanel();
      if (!panel) return null;

      panel.setAttribute("visible", state.visible ? "true" : "false");

      const text = panel.querySelector("#svr-watch-wrist-text");
      if (text) {
        const value = [
          "SVR WATCH P" + PHASE,
          "Time: " + state.stats.time,
          "Scene: " + state.stats.scene,
          "Move: " + state.stats.locomotion,
          "Chips: " + state.stats.chips,
          "Status: " + state.stats.health
        ].join("
");

        text.setAttribute("value", value);
      }

      return panel;
    } catch (error) {
      recordError("renderAFramePanel", error);
      return null;
    }
  }

  function updateStats(extra) {
    const date = new Date();

    state.stats.phase = readVersion();
    state.stats.scene = detectScene();
    state.stats.locomotion = detectLocomotion();
    state.stats.chips = getChipCount();
    state.stats.time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });

    if (extra && typeof extra === "object") {
      Object.keys(extra).forEach(function (key) {
        state.stats[key] = extra[key];
      });
    }

    state.lastUpdate = date.toISOString();
  }

  function refresh(extra) {
    updateStats(extra);
    renderHud();
    renderAFramePanel();

    window.dispatchEvent(new CustomEvent("svr:watch-refresh", {
      detail: {
        state,
        stats: state.stats
      }
    }));

    return state;
  }

  function toggle(force) {
    if (typeof force === "boolean") {
      state.visible = force;
    } else {
      state.visible = !state.visible;
    }

    refresh();

    return state.visible;
  }

  function installKeyboard() {
    window.addEventListener("keydown", function (event) {
      if (event.code === "KeyW" && (event.ctrlKey || event.altKey || event.metaKey)) {
        return;
      }

      if (event.code === "KeyW" && event.shiftKey) {
        toggle();
        event.preventDefault();
      }
    }, { passive: false });

    window.addEventListener("keydown", function (event) {
      if (event.code === "F8") {
        toggle();
        event.preventDefault();
      }
    }, { passive: false });
  }

  function installEvents() {
    window.addEventListener("svr:phase250-ready", function () {
      refresh({ health: "phase-ready" });
    });

    window.addEventListener("svr:optional-modules-ready", function () {
      refresh({ health: "modules-ready" });
    });

    window.addEventListener("svr:chips-updated", function (event) {
      const detail = event && event.detail ? event.detail : {};
      refresh({
        chips: Number(detail.chips || detail.total || state.stats.chips || 0)
      });
    });

    window.addEventListener("svr:watch-toggle", function () {
      toggle();
    });

    window.addEventListener("vrdisplaypresentchange", function () {
      setTimeout(refresh, 250);
    });
  }

  function startTicker() {
    refresh();
    window.setInterval(function () {
      refresh();
    }, 3000);
  }

  function init(options) {
    try {
      options = options || {};

      if (typeof options.visible === "boolean") {
        state.visible = options.visible;
      }

      if (!state.initialized) {
        createHud();
        createAFramePanel();
        installKeyboard();
        installEvents();
        startTicker();
        state.initialized = true;
      }

      refresh(options.stats || null);
      log("ready", state);

      return state;
    } catch (error) {
      recordError("init", error);
      return state;
    }
  }

  window[MODULE_NAME] = {
    init,
    refresh,
    toggle,
    state,
    getStats: function () {
      return Object.assign({}, state.stats);
    },
    setStats: function (stats) {
      refresh(stats || {});
      return Object.assign({}, state.stats);
    },
    show: function () {
      return toggle(true);
    },
    hide: function () {
      return toggle(false);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
    }, { once: true });
  } else {
    init();
  }
})();