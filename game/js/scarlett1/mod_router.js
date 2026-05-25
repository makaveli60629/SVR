(function(){
  'use strict';
  const MODULE = 'mod_router';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    roomTables: [],
    init(){ window.addEventListener('svr_database_population', e => this.routePlayersToCorrectTables(e.detail?.players || [])); console.info('[SVR]', MODULE, 'ready'); },
    async fetchRoomAvailability(targetRoomZone){
      if (!root.config?.backendEnabled) return [];
      try{ const r = await fetch(`/api/rooms/${encodeURIComponent(targetRoomZone)}/tables`); if (r.ok) this.roomTables = await r.json(); }
      catch(error){ console.warn('[SVR] room availability unavailable', error); }
      return this.roomTables;
    },
    routePlayersToCorrectTables(playerQueue){
      for (const player of playerQueue){
        const table = this.roomTables.find(t => t.game_type === player.preferred_game_type && t.current_occupancy < t.seat_count);
        if (!table) continue;
        table.current_occupancy++;
        window.dispatchEvent(new CustomEvent('svr_render_seat_allocation', { detail: { userId: player.user_id, username: player.username, targetTableId: table.table_id, gameType: table.game_type, seatIndex: table.current_occupancy, maxSeats: 6 } }));
      }
    }
  };
  root.modules[MODULE] = api;
  api.init();
})();
