// Emberwind Duel — everything the player sees, drawn on one canvas.
// The table, the hands, the cards, the HUD and the title / end screens are
// all painted here from the game state; no image files are loaded, so the
// art is code: gradients, shapes and the four wind sigils.

import { WINDS, EFFECT_LABEL, describeEffect, RESONANCE_BONUS } from './cards.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;
const MAX_MANA_PIPS = 10;

export const CARD_W = 150;
export const CARD_H = 208;
export const RIVAL_CARD_W = 92;
export const RIVAL_CARD_H = 128;

// ---- layout helpers (shared with input.js so clicks land on the cards) ----

export function playerCardRect(index, total, selectedIndex, hoverIndex) {
  const gap = Math.min(164, (VIEW_W - 260) / Math.max(1, total));
  const startX = VIEW_W / 2 - ((total - 1) * gap) / 2 - CARD_W / 2;
  const x = startX + index * gap;
  let y = VIEW_H - CARD_H - 18;
  if (index === selectedIndex) y -= 34;
  else if (index === hoverIndex) y -= 16;
  return { x, y, w: CARD_W, h: CARD_H };
}

export function rivalCardRect(index, total) {
  const gap = 100;
  const startX = VIEW_W / 2 - ((total - 1) * gap) / 2 - RIVAL_CARD_W / 2;
  return { x: startX + index * gap, y: 108, w: RIVAL_CARD_W, h: RIVAL_CARD_H };
}

export function endTurnRect() {
  return { x: VIEW_W - 210, y: VIEW_H / 2 - 34, w: 170, h: 68 };
}

export function playButtonRect() {
  // Under END TURN on the right edge, clear of the hand and the table.
  return { x: VIEW_W - 210, y: VIEW_H / 2 + 50, w: 170, h: 56 };
}

// ---- small drawing tools ----

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWindSigil(ctx, windKey, cx, cy, size) {
  const wind = WINDS[windKey];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = wind.color;
  ctx.strokeStyle = wind.dark;
  ctx.lineWidth = 2;
  const s = size / 2;
  ctx.beginPath();
  if (wind.shape === 'triangle') {
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.95, s * 0.8);
    ctx.lineTo(-s * 0.95, s * 0.8);
  } else if (wind.shape === 'diamond') {
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.85, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.85, 0);
  } else if (wind.shape === 'square') {
    ctx.rect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6);
  } else {
    // droplet
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.9, -s * 0.1, s * 0.75, s * 0.7, 0, s * 0.85);
    ctx.bezierCurveTo(-s * 0.75, s * 0.7, -s * 0.9, -s * 0.1, 0, -s);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawLifeBar(ctx, x, y, w, life, maxLife, shield, alignRight) {
  const h = 22;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, x, y, w, h, 11);
  ctx.fill();
  const frac = Math.max(0, life / maxLife);
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#ff5d5d');
  grad.addColorStop(1, '#ff9a3d');
  ctx.fillStyle = grad;
  roundRect(ctx, x + 2, y + 2, Math.max(0, (w - 4) * frac), h - 4, 9);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = alignRight ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  const label = `♥ ${life} / ${maxLife}` + (shield > 0 ? `   🛡 ${shield}` : '');
  ctx.fillText(label, alignRight ? x + w - 10 : x + 10, y + h / 2 + 1);
  ctx.restore();
}

