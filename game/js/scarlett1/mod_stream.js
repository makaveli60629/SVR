(function(){
  'use strict';
  const MODULE = 'mod_stream';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    streamContainerId: 'svr-stream-container',
    init(){ window.addEventListener('svr_toggle_stream', e => e.detail?.active ? this.startStreamSource(e.detail.streamUrl) : this.stopStreamSource()); console.info('[SVR]', MODULE, 'ready'); },
    startStreamSource(streamUrl){
      const container = document.getElementById(this.streamContainerId);
      if (!container || !streamUrl) return;
      container.style.display = 'block';
      container.innerHTML = `<video id="svr-broadcast-player" controls autoplay muted playsinline style="width:100%;height:100%;border-radius:8px"><source src="${String(streamUrl).replace(/"/g,'&quot;')}" type="application/x-mpegURL"></video>`;
      window.dispatchEvent(new CustomEvent('svr_update_jumbotron', { detail: { text: 'LIVE BROADCAST FEED ONLINE' } }));
    },
    stopStreamSource(){ const container = document.getElementById(this.streamContainerId); if (container){ container.innerHTML = ''; container.style.display = 'none'; } }
  };
  root.modules[MODULE] = api;
  api.init();
})();
