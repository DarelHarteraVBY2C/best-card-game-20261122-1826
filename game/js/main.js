// Emberwind Duel — game state, turns and rules.
// Owns the match: life, mana, hands, the turn loop, card effects, the
// resonance combo, the rival's turn, and the win / loss screens. Rendering
// lives in render.js, input in input.js; this file only decides what happens.

import { CARD_DEFS, RESONANCE_BONUS, describeEffect } from './cards.js';
import { buildDeck, shuffleDeck, drawCards, START_HAND } from './deck.js';
import { planRivalTurn, telegraphFor, RIVAL_NAME } from './opponent.js';
import { attachInput, hitPlayerCard, hitEndTurn, hitPlayButton } from './input.js';
import { drawTitle, drawPlay, drawEnd, describeState, VIEW_W, VIEW_H } from './render.js';
import { applyShot } from './shots.js';
import {
  ensureAudio, playCardSound, strikeSound, healSound, guardSound,
  drawSound, comboSound, turnSound, winFanfare, lossSound, toggleMute,
} from './audio.js';

export const MAX_LIFE = 30;
export const MAX_MANA = 10;

function makeFighter(name, isRival) {
  return {
    name,
    life: MAX_LIFE,
    maxLife: MAX_LIFE,
    shield: 0,
    mana: 0,
    maxMana: 0,
    deck: [],
    discard: [],
    hand: [],
    isRival,
  };
}

