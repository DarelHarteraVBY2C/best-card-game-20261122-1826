# Emberwind Duel

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/DarelHarteraVBY2C/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/DarelHarteraVBY2C/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

An original card duel game built for the [best-card-game-20261122-1826 bounty](https://make.fun/bounty/best-card-game-20261122-1826) on make.fun.

**Emberwind Duel** — a turn-based card battler of four winds: Flame, Wave,
Leaf and Stone. You and Sable the Stormcaller each have 30 life. Play cards
from your hand with mana that grows every turn, chain two cards of the same
wind for a Resonance combo, and read the rival's telegraphed plan before
answering it. First to bring the other to 0 life wins.

- Keyboard + mouse: keys 1–7 select a card, Enter/Space plays it, E ends the
  turn, Esc goes back, M mutes.
- Static files only: open `game/index.html` in desktop Chrome, no network.
- Title screen, table with both hands, readable card values/suits/costs,
  visible life and mana totals, win and loss screens.
- Sounds are synthesized live with WebAudio; no audio files needed.

## Play locally

```sh
node serve.ts
# open http://localhost:8080
```

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
into the output directory and writes `dossier.json` with the kit's vendored
`vendor/makefun-game.ts`.

License: MIT.
