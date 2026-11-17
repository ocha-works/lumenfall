// Every pixel of LUMENFALL: a pre-rendered indigo night garden (moon, hills,
// stone lanterns, ink bushes), the lantern-keeper spirit, ink shades, glows,
// particles, HUD and the title / results / pause screens. Canvas 2D only.

import { COLORS, ENEMIES, FIELD, PLAYER } from './config.js';
import { makeRng } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const TAU = Math.PI * 2;
let bgCanvas = null;
let bgSeed = null;
let vignette = null;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function buildBackground(seed) {
  const c = makeCanvas(FIELD.width, FIELD.height);
  const g = c.getContext('2d');
  const rng = makeRng(seed * 7919 + 13);

  const sky = g.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(0.55, COLORS.skyBottom);
  sky.addColorStop(1, '#120d2e');
  g.fillStyle = sky;
  g.fillRect(0, 0, FIELD.width, FIELD.height);

  // Stars.
  for (let i = 0; i < 150; i += 1) {
    const x = rng() * FIELD.width;
    const y = rng() * FIELD.height * 0.55;
    const r = rng.range(0.5, 1.6);
    g.globalAlpha = rng.range(0.25, 0.9);
    g.fillStyle = '#e8e4ff';
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  g.globalAlpha = 1;

  // Moon and its halo, upper right.
  const moonX = FIELD.width - 210;
  const moonY = 118;
  const halo = g.createRadialGradient(moonX, moonY, 10, moonX, moonY, 190);
  halo.addColorStop(0, 'rgba(245,234,208,0.35)');
  halo.addColorStop(1, 'rgba(245,234,208,0)');
  g.fillStyle = halo;
  g.fillRect(moonX - 200, moonY - 200, 400, 400);
  g.fillStyle = COLORS.moon;
  g.beginPath();
  g.arc(moonX, moonY, 44, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(214,200,168,0.30)';
  g.beginPath();
  g.arc(moonX - 13, moonY - 6, 5.5, 0, TAU);
  g.arc(moonX + 14, moonY + 12, 4, 0, TAU);
  g.arc(moonX + 5, moonY - 19, 3.4, 0, TAU);
  g.arc(moonX - 20, moonY + 15, 3, 0, TAU);
  g.fill();

  // Far hill ridge.
  g.fillStyle = COLORS.hillFar;
  g.beginPath();
  g.moveTo(0, FIELD.height);
  g.lineTo(0, 470);
  for (let x = 0; x <= FIELD.width; x += 80) {
    g.lineTo(x, 470 - Math.sin(x * 0.004 + seed) * 36 - rng.range(0, 14));
  }
  g.lineTo(FIELD.width, FIELD.height);
  g.closePath();
  g.fill();

  // Pine silhouettes on the ridge.
  g.fillStyle = COLORS.hillNear;
  for (const px of [90, 330, 1080, 1210]) {
    const baseY = 478 - Math.sin(px * 0.004 + seed) * 30;
    g.fillRect(px - 3, baseY - 64, 6, 64);
    for (let tier = 0; tier < 3; tier += 1) {
      const w = 54 - tier * 13;
      const y = baseY - 40 - tier * 22;
      g.beginPath();
      g.moveTo(px - w / 2, y);
      g.lineTo(px + w / 2, y);
      g.lineTo(px, y - 26);
      g.closePath();
      g.fill();
    }
  }

  // Ground.
  const ground = g.createLinearGradient(0, 520, 0, FIELD.height);
  ground.addColorStop(0, COLORS.hillNear);
  ground.addColorStop(1, COLORS.ground);
  g.fillStyle = ground;
  g.beginPath();
  g.moveTo(0, FIELD.height);
  g.lineTo(0, 560);
  for (let x = 0; x <= FIELD.width; x += 64) {
    g.lineTo(x, 556 + Math.sin(x * 0.01 + seed * 2) * 10 + rng.range(0, 6));
  }
  g.lineTo(FIELD.width, FIELD.height);
  g.closePath();
  g.fill();

  // Ink bushes along the ground line.
  g.fillStyle = COLORS.silhouette;
  for (let i = 0; i < 16; i += 1) {
    const x = rng() * FIELD.width;
    const y = rng.range(566, 610);
    const r = rng.range(22, 52);
    g.beginPath();
    g.arc(x, y, r, Math.PI, 0);
    g.arc(x + r * 0.7, y, r * 0.7, Math.PI, 0);
    g.arc(x - r * 0.7, y, r * 0.75, Math.PI, 0);
    g.fill();
  }

  // Stone lanterns with warm windows — the garden the keeper tends.
  for (const lx of [150, 470, 830, 1140]) {
    const ly = 640 + Math.sin(lx) * 8;
    g.fillStyle = '#131a38';
    g.fillRect(lx - 5, ly - 58, 10, 58);
    g.fillRect(lx - 17, ly - 62, 34, 8);
    g.fillRect(lx - 13, ly - 84, 26, 22);
    g.beginPath();
    g.moveTo(lx - 20, ly - 84);
    g.lineTo(lx + 20, ly - 84);
    g.lineTo(lx, ly - 102);
    g.closePath();
    g.fill();
    const glow = g.createRadialGradient(lx, ly - 73, 1, lx, ly - 73, 44);
    glow.addColorStop(0, 'rgba(255,190,100,0.75)');
    glow.addColorStop(1, 'rgba(255,190,100,0)');
    g.fillStyle = glow;
    g.fillRect(lx - 46, ly - 119, 92, 92);
    g.fillStyle = '#ffca7a';
    g.fillRect(lx - 6, ly - 79, 12, 11);
  }

  // Grass blades at the very bottom.
  g.strokeStyle = COLORS.silhouette;
  g.lineWidth = 2;
  for (let i = 0; i < 130; i += 1) {
    const x = rng() * FIELD.width;
    const h = rng.range(8, 24);
    const lean = rng.range(-5, 5);
    g.beginPath();
    g.moveTo(x, FIELD.height);
    g.quadraticCurveTo(x + lean, FIELD.height - h * 0.6, x + lean * 1.6, FIELD.height - h);
    g.stroke();
  }
  return c;
}

function ensureBackground(seed) {
  if (bgCanvas && bgSeed === seed) return bgCanvas;
  bgSeed = seed;
  bgCanvas = buildBackground(seed);
  return bgCanvas;
}

function ensureVignette() {
  if (vignette) return vignette;
  const c = makeCanvas(FIELD.width, FIELD.height);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(640, 360, 320, 640, 360, 780);
  grad.addColorStop(0, 'rgba(4,4,12,0)');
  grad.addColorStop(1, 'rgba(4,4,12,0.55)');
  g.fillStyle = grad;
  g.fillRect(0, 0, FIELD.width, FIELD.height);
  vignette = c;
  return vignette;
}

function glowDot(ctx, x, y, radius, color) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawLantern(ctx, x, y, radius, aim, time, opts = {}) {
  const tilt = Math.max(-0.28, Math.min(0.28, Math.cos(aim) * 0.16 + Math.sin(time * 1.7) * 0.03));
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 2.1) * 2.5);
  ctx.rotate(tilt);
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

  // Halo of warm light.
  const halo = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 4.4);
  halo.addColorStop(0, 'rgba(255,183,71,0.34)');
  halo.addColorStop(0.55, 'rgba(255,150,60,0.12)');
  halo.addColorStop(1, 'rgba(255,150,60,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(-radius * 4.4, -radius * 4.4, radius * 8.8, radius * 8.8);

  // Paper body.
  const bodyGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.2, 0, 0, radius * 1.25);
  bodyGrad.addColorStop(0, COLORS.lanternCore);
  bodyGrad.addColorStop(0.6, COLORS.lanternPaper);
  bodyGrad.addColorStop(1, '#f7b95e');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 1.12, 0, 0, TAU);
  ctx.fill();

  // Ribs: vertical curves following the paper's roundness.
  ctx.strokeStyle = 'rgba(232,163,76,0.65)';
  ctx.lineWidth = Math.max(1.2, radius * 0.07);
  ctx.beginPath();
  for (const f of [-0.55, 0, 0.55]) {
    ctx.moveTo(f * radius, -radius * 1.1);
    ctx.quadraticCurveTo(f * radius * 1.5, 0, f * radius, radius * 1.1);
  }
  ctx.stroke();
  // Horizontal bands.
  ctx.beginPath();
  ctx.ellipse(0, -radius * 0.55, radius * 0.86, radius * 0.3, 0, 0, Math.PI);
  ctx.ellipse(0, radius * 0.55, radius * 0.86, radius * 0.3, 0, Math.PI, TAU);
  ctx.stroke();

  // Top cap, hanging ring and sprout.
  ctx.fillStyle = '#3a2b1c';
  ctx.fillRect(-radius * 0.42, -radius * 1.3, radius * 0.84, radius * 0.2);
  ctx.strokeStyle = '#3a2b1c';
  ctx.lineWidth = Math.max(1.4, radius * 0.08);
  ctx.beginPath();
  ctx.arc(0, -radius * 1.44, radius * 0.14, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#5d8a4a';
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.3);
  ctx.quadraticCurveTo(radius * 0.1, -radius * 1.55, radius * 0.34, -radius * 1.58);
  ctx.stroke();
  ctx.fillStyle = '#79b657';
  ctx.beginPath();
  ctx.ellipse(radius * 0.42, -radius * 1.6, radius * 0.16, radius * 0.08, -0.5, 0, TAU);
  ctx.fill();

  // Bottom tassel.
  ctx.strokeStyle = '#c94f38';
  ctx.lineWidth = Math.max(1.4, radius * 0.09);
  ctx.beginPath();
  ctx.moveTo(0, radius * 1.12);
  ctx.lineTo(0, radius * 1.34);
  ctx.moveTo(-radius * 0.12, radius * 1.14);
  ctx.lineTo(-radius * 0.16, radius * 1.32);
  ctx.moveTo(radius * 0.12, radius * 1.14);
  ctx.lineTo(radius * 0.16, radius * 1.32);
  ctx.stroke();

  // Face.
  const blink = Math.sin(time * 0.9) > 0.985;
  ctx.fillStyle = '#4a2f18';
  if (blink) {
    ctx.fillRect(-radius * 0.42, -radius * 0.06, radius * 0.24, 2);
    ctx.fillRect(radius * 0.18, -radius * 0.06, radius * 0.24, 2);
  } else {
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.05, radius * 0.09, 0, TAU);
    ctx.arc(radius * 0.3, -radius * 0.05, radius * 0.09, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#4a2f18';
  ctx.lineWidth = Math.max(1.3, radius * 0.07);
  ctx.beginPath();
  ctx.arc(0, radius * 0.16, radius * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,130,110,0.55)';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.52, radius * 0.18, radius * 0.13, radius * 0.08, 0, 0, TAU);
  ctx.ellipse(radius * 0.52, radius * 0.18, radius * 0.13, radius * 0.08, 0, 0, TAU);
  ctx.fill();

  ctx.restore();
}

