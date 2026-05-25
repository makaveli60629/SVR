(function(){
  'use strict';
  const MODULE = 'mod_profile_sync';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    init(){ window.addEventListener('svr_user_authenticated', e => this.syncIdentity(e.detail || {})); console.info('[SVR]', MODULE, 'ready'); },
    syncIdentity(profile){
      window.dispatchEvent(new CustomEvent('svr_load_table_identity_card', { detail: { username: profile.username || 'Guest', avatarUrl: profile.avatar_url || 'assets/textures/avatars/default.png', rank: profile.rank_title || 'VIP TESTER' } }));
    }
  };
  root.modules[MODULE] = api;
  api.init();
})();
