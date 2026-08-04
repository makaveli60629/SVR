export const STANDARD_DENOMINATIONS = [5000, 1000, 500, 100, 25, 5, 1];
export const WORKING_RESERVE = Object.freeze({ 25: 4, 5: 5, 1: 5 });

function clampAmount(value) {
  const amount = Math.floor(Number(value) || 0);
  return Math.max(0, amount);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function greedy(amount, denominations = STANDARD_DENOMINATIONS) {
  const values = [];
  let remaining = clampAmount(amount);
  for (const denomination of denominations) {
    const count = Math.floor(remaining / denomination);
    for (let index = 0; index < count; index += 1) values.push(denomination);
    remaining -= count * denomination;
  }
  if (remaining > 0) values.push(remaining);
  return values;
}

function reserveValues(amount) {
  if (amount < 130) return [];
  return [
    ...Array(WORKING_RESERVE[25]).fill(25),
    ...Array(WORKING_RESERVE[5]).fill(5),
    ...Array(WORKING_RESERVE[1]).fill(1),
  ];
}

function packToLimit(values, maxChips) {
  const packed = values.slice().sort((a, b) => b - a);
  while (packed.length > maxChips) {
    const first = packed.shift() || 0;
    const second = packed.shift() || 0;
    packed.push(first + second);
    packed.sort((a, b) => b - a);
  }
  return packed;
}

export function bankrollPlan(value, options = {}) {
  const amount = clampAmount(value);
  const maxChips = Math.max(1, Math.floor(Number(options.maxChips) || 32));
  const useWorkingReserve = options.workingReserve !== false;
  const reserve = useWorkingReserve ? reserveValues(amount) : [];
  let values = reserve.concat(greedy(amount - sum(reserve)));
  let compressed = false;

  if (values.length > maxChips) {
    values = greedy(amount);
  }
  if (values.length > maxChips) {
    values = packToLimit(values, maxChips);
    compressed = true;
  }

  values.sort((a, b) => b - a);
  const counts = {};
  for (const denomination of values) counts[denomination] = (counts[denomination] || 0) + 1;
  const total = sum(values);
  return {
    amount,
    values,
    counts,
    total,
    exact: total === amount,
    chipCount: values.length,
    maxChips,
    compressed,
  };
}

export function canMakeAmount(values, target) {
  const wanted = clampAmount(target);
  if (wanted === 0) return true;
  const reachable = new Uint8Array(wanted + 1);
  reachable[0] = 1;
  for (const raw of values) {
    const value = clampAmount(raw);
    for (let amount = wanted; amount >= value; amount -= 1) {
      if (reachable[amount - value]) reachable[amount] = 1;
    }
  }
  return !!reachable[wanted];
}

export function formatDenomination(value) {
  const amount = clampAmount(value);
  if (amount >= 1000 && amount % 1000 === 0) return `$${amount / 1000}K`;
  return `$${amount.toLocaleString()}`;
}

export function runBankrollModelSelfTest() {
  const samples = [0, 1, 5, 20, 129, 130, 499, 999, 1000, 2375, 6000, 25000];
  const commonBets = [1, 5, 10, 20, 25, 50, 75, 100, 125];
  const results = samples.map((amount) => {
    const plan = bankrollPlan(amount);
    const payable = commonBets
      .filter((bet) => bet <= Math.min(amount, 125))
      .every((bet) => canMakeAmount(plan.values, bet));
    return {
      amount,
      exact: plan.exact,
      chipCount: plan.chipCount,
      withinLimit: plan.chipCount <= plan.maxChips,
      commonBetsPayable: amount < 130 ? true : payable,
    };
  });
  return {
    passed: results.every((result) => result.exact && result.withinLimit && result.commonBetsPayable),
    results,
  };
}
