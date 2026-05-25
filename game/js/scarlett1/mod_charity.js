(function(){
  'use strict';
  const MODULE = 'mod_charity';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    activeCampaigns: [],
    init(){
      console.info('[SVR]', MODULE, 'ready');
      if (root.config?.backendEnabled) this.fetchLiveMetrics();
    },
    async fetchLiveMetrics(){
      try{
        const response = await fetch('/api/charity/metrics', { credentials: 'same-origin' });
        if (response.ok){ this.activeCampaigns = await response.json(); this.updateTableTickers(); }
      }catch(error){ console.warn('[SVR] charity metrics unavailable', error); }
    },
    updateTableTickers(){
      for (const campaign of this.activeCampaigns){
        const category = String(campaign.cause_category || 'community').replace(/_/g, ' ');
        const text = `Support: ${category} | Raised: $${campaign.raised_amount || 0} / $${campaign.target_amount || 0}`;
        window.dispatchEvent(new CustomEvent('svr_update_ticker', { detail: { text } }));
      }
    },
    triggerWinnerDisplay(winnerUsername, handName, communityCards = [], winningCards = []){
      const duration = 10000;
      const username = winnerUsername || 'Winner';
      window.dispatchEvent(new CustomEvent('svr_highlight_player', { detail: { username, highlight: true } }));
      window.dispatchEvent(new CustomEvent('svr_show_banner', { detail: { message: `POT WON BY: ${username}\nHAND: ${handName || 'Poker Hand'}\nCARDS: ${winningCards.join(', ')}`, communityCards, winningCards, duration } }));
      setTimeout(()=> window.dispatchEvent(new CustomEvent('svr_highlight_player', { detail: { username, highlight: false } })), duration);
    }
  };
  root.modules[MODULE] = api;
  api.init();
})();
