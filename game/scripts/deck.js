/**
 * SVR Poker — deck.js
 * Full 52-card deck utilities — re-exported from pokerEngine for convenience.
 */

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/** Build a fresh 52-card deck */
export function createDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ rank, suit, label: rank + suit });
  return deck;
}

/** Fisher-Yates shuffle */
export function shuffleDeck(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/** Deal n cards from the top of a (mutable) deck array */
export function dealCards(deck, n = 2) {
  if (deck.length < n) throw new Error('Not enough cards in deck');
  return deck.splice(deck.length - n, n);
}

/** Card label → suit color class ('red' | 'black') */
export function suitColor(label) {
  const suit = label.slice(-1);
  return suit === '♥' || suit === '♦' ? 'red' : 'black';
}
