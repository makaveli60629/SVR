(function(){
  'use strict';
  const MODULE = 'mod_scorpion_fx';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    init(){ window.addEventListener('svr_table_high_stakes_event', e => this.triggerStagedAtmosphere(Number(e.detail?.potSize || 0))); console.info('[SVR]', MODULE, 'ready'); },
    triggerStagedAtmosphere(potSize){
      window.dispatchEvent(new CustomEvent('svr_modify_ambient_light', { detail: { color: 0xff5500, intensity: potSize > 50000 ? 2.5 : 1.2, duration: 5000 } }));
      window.dispatchEvent(new CustomEvent('svr_spawn_particles', { detail: { type: 'scorpion_gold', density: Math.min(150, Math.max(20, Math.round(potSize/500))) } }));
    }
  };
  root.modules[MODULE] = api;
  api.init();
})();
