(function () {
  "use strict";

  const MODULE_NAME = "SVRHandControllerNavigation";
  const PHASE = 253;

  const state = {
    phase: PHASE,
    initialized: false,
    focusedIndex: 0,
    items: [],
    mode: "hybrid",
    lastInput: "none",
    controllerConnected: false,
    handTrackingLikely: false,
    raycastersInstalled: false,
    errors: []
  };

  const SELECTORS = [
    "[data-svr-nav]",
    "[data-hub-action]",
    "[data-scene-link]",
    ".svr-hub-card",
    ".hub-card",
    "button",
    "a[href]"
  ];

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

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    const style = window.getComputedStyle ? getComputedStyle(el) : null;
    if (style && (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")) return false;
    if (rect && rect.width <= 0 && rect.height <= 0) return false;
    return true;
  }

  function collectItems() {
    const found = [];
    SELECTORS.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        if (!found.includes(el) && isVisible(el)) found.push(el);
      });
    });

    state.items = found.filter(function (el) {
      return !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true";
    });

    state.items.forEach(function (el, index) {
      el.setAttribute("data-svr-nav-index", String(index));
      el.setAttribute("tabindex", el.getAttribute("tabindex") || "0");
      el.style.cursor = "pointer";
    });

    if (state.focusedIndex >= state.items.length) state.focusedIndex = 0;
    return state.items;
  }

  function setFocus(index) {
    collectItems();
    if (!state.items.length) return null;

    state.focusedIndex = ((index % state.items.length) + state.items.length) % state.items.length;

    state.items.forEach(function (el, i) {
      const focused = i === state.focusedIndex;
      el.setAttribute("data-svr-focused", focused ? "true" : "false");
      if (focused) {
        el.classList.add("svr-nav-focused");
        try { el.focus({ preventScroll: true }); } catch (_) { try { el.focus(); } catch (__) {} }
        if (el.scrollIntoView) {
          el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        }
      } else {
        el.classList.remove("svr-nav-focused");
      }
    });

    window.dispatchEvent(new CustomEvent("svr:nav-focus", {
      detail: {
        index: state.focusedIndex,
        total: state.items.length,
        element: state.items[state.focusedIndex]
      }
    }));

    return state.items[state.focusedIndex];
  }

  function move(delta) {
    state.lastInput = "move";
    return setFocus(state.focusedIndex + delta);
  }

  function activateCurrent() {
    collectItems();
    const el = state.items[state.focusedIndex];
    if (!el) return false;

    state.lastInput = "select";

    window.dispatchEvent(new CustomEvent("svr:nav-activate", {
      detail: {
        index: state.focusedIndex,
        element: el,
        action: el.getAttribute("data-hub-action") || el.getAttribute("data-svr-nav") || "activate"
      }
    }));

    if (el.matches && el.matches("a[href]")) {
      const href = el.getAttribute("href");
      if (href && href !== "#") {
        location.href = href;
        return true;
      }
    }

    try {
      el.click();
      return true;
    } catch (error) {
      recordError("activateCurrent", error);
      return false;
    }
  }

  function installCss() {
    if (document.getElementById("svr-hand-controller-navigation-css")) return;

    const style = document.createElement("style");
    style.id = "svr-hand-controller-navigation-css";
    style.textContent = `
      :root { --svr-focus-color: #00f7ff; }
      [data-svr-focused="true"], .svr-nav-focused {
        outline: 3px solid var(--svr-focus-color) !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 4px rgba(0,247,255,.18), 0 0 28px rgba(0,247,255,.35) !important;
        transform: translateY(-2px) scale(1.015);
      }
      [data-svr-nav], [data-hub-action], [data-scene-link], .svr-hub-card, .hub-card {
        touch-action: manipulation;
      }
      #svr-input-help {
        position: fixed;
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
        z-index: 100001;
        color: #dfffff;
        background: rgba(0, 8, 18, .76);
        border: 1px solid rgba(0, 247, 255, .28);
        border-radius: 999px;
        padding: 9px 14px;
        font: 12px/1.3 system-ui, Segoe UI, Arial;
        box-shadow: 0 0 26px rgba(0,247,255,.16);
        pointer-events: none;
        backdrop-filter: blur(8px);
      }
    `;
    document.head.appendChild(style);
  }

  function showHelp(message) {
    let help = document.getElementById("svr-input-help");
    if (!help) {
      help = document.createElement("div");
      help.id = "svr-input-help";
      document.body.appendChild(help);
    }

    help.textContent = message || "Controller: stick/D-pad moves • trigger/A selects • keyboard arrows/Enter also work";
    help.style.display = "block";

    clearTimeout(showHelp.timer);
    showHelp.timer = setTimeout(function () {
      if (help) help.style.display = "none";
    }, 7000);
  }

  function installKeyboard() {
    window.addEventListener("keydown", function (event) {
      const code = event.code;
      if (["ArrowRight", "ArrowDown", "KeyS", "KeyD"].includes(code)) {
        move(1);
        showHelp("Navigation active: arrows/WASD move, Enter/Space selects");
        event.preventDefault();
      } else if (["ArrowLeft", "ArrowUp", "KeyW", "KeyA"].includes(code)) {
        move(-1);
        showHelp("Navigation active: arrows/WASD move, Enter/Space selects");
        event.preventDefault();
      } else if (["Enter", "Space", "NumpadEnter"].includes(code)) {
        activateCurrent();
        event.preventDefault();
      } else if (code === "KeyH" && event.shiftKey) {
        showHelp();
        event.preventDefault();
      }
    }, { passive: false });
  }

  function pollGamepads() {
    try {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      if (pads.length) state.controllerConnected = true;

      pads.forEach(function (pad) {
        const now = performance.now();
        pad._svrLastNav = pad._svrLastNav || 0;
        const cooldown = 260;
        if (now - pad._svrLastNav < cooldown) return;

        const axes = pad.axes || [];
        const buttons = pad.buttons || [];
        const x = axes[0] || 0;
        const y = axes[1] || 0;
        const selectPressed = !!(
          (buttons[0] && buttons[0].pressed) ||
          (buttons[1] && buttons[1].pressed) ||
          (buttons[7] && buttons[7].pressed)
        );

        if (y > 0.55 || x > 0.55 || (buttons[15] && buttons[15].pressed) || (buttons[13] && buttons[13].pressed)) {
          move(1);
          showHelp("Controller navigation: trigger/A selects");
          pad._svrLastNav = now;
        } else if (y < -0.55 || x < -0.55 || (buttons[14] && buttons[14].pressed) || (buttons[12] && buttons[12].pressed)) {
          move(-1);
          showHelp("Controller navigation: trigger/A selects");
          pad._svrLastNav = now;
        } else if (selectPressed) {
          activateCurrent();
          showHelp("Selected");
          pad._svrLastNav = now;
        }
      });
    } catch (error) {
      recordError("pollGamepads", error);
    }

    requestAnimationFrame(pollGamepads);
  }

  function installPointerSelect() {
    document.addEventListener("pointerdown", function (event) {
      const target = event.target && event.target.closest ? event.target.closest(SELECTORS.join(",")) : null;
      if (!target) return;
      collectItems();
      const index = state.items.indexOf(target);
      if (index >= 0) setFocus(index);
    }, { passive: true });
  }

  function installAFrameControllerSupport() {
    if (!window.AFRAME) return false;

    try {
      if (!AFRAME.components["svr-hub-nav-raycaster"]) {
        AFRAME.registerComponent("svr-hub-nav-raycaster", {
          init: function () {
            this.el.setAttribute("raycaster", "objects: [data-svr-nav], [data-hub-action], .svr-hub-card, .hub-card; far: 8; showLine: true; lineColor: #00f7ff; lineOpacity: 0.65");
            this.el.setAttribute("cursor", "rayOrigin: entity; fuse: false");

            this.el.addEventListener("triggerdown", function () { activateCurrent(); });
            this.el.addEventListener("gripdown", function () { move(1); });
            this.el.addEventListener("thumbstickmoved", function (event) {
              const y = event.detail && typeof event.detail.y === "number" ? event.detail.y : 0;
              if (y > 0.65) move(1);
              if (y < -0.65) move(-1);
            });
            this.el.addEventListener("raycaster-intersection", function (event) {
              const intersections = event.detail && event.detail.intersections ? event.detail.intersections : [];
              const hit = intersections[0] && intersections[0].object && intersections[0].object.el;
              if (!hit) return;
              const target = hit.closest ? hit.closest(SELECTORS.join(",")) : hit;
              collectItems();
              const index = state.items.indexOf(target);
              if (index >= 0) setFocus(index);
            });
          }
        });
      }

      const scene = document.querySelector("a-scene");
      if (!scene) return false;

      const controllerSelectors = [
        "#leftHand",
        "#rightHand",
        "[hand-controls]",
        "[laser-controls]",
        "[tracked-controls]",
        "[oculus-touch-controls]",
        "[vive-controls]",
        "[windows-motion-controls]"
      ];

      let controllers = [];
      controllerSelectors.forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (el) {
          if (!controllers.includes(el)) controllers.push(el);
        });
      });

      if (!controllers.length) {
        const left = document.createElement("a-entity");
        left.id = "leftHand";
        left.setAttribute("hand-controls", "hand: left; handModelStyle: lowPoly; color: #00f7ff");
        left.setAttribute("laser-controls", "hand: left");
        left.setAttribute("svr-hub-nav-raycaster", "");
        scene.appendChild(left);

        const right = document.createElement("a-entity");
        right.id = "rightHand";
        right.setAttribute("hand-controls", "hand: right; handModelStyle: lowPoly; color: #00f7ff");
        right.setAttribute("laser-controls", "hand: right");
        right.setAttribute("svr-hub-nav-raycaster", "");
        scene.appendChild(right);

        controllers = [left, right];
      } else {
        controllers.forEach(function (el) {
          el.setAttribute("svr-hub-nav-raycaster", "");
        });
      }

      state.raycastersInstalled = true;
      return true;
    } catch (error) {
      recordError("installAFrameControllerSupport", error);
      return false;
    }
  }

  function detectHandTracking() {
    try {
      state.handTrackingLikely = !!(
        navigator.xr ||
        document.querySelector("[hand-tracking-controls]") ||
        document.querySelector("[hand-controls]")
      );
      return state.handTrackingLikely;
    } catch (_) {
      return false;
    }
  }

  function observeDomChanges() {
    const observer = new MutationObserver(function () {
      collectItems();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-svr-nav", "data-hub-action", "hidden", "style", "class"]
    });
  }

  function init() {
    if (state.initialized) return state;

    installCss();
    collectItems();
    setFocus(0);
    installKeyboard();
    installPointerSelect();
    observeDomChanges();
    detectHandTracking();
    pollGamepads();
    installAFrameControllerSupport();

    window.addEventListener("controllerconnected", function () {
      state.controllerConnected = true;
      showHelp("Controller connected: stick/D-pad moves, trigger selects");
      collectItems();
    });

    window.addEventListener("vrdisplaypresentchange", function () {
      setTimeout(function () {
        installAFrameControllerSupport();
        showHelp("VR navigation ready");
      }, 350);
    });

    window.addEventListener("svr:optional-modules-ready", function () {
      collectItems();
      setFocus(state.focusedIndex || 0);
    });

    state.initialized = true;
    showHelp();
    log("ready", state);

    window.dispatchEvent(new CustomEvent("svr:hub-navigation-ready", { detail: state }));
    return state;
  }

  window[MODULE_NAME] = {
    init,
    state,
    collectItems,
    setFocus,
    move,
    activateCurrent,
    showHelp
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("load", function () {
    setTimeout(function () {
      collectItems();
      installAFrameControllerSupport();
    }, 500);
  });
})();