function drawMoth(ctx, e, time) {
  const flap = Math.sin(time * 14 + e.phase * 3) * 0.55;
  const facing = Math.atan2(Math.sin(e.phase), 1);
  ctx.save();
  ctx.translate(e.x, e.y);
  const flash = e.flashT > 0;
  // Wings.
  ctx.fillStyle = flash ? '#8f7fd0' : '#2e2160';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.5 + flap * 0.5));
    ctx.beginPath();
    ctx.ellipse(side * e.radius * 0.95, -e.radius * 0.25, e.radius * 0.95, e.radius * 0.5, side * 0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = flash ? '#b7a8e8' : COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(0, 0, e.radius * 0.52, e.radius * 0.78, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = COLORS.shadeRim;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, e.radius * 0.52, e.radius * 0.78, 0, 0, TAU);
  ctx.stroke();
  // Antennae and eyes.
  ctx.strokeStyle = COLORS.shadeRim;
  ctx.beginPath();
  ctx.moveTo(-3, -e.radius * 0.7);
  ctx.quadraticCurveTo(-8, -e.radius * 1.15, -13, -e.radius * 1.2);
  ctx.moveTo(3, -e.radius * 0.7);
  ctx.quadraticCurveTo(8, -e.radius * 1.15, 13, -e.radius * 1.2);
  ctx.stroke();
  ctx.fillStyle = COLORS.shadeEye;
  ctx.beginPath();
  ctx.arc(-e.radius * 0.2, -e.radius * 0.15, 2.9, 0, TAU);
  ctx.arc(e.radius * 0.2, -e.radius * 0.15, 2.9, 0, TAU);
  ctx.fill();
  ctx.restore();
  void facing;
}

