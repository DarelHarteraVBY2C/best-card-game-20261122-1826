// Emberwind Duel — card definitions.
// Every card belongs to one of four winds (elements). Each wind has its own
// colour AND its own drawn shape, so a card's suit is readable without text.
//   Flame  (red,    triangle) — strikes hard
//   Wave   (blue,   droplet)  — mends life
//   Leaf   (green,  diamond)  — draws fresh cards
//   Stone  (amber,  square)   — raises a guard shield

export const WINDS = {
  flame: { label: 'Flame', color: '#e5484d', dark: '#8f1d22', light: '#ffb3b0', shape: 'triangle' },
  wave:  { label: 'Wave',  color: '#3e8ef7', dark: '#174a94', light: '#bcd8ff', shape: 'droplet' },
  leaf:  { label: 'Leaf',  color: '#46a758', dark: '#1d5c2e', light: '#b8ecc4', shape: 'diamond' },
  stone: { label: 'Stone', color: '#e8a13a', dark: '#8a5a12', light: '#ffe1a8', shape: 'square' },
};

export const WIND_ORDER = ['flame', 'wave', 'leaf', 'stone'];

// effect: strike = damage the rival, guard = shield yourself,
//         mend = restore your life, draw = pull extra cards.
export const CARD_DEFS = [
  { id: 'ember-spark',   name: 'Ember Spark',   wind: 'flame', cost: 1, power: 3, effect: 'strike', blurb: 'A quick lick of fire.' },
  { id: 'ember-fang',    name: 'Ember Fang',    wind: 'flame', cost: 2, power: 5, effect: 'strike', blurb: 'Bites twice as hot.' },
  { id: 'ember-storm',   name: 'Ember Storm',   wind: 'flame', cost: 4, power: 9, effect: 'strike', blurb: 'The sky itself burns.' },
  { id: 'ember-coal',    name: 'Coal Heart',    wind: 'flame', cost: 2, power: 2, effect: 'guard',  blurb: 'Banked heat, hard skin.' },
  { id: 'ember-kindling',name: 'Kindling',      wind: 'flame', cost: 1, power: 2, effect: 'draw',   blurb: 'Small flame, fresh ideas.' },
  { id: 'ember-ash',     name: 'Ash Veil',      wind: 'flame', cost: 3, power: 4, effect: 'guard',  blurb: 'Smoke that swallows blows.' },
  { id: 'tide-drip',     name: 'Tide Drip',     wind: 'wave',  cost: 1, power: 3, effect: 'mend',   blurb: 'Cool water, cool head.' },
  { id: 'tide-surge',    name: 'Tide Surge',    wind: 'wave',  cost: 2, power: 4, effect: 'strike', blurb: 'A wave that hits like a wall.' },
  { id: 'tide-spring',   name: 'Springwell',    wind: 'wave',  cost: 3, power: 6, effect: 'mend',   blurb: 'Drink deep, stand tall.' },
  { id: 'tide-undertow', name: 'Undertow',      wind: 'wave',  cost: 2, power: 2, effect: 'draw',   blurb: 'The current pulls cards in.' },
  { id: 'tide-mist',     name: 'Mist Cloak',    wind: 'wave',  cost: 2, power: 4, effect: 'guard',  blurb: 'Hard to hit what you cannot see.' },
  { id: 'tide-rain',     name: 'First Rain',    wind: 'wave',  cost: 1, power: 2, effect: 'strike', blurb: 'Sharp drops, sharper sting.' },
  { id: 'grove-seed',    name: 'Grove Seed',    wind: 'leaf',  cost: 1, power: 2, effect: 'draw',   blurb: 'Plant one, harvest two.' },
  { id: 'grove-thorn',   name: 'Thorn Whip',    wind: 'leaf',  cost: 2, power: 5, effect: 'strike', blurb: 'Vines with a temper.' },
  { id: 'grove-bloom',   name: 'Bloom Burst',   wind: 'leaf',  cost: 3, power: 5, effect: 'mend',   blurb: 'Petals knit the wounds shut.' },
  { id: 'grove-canopy',  name: 'Canopy Wall',   wind: 'leaf',  cost: 3, power: 6, effect: 'guard',  blurb: 'A roof of living leaves.' },
  { id: 'grove-spore',   name: 'Spore Cloud',   wind: 'leaf',  cost: 1, power: 2, effect: 'strike', blurb: 'Itchy, then worse.' },
  { id: 'grove-root',    name: 'Deep Root',     wind: 'leaf',  cost: 2, power: 3, effect: 'mend',   blurb: 'Draw strength from below.' },
  { id: 'crag-pebble',   name: 'Pebble Shot',   wind: 'stone', cost: 1, power: 2, effect: 'strike', blurb: 'Small rock, big bruise.' },
  { id: 'crag-bulwark',  name: 'Bulwark',       wind: 'stone', cost: 2, power: 5, effect: 'guard',  blurb: 'Stand behind the mountain.' },
  { id: 'crag-avalanche',name: 'Avalanche',     wind: 'stone', cost: 4, power: 8, effect: 'strike', blurb: 'The whole cliff comes down.' },
  { id: 'crag-quarry',   name: 'Quarry Pick',   wind: 'stone', cost: 1, power: 2, effect: 'draw',   blurb: 'Chip away, find treasure.' },
  { id: 'crag-balm',     name: 'Stone Balm',    wind: 'stone', cost: 2, power: 4, effect: 'mend',   blurb: 'Warm rock, slow healing.' },
  { id: 'crag-rampart',  name: 'Rampart',       wind: 'stone', cost: 3, power: 7, effect: 'guard',  blurb: 'A wall that walks with you.' },
];

export const EFFECT_LABEL = {
  strike: 'STRIKE',
  guard: 'GUARD',
  mend: 'MEND',
  draw: 'DRAW',
};

// Playing two cards of the same wind back to back in one turn resonates:
// the second card's power grows. This is the combo the player hunts for.
export const RESONANCE_BONUS = 2;

export function windOf(card) {
  return WINDS[card.wind];
}

export function describeEffect(card, power) {
  switch (card.effect) {
    case 'strike': return `Deal ${power} damage`;
    case 'guard': return `Gain ${power} shield`;
    case 'mend': return `Restore ${power} life`;
    case 'draw': return `Draw ${power} cards`;
    default: return '';
  }
}
