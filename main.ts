// LUMENFALL — entrypoint for the best-game-01 submission (Node 22, standard library only).
//
// What this program does, in plain terms:
//   1. It sanity-checks the LUMENFALL game tree that sits beside this file, so a broken
//      or incomplete checkout fails loudly here instead of inside the grader.
//   2. It copies the playable game (game/, plain static files a desktop browser loads
//      fully offline) and the four screenshots into the output directory.
//   3. It writes dossier.json into that output directory with the vendored make.fun
//      library, using exactly the scorer's caps, so the dossier the judge reads is
//      byte-for-byte the one the scorer rebuilds from the same tree.
//
// LUMENFALL itself is a canvas arena survival game: a lantern-keeper spirit defends a
// night garden against waves of ink moths and blobs, meets the Great Moth boss every
// fifth wave, and gathers light motes to heal and embers to fire faster. All of its
// sound is synthesised in the browser with WebAudio; there is no library, no build
// step and no network request anywhere in game/.
//
// Run it the way the grader does, or locally with an output override:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game itself locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ENTRY_TITLE = 'LUMENFALL';
const EXPECTED_SCREENSHOTS = ['1-title.jpg', '2-play.jpg', '3-results.jpg', '4-boss.jpg'];
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail early, with a message that names the missing piece, when the tree beside this
// file is not the complete LUMENFALL entry: the grader can only judge what is here.
function checkEntryTree(root) {
  const gameDir = join(root, 'game');
  if (!existsSync(join(gameDir, 'index.html'))) {
    throw new Error(`${ENTRY_TITLE}: game/index.html is missing, so there is nothing to hand in`);
  }
  const shotsDir = join(root, 'screenshots');
  const shots = existsSync(shotsDir) ? readdirSync(shotsDir).sort() : [];
  if (shots.length < 3 || shots.length > DOSSIER_CAPS.screenshots.max) {
    throw new Error(`${ENTRY_TITLE}: expected 3 or 4 screenshots, found ${shots.length}`);
  }
  for (const name of EXPECTED_SCREENSHOTS) {
    if (!shots.includes(name)) throw new Error(`${ENTRY_TITLE}: screenshot ${name} is missing`);
    const bytes = statSync(join(shotsDir, name)).size;
    if (bytes > DOSSIER_CAPS.screenshots.max_bytes) {
      throw new Error(`${ENTRY_TITLE}: screenshot ${name} is ${bytes} bytes, over the 256 KiB cap`);
    }
  }
  return shots;
}

const screenshots = checkEntryTree(here);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The caps below are the scorer's own (reference/gate.json): only text_max_bytes
// shapes the dossier bytes; the rest make this program refuse, in the same places
// the scorer would refuse, an entry with too many or too large screenshots or game
// files, or a game path that is too long for the output directory's own entry cap.
writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_CAPS));

console.log(`${ENTRY_TITLE}: handed in game/ with ${screenshots.length} screenshots and dossier.json to ${out}`);
