/**
 * SVR Poker — seatSystem.js
 * Manages player seat assignment and teleportation.
 * Works with both A-Frame and plain DOM scenes.
 */

export class SeatSystem {
  constructor(seats = []) {
    // seats: array of { id, position: {x,y,z}, occupied: bool }
    this.seats = seats.length > 0 ? seats : this._defaultSeats();
  }

  _defaultSeats() {
    const count = 6;
    const r     = 2.2;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        id:       'seat_' + i,
        position: {
          x: parseFloat((Math.cos(angle) * r).toFixed(3)),
          y: 0.0,
          z: parseFloat((Math.sin(angle) * r).toFixed(3)),
        },
        occupied: false,
        playerId: null,
      };
    });
  }

  /** Assign next free seat to a player. Returns seat or null. */
  assignSeat(playerId) {
    const seat = this.seats.find(s => !s.occupied);
    if (!seat) return null;
    seat.occupied = true;
    seat.playerId = playerId;
    return seat;
  }

  /** Free a seat by player ID */
  freeSeat(playerId) {
    const seat = this.seats.find(s => s.playerId === playerId);
    if (seat) { seat.occupied = false; seat.playerId = null; }
  }

  /** Get seat position for a player */
  getPosition(playerId) {
    return this.seats.find(s => s.playerId === playerId)?.position ?? null;
  }

  /** Teleport A-Frame rig to a seat */
  teleportRig(rigEl, seat) {
    if (!rigEl || !seat) return;
    const p = seat.position;
    rigEl.setAttribute('position', { x: p.x, y: 1.6, z: p.z + 0.3 });
  }
}

// A-Frame component wrapper
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('seat-system', {
    init() {
      this.seatSystem = new SeatSystem();
      const rig = document.querySelector('#rig') || document.querySelector('a-camera');

      document.querySelectorAll('.seat-target').forEach(el => {
        el.addEventListener('click', () => {
          const pos  = el.getAttribute('position');
          const seat = { position: { x: pos.x, y: 0, z: pos.z } };
          this.seatSystem.teleportRig(rig, seat);
        });
      });

      console.log('[SeatSystem] Initialized with', this.seatSystem.seats.length, 'seats');
    },
  });
}
