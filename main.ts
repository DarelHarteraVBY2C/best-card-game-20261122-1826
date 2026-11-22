// Emberwind Duel — the entry program (Node 22, standard library only).
//
// This program hands the game in. It takes the repository's own game/
// folder and screenshots/ folder, copies them into the output directory
// the grader provides, and writes dossier.json there with the vendored
// make.fun library, so the judge can read the game and its screenshots.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The folder this file lives in is the repository root.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The grader writes to /output; a local run uses MAKEFUN_OUTPUT_DIR.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Refuse to hand in a half-built entry: the game folder, its entry page
// and the screenshots must all be present before anything is copied.
const gameDir = join(repoRoot, 'game');
const shotDir = join(repoRoot, 'screenshots');
for (const required of [join(gameDir, 'index.html'), shotDir]) {
  if (!existsSync(required)) {
    throw new Error(`Emberwind Duel is missing its hand-in file: ${required}`);
  }
}

mkdirSync(outputDir, { recursive: true });

// The playable game: plain static files under game/.
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });

// The screenshots, real renders of the game's own code.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
cpSync(shotDir, join(outputDir, 'screenshots'), { recursive: true });

// The dossier: the judge's view of the game, built by the kit's library.
// The caps mirror the gate's own limits (at most 4 screenshots, each at
// most 256 KiB; game/ at most 993 files and 48 MiB; paths at most 1000
// bytes; dossier text at most 160 KiB), so an entry this program writes
// is one the gate accepts on those rows.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// A short summary on stdout so a local run shows what was handed in.
function countFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    total += entry.isDirectory() ? countFiles(join(dir, entry.name)) : 1;
  }
  return total;
}
const shotCount = readdirSync(join(outputDir, 'screenshots')).length;
const shotBytes = readdirSync(join(outputDir, 'screenshots')).reduce(
  (sum, name) => sum + statSync(join(outputDir, 'screenshots', name)).size,
  0,
);
console.log(
  `Emberwind Duel handed in: ${countFiles(join(outputDir, 'game'))} game files, ` +
    `${shotCount} screenshots (${shotBytes} bytes), ` +
    `dossier.json (${dossier.length} bytes) -> ${outputDir}`,
);
