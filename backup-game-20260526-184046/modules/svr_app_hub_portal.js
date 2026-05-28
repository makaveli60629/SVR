(function () {
  "use strict";

  const PHASE_LABEL = "Phase 250 App Hub Test Build";

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function addDomPortal() {
    if (document.getElementById("svr-app-hub-dom-portal")) return;

    const wrap = document.createElement("div");
    wrap.id = "svr-app-hub-dom-portal";
    wrap.style.position = "fixed";
    wrap.style.right = "14px";
    wrap.style.bottom = "14px";
    wrap.style.zIndex = "9999";
    wrap.style.background = "rgba(7,2,15,0.82)";
    wrap.style.border = "1px solid rgba(159,252,255,0.55)";
    wrap.style.boxShadow = "0 0 22px rgba(125,250,255,0.22)";
    wrap.style.borderRadius = "14px";
    wrap.style.padding = "10px 12px";
    wrap.style.font = "14px system-ui, sans-serif";
    wrap.style.color = "#ffffff";

    const a = document.createElement("a");
    a.href = "./app-hub.html";
    a.textContent = "Open SVR App Hub";
    a.style.color = "#9ffcff";
    a.style.textDecoration = "none";
    a.style.fontWeight = "700";

    const small = document.createElement("div");
    small.textContent = PHASE_LABEL;
    small.style.fontSize = "11px";
    small.style.opacity = "0.78";
    small.style.marginTop = "4px";

    wrap.appendChild(a);
    wrap.appendChild(small);
    document.body.appendChild(wrap);
  }

  function addAFramePortal() {
    const scene = document.querySelector("a-scene");

    if (!scene || !window.AFRAME) return;
    if (document.getElementById("svr-lobby-app-hub-portal")) return;

    if (!AFRAME.components["svr-open-app-hub"]) {
      AFRAME.registerComponent("svr-open-app-hub", {
        init: function () {
          const open = function () {
            window.location.href = "./app-hub.html";
          };

          this.el.addEventListener("click", open);
          this.el.addEventListener("mouseup", open);
          this.el.addEventListener("triggerup", open);
          this.el.addEventListener("selectend", open);
        }
      });
    }

    const root = document.createElement("a-entity");
    root.id = "svr-lobby-app-hub-portal";
    root.setAttribute("position", "0 2.15 -4.2");
    root.setAttribute("rotation", "0 0 0");

    const panel = document.createElement("a-plane");
    panel.setAttribute("class", "clickable");
    panel.setAttribute("svr-open-app-hub", "");
    panel.setAttribute("width", "2.9");
    panel.setAttribute("height", "1.15");
    panel.setAttribute("color", "#15102a");
    panel.setAttribute("material", "shader: standard; roughness: 0.55; metalness: 0.05; emissive: #0b2340; emissiveIntensity: 0.45");

    const title = document.createElement("a-text");
    title.setAttribute("value", "APP HUB");
    title.setAttribute("align", "center");
    title.setAttribute("width", "3");
    title.setAttribute("color", "#9ffcff");
    title.setAttribute("position", "0 0.22 0.035");

    const sub = document.createElement("a-text");
    sub.setAttribute("value", "Store / site panels");
    sub.setAttribute("align", "center");
    sub.setAttribute("width", "2.8");
    sub.setAttribute("color", "#ffffff");
    sub.setAttribute("position", "0 -0.08 0.035");

    const phase = document.createElement("a-text");
    phase.setAttribute("value", PHASE_LABEL);
    phase.setAttribute("align", "center");
    phase.setAttribute("width", "2.6");
    phase.setAttribute("color", "#d8ccff");
    phase.setAttribute("position", "0 -0.37 0.035");

    root.appendChild(panel);
    root.appendChild(title);
    root.appendChild(sub);
    root.appendChild(phase);
    scene.appendChild(root);
  }

  function boot() {
    addDomPortal();

    let tries = 0;
    const timer = window.setInterval(function () {
      tries += 1;
      addAFramePortal();
      if (tries > 80 || document.getElementById("svr-lobby-app-hub-portal")) {
        window.clearInterval(timer);
      }
    }, 125);
  }

  ready(boot);
})();
