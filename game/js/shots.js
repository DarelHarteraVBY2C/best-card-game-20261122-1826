// Emberwind Duel — deterministic screenshot states.
// ?shot=title | play | win | loss jumps the game straight into the matching
// scene so screenshots are reproducible renders of the real game code.
// Without the parameter the game starts on its title screen as normal.

import { CARD_DEFS } from './cards.js';

// Small seeded generator so the play screenshot deals the same hands.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function handOf(ids) {
  return ids.map((id, i) => {
    const def = CARD_DEFS.find((d) => d.id === id);
    return { ...def, uid: `${def.id}#shot${i}` };
  });
}

export function applyShot(state, startMatch) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;

  if (shot === 'title') return; // the title screen is already the default

  // Every staged scene starts from a real fresh match, then the numbers
  // are pushed to a mid-game (or finished) position.
  state.random = mulberry32(20261123);
  startMatch();

  if (shot === 'play') {
    state.turn = 4;
    state.player.life = 24;
    state.player.shield = 2;
    state.player.mana = 6;
    state.player.maxMana = 6;
    state.rival.life = 18;
    state.rival.shield = 3;
    state.rival.mana = 5;
    state.rival.maxMana = 5;
    state.player.hand = handOf([
      'ember-storm', 'tide-spring', 'grove-thorn', 'crag-bulwark', 'ember-fang',
    ]);
    state.rival.hand = handOf(['tide-surge', 'grove-canopy', 'crag-avalanche', 'ember-ash']);
    state.lastPlayed = { card: { ...CARD_DEFS.find((d) => d.id === 'ember-fang'), uid: 'ember-fang#played' }, lift: 0 };
    state.selected = 2;
    state.log = [
      'Sable struck with Tide Surge for 4.',
      'You answered with Ember Fang for 5.',
      'Turn 4 — your move. Chain the same wind for +2!',
    ];
  } else if (shot === 'win') {
    state.rival.life = 0;
    state.player.life = 17;
    state.turn = 7;
    state.winner = 'player';
    state.screen = 'end';
    state.phase = 'anim';
    state.confetti = [];
    const colors = ['#ffd24d', '#e5484d', '#3e8ef7', '#46a758', '#f472b6'];
    for (let i = 0; i < 90; i++) {
      state.confetti.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vy: 2 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 2,
        color: colors[i % colors.length],
      });
    }
  } else if (shot === 'loss') {
    state.player.life = 0;
    state.rival.life = 11;
    state.turn = 8;
    state.winner = 'rival';
    state.screen = 'end';
    state.phase = 'anim';
  }
}