function drawBlob(ctx, e, time) {
  const pulse = 1 + Math.sin(time * 3.4 + e.phase) * 0.07;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(pulse, 1 / pulse);
  const flash = e.flashT > 0;
  const grad = ctx.createRadialGradient(-e.radius * 0.3, -e.radius * 0.4, e.radius * 0.2, 0, 0, e.radius * 1.15);
  grad.addColorStop(0, flash ? '#6a5aa8' : COLORS.blobShine);
  grad.addColorStop(0.5, flash ? '#4a3f7d' : '#241a45');
  grad.addColorStop(1, COLORS.ink);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = COLORS.shadeRim;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Drips at the base.
  ctx.fillStyle = flash ? '#4a3f7d' : COLORS.ink;
  for (const dx of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.ellipse(e.radius * dx, e.radius * 0.92, e.radius * 0.16, e.radius * (0.22 + 0.08 * Math.sin(time * 5 + e.phase + dx * 4)), 0, 0, TAU);
    ctx.fill();
  }
  // Eyes.
  ctx.fillStyle = COLORS.shadeEye;
  ctx.beginPath();
  ctx.arc(-e.radius * 0.32, -e.radius * 0.2, 3.2, 0, TAU);
  ctx.arc(e.radius * 0.32, -e.radius * 0.2, 3.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawGreatMoth(ctx, e, time) {
  const flap = Math.sin(time * 5.2 + e.phase) * 0.3;
  ctx.save();
  ctx.translate(e.x, e.y);
  const flash = e.flashT > 0;
  glowDot(ctx, 0, 0, e.radius * 2.6, 'rgba(122,104,184,0.20)');
  ctx.fillStyle = flash ? '#7d6cc0' : '#1d1440';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.35 + flap));
    ctx.beginPath();
    ctx.ellipse(side * e.radius * 1.05, -e.radius * 0.3, e.radius * 1.15, e.radius * 0.55, side * 0.45, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(side * e.radius * 0.85, e.radius * 0.42, e.radius * 0.8, e.radius * 0.4, side * 0.3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = flash ? '#a493dd' : COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(0, 0, e.radius * 0.5, e.radius * 0.85, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = COLORS.shadeRim;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  // Wing eye-spots glow through the body line.
  ctx.fillStyle = COLORS.shadeEye;
  ctx.beginPath();
  ctx.arc(-e.radius * 0.22, -e.radius * 0.2, 4.6, 0, TAU);
  ctx.arc(e.radius * 0.22, -e.radius * 0.2, 4.6, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = COLORS.shadeRim;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-5, -e.radius * 0.78);
  ctx.quadraticCurveTo(-16, -e.radius * 1.3, -28, -e.radius * 1.34);
  ctx.moveTo(5, -e.radius * 0.78);
  ctx.quadraticCurveTo(16, -e.radius * 1.3, 28, -e.radius * 1.34);
  ctx.stroke();
  ctx.restore();
}

function drawEnemy(ctx, e, time) {
  if (e.kind === 'moth') drawMoth(ctx, e, time);
  else if (e.kind === 'blob') drawBlob(ctx, e, time);
  else drawGreatMoth(ctx, e, time);
  // Small HP pip arc for damaged non-boss shades.
  if (e.kind !== 'greatmoth' && e.hp < e.maxHp) {
    ctx.save();
    ctx.strokeStyle = 'rgba(201,184,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius + 6, -Math.PI / 2, -Math.PI / 2 + TAU * (e.hp / e.maxHp));
    ctx.stroke();
    ctx.restore();
  }
}

function drawPickup(ctx, pk, time) {
  const bob = Math.sin(time * 3 + pk.phase) * 3;
  const fade = pk.life < 2 ? (Math.sin(time * 10) > 0 ? 1 : 0.35) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  if (pk.kind === 'mote') {
    glowDot(ctx, pk.x, pk.y + bob, 26, 'rgba(255,200,100,0.5)');
    ctx.fillStyle = COLORS.lanternCore;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bob, 5.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = COLORS.amber;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bob, 3, 0, TAU);
    ctx.fill();
  } else {
    glowDot(ctx, pk.x, pk.y + bob, 34, 'rgba(255,120,71,0.5)');
    ctx.fillStyle = COLORS.ember;
    ctx.beginPath();
    const w = Math.sin(time * 9 + pk.phase) * 2;
    ctx.moveTo(pk.x, pk.y + bob - 11);
    ctx.quadraticCurveTo(pk.x + 7 + w, pk.y + bob - 2, pk.x + 5, pk.y + bob + 6);
    ctx.quadraticCurveTo(pk.x, pk.y + bob + 10, pk.x - 5, pk.y + bob + 6);
    ctx.quadraticCurveTo(pk.x - 7 + w, pk.y + bob - 2, pk.x, pk.y + bob - 11);
    ctx.fill();
    ctx.fillStyle = '#ffc46b';
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bob + 3, 3.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGame(ctx, world) {
  const time = world.time;
  ctx.save();
  if (world.shake > 0.2) {
    ctx.translate(Math.sin(time * 91) * world.shake * 0.5, Math.cos(time * 83) * world.shake * 0.5);
  }
  ctx.drawImage(ensureBackground(world.seed), 0, 0);

  // Fireflies.
  for (const fly of world.fireflies) {
    const tw = 0.5 + 0.5 * Math.sin(fly.phase * 2.3);
    ctx.globalAlpha = 0.25 + tw * 0.55;
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, fly.size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const pk of world.pickups) drawPickup(ctx, pk, time);
  for (const e of world.enemies) drawEnemy(ctx, e, time);

  // Light motes (shots).
  for (const b of world.bullets) {
    glowDot(ctx, b.x, b.y, 15, 'rgba(255,190,90,0.55)');
    ctx.fillStyle = COLORS.lanternCore;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.6, 0, TAU);
    ctx.fill();
  }

  // The keeper (hidden once the light is out).
  if (!world.over) {
    const p = world.player;
    const blinkOff = p.invulnT > 0 && p.dashT <= 0 && Math.sin(time * 26) > 0.2;
    drawLantern(ctx, p.x, p.y, PLAYER.radius + 4, p.aim, time, { alpha: blinkOff ? 0.35 : 1 });
    // Aiming spark at the lantern's rim.
    ctx.fillStyle = 'rgba(255,243,196,0.9)';
    ctx.beginPath();
    ctx.arc(p.x + Math.cos(p.aim) * (PLAYER.radius + 9), p.y + Math.sin(p.aim) * (PLAYER.radius + 9), 2.6, 0, TAU);
    ctx.fill();
    if (p.hurtT > 0) {
      ctx.fillStyle = `rgba(255,70,50,${(p.hurtT / 0.35) * 0.16})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  // Particles.
  for (const pt of world.particles) {
    const a = Math.max(0, pt.life / pt.maxLife);
    ctx.globalAlpha = pt.ghost ? a * 0.5 : a;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * (pt.ghost ? 1 : a * 0.8 + 0.2), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Floating score text.
  ctx.textAlign = 'center';
  ctx.font = 'bold 17px Verdana, sans-serif';
  for (const f of world.floaters) {
    ctx.globalAlpha = 1 - (f.t / f.life) ** 2;
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
  ctx.drawImage(ensureVignette(), 0, 0);

  // Boss health bar.
  if (world.boss) {
    const b = world.boss;
    const w = 420;
    const x = (FIELD.width - w) / 2;
    ctx.fillStyle = 'rgba(5,6,15,0.6)';
    ctx.fillRect(x - 3, 52, w + 6, 16);
    ctx.fillStyle = '#3a2d66';
    ctx.fillRect(x, 55, w, 10);
    ctx.fillStyle = '#9a86e0';
    ctx.fillRect(x, 55, w * Math.max(0, b.hp / b.maxHp), 10);
    ctx.fillStyle = COLORS.textWarm;
    ctx.font = 'bold 12px Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GREAT MOTH', FIELD.width / 2, 48);
  }
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.25, y + s * 0.1, x - s * 0.72, y - s * 0.95, x, y - s * 0.32);
  ctx.bezierCurveTo(x + s * 0.72, y - s * 0.95, x + s * 1.25, y + s * 0.1, x, y + s * 0.9);
  ctx.closePath();
}

export function drawHUD(ctx, world, opts = {}) {
  const p = world.player;
  // Hearts (5 hearts, each worth 20 light).
  for (let i = 0; i < 5; i += 1) {
    const x = 34 + i * 34;
    const y = 34;
    const fill = Math.max(0, Math.min(1, (p.hp - i * 20) / 20));
    ctx.save();
    heartPath(ctx, x, y, 13);
    ctx.fillStyle = 'rgba(255,138,122,0.22)';
    ctx.fill();
    if (fill > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 14, y - 14, 28 * fill, 28);
      ctx.clip();
      heartPath(ctx, x, y, 13);
      ctx.fillStyle = COLORS.heart;
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(255,233,196,0.5)';
    ctx.lineWidth = 1.4;
    heartPath(ctx, x, y, 13);
    ctx.stroke();
    ctx.restore();
  }

  // Wave, top centre.
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textWarm;
  ctx.font = 'bold 21px Verdana, sans-serif';
  ctx.fillText(world.wave > 0 ? `WAVE ${world.wave}` : 'THE GARDEN AT DUSK', FIELD.width / 2, 34);

  // Score, top right.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textWarm;
  ctx.font = 'bold 24px Verdana, sans-serif';
  ctx.fillText(String(world.score), FIELD.width - 28, 38);
  ctx.font = '13px Verdana, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('SCORE', FIELD.width - 28, 58);

  // Dash cooldown and ember timer, bottom left.
  const dashReady = p.dashCd <= 0;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(5,6,15,0.55)';
  ctx.fillRect(20, FIELD.height - 52, 168, 34);
  ctx.fillStyle = dashReady ? '#ffd98a' : '#6f6390';
  ctx.fillRect(24, FIELD.height - 48, 160 * (dashReady ? 1 : 1 - p.dashCd / 1.6), 5);
  ctx.font = 'bold 13px Verdana, sans-serif';
  ctx.fillStyle = dashReady ? COLORS.textWarm : COLORS.textDim;
  ctx.fillText(dashReady ? 'DASH READY (Shift)' : 'DASH CHARGING…', 24, FIELD.height - 26);
  if (p.emberT > 0) {
    ctx.fillStyle = 'rgba(5,6,15,0.55)';
    ctx.fillRect(20, FIELD.height - 92, 168, 34);
    ctx.fillStyle = COLORS.ember;
    ctx.fillRect(24, FIELD.height - 88, 160 * (p.emberT / 6), 5);
    ctx.fillStyle = '#ffb08a';
    ctx.fillText('EMBER RAPID FIRE', 24, FIELD.height - 66);
  }

  // Controls reminder, bottom right.
  ctx.textAlign = 'right';
  ctx.font = '12.5px Verdana, sans-serif';
  ctx.fillStyle = 'rgba(185,168,217,0.85)';
  ctx.fillText(opts.muted ? 'M  sound: off' : 'M  sound: on', FIELD.width - 24, FIELD.height - 40);
  ctx.fillText('P  pause', FIELD.width - 24, FIELD.height - 22);

  drawBanner(ctx, world);
}

export function drawBanner(ctx, world) {
  const b = world.banner;
  if (!b) return;
  const inT = Math.min(1, b.t / 0.35);
  const outT = Math.min(1, (b.dur - b.t) / 0.5);
  const a = Math.max(0, Math.min(inT, outT));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(5,6,15,0.45)';
  ctx.fillRect(0, 118, FIELD.width, 92);
  ctx.fillStyle = COLORS.amberBright;
  ctx.font = 'bold 44px Georgia, serif';
  try { ctx.letterSpacing = '6px'; } catch { /* older canvas */ }
  ctx.fillText(b.text.toUpperCase(), FIELD.width / 2, 162);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  if (b.sub) {
    ctx.fillStyle = COLORS.textWarm;
    ctx.font = '17px Georgia, serif';
    ctx.fillText(b.sub, FIELD.width / 2, 192);
  }
  ctx.restore();
}

function panel(ctx, w, h) {
  const x = (FIELD.width - w) / 2;
  const y = (FIELD.height - h) / 2;
  ctx.fillStyle = 'rgba(6,7,18,0.78)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,183,71,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
  return { x, y };
}

export function drawTitle(ctx, world, best) {
  ctx.fillStyle = 'rgba(5,5,16,0.45)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawLantern(ctx, FIELD.width / 2, 208, 52, -Math.PI / 2, world.time);

  ctx.textAlign = 'center';
  ctx.save();
  ctx.shadowColor = 'rgba(255,170,60,0.85)';
  ctx.shadowBlur = 34;
  ctx.fillStyle = COLORS.amberBright;
  ctx.font = 'bold 96px Georgia, serif';
  try { ctx.letterSpacing = '10px'; } catch { /* older canvas */ }
  ctx.fillText('LUMENFALL', FIELD.width / 2, 388);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }

  ctx.fillStyle = COLORS.textWarm;
  ctx.font = '21px Georgia, serif';
  ctx.fillText('Keep the lantern lit. Keep the garden safe.', FIELD.width / 2, 432);

  ctx.font = '17px Verdana, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('Move  WASD / Arrows        Aim  Mouse        Fire  Hold Click / Space        Dash  Shift', FIELD.width / 2, 486);
  ctx.fillText('Gather fallen light to mend your lantern. An ember makes your light fly faster.', FIELD.width / 2, 516);

  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3.2);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.amberBright;
  ctx.font = 'bold 24px Verdana, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO BEGIN', FIELD.width / 2, 586);
  ctx.globalAlpha = 1;

  if (best > 0) {
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '15px Verdana, sans-serif';
    ctx.fillText(`Best score so far: ${best}`, FIELD.width / 2, 626);
  }
}

export function drawOver(ctx, world, best) {
  ctx.fillStyle = 'rgba(5,5,16,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const { y } = panel(ctx, 520, 400);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff9a8a';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('THE LIGHT FADES', FIELD.width / 2, y + 78);

  ctx.fillStyle = COLORS.textWarm;
  ctx.font = '20px Verdana, sans-serif';
  ctx.fillText(`Score`, FIELD.width / 2, y + 138);
  ctx.font = 'bold 52px Verdana, sans-serif';
  ctx.fillStyle = COLORS.amberBright;
  ctx.fillText(String(world.score), FIELD.width / 2, y + 192);

  ctx.font = '19px Verdana, sans-serif';
  ctx.fillStyle = COLORS.textWarm;
  ctx.fillText(`Waves survived   ${world.wave}`, FIELD.width / 2, y + 244);
  ctx.fillText(`Shades cleared   ${world.kills}`, FIELD.width / 2, y + 276);
  ctx.fillStyle = world.score >= best && best > 0 ? '#b8ffc9' : COLORS.textDim;
  ctx.fillText(world.score >= best && best > 0 ? `A new best!` : `Best score   ${best}`, FIELD.width / 2, y + 308);

  const pulse = 0.65 + 0.35 * Math.sin(world.time * 3.2);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = COLORS.amberBright;
  ctx.font = 'bold 20px Verdana, sans-serif';
  ctx.fillText('PRESS R OR CLICK TO TEND THE GARDEN AGAIN', FIELD.width / 2, y + 362);
  ctx.globalAlpha = 1;
}

export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(5,5,16,0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textWarm;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 8);
  ctx.font = '17px Verdana, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('Press P or Esc to return to the garden', FIELD.width / 2, FIELD.height / 2 + 30);
}