function newMatch(random) {
  const player = makeFighter('You', false);
  const rival = makeFighter(RIVAL_NAME, true);
  player.deck = shuffleDeck(buildDeck(), random);
  rival.deck = shuffleDeck(buildDeck(), random);
  drawCards(player.hand, player.deck, player.discard, START_HAND, random);
  drawCards(rival.hand, rival.deck, rival.discard, START_HAND, random);
  return { player, rival };
}

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const state = {
    screen: 'title', // title | play | end
    phase: 'player', // player | rival | anim
    turn: 1,
    player: makeFighter('You', false),
    rival: makeFighter(RIVAL_NAME, true),
    selected: -1,
    hover: -1,
    lastPlayed: null,
    lastWind: null,
    log: ['Welcome to the table. The winds are yours to command.'],
    floaters: [],
    confetti: [],
    telegraph: '',
    resonanceHint: '',
    winner: null,
    random: Math.random,
    sampleCards: CARD_DEFS.filter((c) => ['ember-storm', 'tide-spring', 'grove-canopy', 'crag-avalanche'].includes(c.id)),
    rivalPlan: [],
    timers: [],
  };

  function log(line) {
    state.log.push(line);
    if (state.log.length > 6) state.log.shift();
  }

  function floater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 1.4 });
  }

  function startMatch() {
    const match = newMatch(state.random);
    state.player = match.player;
    state.rival = match.rival;
    state.turn = 1;
    state.screen = 'play';
    state.phase = 'player';
    state.selected = -1;
    state.hover = -1;
    state.lastPlayed = null;
    state.lastWind = null;
    state.log = ['Turn 1 — your move. Mana grows every turn.'];
    state.floaters = [];
    state.confetti = [];
    state.telegraph = '';
    state.resonanceHint = '';
    state.winner = null;
    beginPlayerTurn();
    announce();
  }

  function beginPlayerTurn() {
    const p = state.player;
    p.maxMana = Math.min(MAX_MANA, state.turn);
    p.mana = p.maxMana;
    const drawn = drawCards(p.hand, p.deck, p.discard, 1, state.random);
    if (drawn === 0) {
      // Fatigue: an empty deck and discard costs 2 life.
      p.life = Math.max(0, p.life - 2);
      log('Your deck is empty — fatigue costs 2 life.');
    }
    state.lastWind = null;
    state.phase = 'player';
    turnSound();
    checkEnd();
  }

  function applyCardEffect(actor, target, card, power) {
    const cx = VIEW_W / 2;
    if (card.effect === 'strike') {
      let dmg = power;
      if (target.shield > 0) {
        const absorbed = Math.min(target.shield, dmg);
        target.shield -= absorbed;
        dmg -= absorbed;
      }
      target.life = Math.max(0, target.life - dmg);
      floater(cx, 330, `-${dmg}`, '#ff5d5d');
      strikeSound();
      log(`${actor.name} strikes with ${card.name} for ${power}.`);
    } else if (card.effect === 'guard') {
      actor.shield += power;
      floater(cx, 330, `+${power} shield`, '#7dd3fc');
      guardSound();
      log(`${actor.name} raises ${power} shield.`);
    } else if (card.effect === 'mend') {
      actor.life = Math.min(actor.maxLife, actor.life + power);
      floater(cx, 330, `+${power} life`, '#4ade80');
      healSound();
      log(`${actor.name} mends ${power} life.`);
    } else if (card.effect === 'draw') {
      const n = drawCards(actor.hand, actor.deck, actor.discard, power, state.random);
      floater(cx, 330, `+${n} cards`, '#facc15');
      drawSound();
      log(`${actor.name} draws ${n} card${n === 1 ? '' : 's'}.`);
    }
  }

  function playCard(actor, target, card) {
    const idx = actor.hand.findIndex((c) => c.uid === card.uid);
    if (idx === -1) return false;
    if (card.cost > actor.mana) return false;
    actor.mana -= card.cost;
    actor.hand.splice(idx, 1);
    actor.discard.push(card);
    let power = card.power;
    let resonated = false;
    if (state.lastWind === card.wind) {
      power += RESONANCE_BONUS;
      resonated = true;
    }
    state.lastWind = card.wind;
    state.lastPlayed = { card, lift: 0 };
    state.resonanceHint = resonated ? `RESONANCE! ${card.name} +${RESONANCE_BONUS}` : '';
    if (resonated) comboSound();
    else playCardSound();
    applyCardEffect(actor, target, card, power);
    if (state.selected >= actor.hand.length) state.selected = -1;
    return true;
  }

  function checkEnd() {
    if (state.player.life <= 0 || state.rival.life <= 0) {
      state.winner = state.player.life > 0 ? 'player' : 'rival';
      state.screen = 'end';
      state.phase = 'anim';
      state.selected = -1;
      if (state.winner === 'player') {
        winFanfare();
        spawnConfetti();
        log(`Victory in ${state.turn} turns!`);
      } else {
        lossSound();
        log('Sable takes the table.');
      }
      announce();
      return true;
    }
    return false;
  }

  function spawnConfetti() {
    const colors = ['#ffd24d', '#e5484d', '#3e8ef7', '#46a758', '#f472b6'];
    state.confetti = [];
    for (let i = 0; i < 90; i++) {
      state.confetti.push({
        x: Math.random() * VIEW_W,
        y: -20 - Math.random() * 200,
        vy: 2 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 2,
        color: colors[i % colors.length],
      });
    }
  }

  function endPlayerTurn() {
    if (state.screen !== 'play' || state.phase !== 'player') return;
    state.phase = 'rival';
    state.selected = -1;
    state.resonanceHint = '';
    const rival = state.rival;
    rival.maxMana = Math.min(MAX_MANA, state.turn);
    rival.mana = rival.maxMana;
    drawCards(rival.hand, rival.deck, rival.discard, 1, state.random);
    state.rivalPlan = planRivalTurn(rival, state.player);
    state.telegraph = telegraphFor(state.rivalPlan, rival.hand);
    log(`Sable's turn — ${state.telegraph.toLowerCase()}`);
    announce();
    runRivalPlan(0);
  }

  function runRivalPlan(step) {
    if (state.screen !== 'play') return;
    if (step >= state.rivalPlan.length) {
      state.telegraph = '';
      state.turn += 1;
      log(`Turn ${state.turn} — your move.`);
      beginPlayerTurn();
      announce();
      return;
    }
    const uid = state.rivalPlan[step];
    const card = state.rival.hand.find((c) => c.uid === uid);
    if (card) playCard(state.rival, state.player, card);
    if (checkEnd()) return;
    const timer = setTimeout(() => runRivalPlan(step + 1), 900);
    state.timers.push(timer);
  }

  function announce() {
    const el = document.getElementById('status');
    if (el) el.textContent = describeState(state);
  }

  // ---- input handlers handed to input.js ----

  const game = {
    onHover(x, y) {
      if (state.screen !== 'play') return;
      state.hover = hitPlayerCard(x, y, state);
    },
    onClick(x, y) {
      ensureAudio();
      if (state.screen === 'title') {
        startMatch();
        return;
      }
      if (state.screen === 'end') {
        startMatch();
        return;
      }
      if (state.phase !== 'player') return;
      if (hitEndTurn(x, y)) {
        endPlayerTurn();
        return;
      }
      if (state.selected >= 0 && hitPlayButton(x, y)) {
        playSelected();
        return;
      }
      const idx = hitPlayerCard(x, y, state);
      if (idx >= 0) {
        state.selected = state.selected === idx ? -1 : idx;
        playCardSound();
      } else {
        state.selected = -1;
      }
    },
    selectCard(i) {
      if (state.screen === 'title' || state.screen === 'end') return;
      if (i < state.player.hand.length) {
        state.selected = state.selected === i ? -1 : i;
      }
    },
    confirm() {
      ensureAudio();
      if (state.screen === 'title' || state.screen === 'end') {
        startMatch();
        return;
      }
      if (state.phase === 'player') playSelected();
    },
    endTurn() {
      endPlayerTurn();
    },
    cancel() {
      state.selected = -1;
    },
    toggleMute() {
      toggleMute();
    },
  };

  function playSelected() {
    if (state.selected < 0 || state.selected >= state.player.hand.length) return;
    const card = state.player.hand[state.selected];
    if (card.cost > state.player.mana) {
      log(`Not enough mana for ${card.name} (${card.cost} needed).`);
      return;
    }
    state.selected = -1;
    playCard(state.player, state.rival, card);
    checkEnd();
    announce();
  }

  // ---- render loop ----

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // floaters drift up and fade
    for (const f of state.floaters) {
      f.y -= 34 * dt;
      f.life -= dt;
    }
    state.floaters = state.floaters.filter((f) => f.life > 0);
    if (state.resonanceHint) {
      state.resonanceHintLife = (state.resonanceHintLife || 1.6) - dt;
      if (state.resonanceHintLife <= 0) {
        state.resonanceHint = '';
        state.resonanceHintLife = 1.6;
      }
    }
    for (const c of state.confetti) {
      c.y += c.vy * 60 * dt;
      c.x += c.vx * 60 * dt;
      if (c.y > VIEW_H + 20) c.y = -20;
    }
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (state.screen === 'title') drawTitle(ctx, state);
    else if (state.screen === 'end') drawEnd(ctx, state);
    else drawPlay(ctx, state);
    requestAnimationFrame(frame);
  }

  function fitCanvas() {
    const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
    canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  attachInput(canvas, game);
  applyShot(state, startMatch);
  requestAnimationFrame(frame);
  announce();
  return game;
}

// Boot: the page's single module script creates the game.
const canvas = document.getElementById('game');
if (canvas) createGame(canvas);