function drawPlayerMana(ctx, player) {
  // Right column, above END TURN: two rows of five pips, clear of the hand.
  const x0 = VIEW_W - 210;
  ctx.save();
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#cfe8ff';
  ctx.fillText('YOUR MANA', x0, 246);
  for (let i = 0; i < MAX_MANA_PIPS; i++) {
    const cx = x0 + 14 + (i % 5) * 26;
    const cy = 268 + Math.floor(i / 5) * 26;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    if (i < player.mana) {
      ctx.fillStyle = '#4db2ff';
      ctx.fill();
      ctx.strokeStyle = '#bfe4ff';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    }
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Deck ${player.deck.length}  •  Discard ${player.discard.length}`, x0, 312);
  ctx.restore();
}

function drawManaPips(ctx, x, y, mana, maxMana) {
  ctx.save();
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#cfe8ff';
  ctx.fillText('MANA', x, y);
  for (let i = 0; i < maxMana; i++) {
    const cx = x + 58 + i * 26;
    ctx.beginPath();
    ctx.arc(cx, y, 9, 0, Math.PI * 2);
    if (i < mana) {
      ctx.fillStyle = '#4db2ff';
      ctx.fill();
      ctx.strokeStyle = '#bfe4ff';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    }
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

// ---- cards ----

export function drawCardFace(ctx, card, rect, opts = {}) {
  const { x, y, w, h } = rect;
  const wind = WINDS[card.wind];
  const playable = opts.playable !== false;
  const dim = !playable;
  ctx.save();
  if (opts.lift) ctx.translate(0, opts.lift);
  if (opts.tilt) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(opts.tilt);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#fffdf5');
  body.addColorStop(1, '#f3ead2');
  ctx.fillStyle = body;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = opts.selected ? 5 : 3;
  ctx.strokeStyle = opts.selected ? '#ffd24d' : wind.dark;
  ctx.stroke();
  ctx.fillStyle = wind.color;
  roundRect(ctx, x + 6, y + 6, w - 12, 52, 10);
  ctx.fill();
  // cost gem, top-left
  ctx.fillStyle = '#2b6cb0';
  ctx.beginPath();
  ctx.arc(x + 24, y + 32, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#bfe4ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.cost), x + 24, y + 33);
  // wind sigil + name
  drawWindSigil(ctx, card.wind, x + w / 2, y + 84, 44);
  ctx.fillStyle = '#2a2118';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(card.name, x + w / 2, y + 122);
  ctx.fillStyle = wind.dark;
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText(wind.label.toUpperCase() + ' WIND', x + w / 2, y + 141);
  // effect line
  ctx.fillStyle = '#fff';
  ctx.fillStyle = wind.light;
  roundRect(ctx, x + 10, y + 152, w - 20, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#2a2118';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(`${EFFECT_LABEL[card.effect]} ${card.power}`, x + w / 2, y + 166);
  ctx.fillStyle = '#6b5d4f';
  ctx.font = 'italic 11px Georgia, serif';
  ctx.fillText(card.blurb, x + w / 2, y + 192);
  if (dim) {
    ctx.fillStyle = 'rgba(40,30,20,0.45)';
    roundRect(ctx, x, y, w, h, 14);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('NOT ENOUGH MANA', x + w / 2, y + h / 2);
  }
  ctx.restore();
}

export function drawCardBack(ctx, rect, tilt = 0) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#3a2b5c');
  body.addColorStop(1, '#1d1433');
  ctx.fillStyle = body;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#c9a86a';
  ctx.lineWidth = 2;
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 8);
  ctx.stroke();
  drawWindSigil(ctx, 'flame', x + w / 2, y + h / 2 - 8, 34);
  ctx.fillStyle = '#c9a86a';
  ctx.font = 'bold 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBERWIND', x + w / 2, y + h - 16);
  ctx.restore();
}

// ---- the table ----

function drawTable(ctx, state) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#14532d');
  g.addColorStop(0.5, '#166534');
  g.addColorStop(1, '#052e16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // felt pattern: faint rings
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  for (let r = 60; r < 700; r += 90) {
    ctx.beginPath();
    ctx.arc(VIEW_W / 2, VIEW_H / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  // wooden rim
  ctx.strokeStyle = '#5b3a1e';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, VIEW_W - 16, VIEW_H - 16);
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, VIEW_W - 36, VIEW_H - 36);
  // centre emblem
  ctx.save();
  ctx.globalAlpha = 0.14;
  drawWindSigil(ctx, 'flame', VIEW_W / 2, VIEW_H / 2 + 6, 190);
  ctx.restore();
}

function drawFighter(ctx, fighter, x, y, isRival, state) {
  ctx.save();
  ctx.textBaseline = 'middle';
  // portrait medallion
  const grad = ctx.createRadialGradient(x, y, 4, x, y, 34);
  if (isRival) {
    grad.addColorStop(0, '#7c3aed');
    grad.addColorStop(1, '#2e1065');
  } else {
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(1, '#78350f');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd24d';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(isRival ? 'S' : 'Y', x, y + 2);
  // name + life
  ctx.textAlign = isRival ? 'left' : 'left';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(fighter.name, x + 46, y - 14);
  drawLifeBar(ctx, x + 46, y + 4, 300, fighter.life, fighter.maxLife, fighter.shield, false);
  ctx.restore();
}

function drawFloaters(ctx, floaters) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const f of floaters) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillStyle = f.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 4;
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
}

function drawLog(ctx, lines) {
  // Centred under the telegraph, clear of the played card (left) and hand.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const shown = lines.slice(-3);
  shown.forEach((line, i) => {
    ctx.globalAlpha = 0.55 + i * 0.22;
    ctx.fillText(line, VIEW_W / 2, 292 + i * 22);
  });
  ctx.restore();
}

// ---- screens ----

export function drawTitle(ctx, state) {
  drawTable(ctx, state);
  ctx.save();
  ctx.textAlign = 'center';
  // sigils row
  ['flame', 'wave', 'leaf', 'stone'].forEach((w, i) => {
    drawWindSigil(ctx, w, VIEW_W / 2 - 150 + i * 100, 130, 64);
  });
  ctx.fillStyle = '#ffd24d';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 6;
  ctx.strokeText('EMBERWIND', VIEW_W / 2, 250);
  ctx.fillText('EMBERWIND', VIEW_W / 2, 250);
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 34px Georgia, serif';
  ctx.fillText('— Duel of the Four Winds —', VIEW_W / 2, 305);
  ctx.font = '19px Georgia, serif';
  ctx.fillStyle = '#d9f99d';
  ctx.fillText('Outwit Sable the Stormcaller. Play cards, chain the same wind,', VIEW_W / 2, 360);
  ctx.fillText('and bring her life to zero before she brings yours down.', VIEW_W / 2, 386);
  // sample cards fanned on the table
  const sample = state.sampleCards || [];
  sample.forEach((card, i) => {
    const rect = { x: VIEW_W / 2 - 330 + i * 170, y: 420, w: CARD_W, h: CARD_H };
    drawCardFace(ctx, card, rect, { tilt: (i - 1.5) * 0.07 });
  });
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('▶  CLICK or press ENTER to begin', VIEW_W / 2, 668);
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('Mouse: click a card, then PLAY  •  Keys: 1–5 select, Enter play, E end turn, M mute', VIEW_W / 2, 696);
  ctx.restore();
}

export function drawPlay(ctx, state) {
  drawTable(ctx, state);
  const { player, rival } = state;
  // rival corner
  drawFighter(ctx, rival, 70, 60, true, state);
  drawManaPips(ctx, 70, 106, rival.mana, rival.maxMana);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Deck ${rival.deck.length}  •  Discard ${rival.discard.length}`, 70, 130);
  ctx.restore();
  // player corner
  drawFighter(ctx, player, 70, VIEW_H - 60, false, state);
  drawPlayerMana(ctx, player);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Turn ${state.turn}  •  ${state.phase === 'player' ? 'Your move' : 'Sable is thinking…'}`, 70, 470);
  ctx.restore();
  // rival hand (face down)
  rival.hand.forEach((card, i) => {
    drawCardBack(ctx, rivalCardRect(i, rival.hand.length), (i - rival.hand.length / 2) * 0.03);
  });
  // telegraph
  if (state.telegraph && state.phase === 'rival') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'italic bold 19px Georgia, serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText(state.telegraph, VIEW_W / 2, 262);
    ctx.restore();
  }
  // centre: last played card, offset left so it never covers the hand
  if (state.lastPlayed) {
    const rect = { x: VIEW_W / 2 - CARD_W / 2 - 260, y: 272, w: CARD_W, h: CARD_H };
    drawCardFace(ctx, state.lastPlayed.card, rect, { lift: state.lastPlayed.lift || 0 });
  }
  drawLog(ctx, state.log);
  // player hand
  player.hand.forEach((card, i) => {
    const rect = playerCardRect(i, player.hand.length, state.selected, state.hover);
    // Cards only grey out while it is the player's turn and mana is short;
    // on the end screens (or the rival's turn) they show at full colour.
    const playable = state.phase !== 'player' || card.cost <= player.mana;
    drawCardFace(ctx, card, rect, {
      selected: i === state.selected,
      playable,
      lift: state.playAnim && state.playAnim.uid === card.uid ? state.playAnim.lift : 0,
    });
  });
  // play + end turn buttons
  if (state.phase === 'player' && state.selected >= 0) {
    const b = playButtonRect();
    ctx.save();
    ctx.fillStyle = '#ffd24d';
    roundRect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#8a5a12';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3a2a00';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶ PLAY', b.x + b.w / 2, b.y + b.h / 2 + 1);
    ctx.restore();
  }
  const e = endTurnRect();
  ctx.save();
  ctx.fillStyle = state.phase === 'player' ? '#e5484d' : 'rgba(255,255,255,0.25)';
  roundRect(ctx, e.x, e.y, e.w, e.h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('END TURN ⏎', e.x + e.w / 2, e.y + e.h / 2 + 1);
  ctx.font = '13px Georgia, serif';
  ctx.fillText('press E', e.x + e.w / 2, e.y + e.h + 18);
  ctx.restore();
  // resonance hint
  if (state.resonanceHint) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillStyle = '#ffd24d';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 4;
    ctx.strokeText(state.resonanceHint, VIEW_W / 2, 285);
    ctx.fillText(state.resonanceHint, VIEW_W / 2, 285);
    ctx.restore();
  }
  drawFloaters(ctx, state.floaters);
}

export function drawEnd(ctx, state) {
  drawPlay(ctx, state);
  ctx.save();
  ctx.fillStyle = state.winner === 'player' ? 'rgba(20,60,20,0.72)' : 'rgba(60,10,10,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  if (state.winner === 'player') {
    ctx.fillStyle = '#ffd24d';
    ctx.font = 'bold 88px Georgia, serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 6;
    ctx.strokeText('VICTORY!', VIEW_W / 2, 300);
    ctx.fillText('VICTORY!', VIEW_W / 2, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Georgia, serif';
    ctx.fillText('The four winds bow to you. Sable is beaten —', VIEW_W / 2, 360);
    ctx.fillText(`in ${state.turn} turns, with ${state.player.life} life to spare.`, VIEW_W / 2, 392);
  } else {
    ctx.fillStyle = '#ff8a8a';
    ctx.font = 'bold 88px Georgia, serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 6;
    ctx.strokeText('DEFEAT', VIEW_W / 2, 300);
    ctx.fillText('DEFEAT', VIEW_W / 2, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Georgia, serif';
    ctx.fillText('Sable the Stormcaller takes the table this time.', VIEW_W / 2, 360);
    ctx.fillText('Shuffle the deck and challenge her again.', VIEW_W / 2, 392);
  }
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillStyle = '#ffd24d';
  ctx.fillText('▶  CLICK or press ENTER to play again', VIEW_W / 2, 470);
  ctx.restore();
  // confetti on victory
  if (state.winner === 'player' && state.confetti) {
    ctx.save();
    for (const c of state.confetti) {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, 8, 12);
    }
    ctx.restore();
  }
}

export function describeState(state) {
  if (state.screen === 'title') return 'Title screen: Emberwind Duel. Press Enter to begin.';
  if (state.screen === 'end') {
    return state.winner === 'player'
      ? `Victory! You beat Sable in ${state.turn} turns.`
      : 'Defeat. Sable beat you. Press Enter to play again.';
  }
  return `Turn ${state.turn}. Your life ${state.player.life}, Sable ${state.rival.life}. Mana ${state.player.mana}.`;
}
