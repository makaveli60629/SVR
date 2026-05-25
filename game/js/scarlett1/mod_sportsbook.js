(function(){
  'use strict';
  const MODULE = 'mod_sportsbook';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    tickerFeeds: [],
    init(){ console.info('[SVR]', MODULE, 'ready in compliance-safe mode'); if (root.config?.backendEnabled && root.config?.sportsTickerEnabled) this.fetchLiveFeed(); },
    async fetchLiveFeed(){
      try{ const r = await fetch('/api/sports/ticker-feed'); if (r.ok){ this.tickerFeeds = await r.json(); this.broadcastToTextMeshes(); } }
      catch(error){ console.warn('[SVR] sports ticker unavailable', error); }
    },
    broadcastToTextMeshes(){
      const text = this.tickerFeeds.map(g => `[${g.league || 'SPORT'}] ${g.away_team || ''} vs ${g.home_team || ''} | ${g.status || ''}`).join('  •  ');
      window.dispatchEvent(new CustomEvent('svr_update_wall_ticker', { detail: { text } }));
    }
  };
  root.modules[MODULE] = api;
  api.init();
})();
