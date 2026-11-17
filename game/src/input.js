// Keyboard and mouse state: held keys, pointer position in field coordinates,
// and one-shot press events (start, restart, pause, mute) for the main loop.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, down: false, clicked: false };

  const toField = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    if (!event.repeat) pressed.add(event.code);
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => {
    keys.clear();
    mouse.down = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    const p = toField(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const p = toField(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.down = true;
    mouse.clicked = true;
    canvas.setPointerCapture?.(event.pointerId);
  });
  window.addEventListener('pointerup', () => {
    mouse.down = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  /** The per-step control object the world consumes. */
  function controls() {
    const left = keys.has('KeyA') || keys.has('ArrowLeft');
    const right = keys.has('KeyD') || keys.has('ArrowRight');
    const up = keys.has('KeyW') || keys.has('ArrowUp');
    const down = keys.has('KeyS') || keys.has('ArrowDown');
    return {
      moveX: (right ? 1 : 0) - (left ? 1 : 0),
      moveY: (down ? 1 : 0) - (up ? 1 : 0),
      aimX: mouse.x,
      aimY: mouse.y,
      firing: mouse.down || keys.has('Space'),
      dash: keys.has('ShiftLeft') || keys.has('ShiftRight'),
    };
  }

  /** True once per physical press of the given code; consumed by reading. */
  function wasPressed(code) {
    if (!pressed.has(code)) return false;
    pressed.delete(code);
    return true;
  }

  function takeClick() {
    const was = mouse.clicked;
    mouse.clicked = false;
    return was;
  }

  /** Drop stale one-shot events (call at the end of each frame). */
  function flush() {
    pressed.clear();
    mouse.clicked = false;
  }

  return { controls, wasPressed, takeClick, flush, mouse };
}
