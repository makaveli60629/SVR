// /js/scarlett1/modules/jumbotron.js
// MP4 proof-of-life jumbotron for Quest: reliable video screens.

AFRAME.registerComponent("scarlett-jumbotron", {
  schema: {
    src: { default: "" },
    label: { default: "JUMBOTRON" },
    muted: { default: true },
    autoplay: { default: true },
    width: { default: 8.5 },
    height: { default: 2.2 }
  },

  init() {
    const el = this.el;

    // Base geometry/material
    el.setAttribute("geometry", `primitive: plane; width: ${this.data.width}; height: ${this.data.height}`);
    el.setAttribute("material", "shader: flat; color:#101827; emissive:#2bd6ff; emissiveIntensity:0.10; opacity:0.96; transparent:true; side:double");

    // Label
    const t = document.createElement("a-text");
    t.setAttribute("value", this.data.label);
    t.setAttribute("align", "center");
    t.setAttribute("color", "#bff");
    t.setAttribute("width", "10");
    t.setAttribute("position", "0 -1.35 0.01");
    el.appendChild(t);

    // Video element
    const vid = document.createElement("video");
    vid.crossOrigin = "anonymous";
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");
    vid.muted = !!this.data.muted;
    vid.loop = true;
    vid.preload = "auto";

    this.video = vid;

    // Put into a-assets and reference by id
    const assets = document.querySelector("a-assets");
    const id = this._ensureId();
    vid.id = id;
    assets.appendChild(vid);

    // Set material to use this video
    el.setAttribute("material", `shader: flat; src: #${id}; side:double; toneMapped:false; opacity:0.98; transparent:true`);

    // Source
    if (this.data.src) {
      vid.src = this.data.src;
      vid.load();
    }

    const tryPlay = async () => {
      if (!this.data.autoplay) return;
      try {
        await vid.play();
        if (window.hudLog) hudLog(`Jumbotron playing ✅ ${this.data.label}`);
      } catch (e) {
        if (window.hudLog) hudLog(`Jumbotron waiting for click ▶ ${this.data.label}`);
      }
    };

    // Attempt play when ready
    vid.addEventListener("loadeddata", tryPlay);

    // Click/trigger to start
    el.classList.add("clickable");
    el.addEventListener("click", () => {
      vid.muted = true;
      vid.play().catch(() => {});
    });

    // Try again on enter VR
    el.sceneEl.addEventListener("enter-vr", () => tryPlay());
  },

  update(oldData) {
    if (oldData.src !== this.data.src && this.data.src && this.video) {
      this.video.src = this.data.src;
      this.video.load();
      this.video.play().catch(() => {});
    }
  },

  _ensureId() {
    const base = this.el.getAttribute("id") || ("jumbo_" + Math.random().toString(16).slice(2));
    const vidId = `vid_${base}`;
    if (document.getElementById(vidId)) return vidId;
    return vidId;
  }
});
