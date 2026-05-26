(function () {
  "use strict";

  const MODULE_NAME = "SVRMoonMarsLocomotion";
  const DEFAULT_MODE = "smooth";
  const KEY_SPEED = 3.2;
  const MOON_GRAVITY = 0.165;
  const MARS_GRAVITY = 0.38;
  const EARTH_GRAVITY = 1.0;

  const keys = new Set();

  const state = {
    initialized: false,
    sceneName: "earth",
    gravityScale: EARTH_GRAVITY,
    mode: DEFAULT_MODE,
    rig: null,
    camera: null,
    lastTime: 0,
    verticalVelocity: 0,
    grounded: true,
    hudUpdate: null
  };

  function log(message, data) {
    if (data !== undefined) {
      console.log(`[${MODULE_NAME}] ${message}`, data);
    } else {
      console.log(`[${MODULE_NAME}] ${message}`);
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function normalizeSceneName(raw) {
    const value = String(raw || "").toLowerCase();
    if (value.includes("moon") || value.includes("lunar")) return "moon";
    if (value.includes("mars") || value.includes("martian")) return "mars";
    return "earth";
  }

  function detectSceneName() {
    const path = `${location.pathname} ${location.search} ${location.hash}`.toLowerCase();
    const bodyScene = document.body ? document.body.getAttribute("data-scene") : "";
    const htmlScene = document.documentElement ? document.documentElement.getAttribute("data-scene") : "";
    const sceneEl = document.querySelector("[data-svr-scene], a-scene");
    const sceneAttr = sceneEl ? (sceneEl.getAttribute("data-svr-scene") || sceneEl.getAttribute("data-scene") || "") : "";

    return normalizeSceneName(`${path} ${bodyScene || ""} ${htmlScene || ""} ${sceneAttr || ""}`);
  }

  function getGravityScale(sceneName) {
    if (sceneName === "moon") return MOON_GRAVITY;
    if (sceneName === "mars") return MARS_GRAVITY;
    return EARTH_GRAVITY;
  }

  function findRig() {
    const selectors = [
      "#rig",
      "#playerRig",
      "#cameraRig",
      "[data-svr-rig]",
      "[movement-controls]",
      "[wasd-controls]"
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    const camera = findCamera();
    if (camera && camera.parentElement && camera.parentElement.tagName && camera.parentElement.tagName.toLowerCase() !== "a-scene") {
      return camera.parentElement;
    }

    return camera || document.body;
  }

  function findCamera() {
    return (
      document.querySelector("#camera") ||
      document.querySelector("[camera]") ||
      document.querySelector("a-camera") ||
      document.querySelector("camera") ||
      null
    );
  }

  function getPosition(el) {
    if (!el) return { x: 0, y: 1.6, z: 0 };

    if (el.object3D && el.object3D.position) {
      return el.object3D.position;
    }

    const attr = el.getAttribute && el.getAttribute("position");
    if (attr && typeof attr === "object") {
      return attr;
    }

    return { x: 0, y: 1.6, z: 0 };
  }

  function setPosition(el, pos) {
    if (!el) return;

    if (el.object3D && el.object3D.position) {
      el.object3D.position.set(pos.x, pos.y, pos.z);
      return;
    }

    if (el.setAttribute) {
      el.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
    }
  }

  function getYawRadians() {
    const camera = state.camera || findCamera();

    if (camera && camera.object3D) {
      const rot = camera.object3D.rotation;
      if (rot) return rot.y || 0;
    }

    const rotAttr = camera && camera.getAttribute ? camera.getAttribute("rotation") : null;
    if (rotAttr && typeof rotAttr === "object") {
      return (rotAttr.y || 0) * Math.PI / 180;
    }

    return 0;
  }

  function getMoveVector() {
    let forward = 0;
    let strafe = 0;

    if (keys.has("KeyW") || keys.has("ArrowUp")) forward += 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) forward -= 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) strafe -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) strafe += 1;

    const length = Math.hypot(forward, strafe) || 1;
    forward /= length;
    strafe /= length;

    const yaw = getYawRadians();
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);

    return {
      x: (strafe * cos) - (forward * sin),
      z: (-forward * cos) - (strafe * sin)
    };
  }

  function getBaseSpeed() {
    const scene = state.sceneName;
    if (scene === "moon") return KEY_SPEED * 0.74;
    if (scene === "mars") return KEY_SPEED * 0.88;
    return KEY_SPEED;
  }

  function applyEnvironment(sceneName) {
    const scene = sceneName || detectSceneName();
    state.sceneName = scene;
    state.gravityScale = getGravityScale(scene);

    if (document.body) {
      document.body.setAttribute("data-svr-environment", scene);
      document.body.setAttribute("data-svr-gravity-scale", String(state.gravityScale));
    }

    const sceneEl = document.querySelector("a-scene");
    if (sceneEl) {
      sceneEl.setAttribute("data-svr-environment", scene);
      sceneEl.setAttribute("data-svr-gravity-scale", String(state.gravityScale));
    }

    const color = scene === "moon" ? "#d9e5ff" : scene === "mars" ? "#ffb38a" : "#b7f7ff";
    document.documentElement.style.setProperty("--svr-env-accent", color);

    if (typeof state.hudUpdate === "function") {
      state.hudUpdate(`Gravity: ${state.gravityScale.toFixed(3)}g`);
    }

    return scene;
  }

  function step(time) {
    if (!state.initialized) return;

    const rig = state.rig || findRig();
    state.rig = rig;

    const last = state.lastTime || time;
    const dt = clamp((time - last) / 1000, 0, 0.05);
    state.lastTime = time;

    const move = getMoveVector();
    const speed = getBaseSpeed();
    const pos = getPosition(rig);

    if (move.x || move.z) {
      pos.x += move.x * speed * dt;
      pos.z += move.z * speed * dt;
    }

    const floorY = 1.6;
    const gravity = -9.81 * state.gravityScale;

    if (keys.has("Space") && state.grounded) {
      const jumpBoost = state.sceneName === "moon" ? 4.4 : state.sceneName === "mars" ? 3.6 : 3.0;
      state.verticalVelocity = jumpBoost;
      state.grounded = false;
    }

    state.verticalVelocity += gravity * dt;
    pos.y += state.verticalVelocity * dt;

    if (pos.y <= floorY) {
      pos.y = floorY;
      state.verticalVelocity = 0;
      state.grounded = true;
    }

    setPosition(rig, pos);
    requestAnimationFrame(step);
  }

  function installKeyboardControls() {
    window.addEventListener("keydown", function (event) {
      keys.add(event.code);

      if (event.code === "KeyL") {
        state.mode = state.mode === "smooth" ? "teleport" : "smooth";
        if (typeof state.hudUpdate === "function") {
          state.hudUpdate(`Mode: ${state.mode}`);
        }
      }

      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
    }, { passive: false });

    window.addEventListener("keyup", function (event) {
      keys.delete(event.code);
    });
  }

  function installTeleportFallback() {
    window.addEventListener("dblclick", function () {
      if (state.mode !== "teleport") return;

      const rig = state.rig || findRig();
      const pos = getPosition(rig);
      const yaw = getYawRadians();
      const distance = state.sceneName === "moon" ? 5.5 : state.sceneName === "mars" ? 4.5 : 3.5;

      pos.x += -Math.sin(yaw) * distance;
      pos.z += -Math.cos(yaw) * distance;

      setPosition(rig, pos);

      if (typeof state.hudUpdate === "function") {
        state.hudUpdate("Teleported");
      }
    });
  }

  function patchAFrameIfPresent() {
    if (!window.AFRAME) return false;

    if (!AFRAME.components["svr-moon-mars-locomotion"]) {
      AFRAME.registerComponent("svr-moon-mars-locomotion", {
        schema: {
          scene: { type: "string", default: "auto" },
          mode: { type: "string", default: DEFAULT_MODE }
        },
        init: function () {
          const desiredScene = this.data.scene === "auto" ? detectSceneName() : normalizeSceneName(this.data.scene);
          state.mode = this.data.mode || DEFAULT_MODE;
          applyEnvironment(desiredScene);
          state.rig = this.el;
        }
      });
    }

    return true;
  }

  function init(options) {
    options = options || {};

    state.hudUpdate = options.hudUpdate || state.hudUpdate || null;
    state.camera = findCamera();
    state.rig = findRig();
    state.mode = options.mode || state.mode || DEFAULT_MODE;

    applyEnvironment(options.scene || detectSceneName());
    patchAFrameIfPresent();

    if (!state.initialized) {
      installKeyboardControls();
      installTeleportFallback();
      state.initialized = true;
      state.lastTime = performance.now();
      requestAnimationFrame(step);
    }

    log("ready", {
      scene: state.sceneName,
      gravityScale: state.gravityScale,
      mode: state.mode
    });

    return state;
  }

  window[MODULE_NAME] = {
    init,
    state,
    applyEnvironment,
    getSceneName: function () { return state.sceneName; },
    getMode: function () { return state.mode; },
    setMode: function (mode) {
      state.mode = mode === "teleport" ? "teleport" : "smooth";
      return state.mode;
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