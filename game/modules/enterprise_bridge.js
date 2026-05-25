// SVR Poker Enterprise Manifest Bridge
// Version: PHASE-175-MASTER-MANIFEST-MODULE-COMPLETE-LOCK
// Purpose: expose the uploaded master manifest architecture without forcing backend calls at boot.

const PHASE_175_MODULES = [
  'mod_charity',
  'mod_private',
  'mod_sponsor',
  'mod_commerce',
  'mod_stream',
  'mod_audio',
  'mod_watch',
  'mod_router',
  'mod_scorpion_fx',
  'mod_sportsbook',
  'mod_avatar',
  'mod_profile_sync',
  'mod_network'
];

function ensureSvrRoot(){
  const root = window.SVR || {};
  root.version = 'PHASE-175-MASTER-MANIFEST-MODULE-COMPLETE-LOCK';
  root.modules = root.modules || {};
  root.manifest = root.manifest || {};
  root.config = root.config || {};
  root.config.backendEnabled = Boolean(root.config.backendEnabled);
  root.config.multiplayerEnabled = Boolean(root.config.multiplayerEnabled);
  root.config.sponsorInjectionEnabled = Boolean(root.config.sponsorInjectionEnabled);
  root.manifest.scarlett1Modules = PHASE_175_MODULES.slice();
  root.manifest.tableSeatsMax = 6;
  root.manifest.postHandShowcaseMs = 10000;
  root.manifest.controllerFallbackPreserved = true;
  root.manifest.websiteTrackLocked = true;
  window.SVR = root;
  return root;
}

function installEventAuditBridge(){
  const audit = [];
  const remember = (type, detail = {}) => {
    audit.push({ type, detail, at: new Date().toISOString() });
    while (audit.length > 50) audit.shift();
  };
  window.SVR.getEnterpriseAudit = () => audit.slice();
  window.addEventListener('svr_show_banner', e => remember('svr_show_banner', e.detail));
  window.addEventListener('svr_request_seat', e => remember('svr_request_seat', e.detail));
  window.addEventListener('svr_inject_sponsor_materials', e => remember('svr_inject_sponsor_materials', { keys: Object.keys(e.detail?.textures || {}) }));
  window.addEventListener('svr_network_player_update', e => remember('svr_network_player_update', { userId: e.detail?.userId }));
}

function announceReady(){
  const detail = {
    phase: 'PHASE-175-MASTER-MANIFEST-MODULE-COMPLETE-LOCK',
    modules: PHASE_175_MODULES,
    safeMode: true,
    backendEnabled: Boolean(window.SVR?.config?.backendEnabled),
    multiplayerEnabled: Boolean(window.SVR?.config?.multiplayerEnabled)
  };
  window.dispatchEvent(new CustomEvent('svr_enterprise_manifest_ready', { detail }));
  console.info('[SVR] Enterprise manifest bridge ready', detail);
}

ensureSvrRoot();
installEventAuditBridge();
announceReady();

export { PHASE_175_MODULES };
