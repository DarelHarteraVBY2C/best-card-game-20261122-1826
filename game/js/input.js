// Emberwind Duel — mouse and keyboard input.
// Clicks are translated from page pixels into the 1280x720 view the canvas
// draws in, then tested against the same layout helpers render.js uses,
// so a click lands on exactly the card the player sees.

import { playerCardRect, endTurnRect, playButtonRect, VIEW_W, VIEW_H } from './render.js';

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function attachInput(canvas, game) {
  function toView(event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * VIEW_W,
      y: ((event.clientY - box.top) / box.height) * VIEW_H,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = toView(event);
    game.onHover(p.x, p.y);
  });

  canvas.addEventListener('click', (event) => {
    const p = toView(event);
    game.onClick(p.x, p.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key >= '1' && key <= '7') {
      game.selectCard(Number(key) - 1);
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      game.confirm();
    } else if (key === 'e' || key === 'E') {
      game.endTurn();
    } else if (key === 'Escape') {
      game.cancel();
    } else if (key === 'm' || key === 'M') {
      game.toggleMute();
    }
  });
}

// Hit-test a view point against the player's hand; returns the card index
// or -1. Cards are tested topmost-first (rightmost overlaps the left).
export function hitPlayerCard(x, y, state) {
  const total = state.player.hand.length;
  for (let i = total - 1; i >= 0; i--) {
    const rect = playerCardRect(i, total, state.selected, state.hover);
    if (pointInRect(x, y, rect)) return i;
  }
  return -1;
}

export function hitEndTurn(x, y) {
  return pointInRect(x, y, endTurnRect());
}

export function hitPlayButton(x, y) {
  return pointInRect(x, y, playButtonRect());
}
