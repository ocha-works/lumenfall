// LUMENFALL tuning: field size, palette and every gameplay number in one place.

export const FIELD = { width: 1280, height: 720 };

export const COLORS = {
  skyTop: '#0a0e27',
  skyBottom: '#1a1440',
  hillFar: '#101736',
  hillNear: '#0a0f26',
  ground: '#070a1c',
  silhouette: '#05060f',
  moon: '#f5ead0',
  amber: '#ffb347',
  amberBright: '#ffd98a',
  lanternCore: '#fff3c4',
  lanternPaper: '#ffdf9e',
  lanternRib: '#e8a34c',
  ink: '#17102e',
  inkSoft: '#241a45',
  shadeRim: '#7a68b8',
  shadeEye: '#c9b8ff',
  blobShine: '#4a3a75',
  ember: '#ff7847',
  heart: '#ff8a7a',
  textWarm: '#ffe9c4',
  textDim: '#b9a8d9',
};

export const PLAYER = {
  radius: 17,
  speed: 305,
  maxHp: 100,
  fireInterval: 0.145,
  emberInterval: 0.07,
  emberDuration: 6,
  bulletSpeed: 640,
  bulletRadius: 4,
  bulletDamage: 1,
  dashSpeed: 920,
  dashTime: 0.16,
  dashCooldown: 1.6,
  invulnTime: 0.85,
  magnetRadius: 96,
  pickupRadius: 30,
};

export const ENEMIES = {
  moth: { radius: 15, hp: 2, speed: 74, score: 50, contact: 11, wobble: 2.6 },
  blob: { radius: 24, hp: 5, speed: 44, score: 80, contact: 17, wobble: 1.1 },
  greatmoth: { radius: 46, hp: 64, speed: 34, score: 1000, contact: 24, wobble: 0.7 },
};

export const WAVES = {
  baseCount: 3,
  perWave: 2,
  spawnInterval: 0.85,
  restTime: 2.6,
  speedGrowth: 0.045,
  hpGrowthEvery: 4,
};

export const PICKUPS = {
  moteChance: 0.45,
  emberChance: 0.07,
  moteHeal: 7,
  lifetime: 12,
  drift: 12,
};

export const STEP = 1 / 60;
