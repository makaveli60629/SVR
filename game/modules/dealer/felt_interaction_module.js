export class FeltInteractionModule extends EventTarget {
  constructor(table) {
    super();
    this.table = table;
    this.streetCommitted = new Map();
    this.lastAction = null;
  }

  getLine() {
    return this.table?.getBettingLine?.() || { radiusX: 0.88, radiusZ: 0.39, centerX: 0, centerZ: 0 };
  }

  normalizePosition(position = {}) {
    return {
      x: Number(position.x || 0),
      y: Number(position.y || 0),
      z: Number(position.z || 0)
    };
  }

  isPastLine(position) {
    const p = this.normalizePosition(position);
    const line = this.getLine();
    const nx = (p.x - Number(line.centerX || 0)) / Math.max(0.001, Number(line.radiusX || 0.88));
    const nz = (p.z - Number(line.centerZ || 0)) / Math.max(0.001, Number(line.radiusZ || 0.39));
    return nx * nx + nz * nz <= 1;
  }

  evaluateCardRelease({ seatIndex = 0, position = {} } = {}) {
    const committed = this.isPastLine(position);
    const result = {
      type: committed ? 'fold' : 'keep-cards',
      seatIndex: Number(seatIndex),
      committed,
      position: this.normalizePosition(position),
      reason: committed ? 'cards-crossed-betting-line' : 'cards-remained-in-player-zone'
    };
    this.lastAction = result;
    if (committed) this.dispatchEvent(new CustomEvent('fold', { detail: result }));
    return result;
  }

  evaluateChipRelease({ seatIndex = 0, position = {}, chipValue = 0, stack = Infinity, toCall = 0, minimumRaiseTo = 0 } = {}) {
    const committed = this.isPastLine(position);
    const seat = Number(seatIndex);
    const value = Math.max(0, Number(chipValue || 0));
    const available = Math.max(0, Number.isFinite(Number(stack)) ? Number(stack) : value);
    const amount = Math.min(value, available);
    if (!committed || amount <= 0) {
      const result = { type: 'keep-chips', seatIndex: seat, committed: false, amount: 0, position: this.normalizePosition(position) };
      this.lastAction = result;
      return result;
    }

    const previous = Number(this.streetCommitted.get(seat) || 0);
    const total = previous + amount;
    const call = Math.max(0, Number(toCall || 0));
    const minRaise = Math.max(call, Number(minimumRaiseTo || 0));
    let action = 'bet';
    if (call > 0) {
      if (total < call) action = total >= available ? 'all-in-call' : 'under-call';
      else if (total === call) action = 'call';
      else if (minRaise > call && total < minRaise) action = total >= available ? 'all-in-raise' : 'incomplete-raise';
      else action = 'raise';
    } else if (total >= available && available !== Infinity) {
      action = 'all-in-bet';
    }

    this.streetCommitted.set(seat, total);
    const result = {
      type: action,
      seatIndex: seat,
      committed: true,
      amount,
      streetTotal: total,
      toCall: call,
      minimumRaiseTo: minRaise,
      position: this.normalizePosition(position)
    };
    this.lastAction = result;
    this.dispatchEvent(new CustomEvent('wager', { detail: result }));
    return result;
  }

  resetStreet() {
    this.streetCommitted.clear();
    this.lastAction = null;
    this.dispatchEvent(new CustomEvent('streetreset'));
  }

  snapshot() {
    return {
      bettingLine: this.getLine(),
      committedBySeat: Object.fromEntries(this.streetCommitted),
      lastAction: this.lastAction
    };
  }
}
