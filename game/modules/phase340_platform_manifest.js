export const BUILD = 'PHASE-356-QUEST-FULL-GAME-ACCEPTANCE-SMOOTHNESS-LOCK';
export const VERSION = 'phase356';

const REGISTRY = ['modules/phase340_runtime_authority_registry.js'];

const FOUNDATION = [
  'phase101_boot_load_screen_recovery.js',
  'phase101_partial_runtime_render_guard.js',
  'main.js',
  'phase156_table2_stool_texture_lock.js',
  'phase161_geometry_table_fbx_floor_lock.js',
  'phase164_fbx_table_final_alignment_seat_anchor_lock.js',
  'modules/phase200_clean_runtime_authority_lock.js',
  'modules/phase202_fbx_asset_path_recovery_lock.js',
  'modules/phase203_table_asset_resolver_lock.js'
];

const LOBBY = [
  'modules/phase195_vr_room_portal_system_lock.js',
  'modules/phase211_no_blink_visual_stabilizer_lock.js',
  'modules/phase322_full_lobby_visual_finish_lock.js',
  'modules/p222_spawn.js',
  'modules/p225_lock.js'
];

const POKER_CORE = [
  'modules/p85_poker_truth_lock.js',
  'modules/phase336_authoritative_poker_rules_pot_settlement_lock.js'
];

const SETTLEMENT_PRESENTATION = [
  'modules/phase337_physical_pot_winner_settlement_lock.js',
  'modules/phase338_bankroll_chip_inventory_sync_lock.js',
  'modules/phase341_canonical_table_geometry_card_motion_lock.js',
  'modules/phase342_adaptive_performance_asset_pipeline_lock.js'
];

const ACCOUNT_ACTIVITY = [
  'modules/phase345_player_account_activity_bridge.js',
  'modules/phase346_player_avatar_profile_bridge.js'
];
const INGAME_AVATAR = ['modules/phase348_ingame_player_avatar_presence_performance_lock.js'];
const MULTIPLAYER_PRESENCE = [
  'modules/phase349_multiplayer_presence_seat_reconnect_lock.js',
  'modules/phase349_presence_gameplay_seat_bridge.js'
];
const SHARED_SOCIAL = [...ACCOUNT_ACTIVITY, ...INGAME_AVATAR, ...MULTIPLAYER_PRESENCE];

const DESKTOP_PRESENTATION = [
  'modules/phase323_table_resting_point_alignment_lock.js',
  'modules/phase332_pro_table_chip_physics_pass_line_lock.js',
  'modules/phase334_table_layout_gesture_poker_lock.js',
  'modules/phase335_oculus_acceptance_gameplay_stability_lock.js'
];

const QUEST_FOUNDATION = [
  'modules/phase356_quest_runtime_boot_lock.js',
  'phase101_boot_load_screen_recovery.js',
  'phase101_partial_runtime_render_guard.js',
  'main.js',
  'modules/phase356_quest_uploaded_table_authority_lock.js'
];
const QUEST_POKER_BOOT = ['modules/phase356_quest_poker_boot_order_lock.js'];
const QUEST_INPUT = [
  'modules/p86_seated_lock.js',
  'modules/p87_scorpion_seat_authority.js',
  'phase281_visible_hands_sky_cleanup_lock.js',
  'modules/phase323_table_resting_point_alignment_lock.js',
  'modules/phase331_quest_meta_hands_table_interaction_lock.js',
  'modules/phase332_pro_table_chip_physics_pass_line_lock.js',
  'modules/phase333_quest_shader_gameplay_polish_lock.js',
  'modules/phase334_table_layout_gesture_poker_lock.js',
  'modules/phase335_oculus_acceptance_gameplay_stability_lock.js'
];
const QUEST_SETTLEMENT = [
  'modules/phase337_physical_pot_winner_settlement_lock.js',
  'modules/phase338_bankroll_chip_inventory_sync_lock.js',
  'modules/phase342_adaptive_performance_asset_pipeline_lock.js'
];
const QUEST_ACCEPTANCE = [
  'modules/phase356_quest_pot_display_authority_lock.js',
  'modules/phase356_quest_full_game_acceptance_smoothness_lock.js'
];
const QUEST_DEFERRED = [...LOBBY, ...SHARED_SOCIAL];

