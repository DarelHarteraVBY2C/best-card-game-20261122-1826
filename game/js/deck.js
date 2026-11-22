// Emberwind Duel — deck handling: build, shuffle, draw, discard.
// A deck is a plain array of card objects; each entry is its own copy so
// playing one copy never mutates the other.

import { CARD_DEFS } from './cards.js';

export const DECK_SIZE = 40;
export const HAND_LIMIT = 7;
export const START_HAND = 5;

export function buildDeck() {
  const deck = [];
  // Two copies of every definition: 24 definitions x 2 = 48, trimmed to 40
  // by dropping the second copy of the eight cheapest cards, so the deck
  // leans on mid-cost plays instead of flooding with 1-cost tricks.
  const singles = ['ember-spark', 'tide-drip', 'grove-seed', 'crag-pebble',
    'ember-kindling', 'tide-rain', 'grove-spore', 'crag-quarry'];
  for (const def of CARD_DEFS) {
    deck.push({ ...def, uid: def.id + '#1' });
    if (!singles.includes(def.id)) deck.push({ ...def, uid: def.id + '#2' });
  }
  return deck;
}

export function shuffleDeck(deck, random) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Draw up to n cards from the top of the deck into a hand. When the deck
// runs dry the discard pile is shuffled back in; when both are empty the
// hand simply stays as it is (fatigue is handled by the caller).
export function drawCards(hand, deck, discard, n, random) {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck.push(...shuffleDeck(discard.splice(0), random));
    }
    hand.push(deck.pop());
    drawn++;
  }
  return drawn;
}

export function discardHand(hand, discard) {
  discard.push(...hand.splice(0));
}
