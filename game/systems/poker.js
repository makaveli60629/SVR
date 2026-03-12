/**
 * SVR Poker — poker.js (A-Frame system)
 * Client-side A-Frame poker component that syncs with Socket.IO backend.
 * Three.js r170 / A-Frame 1.5
 */

if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('poker-table', {
    schema: {
      serverUrl: { type: 'string', default: '' },
      tableId:   { type: 'string', default: 'main' },
      playerId:  { type: 'string', default: '' },
    },

    init() {
      this.tableState = null;

      // Listen for action events from gesture controls
      this.el.sceneEl.addEventListener('pokerAction', (e) => {
        const { type, amount } = e.detail;
        this._sendAction(type, amount);
      });

      // Listen for chips awarded (slot machine, etc.)
      this.el.sceneEl.addEventListener('chipsAwarded', (e) => {
        console.log('[Poker] Chips awarded:', e.detail.amount);
      });

      console.log('[Poker] Component initialized, table:', this.data.tableId);
    },

    _sendAction(type, amount = 0) {
      if (window.sendAction) {
        window.sendAction(type);
      } else {
        console.log('[Poker] Action (offline):', type, amount);
      }
    },

    _buildDeck() {
      const suits = ['♠', '♥', '♦', '♣'];
      const deck  = [];
      suits.forEach(s => {
        for (let i = 2; i <= 14; i++) {
          const rank = i > 10 ? ['J','Q','K','A'][i-11] : String(i);
          deck.push({ suit: s, rank, value: i, label: rank + s });
        }
      });
      this.deck = deck;
      console.log('[Poker] Deck ready:', this.deck.length, 'cards');
    },
  });
}