const ANDROID_FOUNDATION = [
  'modules/phase355_android_runtime_smoothness_hardening_lock.js',
  'phase101_boot_load_screen_recovery.js',
  'phase101_partial_runtime_render_guard.js',
  'main.js'
];
const ANDROID_POKER = [
  'modules/phase355_android_poker_boot_order_lock.js',
  'modules/phase337_physical_pot_winner_settlement_lock.js',
  'modules/phase338_bankroll_chip_inventory_sync_lock.js',
  'modules/phase342_adaptive_performance_asset_pipeline_lock.js'
];
const ANDROID_FINAL = [
  'modules/phase343_android_gameplay_hud_seated_table_view_lock.js',
  'modules/phase344_android_full_hand_acceptance_input_lock.js',
  'modules/phase347_android_single_controller_seated_gameplay_apk_release_lock.js',
  'modules/phase355_android_full_hand_driver_compatibility_lock.js',
  'modules/phase350_android_controller_dom_deduplication_lock.js'
];
const ANDROID_DEFERRED = [
  'modules/phase322_full_lobby_visual_finish_lock.js',
  ...SHARED_SOCIAL
];

const CAMERA3 = [
  'modules/phase339_camera3_table_orbit_lock.js',
  'modules/phase350_camera3_visibility_lighting_lock.js'
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
  if (path.endsWith('/camera3.html') || params.get('cam') === 'director' || params.has('director')) return 'camera3';
  if (path.endsWith('/android.html')) return 'android';
  if (params.get('platform') === 'quest' || /Quest|Oculus|Meta Quest/i.test(ua)) return 'quest';
  if (/Android/i.test(ua) && !params.has('desktop') && !params.has('standard')) return 'android';
  return 'desktop';
}

export function manifestFor(platform = detectPlatform()) {
  const value = String(platform || '').toLowerCase();
  if (value === 'camera3') {
    return unique([
      ...REGISTRY,
      'main.js',
      'phase156_table2_stool_texture_lock.js',
      'phase161_geometry_table_fbx_floor_lock.js',
      'phase164_fbx_table_final_alignment_seat_anchor_lock.js',
      'modules/phase200_clean_runtime_authority_lock.js',
      'modules/phase202_fbx_asset_path_recovery_lock.js',
      'modules/phase203_table_asset_resolver_lock.js',
      ...POKER_CORE,
      ...SETTLEMENT_PRESENTATION,
      ...CAMERA3
    ]);
  }
  if (value === 'android') return unique([...REGISTRY, ...ANDROID_FOUNDATION, ...ANDROID_POKER, ...ANDROID_FINAL]);
  if (value === 'quest') return unique([...REGISTRY, ...QUEST_FOUNDATION, ...QUEST_POKER_BOOT, ...QUEST_INPUT, ...QUEST_SETTLEMENT, ...QUEST_ACCEPTANCE]);
  return unique([...REGISTRY, ...FOUNDATION, ...LOBBY, ...POKER_CORE, ...DESKTOP_PRESENTATION, ...SETTLEMENT_PRESENTATION, ...SHARED_SOCIAL]);
}

export function deferredManifestFor(platform = detectPlatform()) {
  const value = String(platform || '').toLowerCase();
  if (value === 'android') return unique(ANDROID_DEFERRED);
  if (value === 'quest') return unique(QUEST_DEFERRED);
  return [];
}

