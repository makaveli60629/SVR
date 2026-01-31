// /js/scarlett1/modules/jumbotron.js
// IPTV M3U parser + jumbotron that never stays black.
// If video fails, it shows a Canvas-based channel list UI so you always see something.

AFRAME.registerComponent("scarlett-jumbotron-iptv", {
  schema: {
    m3uUrl: { default: "" },     // URL to an M3U list
    label:  { default: "JUMBOTRON" },
    width:  { default: 8.5 },
    height: { default: 2.2 }
  },

  async init() {
    const el = this.el;

    el.setAttribute("geometry", `primitive: plane; width: ${this.data.width}; height: ${this.data.height}`);
    el.setAttribute("material", "shader: flat; color:#101827; emissive:#2bd6ff; emissiveIntensity:0.10; opacity:0.96; transparent:true; side:double");

    // Title label under screen
    const t = document.createElement("a-text");
    t.setAttribute("value", this.data.label);
    t.setAttribute("align", "center");
    t.setAttribute("color", "#bff");
    t.setAttribute("width", "10");
    t.setAttribute("position", "0 -1.35 0.01");
    el.appendChild(t);

    // --- Canvas UI fallback texture ---
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    const assets = document.querySelector("a-assets");
    const canvasId = this._ensureId("canvas");
    canvas.id = canvasId;
    assets.appendChild(canvas);

    // Default canvas UI so it's never black
    this._drawUI(ctx, [`${this.data.label}`, "Loading channel list…", "(If video fails, this stays visible)"]);
    el.setAttribute("material", `shader: flat; src: #${canvasId}; side:double; toneMapped:false; opacity:0.98; transparent:true`);

    this.ctx = ctx;
    this.canvas = canvas;

    // --- Video element for streams (if any work) ---
    const vid = document.createElement("video");
    vid.crossOrigin = "anonymous";
    vid.setAttribute("playsinline", "");
    vid.setAttribute("webkit-playsinline", "");
    vid.muted = true;   // muted is required for autoplay in most cases
    vid.loop = false;
    vid.preload = "auto";
    this.video = vid;

    const vidId = this._ensureId("vid");
    vid.id = vidId;
    assets.appendChild(vid);

    // Keep state
    this.channels = [];
    this.current = 0;
    this.usingVideo = false;

    // Click to attempt play / next channel
    el.classList.add("clickable");
    el.addEventListener("click", () => this.next());

    // Load M3U list
    if (!this.data.m3uUrl) {
      this._drawUI(ctx, [`${this.data.label}`, "No m3uUrl set", "Provide an M3U URL to play channels"]);
      return;
    }

    await this._loadM3U(this.data.m3uUrl);

    if (this.channels.length === 0) {
      this._drawUI(ctx, [`${this.data.label}`, "No playable links found", "Many IPTV lists are blocked by CORS/codecs"]);
      return;
    }

    // Draw list UI immediately
    this._drawChannelList();

    // Try first channel automatically
    this.playIndex(0);

    // expose global controls (watch buttons can call these)
    window.SCARLETT_TV = window.SCARLETT_TV || {};
    window.SCARLETT_TV.next = () => this.next();
    window.SCARLETT_TV.prev = () => this.prev();
    window.SCARLETT_TV.play = (i) => this.playIndex(i);
    window.SCARLETT_TV.list = () => this.channels;

    if (window.hudLog) hudLog(`IPTV jumbotron ready ✅ ${this.data.label} | channels: ${this.channels.length}`);
  },

  async _loadM3U(url) {
    try {
      const res = await fetch(url, { mode: "cors" });
      const text = await res.text();
      this.channels = parseM3U(text);

      // Prefer HLS .m3u8 links if present
      this.channels.sort((a, b) => scoreUrl(b.url) - scoreUrl(a.url));

      if (window.hudLog) hudLog(`M3U loaded ✅ (${this.channels.length} entries)`);
    } catch (e) {
      this._drawUI(this.ctx, [
        `${this.data.label}`,
        "M3U fetch failed (CORS blocked)",
        "Try hosting the M3U on your GitHub / server with CORS headers"
      ]);
      if (window.hudLog) hudLog("ERR: M3U fetch failed (CORS)");
      this.channels = [];
    }
  },

  _drawUI(ctx, lines) {
    ctx.clearRect(0, 0, 1024, 256);
    ctx.fillStyle = "rgba(10, 12, 20, 0.95)";
    ctx.fillRect(0, 0, 1024, 256);

    // neon border
    ctx.strokeStyle = "rgba(0, 229, 255, 0.9)";
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 1012, 244);

    ctx.fillStyle = "#bff";
    ctx.font = "bold 44px Arial";
    ctx.fillText(lines[0] || "SCARLETT TV", 28, 72);

    ctx.fillStyle = "#b19cd9";
    ctx.font = "28px Arial";
    for (let i = 1; i < lines.length; i++) {
      ctx.fillText(lines[i], 28, 72 + i * 42);
    }
  },

  _drawChannelList() {
    const ctx = this.ctx;
    const list = this.channels;

    const head = `${this.data.label} — CHANNELS (${list.length})`;
    const hint = "Tap screen / Trigger to NEXT channel • Watch: NEXT/PREV";

    // show current window of channels
    const start = Math.max(0, this.current - 3);
    const end = Math.min(list.length, start + 7);

    const lines = [head, hint];
    for (let i = start; i < end; i++) {
      const mark = (i === this.current) ? "▶ " : "   ";
      lines.push(mark + (list[i].name || `Channel ${i + 1}`));
    }

    this._drawUI(ctx, lines);
    this.el.getObject3D("mesh").material.map.needsUpdate = true;
  },

  playIndex(i) {
    if (!this.channels || this.channels.length === 0) return;

    this.current = (i + this.channels.length) % this.channels.length;
    const ch = this.channels[this.current];

    this._drawChannelList();

    // Attempt video playback
    this._tryPlay(ch.url, ch.name);
  },

  next() {
    this.playIndex(this.current + 1);
  },

  prev() {
    this.playIndex(this.current - 1);
  },

  _tryPlay(url, name) {
    const el = this.el;
    const vid = this.video;
    const ctx = this.ctx;

    // switch to "trying"
    this._drawUI(ctx, [`${this.data.label}`, `Trying: ${name}`, url.slice(0, 80) + "…"]);
    el.getObject3D("mesh").material.map.needsUpdate = true;

    // Set video source
    vid.pause();
    vid.src = url;
    vid.load();

    let settled = false;

    const succeed = async () => {
      if (settled) return;
      settled = true;

      // set video texture
      el.setAttribute("material", `shader: flat; src: #${vid.id}; side:double; toneMapped:false; opacity:0.98; transparent:true`);

      try {
        await vid.play();
        this.usingVideo = true;
        if (window.hudLog) hudLog(`TV playing ✅ ${name}`);
      } catch (e) {
        fail();
      }
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      this.usingVideo = false;

      // revert to list UI (never black)
      el.setAttribute("material", `shader: flat; src: #${this.canvas.id}; side:double; toneMapped:false; opacity:0.98; transparent:true`);
      this._drawUI(ctx, [`${this.data.label}`, `FAILED: ${name}`, "Tap to try next channel"]);
      el.getObject3D("mesh").material.map.needsUpdate = true;

      if (window.hudLog) hudLog(`TV failed ✖ ${name}`);
    };

    vid.addEventListener("loadeddata", succeed, { once: true });
    vid.addEventListener("error", fail, { once: true });

    // safety timeout
    setTimeout(() => fail(), 1800);
  },

  _ensureId(prefix) {
    const base = this.el.getAttribute("id") || ("jumbo_" + Math.random().toString(16).slice(2));
    const id = `${prefix}_${base}`;
    if (document.getElementById(id)) return `${id}_${Math.random().toString(16).slice(2)}`;
    return id;
  }
});

// ---- Utilities ----

function parseM3U(text) {
  const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
  const out = [];
  let name = "";
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.startsWith("#EXTINF")) {
      const parts = ln.split(",");
      name = (parts[1] || "").trim();
    } else if (!ln.startsWith("#")) {
      const url = ln.trim();
      if (url.startsWith("http")) out.push({ name, url });
      name = "";
    }
  }
  return out;
}

function scoreUrl(url) {
  // prefer .m3u8 HLS over everything else
  const u = url.toLowerCase();
  let s = 0;
  if (u.includes(".m3u8")) s += 100;
  if (u.includes("hls")) s += 20;
  if (u.includes(".ts")) s += 10;
  if (u.includes(".mp4")) s += 15;
  return s;
        }
