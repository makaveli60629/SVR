export const BUILD = 'PHASE-340-PLATFORM-CORE-EXTRACTION-AUTHORITY-LOCK';
export const VERSION = 'phase345';

const REGISTRY = [
  'modules/phase340_runtime_authority_registry.js'
];

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
  'modules/phase345_player_account_activity_bridge.js'
];

const DESKTOP_PRESENTATION = [
  'modules/phase323_table_resting_point_alignment_lock.js',
  'modules/phase332_pro_table_chip_physics_pass_line_lock.js',
  'modules/phase334_table_layout_gesture_poker_lock.js',
  'modules/phase335_oculus_acceptance_gameplay_stability_lock.js'
];

const QUEST = [
  'modules/phase199_fbx_table_runtime_diagnostic_lock.js',
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

const ANDROID = [
  'modules/phase322_full_lobby_visual_finish_lock.js',
  'phase326_android_playable_polish_lock.js',
  'phase339_android_single_authority_lock.js'
];

const ANDROID_FINAL = [
  'modules/phase343_android_gameplay_hud_seated_table_view_lock.js',
  'modules/phase344_android_full_hand_acceptance_input_lock.js'
];

const CAMERA3 = [
  'modules/phase339_camera3_table_orbit_lock.js'
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
  if (/Quest|Oculus|Meta Quest/i.test(ua)) return 'quest';
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
  if (value === 'android') return unique([...REGISTRY, ...FOUNDATION, ...ANDROID, ...POKER_CORE, ...SETTLEMENT_PRESENTATION, ...ANDROID_FINAL, ...ACCOUNT_ACTIVITY]);
  if (value === 'quest') return unique([...REGISTRY, ...FOUNDATION, ...LOBBY, ...POKER_CORE, ...QUEST, ...SETTLEMENT_PRESENTATION, ...ACCOUNT_ACTIVITY]);
  return unique([...REGISTRY, ...FOUNDATION, ...LOBBY, ...POKER_CORE, ...DESKTOP_PRESENTATION, ...SETTLEMENT_PRESENTATION, ...ACCOUNT_ACTIVITY]);
}

export function validateManifest(platform = detectPlatform()) {
  const modules = manifestFor(platform);
  const normalized = modules.map((x) => x.replace(/[?#].*$/, ''));
  const duplicates = normalized.filter((x, i) => normalized.indexOf(x) !== i);
  const forbidden = [];
  if (platform === 'android') {
    for (const old of ['phase324_android_game_entry_controls_lock.js','phase325_android_controls_table_unifier_lock.js','phase329_android_table_playtest_ux_lock.js','modules/phase330_android_ux_cleanup_master_handoff_lock.js']) {
      if (normalized.some((x) => x.endsWith(old))) forbidden.push(old);
    }
  }
  if (platform === 'camera3') {
    for (const old of ['modules/phase322_full_lobby_visual_finish_lock.js','phase326_android_playable_polish_lock.js','modules/phase331_quest_meta_hands_table_interaction_lock.js','modules/phase345_player_account_activity_bridge.js']) {
      if (normalized.some((x) => x.endsWith(old))) forbidden.push(old);
    }
  }
  return {
    build: BUILD,
    platform,
    moduleCount: modules.length,
    duplicates,
    forbidden,
    pass: duplicates.length === 0 && forbidden.length === 0,
    modules
  };
}
