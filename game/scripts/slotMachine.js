/**
 * SVR Poker — slotMachine.js
 * Daily bonus slot machine — award random chip reward once per 24h.
 * No alert() — updates a DOM element instead.
 */

const REWARDS    = [50, 100, 250, 500, 1000, 2500];
const STORAGE_KEY = 'svr_daily_slot';
const ONE_DAY_MS  = 24 * 60 * 60 * 1000;

/**
 * Attempt to spin the daily slot machine.
 *
 * @param {string}   resultElementId  — DOM element ID to display result
 * @param {Function} onReward         — callback(amount: number) when reward granted
 */
export function spinDailySlot(resultElementId, onReward) {
  const el = document.getElementById(resultElementId);
  if (!el) { console.warn('[SlotMachine] Element not found:', resultElementId); return; }

  const last = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  const now  = Date.now();

  if (now - last < ONE_DAY_MS) {
    const nextMs   = ONE_DAY_MS - (now - last);
    const nextHrs  = Math.ceil(nextMs / 3_600_000);
    el.textContent = `⏳ Daily spin available in ${nextHrs}h`;
    el.className   = 'slot-cooldown';
    return;
  }

  // Spin animation
  el.textContent = '🎰 Spinning…';
  el.className   = 'slot-spinning';

  setTimeout(() => {
    const win = REWARDS[Math.floor(Math.random() * REWARDS.length)];
    localStorage.setItem(STORAGE_KEY, String(now));
    el.textContent = `🎉 Daily Reward: +${win} chips!`;
    el.className   = 'slot-win';
    if (typeof onReward === 'function') onReward(win);
  }, 1200);
}

// A-Frame component wrapper
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('slot-machine', {
    init() {
      this.el.addEventListener('click', () => {
        spinDailySlot('slotResult', (amount) => {
          this.el.sceneEl.emit('chipsAwarded', { amount });
        });
      });
    },
  });
}
