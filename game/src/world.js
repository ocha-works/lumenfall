// The whole simulation: the lantern-keeper, light-mote shots, ink shades,
// pickups, particles and wave progression. Pure state and rules — no drawing,
// no DOM — stepped at a fixed rate by main.js (live) or shots.js (staged).

import { ENEMIES, FIELD, PICKUPS, PLAYER, WAVES } from './config.js';
import { makeRng } from './random.js';

export const EVENT_OVER = 1;

const TAU = Math.PI * 2;

function burst(list, rng, x, y, count, color, speed, life, size) {
  for (let i = 0; i < count; i += 1) {
    const angle = rng() * TAU;
    const v = rng.range(speed * 0.3, speed);
    list.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v,
      life: rng.range(life * 0.5, life),
      maxLife: life,
      size: rng.range(size * 0.5, size),
      color,
      drag: 3.2,
    });
  }
}

export function createWorld() {
  const world = {
    seed: 1,
    rng: makeRng(1),
    time: 0,
    score: 0,
    kills: 0,
    wave: 0,
    over: false,
    events: [],
    player: null,
    bullets: [],
    enemies: [],
    pickups: [],
    particles: [],
    floaters: [],
    fireflies: [],
    banner: null,
    wavePhase: 'rest',
    holdWaves: false,
    spawnLeft: 0,
    spawnT: 0,
    restT: 0,
    boss: null,
    shake: 0,
  };

  function reset(seed) {
    world.seed = seed;
    world.rng = makeRng(seed);
    const rng = world.rng;
    world.time = 0;
    world.score = 0;
    world.kills = 0;
    world.wave = 0;
    world.over = false;
    world.events = [];
    world.bullets = [];
    world.enemies = [];
    world.pickups = [];
    world.particles = [];
    world.floaters = [];
    world.banner = null;
    world.wavePhase = 'rest';
    world.holdWaves = false;
    world.spawnLeft = 0;
    world.spawnT = 0;
    world.restT = 1.2;
    world.boss = null;
    world.shake = 0;
    world.player = {
      x: FIELD.width / 2,
      y: FIELD.height / 2,
      hp: PLAYER.maxHp,
      aim: -Math.PI / 2,
      fireCd: 0,
      dashT: 0,
      dashCd: 0,
      dashDirX: 1,
      dashDirY: 0,
      invulnT: 0,
      emberT: 0,
      hurtT: 0,
      bobPhase: rng() * TAU,
    };
    world.fireflies = [];
    for (let i = 0; i < 42; i += 1) {
      world.fireflies.push({
        x: rng() * FIELD.width,
        y: rng.range(FIELD.height * 0.25, FIELD.height * 0.95),
        phase: rng() * TAU,
        speed: rng.range(0.3, 0.9),
        size: rng.range(1.2, 2.6),
      });
    }
  }

  function announce(text, sub, dur = 2.2) {
    world.banner = { text, sub, t: 0, dur };
  }

  function startWave() {
    world.wave += 1;
    const wave = world.wave;
    const isBoss = wave % 5 === 0;
    world.spawnLeft = WAVES.baseCount + wave * WAVES.perWave + (isBoss ? 2 : 0);
    world.spawnT = 0;
    world.wavePhase = 'spawning';
    if (isBoss) {
      announce(`Wave ${wave}`, 'The Great Moth descends', 2.8);
      world.events.push('boss');
      spawnEnemy('greatmoth');
    } else {
      announce(`Wave ${wave}`, wave === 1 ? 'The shades are coming' : '', 2.0);
      world.events.push('wave');
    }
  }

  function spawnEnemy(kind) {
    const rng = world.rng;
    const spec = ENEMIES[kind];
    const p = world.player;
    let x = 0;
    let y = 0;
    for (let tries = 0; tries < 12; tries += 1) {
      const edge = rng.int(0, 3);
      if (edge === 0) { x = rng() * FIELD.width; y = -30; }
      else if (edge === 1) { x = FIELD.width + 30; y = rng() * FIELD.height; }
      else if (edge === 2) { x = rng() * FIELD.width; y = FIELD.height + 30; }
      else { x = -30; y = rng() * FIELD.height; }
      if (Math.hypot(x - p.x, y - p.y) > 260) break;
    }
    const speedMul = 1 + (world.wave - 1) * WAVES.speedGrowth + rng.range(-0.08, 0.08);
    const hpBonus = Math.floor((world.wave - 1) / WAVES.hpGrowthEvery);
    const enemy = {
      kind, x, y,
      hp: spec.hp + (kind === 'greatmoth' ? 0 : hpBonus),
      maxHp: spec.hp + (kind === 'greatmoth' ? 0 : hpBonus),
      radius: spec.radius,
      speed: spec.speed * speedMul,
      phase: rng() * TAU,
      flashT: 0,
      kvx: 0,
      kvy: 0,
      touchCd: 0,
    };
    world.enemies.push(enemy);
    if (kind === 'greatmoth') world.boss = enemy;
    return enemy;
  }

  function pickSpawnKind() {
    const wave = world.wave;
    const blobShare = Math.min(0.12 + wave * 0.035, 0.5);
    return world.rng.chance(blobShare) ? 'blob' : 'moth';
  }

  function hurtPlayer(amount) {
    const p = world.player;
    if (p.invulnT > 0 || world.over) return;
    p.hp -= amount;
    p.hurtT = 0.35;
    p.invulnT = PLAYER.invulnTime;
    world.shake = Math.min(10, world.shake + 6);
    burst(world.particles, world.rng, p.x, p.y, 14, '#ff8a7a', 190, 0.5, 3.4);
    world.events.push('hurt');
    if (p.hp <= 0) {
      p.hp = 0;
      world.over = true;
      burst(world.particles, world.rng, p.x, p.y, 46, '#ffd98a', 260, 1.1, 4.2);
      burst(world.particles, world.rng, p.x, p.y, 22, '#ff7847', 160, 1.3, 3.4);
      world.events.push('over');
    }
  }

  function killEnemy(enemy) {
    const spec = ENEMIES[enemy.kind];
    world.score += spec.score;
    world.kills += 1;
    world.floaters.push({ x: enemy.x, y: enemy.y - enemy.radius - 4, text: `+${spec.score}`, t: 0, life: 0.9, color: '#ffd98a' });
    burst(world.particles, world.rng, enemy.x, enemy.y, enemy.kind === 'greatmoth' ? 60 : 16, '#c9b8ff', 210, 0.7, 3.6);
    burst(world.particles, world.rng, enemy.x, enemy.y, enemy.kind === 'greatmoth' ? 30 : 8, '#17102e', 150, 0.8, 5);
    world.events.push('kill');
    if (enemy.kind === 'greatmoth') world.boss = null;
    const roll = world.rng();
    if (roll < PICKUPS.moteChance) {
      world.pickups.push({ kind: 'mote', x: enemy.x, y: enemy.y, t: 0, life: PICKUPS.lifetime, phase: world.rng() * TAU });
    } else if (roll < PICKUPS.moteChance + PICKUPS.emberChance) {
      world.pickups.push({ kind: 'ember', x: enemy.x, y: enemy.y, t: 0, life: PICKUPS.lifetime, phase: world.rng() * TAU });
    }
  }

  function stepPlayer(dt, ctl) {
    const p = world.player;
    let mx = ctl.moveX;
    let my = ctl.moveY;
    const len = Math.hypot(mx, my);
    if (len > 0) { mx /= len; my /= len; }
    p.aim = Math.atan2(ctl.aimY - p.y, ctl.aimX - p.x);

    if (p.dashCd > 0) p.dashCd -= dt;
    if (p.invulnT > 0) p.invulnT -= dt;
    if (p.hurtT > 0) p.hurtT -= dt;
    if (p.emberT > 0) p.emberT -= dt;
    if (p.fireCd > 0) p.fireCd -= dt;

    if (ctl.dash && p.dashCd <= 0 && p.dashT <= 0) {
      p.dashT = PLAYER.dashTime;
      p.dashCd = PLAYER.dashCooldown;
      p.invulnT = Math.max(p.invulnT, PLAYER.dashTime + 0.08);
      if (len > 0) { p.dashDirX = mx; p.dashDirY = my; }
      else { p.dashDirX = Math.cos(p.aim); p.dashDirY = Math.sin(p.aim); }
      world.events.push('dash');
    }
    if (p.dashT > 0) {
      p.dashT -= dt;
      p.x += p.dashDirX * PLAYER.dashSpeed * dt;
      p.y += p.dashDirY * PLAYER.dashSpeed * dt;
      world.particles.push({
        x: p.x, y: p.y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3,
        size: PLAYER.radius * 1.5, color: 'rgba(255,190,100,0.35)', drag: 0, ghost: true,
      });
    } else {
      p.x += mx * PLAYER.speed * dt;
      p.y += my * PLAYER.speed * dt;
    }
    p.x = Math.min(FIELD.width - PLAYER.radius, Math.max(PLAYER.radius, p.x));
    p.y = Math.min(FIELD.height - PLAYER.radius, Math.max(PLAYER.radius, p.y));

    if (ctl.firing && p.fireCd <= 0 && !world.over) {
      p.fireCd = p.emberT > 0 ? PLAYER.emberInterval : PLAYER.fireInterval;
      const spread = world.rng.range(-0.035, 0.035);
      const a = p.aim + spread;
      world.bullets.push({
        x: p.x + Math.cos(p.aim) * (PLAYER.radius + 6),
        y: p.y + Math.sin(p.aim) * (PLAYER.radius + 6),
        vx: Math.cos(a) * PLAYER.bulletSpeed,
        vy: Math.sin(a) * PLAYER.bulletSpeed,
        life: 0.95,
      });
      world.events.push('shoot');
    }
  }

  function stepBullets(dt) {
    const bullets = world.bullets;
    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x < -20 || b.x > FIELD.width + 20 || b.y < -20 || b.y > FIELD.height + 20) {
        bullets.splice(i, 1);
        continue;
      }
      for (let j = world.enemies.length - 1; j >= 0; j -= 1) {
        const e = world.enemies[j];
        const rr = e.radius + PLAYER.bulletRadius;
        if ((e.x - b.x) ** 2 + (e.y - b.y) ** 2 < rr * rr) {
          bullets.splice(i, 1);
          e.hp -= PLAYER.bulletDamage;
          e.flashT = 0.09;
          const mass = e.kind === 'greatmoth' ? 0.12 : e.kind === 'blob' ? 0.45 : 1;
          e.kvx += b.vx * 0.16 * mass;
          e.kvy += b.vy * 0.16 * mass;
          burst(world.particles, world.rng, b.x, b.y, 3, '#ffd98a', 120, 0.3, 2.6);
          if (e.hp <= 0) {
            world.enemies.splice(j, 1);
            killEnemy(e);
          } else {
            world.events.push('hit');
          }
          break;
        }
      }
    }
  }

  function stepEnemies(dt) {
    const p = world.player;
    const enemies = world.enemies;
    for (const e of enemies) {
      const spec = ENEMIES[e.kind];
      e.phase += dt * spec.wobble * 2;
      if (e.flashT > 0) e.flashT -= dt;
      if (e.touchCd > 0) e.touchCd -= dt;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const wob = Math.sin(e.phase) * 0.45;
      const px = (-dy / dist) * wob;
      const py = (dx / dist) * wob;
      e.x += ((dx / dist) + px) * e.speed * dt + e.kvx * dt;
      e.y += ((dy / dist) + py) * e.speed * dt + e.kvy * dt;
      e.kvx *= Math.max(0, 1 - 9 * dt);
      e.kvy *= Math.max(0, 1 - 9 * dt);
    }
    // Gentle separation so shades do not stack into one blob.
    for (let i = 0; i < enemies.length; i += 1) {
      for (let j = i + 1; j < enemies.length; j += 1) {
        const a = enemies[i];
        const b = enemies[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const rr = (a.radius + b.radius) * 0.8;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0.01 && d2 < rr * rr) {
          const d = Math.sqrt(d2);
          const push = ((rr - d) / d) * 14 * dt;
          a.x -= dx * push;
          a.y -= dy * push;
          b.x += dx * push;
          b.y += dy * push;
        }
      }
    }
    // Contact with the keeper.
    for (let i = enemies.length - 1; i >= 0; i -= 1) {
      const e = enemies[i];
      const rr = e.radius + PLAYER.radius - 2;
      if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < rr * rr) {
        if (e.kind === 'greatmoth') {
          if (e.touchCd <= 0) {
            e.touchCd = 0.9;
            hurtPlayer(ENEMIES.greatmoth.contact);
            e.kvx -= (p.x - e.x) * 2.2;
            e.kvy -= (p.y - e.y) * 2.2;
          }
        } else {
          enemies.splice(i, 1);
          burst(world.particles, world.rng, e.x, e.y, 12, '#7a68b8', 170, 0.6, 3.6);
          hurtPlayer(ENEMIES[e.kind].contact);
        }
      }
    }
  }

  function stepPickups(dt) {
    const p = world.player;
    for (let i = world.pickups.length - 1; i >= 0; i -= 1) {
      const pk = world.pickups[i];
      pk.t += dt;
      pk.life -= dt;
      if (pk.life <= 0) {
        world.pickups.splice(i, 1);
        continue;
      }
      const dx = p.x - pk.x;
      const dy = p.y - pk.y;
      const dist = Math.hypot(dx, dy);
      if (dist < PLAYER.magnetRadius && dist > 1) {
        const pull = 260 * (1 - dist / PLAYER.magnetRadius) + 60;
        pk.x += (dx / dist) * pull * dt;
        pk.y += (dy / dist) * pull * dt;
      } else {
        pk.x += Math.sin(pk.phase + pk.t * 1.4) * PICKUPS.drift * dt;
        pk.y += Math.cos(pk.phase * 1.3 + pk.t * 1.1) * PICKUPS.drift * dt;
      }
      if (dist < PLAYER.pickupRadius) {
        world.pickups.splice(i, 1);
        if (pk.kind === 'mote') {
          p.hp = Math.min(PLAYER.maxHp, p.hp + PICKUPS.moteHeal);
          world.floaters.push({ x: p.x, y: p.y - 30, text: `+${PICKUPS.moteHeal} light`, t: 0, life: 0.9, color: '#b8ffc9' });
          world.events.push('pickup');
        } else {
          p.emberT = PLAYER.emberDuration;
          world.floaters.push({ x: p.x, y: p.y - 30, text: 'EMBER — rapid light!', t: 0, life: 1.2, color: '#ffb08a' });
          world.events.push('ember');
        }
        burst(world.particles, world.rng, pk.x, pk.y, 10, pk.kind === 'mote' ? '#ffd98a' : '#ff7847', 130, 0.45, 3);
      }
    }
  }

  function stepFx(dt) {
    for (let i = world.particles.length - 1; i >= 0; i -= 1) {
      const pt = world.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        world.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.drag) {
        const d = Math.max(0, 1 - pt.drag * dt);
        pt.vx *= d;
        pt.vy *= d;
      }
    }
    for (let i = world.floaters.length - 1; i >= 0; i -= 1) {
      const f = world.floaters[i];
      f.t += dt;
      f.y -= 34 * dt;
      if (f.t >= f.life) world.floaters.splice(i, 1);
    }
    for (const fly of world.fireflies) {
      fly.phase += dt * fly.speed;
      fly.x += Math.sin(fly.phase * 0.9) * 9 * dt;
      fly.y += Math.cos(fly.phase * 0.7) * 6 * dt;
    }
    if (world.banner) {
      world.banner.t += dt;
      if (world.banner.t >= world.banner.dur) world.banner = null;
    }
    if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 26);
  }

  function stepWaves(dt) {
    if (world.over || world.holdWaves) return;
    if (world.wavePhase === 'rest') {
      world.restT -= dt;
      if (world.restT <= 0) startWave();
      return;
    }
    if (world.wavePhase === 'spawning') {
      world.spawnT -= dt;
      if (world.spawnLeft > 0 && world.spawnT <= 0) {
        world.spawnT = WAVES.spawnInterval;
        world.spawnLeft -= 1;
        spawnEnemy(pickSpawnKind());
      }
      if (world.spawnLeft <= 0) world.wavePhase = 'fighting';
      return;
    }
    // fighting
    if (world.enemies.length === 0) {
      world.wavePhase = 'rest';
      world.restT = WAVES.restTime;
      world.score += 25 * world.wave;
      world.floaters.push({
        x: FIELD.width / 2, y: FIELD.height / 2 - 60,
        text: `Wave ${world.wave} clear  +${25 * world.wave}`, t: 0, life: 1.4, color: '#ffe9c4',
      });
    }
  }

  /** Advance the whole world one fixed step. Returns event flags (EVENT_OVER). */
  function step(dt, ctl) {
    world.events = [];
    world.time += dt;
    if (!world.over) {
      stepPlayer(dt, ctl);
      stepBullets(dt);
      stepEnemies(dt);
      stepPickups(dt);
    }
    stepWaves(dt);
    stepFx(dt);
    return world.over ? EVENT_OVER : 0;
  }

  world.reset = reset;
  world.step = step;
  world.announce = announce;
  reset(1);
  return world;
}
