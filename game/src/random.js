// A small deterministic PRNG (mulberry32) so staged scenes and world layouts
// are identical for a given seed, plus the range/pick helpers the game uses.

export function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (min, max) => min + next() * (max - min);
  next.int = (min, max) => Math.floor(next.range(min, max + 1));
  next.chance = (p) => next() < p;
  next.pick = (list) => list[Math.floor(next() * list.length) % list.length];
  next.sign = () => (next() < 0.5 ? -1 : 1);
  return next;
}
