// Emberwind Duel — the rival's brain.
// Sable the Stormcaller plays by rules the player can read and counter:
// she telegraphs her next move, spends mana on the biggest strike she can
// afford when the player is weak, and otherwise guards or mends. Her plan
// is shown on the table before she acts, so the player can answer it.

import { RESONANCE_BONUS } from './cards.js';

export const RIVAL_NAME = 'Sable the Stormcaller';

// Pick the rival's whole turn in advance: a list of card indexes to play,
// in order, plus a one-line telegraph the table shows ("Sable plans: ...").
export function planRivalTurn(rival, player) {
  const plan = [];
  let mana = rival.mana;
  let lastWind = null;
  const hand = rival.hand.slice();
  const used = new Set();

  // Greedy pass: keep taking the best affordable card until mana runs out
  // or the hand offers nothing worth playing.
  while (true) {
    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < hand.length; i++) {
      if (used.has(i)) continue;
      const card = hand[i];
      if (card.cost > mana) continue;
      let score = scoreCard(card, rival, player, lastWind);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx === -1 || bestScore < 1.5) break;
    const card = hand[bestIdx];
    plan.push(card.uid);
    used.add(bestIdx);
    mana -= card.cost;
    lastWind = card.wind;
  }
  return plan;
}

function scoreCard(card, rival, player, lastWind) {
  let score = card.power;
  // Resonance: same wind twice in a row is worth more.
  if (lastWind && lastWind === card.wind) score += RESONANCE_BONUS;
  // Finishing instinct: a strike that ends the game outranks everything.
  if (card.effect === 'strike' && card.power >= player.life + player.shield) score += 100;
  // When hurt, healing and guarding climb in value.
  if (rival.life <= 12) {
    if (card.effect === 'mend') score += 4;
    if (card.effect === 'guard') score += 2;
  }
  // Drawing is cheap filler: useful, never the star of the turn.
  if (card.effect === 'draw') score -= 1;
  // Cheap cards are slightly favoured so mana is rarely wasted.
  score += (4 - card.cost) * 0.25;
  return score;
}

export function telegraphFor(plan, rivalHand) {
  if (plan.length === 0) return 'Sable holds back…';
  const first = rivalHand.find((c) => c.uid === plan[0]);
  if (!first) return 'Sable is scheming…';
  const verbs = {
    strike: 'a heavy strike',
    guard: 'a wall of stone',
    mend: 'a healing tide',
    draw: 'a fresh draw',
  };
  return `Sable plans ${verbs[first.effect]} (${plan.length} card${plan.length > 1 ? 's' : ''})`;
}
