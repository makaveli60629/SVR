(function(){
  'use strict';
  const MODULE = 'mod_sponsor';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    activeTextures: {},
    init(){ console.info('[SVR]', MODULE, 'ready'); if (root.config?.backendEnabled && root.config?.sponsorInjectionEnabled) this.loadSponsorAssets(); },
    async loadSponsorAssets(){
      try{
        const response = await fetch('/api/sponsors/active-campaigns');
        if (response.ok) this.processCampaignData(await response.json());
      }catch(error){ console.warn('[SVR] sponsor assets unavailable', error); }
    },
    processCampaignData(campaigns = []){
      this.activeTextures = {};
      for (const ad of campaigns){ if (ad?.status === 'active' && ad.logo_url && ad.ad_type) this.activeTextures[ad.ad_type] = ad.logo_url; }
      this.injectSponsorTextures();
    },
    injectSponsorTextures(){
      if (!Object.keys(this.activeTextures).length) return;
      window.dispatchEvent(new CustomEvent('svr_inject_sponsor_materials', { detail: { textures: this.activeTextures } }));
    },
    async verifyCampaignCompliance(campaignId){
      if (!root.config?.backendEnabled || !campaignId) return false;
      try{ const r = await fetch(`/api/sponsors/compliance/${encodeURIComponent(campaignId)}`); const d = await r.json(); return Boolean(d.isCompliant); } catch { return false; }
    }
  };
  root.modules[MODULE] = api;
  api.init();
})();
