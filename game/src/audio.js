// All sound is synthesized with WebAudio oscillators and short noise bursts:
// no audio files, nothing to load. The context is created lazily on the first
// user gesture, and M toggles a master mute.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let lastShoot = 0;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freqFrom, freqTo, duration, type, volume, delay = 0) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function noise(duration, volume, delay = 0) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    source.connect(filter).connect(gain).connect(master);
    source.start(t0);
  }

  const sounds = {
    shoot() {
      const now = performance.now();
      if (now - lastShoot < 45) return;
      lastShoot = now;
      tone(880, 520, 0.07, 'sine', 0.05);
    },
    hit() {
      tone(300, 140, 0.05, 'square', 0.04);
    },
    kill() {
      tone(520, 90, 0.18, 'triangle', 0.12);
      noise(0.12, 0.05);
    },
    hurt() {
      tone(220, 60, 0.25, 'sawtooth', 0.14);
      noise(0.15, 0.08);
    },
    dash() {
      noise(0.14, 0.06);
      tone(400, 900, 0.12, 'sine', 0.04);
    },
    pickup() {
      tone(660, 990, 0.09, 'sine', 0.08);
      tone(990, 1320, 0.1, 'sine', 0.06, 0.05);
    },
    ember() {
      tone(392, 784, 0.16, 'triangle', 0.1);
      tone(523, 1046, 0.16, 'triangle', 0.08, 0.06);
    },
    wave() {
      tone(523, 523, 0.12, 'triangle', 0.09);
      tone(659, 659, 0.12, 'triangle', 0.09, 0.11);
      tone(784, 784, 0.2, 'triangle', 0.1, 0.22);
    },
    boss() {
      tone(196, 98, 0.5, 'sawtooth', 0.1);
      tone(147, 73, 0.5, 'sawtooth', 0.08, 0.1);
    },
    over() {
      tone(392, 392, 0.25, 'triangle', 0.1);
      tone(330, 330, 0.25, 'triangle', 0.1, 0.24);
      tone(262, 196, 0.6, 'triangle', 0.1, 0.48);
    },
    start() {
      tone(523, 784, 0.14, 'sine', 0.08);
      tone(784, 1046, 0.18, 'sine', 0.07, 0.08);
    },
  };

  function play(name) {
    if (!ctx || muted) return;
    sounds[name]?.();
  }

  function toggleMute() {
    muted = !muted;
    return muted;
  }

  return { ensure, play, toggleMute, isMuted: () => muted };
}
