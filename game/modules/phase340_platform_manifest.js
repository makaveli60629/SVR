export const BUILD = 'PHASE-391-PRODUCTION-CONSOLIDATION-AUTO-DEPLOY-LOCK';
export const VERSION = 'phase391';

const REGISTRY = ['modules/phase340_runtime_authority_registry.js'];
const DEVICE_ALIGNMENT = ['modules/phase364_device_xr_geometry_spawn_lock.js'];
const BOOT = [
  'phase101_boot_load_screen_recovery.js',
  'phase101_partial_runtime_render_guard.js',
  'main.js'
];
const POKER_CORE = [
  'modules/p85_poker_truth_lock.js',
  'modules/phase336_authoritative_poker_rules_pot_settlement_lock.js'
];
const LOBBY = [
  'modules/phase195_vr_room_portal_system_lock.js',
  'modules/phase211_no_blink_visual_stabilizer_lock.js',
  'modules/phase322_full_lobby_visual_finish_lock.js',
  'modules/p222_spawn.js',
  'modules/p225_lock.js'
];
const SOCIAL = [
  'modules/phase345_player_account_activity_bridge.js',
  'modules/phase346_player_avatar_profile_bridge.js',
  'modules/phase348_ingame_player_avatar_presence_performance_lock.js',
  'modules/phase349_multiplayer_presence_seat_reconnect_lock.js',
  'modules/phase349_presence_gameplay_seat_bridge.js'
];
const QUEST_FOUNDATION = [
  ...REGISTRY,
  ...DEVICE_ALIGNMENT,
  'modules/phase358_quest_incremental_shader_compile_lock.js',
  'modules/phase358_quest_runtime_boot_lock.js',
  ...BOOT,
  ...POKER_CORE
];
const QUEST_INTERACTION = [
  'phase281_visible_hands_sky_cleanup_lock.js',
  'modules/phase331_quest_meta_hands_table_interaction_lock.js',
  'modules/phase333_quest_shader_gameplay_polish_lock.js',
  'modules/phase334_table_layout_gesture_poker_lock.js',
  'modules/phase335_oculus_acceptance_gameplay_stability_lock.js'
];
const QUEST_SETTLEMENT = [
  'modules/phase337_physical_pot_winner_settlement_lock.js',
  'modules/phase338_bankroll_chip_inventory_sync_lock.js',
  'modules/phase342_adaptive_performance_asset_pipeline_lock.js',
  'modules/phase358_quest_pot_display_authority_lock.js',
  'modules/phase358_quest_full_game_acceptance_smoothness_lock.js'
];
const QUEST_DEFERRED = [...LOBBY, ...SOCIAL];

const ANDROID = [
  ...REGISTRY,
  ...DEVICE_ALIGNMENT,
  'modules/phase356_android_real_device_freeze_recovery_lock.js',
  ...BOOT,
  'modules/phase355_android_poker_boot_order_lock.js',
  'modules/phase337_physical_pot_winner_settlement_lock.js',
  'modules/phase338_bankroll_chip_inventory_sync_lock.js',
  'modules/phase342_adaptive_performance_asset_pipeline_lock.js',
  'modules/phase343_android_gameplay_hud_seated_table_view_lock.js',
  'modules/phase344_android_full_hand_acceptance_input_lock.js',
  'modules/phase347_android_single_controller_seated_gameplay_apk_release_lock.js',
  'modules/phase355_android_full_hand_driver_compatibility_lock.js',
  'modules/phase350_android_controller_dom_deduplication_lock.js',
  'modules/phase365_android_seated_ux_branding_gyro_alignment_lock.js',
  'modules/phase367_android_physical_device_viewport_touch_acceptance_lock.js'
];

const CAMERA3 = [...REGISTRY, ...BOOT, ...POKER_CORE];
const DESKTOP = [
  ...REGISTRY,
  ...BOOT,
  ...LOBBY,
  ...POKER_CORE,
  'modules/phase337_physical_pot_winner_settlement_lock.js',
  'modules/phase338_bankroll_chip_inventory_sync_lock.js',
  'modules/phase341_canonical_table_geometry_card_motion_lock.js',
  'modules/phase342_adaptive_performance_asset_pipeline_lock.js',
  ...SOCIAL
];

