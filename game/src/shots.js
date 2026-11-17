// Staged scenes behind ?shot=start|play|boss|end&seed=N, used to capture the
// screenshots. Each scene resets the world with the seed and plays the real
// rules forward with a deterministic autopilot, so the same seed always
// produces the same frame and the frame is honest gameplay.

import { FIELD, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const IDLE = { moveX: 0, moveY: 0, aimX: FIELD.width / 2, aimY: 0, firing: false, dash: false };

function nearest(list, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const item of list) {
    const d = (item.x - x) ** 2 + (item.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = item;
    }
  }
  return best;
}

/** A competent keeper: keeps its distance, gathers light when hurt, aims at the nearest shade. */
function pilot(world) {
  const p = world.player;
  let mx = 0;
  let my = 0;
  for (const e of world.enemies) {
    const dx = p.x - e.x;
    const dy = p.y - e.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 170) {
      const w = ((170 - dist) / 170) * 1.7;
      mx += (dx / dist) * w;
      my += (dy / dist) * w;
    }
  }
  const hurt = p.hp < 78;
  const pk = nearest(world.pickups, p.x, p.y);
  if (hurt && pk) {
    mx += (pk.x - p.x) / (Math.hypot(pk.x - p.x, pk.y - p.y) || 1) * 1.25;
    my += (pk.y - p.y) / (Math.hypot(pk.x - p.x, pk.y - p.y) || 1) * 1.25;
  } else {
    const orbitX = FIELD.width / 2 + Math.cos(world.time * 0.32) * 190;
    const orbitY = FIELD.height / 2 + Math.sin(world.time * 0.32) * 120;
    mx += (orbitX - p.x) / 300;
    my += (orbitY - p.y) / 300;
  }
  const target = world.boss ?? nearest(world.enemies, p.x, p.y);
  const close = nearest(world.enemies, p.x, p.y);
  const dash = close && Math.hypot(close.x - p.x, close.y - p.y) < 74 && p.dashCd <= 0;
  return {
    moveX: Math.max(-1, Math.min(1, mx)),
    moveY: Math.max(-1, Math.min(1, my)),
    aimX: target ? target.x : p.x + 100,
    aimY: target ? target.y : p.y,
    firing: world.enemies.length > 0,
    dash: Boolean(dash),
  };
}

/** A keeper who fights from where it stands but never steps aside: it clears
 * some shades, then the swarm closes in — a short, honest first game. */
function doomed(world) {
  const target = nearest(world.enemies, world.player.x, world.player.y);
  return {
    ...IDLE,
    aimX: target ? target.x : world.player.x + 120,
    aimY: target ? target.y : world.player.y - 40,
    firing: Boolean(target),
  };
}

const SNAP_FIELDS = [
  'seed', 'time', 'score', 'kills', 'wave', 'over', 'player', 'bullets',
  'enemies', 'pickups', 'particles', 'floaters', 'fireflies', 'banner',
  'wavePhase', 'spawnLeft', 'spawnT', 'restT', 'shake', 'holdWaves',
];

/** Deep-copy the world's data (not its rng or methods) for a later restore. */
function snapshot(world) {
  const snap = {};
  for (const field of SNAP_FIELDS) snap[field] = structuredClone(world[field]);
  return snap;
}

function restore(world, snap) {
  for (const field of SNAP_FIELDS) world[field] = snap[field];
  world.boss = world.enemies.find((e) => e.kind === 'greatmoth') ?? null;
  world.events = [];
}

function run(world, seconds, ctlFn) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, ctlFn(world));
    if (world.over) break;
  }
}

/**
 * Stage the named scene in `world` and return the screen to draw over it
 * plus the best score the results screen should show.
 */
export function stageShot(name, world, seed) {
  world.reset(seed);
  if (name === 'play') {
    // Play a full stretch with the pilot, scoring every frame after the
    // opening seconds, and keep the busiest honest mid-fight moment: shades
    // inside the garden, some close, light in the air, no banner, and —
    // mildly preferred — an ordinary wave rather than the boss wave.
    let snap = null;
    let snapScore = -Infinity;
    const total = Math.floor(42 / STEP);
    for (let i = 0; i < total; i += 1) {
      world.step(STEP, pilot(world));
      if (world.over) break;
      if (world.time < 9) continue;
      const p = world.player;
      const vis = world.enemies.filter(
        (e) => e.x > 30 && e.x < FIELD.width - 30 && e.y > 30 && e.y < FIELD.height - 30,
      );
      const nearCount = vis.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) < 380).length;
      let s = vis.length * 2 + nearCount * 3 + Math.min(world.bullets.length, 6)
        + Math.min(world.particles.length, 12) * 0.2;
      if (world.banner) s -= 8;
      if (world.wave >= 5) s -= 3;
      if (world.wavePhase === 'rest') s -= 4;
      if (s > snapScore) {
        snapScore = s;
        snap = snapshot(world);
      }
    }
    if (snap) restore(world, snap);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'boss') {
    let fought = 0;
    const maxSteps = Math.floor(360 / STEP);
    for (let i = 0; i < maxSteps; i += 1) {
      world.step(STEP, pilot(world));
      if (world.over) break;
      if (world.boss) {
        fought += STEP;
        if (fought >= 5) break;
      }
    }
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    run(world, 900, doomed);
    return { screen: SCREEN_OVER, best: Math.max(world.score, 1) };
  }
  // start (and any unknown name): the garden at rest behind the title, with
  // the keeper waiting down among the stone lanterns, clear of the title.
  world.holdWaves = true;
  run(world, 3, () => IDLE);
  world.player.x = FIELD.width / 2;
  world.player.y = FIELD.height - 58;
  return { screen: SCREEN_TITLE, best: 0 };
}

/** Parse ?shot= and &seed= from a query string. Returns null when not a shot URL. */
export function shotFromQuery(search) {
  const params = new URLSearchParams(search);
  if (!params.has('shot')) return null;
  const seedRaw = Number(params.get('seed'));
  return {
    name: params.get('shot') || 'start',
    seed: Number.isFinite(seedRaw) && seedRaw > 0 ? Math.floor(seedRaw) : 1,
  };
}