export function validateManifest(platform = detectPlatform()) {
  const value = String(platform || '').toLowerCase();
  const modules = manifestFor(value);
  const deferred = deferredManifestFor(value);
  const normalized = modules.map((x) => x.replace(/[?#].*$/, ''));
  const normalizedDeferred = deferred.map((x) => x.replace(/[?#].*$/, ''));
  const combined = [...normalized, ...normalizedDeferred];
  const duplicates = combined.filter((x, i) => combined.indexOf(x) !== i);
  const forbidden = [];

  if (value === 'android') {
    const retired = [
      'phase156_table2_stool_texture_lock.js',
      'phase161_geometry_table_fbx_floor_lock.js',
      'phase164_fbx_table_final_alignment_seat_anchor_lock.js',
      'modules/phase202_fbx_asset_path_recovery_lock.js',
      'modules/phase203_table_asset_resolver_lock.js',
      'phase326_android_playable_polish_lock.js',
      'phase339_android_single_authority_lock.js',
      'phase324_android_game_entry_controls_lock.js',
      'phase325_android_controls_table_unifier_lock.js',
      'phase329_android_table_playtest_ux_lock.js',
      'modules/phase330_android_ux_cleanup_master_handoff_lock.js'
    ];
    for (const old of retired) if (combined.some((x) => x.endsWith(old))) forbidden.push(old);
    const order = [
      'phase355_android_runtime_smoothness_hardening_lock.js',
      'main.js',
      'phase355_android_poker_boot_order_lock.js',
      'phase347_android_single_controller_seated_gameplay_apk_release_lock.js',
      'phase355_android_full_hand_driver_compatibility_lock.js',
      'phase350_android_controller_dom_deduplication_lock.js'
    ].map((name) => normalized.findIndex((x) => x.endsWith(name)));
    if (order.some((index) => index < 0) || order.some((index, position) => position > 0 && index <= order[position - 1]) || order.at(-1) !== normalized.length - 1) {
      forbidden.push('phase355-android-critical-load-order');
    }
  }

  if (value === 'quest') {
    const forbiddenQuest = [
      'phase156_table2_stool_texture_lock.js',
      'phase161_geometry_table_fbx_floor_lock.js',
      'phase164_fbx_table_final_alignment_seat_anchor_lock.js',
      'modules/phase202_fbx_asset_path_recovery_lock.js',
      'modules/phase203_table_asset_resolver_lock.js',
      'phase343_android_gameplay_hud_seated_table_view_lock.js',
      'phase347_android_single_controller_seated_gameplay_apk_release_lock.js',
      'phase350_android_controller_dom_deduplication_lock.js',
      'phase355_android_runtime_smoothness_hardening_lock.js'
    ];
    for (const file of forbiddenQuest) if (normalized.some((x) => x.endsWith(file))) forbidden.push(file);
    const questOrder = [
      'phase356_quest_runtime_boot_lock.js',
      'main.js',
      'phase356_quest_uploaded_table_authority_lock.js',
      'phase356_quest_poker_boot_order_lock.js',
      'phase331_quest_meta_hands_table_interaction_lock.js',
      'phase334_table_layout_gesture_poker_lock.js',
      'phase335_oculus_acceptance_gameplay_stability_lock.js',
      'phase356_quest_pot_display_authority_lock.js',
      'phase356_quest_full_game_acceptance_smoothness_lock.js'
    ].map((name) => normalized.findIndex((x) => x.endsWith(name)));
    if (questOrder.some((index) => index < 0)
      || questOrder.some((index, position) => position > 0 && index <= questOrder[position - 1])
      || questOrder.at(-1) !== normalized.length - 1) {
      forbidden.push('phase356-quest-critical-load-order');
    }
    const profileIndex = normalizedDeferred.findIndex((x) => x.endsWith('phase346_player_avatar_profile_bridge.js'));
    const avatarIndex = normalizedDeferred.findIndex((x) => x.endsWith('phase348_ingame_player_avatar_presence_performance_lock.js'));
    const presenceIndex = normalizedDeferred.findIndex((x) => x.endsWith('phase349_multiplayer_presence_seat_reconnect_lock.js'));
    const seatBridgeIndex = normalizedDeferred.findIndex((x) => x.endsWith('phase349_presence_gameplay_seat_bridge.js'));
    if (profileIndex < 0 || avatarIndex <= profileIndex || presenceIndex <= avatarIndex || seatBridgeIndex <= presenceIndex) {
      forbidden.push('phase356-quest-deferred-load-order');
    }
  }

  if (value === 'camera3') {
    for (const old of ['modules/phase322_full_lobby_visual_finish_lock.js','phase326_android_playable_polish_lock.js','modules/phase331_quest_meta_hands_table_interaction_lock.js','modules/phase345_player_account_activity_bridge.js','modules/phase346_player_avatar_profile_bridge.js','modules/phase347_android_single_controller_seated_gameplay_apk_release_lock.js','modules/phase348_ingame_player_avatar_presence_performance_lock.js','modules/phase349_multiplayer_presence_seat_reconnect_lock.js','modules/phase349_presence_gameplay_seat_bridge.js','modules/phase350_android_controller_dom_deduplication_lock.js']) {
      if (normalized.some((x) => x.endsWith(old))) forbidden.push(old);
    }
    const orbitIndex = normalized.findIndex((x) => x.endsWith('phase339_camera3_table_orbit_lock.js'));
    const lightIndex = normalized.findIndex((x) => x.endsWith('phase350_camera3_visibility_lighting_lock.js'));
    if (orbitIndex < 0 || lightIndex <= orbitIndex || lightIndex !== normalized.length - 1) forbidden.push('phase350-camera3-load-order');
  }

  return {
    build: BUILD,
    platform: value,
    moduleCount: modules.length,
    deferredModuleCount: deferred.length,
    duplicates,
    forbidden,
    pass: duplicates.length === 0 && forbidden.length === 0,
    modules,
    deferred
  };
}