function unique(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item).replace(/[?#].*$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function detectPlatform() {
  const params = new URLSearchParams(location.search);
  const path = location.pathname.toLowerCase();
  const ua = navigator.userAgent || '';
  if (/\/camera3(?:-live)?\.html$/.test(path) || /\/cam3\.html$/.test(path) || params.get('cam') === 'director' || params.has('director')) return 'camera3';
  if (/\/android(?:-tabletop|-stable)?\.html$/.test(path) || params.get('platform') === 'android' || params.get('android') === '1') return 'android';
  if (params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(ua)) return 'quest';
  if (/Android/i.test(ua) && !params.has('desktop') && !params.has('standard')) return 'android';
  return 'desktop';
}

export function manifestFor(platform = detectPlatform()) {
  const value = String(platform || '').toLowerCase();
  if (value === 'camera3') return unique(CAMERA3);
  if (value === 'android') return unique(ANDROID);
  if (value === 'quest') return unique([...QUEST_FOUNDATION, ...QUEST_INTERACTION, ...QUEST_SETTLEMENT]);
  return unique(DESKTOP);
}

export function deferredManifestFor(platform = detectPlatform()) {
  return String(platform || '').toLowerCase() === 'quest' ? unique(QUEST_DEFERRED) : [];
}

function ordered(items, names) {
  const indexes = names.map((name) => items.findIndex((item) => item.endsWith(name)));
  return indexes.every((index) => index >= 0)
    && indexes.every((index, position) => position === 0 || index > indexes[position - 1]);
}

export function validateManifest(platform = detectPlatform()) {
  const value = String(platform || '').toLowerCase();
  const modules = manifestFor(value);
  const deferred = deferredManifestFor(value);
  const normalized = modules.map((item) => item.replace(/[?#].*$/, ''));
  const normalizedDeferred = deferred.map((item) => item.replace(/[?#].*$/, ''));
  const combined = [...normalized, ...normalizedDeferred];
  const duplicates = combined.filter((item, index) => combined.indexOf(item) !== index);
  const forbidden = [];
  const retiredAuthorities = [
    'modules/phase358_quest_uploaded_table_authority_lock.js',
    'modules/phase379_quest_procedural_table_authority.js',
    'modules/phase339_camera3_table_orbit_lock.js',
    'modules/phase350_camera3_visibility_lighting_lock.js',
    'modules/phase388_front_south_seat_authority.js',
    'modules/p86_seated_lock.js',
    'modules/p87_scorpion_seat_authority.js'
  ];
  for (const retired of retiredAuthorities) if (combined.some((item) => item.endsWith(retired))) forbidden.push(retired);

  if (value === 'quest') {
    if (!ordered(normalized, [
      'phase364_device_xr_geometry_spawn_lock.js',
      'phase358_quest_incremental_shader_compile_lock.js',
      'phase358_quest_runtime_boot_lock.js',
      'main.js',
      'p85_poker_truth_lock.js',
      'phase336_authoritative_poker_rules_pot_settlement_lock.js',
      'phase331_quest_meta_hands_table_interaction_lock.js',
      'phase334_table_layout_gesture_poker_lock.js',
      'phase358_quest_full_game_acceptance_smoothness_lock.js'
    ])) forbidden.push('phase391-quest-load-order');
    if (!ordered(normalizedDeferred, [
      'phase346_player_avatar_profile_bridge.js',
      'phase348_ingame_player_avatar_presence_performance_lock.js',
      'phase349_multiplayer_presence_seat_reconnect_lock.js',
      'phase349_presence_gameplay_seat_bridge.js'
    ])) forbidden.push('phase391-quest-deferred-order');
  }
  if (value === 'camera3') {
    if (!ordered(normalized, ['main.js', 'p85_poker_truth_lock.js', 'phase336_authoritative_poker_rules_pot_settlement_lock.js'])) forbidden.push('phase391-camera3-load-order');
    if (normalized.some((item) => /phase339_camera3|phase350_camera3/.test(item))) forbidden.push('phase391-camera3-legacy-controller');
  }
  if (value === 'android') {
    if (!ordered(normalized, [
      'phase364_device_xr_geometry_spawn_lock.js',
      'phase356_android_real_device_freeze_recovery_lock.js',
      'main.js',
      'phase347_android_single_controller_seated_gameplay_apk_release_lock.js',
      'phase350_android_controller_dom_deduplication_lock.js',
      'phase367_android_physical_device_viewport_touch_acceptance_lock.js'
    ])) forbidden.push('phase391-android-load-order');
    if (normalizedDeferred.length) forbidden.push('phase391-android-deferred-work');
  }

  return {
    build: BUILD,
    version: VERSION,
    platform: value,
    moduleCount: modules.length,
    deferredModuleCount: deferred.length,
    duplicates,
    forbidden,
    singleOriginalTableAuthority: !combined.some((item) => item.endsWith('phase358_quest_uploaded_table_authority_lock.js') || item.endsWith('phase379_quest_procedural_table_authority.js')),
    legacyCameraControllersRemoved: !combined.some((item) => /phase339_camera3|phase350_camera3/.test(item)),
    pass: duplicates.length === 0 && forbidden.length === 0,
    modules,
    deferred
  };
}
