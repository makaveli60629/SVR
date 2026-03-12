/**
 * SVR Poker — seatJoin.js
 * Handles the player clicking a seat to join at it in A-Frame VR scenes.
 */

/**
 * Initialize seat click handlers for A-Frame scenes.
 * @param {string} rigSelector  — CSS selector for the camera rig (default: '#rig')
 * @param {string} seatSelector — CSS selector for seat entities (default: '.seat')
 */
export function initSeatJoin(rigSelector = '#rig', seatSelector = '.seat') {
  const rig = document.querySelector(rigSelector);
  if (!rig) { console.warn('[SeatJoin] Rig element not found:', rigSelector); return; }

  const seats = document.querySelectorAll(seatSelector);
  if (!seats.length) { console.warn('[SeatJoin] No seat elements found'); return; }

  seats.forEach((seat, i) => {
    seat.addEventListener('click', () => {
      const pos = seat.getAttribute('position');
      if (!pos) { console.warn('[SeatJoin] Seat has no position', seat.id); return; }
      rig.setAttribute('position', { x: pos.x, y: 1.6, z: pos.z + 0.3 });
      seat.setAttribute('color', '#7a2cff');
      console.log(`[SeatJoin] Joined seat ${i} at`, pos);
    });
  });

  console.log(`[SeatJoin] ${seats.length} seats initialized`);
}

// Auto-init for A-Frame scenes on DOMContentLoaded
if (typeof AFRAME !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => initSeatJoin());
}
