/**
 * SVR Poker — tablemanager.js
 * Manages multiple poker tables on the server side and in A-Frame scenes.
 */

export function createTable(options = {}) {
  console.log('[TableManager] Poker table created:', options.tableId || 'default');
  return options;
}

// A-Frame scene manager component
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('table-manager', {
    schema: {
      tableCount: { type: 'int',    default: 1   },
      tableId:    { type: 'string', default: 'main' },
    },
    init() {
      console.log('[TableManager] Managing', this.data.tableCount, 'table(s)');
    },
  });
}
