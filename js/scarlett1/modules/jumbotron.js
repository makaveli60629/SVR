AFRAME.registerComponent("scarlett-jumbotron", {
  schema: {
    playlist: { default: "https://raw.githubusercontent.com/jromero88/iptv/master/channels/us.m3u" },
    preferName: { default: "CBS" },
    maxScan: { default: 80 },
    inlineM3U: { default: "" }
  },

  init: function () {
    this._video = null;
    this._hls = null;
    this._channels = [];
    this._idx = 0;

    this._buildScreens();
    this._initChat();
    this._boot();
  },

  _buildScreens: function () {
    const frame = document.createElement("a-box");
    frame.setAttribute("width", "6.2");
    frame.setAttribute("height", "3.6");
    frame.setAttribute("depth", "0.12");
    frame.setAttribute("position", "0 2.8 -7.8");
    frame.setAttribute("material", "color:#05070a; metalness:0.55; roughness:0.35");
    this.el.appendChild(frame);

    const screen = document.createElement("a-plane");
    screen.setAttribute("id", "scarlettJumboVideoPlane");
    screen.setAttribute("width", "6.0");
    screen.setAttribute("height", "3.35");
    screen.setAttribute("position", "0 2.8 -7.72");
    screen.setAttribute("material", "color:#111; shader:flat; opacity:1");
    this.el.appendChild(screen);

    const chatFrame = document.createElement("a-box");
    chatFrame.setAttribute("width", "4.2");
    chatFrame.setAttribute("height", "3.6");
    chatFrame.setAttribute("depth", "0.12");
    chatFrame.setAttribute("position", "7.0 2.8 -7.8");
    chatFrame.setAttribute("material", "color:#05070a; metalness:0.55; roughness:0.35");
    this.el.appendChild(chatFrame);

    const chatPlane = document.createElement("a-plane");
    chatPlane.setAttribute("id", "scarlettJumboChatPlane");
    chatPlane.setAttribute("width", "4.0");
    chatPlane.setAttribute("height", "3.35");
    chatPlane.setAttribute("position", "7.0 2.8 -7.72");
    chatPlane.setAttribute("material", "color:#20002a; shader:flat; opacity:0.95; transparent:true");
    this.el.appendChild(chatPlane);

    if (window.hudLog) hudLog("Jumbotrons built ✅ (video + chat)");
  },

  _ensureAssets: function () {
    let assets = document.querySelector("a-assets");
    if (!assets) {
      assets = document.createElement("a-assets");
      this.el.sceneEl.appendChild(assets);
    }
    return assets;
  },

  _makeVideoEl: function () {
    const assets = this._ensureAssets();
    const existing = document.getElementById("scarlettJumboVideo");
    if (existing) existing.remove();

    const v = document.createElement("video");
    v.id = "scarlettJumboVideo";
    v.setAttribute("webkit-playsinline", "true");
    v.setAttribute("playsinline", "true");
    v.setAttribute("crossorigin", "anonymous");
    v.muted = true;
    v.autoplay = true;
    v.loop = true;
    v.preload = "auto";
    assets.appendChild(v);

    const plane = document.getElementById("scarlettJumboVideoPlane");
    if (plane) plane.setAttribute("material", "shader:flat; src:#scarlettJumboVideo; color:#fff");

    this._video = v;
    return v;
  },

  _initChat: function () {
    const assets = this._ensureAssets();
    const old = document.getElementById("scarlettChatCanvas");
    if (old) old.remove();

    const canvas = document.createElement("canvas");
    canvas.id = "scarlettChatCanvas";
    canvas.width = 512; canvas.height = 512;
    assets.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const logs = ["> System Boot…", "> AI Chat READY"];

    const render = () => {
      ctx.fillStyle = "rgba(20,0,30,0.90)";
      ctx.fillRect(0,0,512,512);
      ctx.font = "bold 18px Courier New, monospace";
      ctx.fillStyle = "#b19cd9";
      ctx.fillText("SCARLETT CHAT", 18, 28);

      ctx.font = "14px Courier New, monospace";
      let y = 58;
      for (const line of logs.slice(-18)) {
        ctx.fillStyle = line.includes("WINNER") ? "#FFD700" : "#b19cd9";
        ctx.fillText(line, 18, y);
        y += 24;
      }
    };

    window.addChatMessage = (user, msg) => {
      logs.push(`${String(user).toUpperCase()}: ${String(msg)}`);
      render();
    };

    window.addEventListener("aiMessage", (e) => {
      window.addChatMessage("ChatGPT", (e && e.detail && e.detail.text) ? e.detail.text : "…");
    });

    render();

    const chatPlane = document.getElementById("scarlettJumboChatPlane");
    if (chatPlane) chatPlane.setAttribute("material", "shader:flat; src:#scarlettChatCanvas; transparent:true; opacity:0.95");

    if (window.hudLog) hudLog("Chat ready ✅");
  },

  _parseM3U: function (text) {
    const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const items = [];
    let name = null;
    for (let i=0;i<lines.length;i++){
      const line = lines[i];
      if (line.startsWith("#EXTINF")) {
        const comma = line.lastIndexOf(",");
        name = comma >= 0 ? line.slice(comma+1).trim() : "Channel";
      } else if (!line.startsWith("#")) {
        items.push({ name: name || "Channel", url: line });
        name = null;
      }
    }
    return items;
  },

  _pickStartIndex: function (items) {
    const prefer = (this.data.preferName || "").toLowerCase().trim();
    if (!prefer) return 0;
    const idx = items.findIndex(x => (x.name||"").toLowerCase().includes(prefer));
    return idx >= 0 ? idx : 0;
  },

  _setSource: function (url) {
    const v = this._video || this._makeVideoEl();
    if (this._hls) { try{ this._hls.destroy(); }catch(e){} this._hls=null; }

    const isM3U8 = /\.m3u8(\?|$)/i.test(url);

    if (isM3U8 && v.canPlayType("application/vnd.apple.mpegurl")) { v.src = url; return; }
    if (isM3U8 && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({ enableWorker:true, lowLatencyMode:false });
      hls.loadSource(url);
      hls.attachMedia(v);
      this._hls = hls;
      return;
    }

    // fallback: mp4 or direct (many M3U entries will still be blocked; that's normal)
    v.src = url;
  },

  _playCurrent: async function () {
    if (!this._channels.length) return;
    const ch = this._channels[this._idx];
    if (window.hudLog) hudLog(`[TV] Now: ${ch.name}`);
    if (window.addChatMessage) window.addChatMessage("TV", `Now Playing: ${ch.name}`);

    this._setSource(ch.url);

    try { await this._video.play(); }
    catch(e){
      const plane = document.getElementById("scarlettJumboVideoPlane");
      if (plane) {
        plane.classList.add("clickable");
        plane.addEventListener("click", async () => { try { await this._video.play(); } catch(_) {} }, { once:true });
      }
      if (window.addChatMessage) window.addChatMessage("SYSTEM", "Tap TV screen once to start video");
    }
  },

  _boot: async function () {
    window.nextTVChannel = async () => {
      if (!this._channels.length) return;
      this._idx = (this._idx + 1) % this._channels.length;
      await this._playCurrent();
    };
    window.prevTVChannel = async () => {
      if (!this._channels.length) return;
      this._idx = (this._idx - 1 + this._channels.length) % this._channels.length;
      await this._playCurrent();
    };

    let txt = (this.data.inlineM3U || "").trim();
    if (!txt && (this.data.playlist || "").trim()) {
      try{
        const res = await fetch(this.data.playlist, { mode:"cors" });
        if(!res.ok) throw new Error("HTTP " + res.status);
        txt = await res.text();
      } catch(e){
        if (window.addChatMessage) window.addChatMessage("SYSTEM", "Playlist blocked (CORS/HTTP) — TV may be black");
        if (window.hudLog) hudLog("Playlist fetch failed ❌ " + (e.message||e));
        return;
      }
    }
    if (!txt) { if (window.addChatMessage) window.addChatMessage("SYSTEM", "No playlist provided"); return; }

    const all = this._parseM3U(txt);
    this._channels = all.slice(0, Math.max(1, this.data.maxScan || 80));
    this._idx = this._pickStartIndex(this._channels);

    if (window.hudLog) hudLog("Channels parsed ✅ " + this._channels.length);
    this._makeVideoEl();
    await this._playCurrent();
  }
});