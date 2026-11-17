// LUMENFALL entry point: canvas boot, the fixed-step game loop, and the
// screen state machine (title -> play -> results), wiring input, audio,
// world and render together. With ?shot= in the URL it instead stages one
// deterministic scene and draws it once for screenshot capture.

import { FIELD, STEP } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createWorld } from './world.js';
import {
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  drawGame,
  drawHUD,
  drawOver,
  drawPause,
  drawTitle,
} from './render.js';
import { shotFromQuery, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const world = createWorld();
const audio = createAudio();
const input = createInput(canvas);

let best = 0;
let screen = SCREEN_TITLE;
let paused = false;

function freshSeed() {
  return (Date.now() % 2147483646) + 1;
}

function toTitle() {
  world.reset(freshSeed());
  world.holdWaves = true;
  world.player.x = FIELD.width / 2;
  world.player.y = FIELD.height - 58;
  screen = SCREEN_TITLE;
  paused = false;
}

function startGame() {
  audio.ensure();
  audio.play('start');
  world.reset(freshSeed());
  screen = SCREEN_PLAY;
  paused = false;
}

function drainEvents() {
  for (const name of world.events) audio.play(name);
}

function draw() {
  drawGame(ctx, world);
  if (screen === SCREEN_TITLE) {
    drawTitle(ctx, world, best);
  } else if (screen === SCREEN_PLAY) {
    drawHUD(ctx, world, { muted: audio.isMuted() });
    if (paused) drawPause(ctx);
  } else if (screen === SCREEN_OVER) {
    drawOver(ctx, world, best);
  }
}

// --- Screenshot mode: stage one scene, draw it, stop. ---
const shot = shotFromQuery(window.location.search);
if (shot) {
  const staged = stageShot(shot.name, world, shot.seed);
  screen = staged.screen;
  best = staged.best;
  draw();
  requestAnimationFrame(() => {
    draw();
    window.__shotReady = true;
  });
} else {
  // --- Live game. ---
  toTitle();
  let last = performance.now();
  let accumulator = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    accumulator += dt;

    if (input.wasPressed('KeyM')) audio.toggleMute();

    if (screen === SCREEN_TITLE) {
      world.step(STEP, { moveX: 0, moveY: 0, aimX: world.player.x + 80, aimY: world.player.y - 60, firing: false, dash: false });
      if (input.wasPressed('Enter') || input.takeClick()) startGame();
    } else if (screen === SCREEN_PLAY) {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape')) paused = !paused;
      if (!paused) {
        while (accumulator >= STEP) {
          accumulator -= STEP;
          world.step(STEP, input.controls());
          drainEvents();
          if (world.over) {
            best = Math.max(best, world.score);
            screen = SCREEN_OVER;
            break;
          }
        }
      } else {
        accumulator = 0;
      }
    } else if (screen === SCREEN_OVER) {
      // Let the death particles settle behind the results panel.
      world.step(STEP, { moveX: 0, moveY: 0, aimX: 0, aimY: 0, firing: false, dash: false });
      if (input.wasPressed('KeyR') || input.takeClick()) startGame();
    }

    draw();
    input.flush();
  }
  requestAnimationFrame(frame);
}
