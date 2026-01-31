// Scarlett Jumbotron: plays a selected channel from an M3U playlist on a video-textured screen.
// Quest notes: IPTV streams are often HLS (.m3u8). HLS.js may work depending on CORS/codec.
// If it fails, HUD will say why.

AFRAME.registerComponent("scarlett-jumbotron", {
  schema: {
    playlist: { default: "https://raw.githubusercontent.com/jromero88/iptv/master/channels/us.m3u" },
    // Optional: pick a channel by name (case-insensitive substring).
    // Example: "CBS", "ABC", "FOX", "NBC", "ESPN", "CNN"
    preferName: { default: "CBS" },
    // If preferName not found, fall back to the first playable entry.
    maxScan: { default: 80 }
  },

  init: function () {
    this.el.setAttribute("jumbotron-ready", "false");
    this._videoEl = null;

    this._buildScreen();
    this._bootStream();
  },

  _log: function (m) { if (window.hudLog) hudLog("[JUMB] " + m); },
  _top: function (m) { if (window.hudSetTop) hudSetTop(m); },

  _ensureAssets: function () {
    let assets = document.querySelector("a-assets");
    if (!assets) {
      assets = document.createElement("a-assets");
      this.el.sceneEl.appendChild(assets);
    }
    return assets;
  },

  _buildScreen: function () {
    // Screen frame
    const frame = document.createElement("a-box");
    frame.setAttribute("width", "6.2");
    frame.setAttribute("height", "3.6");
    frame.setAttribute("depth", "0.12");
    frame.setAttribute("position", "0 2.8 -7.8");
    frame.setAttribute("material", "color:#05070a; metalness:0.55; roughness:0.35");
    this.el.appendChild(frame);

    // Neon border
    const border = document.createElement("a-ring");
    border.setAttribute("radius-inner", "1.72");
    border.setAttribute("radius-outer", "1.80");
    border.setAttribute("position", "0 2.8 -7.73");
    border.setAttribute("scale", "1.75 1 1");
    border.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.8; opacity:0.6; transparent:true");
    this.el.appendChild(border);

    // Actual video surface
    const screen = document.createElement("a-plane");
    screen.setAttribute("id", "scarlettJumbotronScreen");
    screen.setAttribute("width", "6.0");
    screen.setAttribute("height", "3.35");
    screen.setAttribute("position", "0 2.8 -7.72");
    screen.setAttribute("material", "color:#111; shader:flat; opacity:1");
    this.el.appendChild(screen);

    this._log("Screen built ✅");
  },

  _makeVideoElement: function () {
    const assets = this._ensureAssets();

    // Remove old video if any
    const existing = document.getElementById("scarlettJumboVideo");
    if (existing) existing.remove();

    const v = document.createElement("video");
    v.id = "scarlettJumboVideo";
    v.setAttribute("webkit-playsinline", "true");
    v.setAttribute("playsinline", "true");
    v.setAttribute("crossorigin", "anonymous");
    v.muted = true;        // required for autoplay in many browsers
    v.autoplay = true;
    v.loop = true;
    v.preload = "auto";

    assets.appendChild(v);
    this._videoEl = v;

    // Point the A-Frame plane material at the video
    const screen = document.getElementById("scarlettJumbotronScreen");
    if (screen) screen.setAttribute("material", "shader:flat; src:#scarlettJumboVideo; color:#fff");

    return v;
  },

  _parseM3U: function (text) {
    // Very tolerant M3U parser:
    // #EXTINF:-1 tvg-id=".." group-title=".." ,Channel Name
    // URL
    const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const items = [];
    let currentName = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("#EXTINF")) {
        const comma = line.lastIndexOf(",");
        currentName = comma >= 0 ? line.slice(comma + 1).trim() : "Channel";
      } else if (!line.startsWith("#")) {
        // This is a URL line
        const url = line;
        items.push({ name: currentName || "Channel", url });
        currentName = null;
      }
    }
    return items;
  },

  _pickChannel: function (items) {
    const prefer = (this.data.preferName || "").trim().toLowerCase();
    const maxScan = Math.max(1, this.data.maxScan || 80);

    if (!items.length) return null;

    // 1) Prefer by name
    if (prefer) {
      const byName = items.find(x => (x.name || "").toLowerCase().includes(prefer));
      if (byName) return byName;
    }

    // 2) Otherwise, scan for likely playable formats
    // Prefer mp4 first, then m3u8, then others
    const slice = items.slice(0, maxScan);

    const mp4 = slice.find(x => /\.mp4(\?|$)/i.test(x.url));
    if (mp4) return mp4;

    const m3u8 = slice.find(x => /\.m3u8(\?|$)/i.test(x.url));
    if (m3u8) return m3u8;

    return slice[0];
  },

  _attachHlsOrNative: function (video, url) {
    // Clear any previous HLS instance
    if (this._hls) {
      try { this._hls.destroy(); } catch(e) {}
      this._hls = null;
    }

    const isM3U8 = /\.m3u8(\?|$)/i.test(url);

    // Native HLS?
    if (isM3U8 && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return;
    }

    // Use Hls.js if available
    if (isM3U8 && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        // mild defaults; IPTV links often have shaky CORS
        enableWorker: true,
        lowLatencyMode: false
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      this._hls = hls;
      return;
    }

    // Otherwise normal src
    video.src = url;
  },

  _bootStream: async function () {
    this._top("Jumbotron loading…");
    this._log("Fetching M3U…");

    let txt = "";
    try {
      const res = await fetch(this.data.playlist, { mode: "cors" });
      if (!res.ok) throw new Error("M3U HTTP " + res.status);
      txt = await res.text();
    } catch (e) {
      this._log("M3U fetch failed ❌ " + (e.message || e));
      this._top("Jumbotron: playlist blocked");
      this._fallbackLabel("PLAYLIST BLOCKED (CORS/HTTP)");
      return;
    }

    const items = this._parseM3U(txt);
    this._log("Parsed channels: " + items.length);

    const chosen = this._pickChannel(items);
    if (!chosen) {
      this._log("No channels found ❌");
      this._top("Jumbotron: empty list");
      this._fallbackLabel("NO CHANNELS FOUND");
      return;
    }

    this._log("Selected: " + chosen.name);
    this._log("URL: " + chosen.url);

    const v = this._makeVideoElement();

    // Helpful events
    v.onplaying = () => {
      this._log("Video playing ✅");
      this._top("Jumbotron: " + chosen.name);
      this.el.setAttribute("jumbotron-ready", "true");
    };
    v.onerror = () => {
      this._log("Video error ❌ (codec/CORS/stream dead)");
      this._top("Jumbotron: failed");
      this._fallbackLabel("STREAM FAILED (codec/CORS)");
    };

    // Attach src using HLS if needed
    this._attachHlsOrNative(v, chosen.url);

    // Attempt play
    try {
      await v.play();
    } catch (e) {
      this._log("Autoplay blocked (tap once) ⚠️");
      this._top("Jumbotron: tap to start");
      // Add tap-to-start
      const screen = document.getElementById("scarlettJumbotronScreen");
      if (screen) {
        screen.classList.add("clickable");
        screen.addEventListener("click", async () => {
          try { await v.play(); } catch(_) {}
        }, { once: true });
      }
      this._fallbackLabel("TAP SCREEN TO PLAY");
    }
  },

  _fallbackLabel: function (text) {
    // Draw a label on the screen if stream not playing
    const existing = document.getElementById("scarlettJumboLabel");
    if (existing) existing.remove();

    const label = document.createElement("a-text");
    label.setAttribute("id", "scarlettJumboLabel");
    label.setAttribute("value", text);
    label.setAttribute("align", "center");
    label.setAttribute("color", "#9ff");
    label.setAttribute("width", "8");
    label.setAttribute("position", "0 2.8 -7.70");
    this.el.appendChild(label);
  }
});
