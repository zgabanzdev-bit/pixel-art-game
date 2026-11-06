/* levels.js — данные уровней и построение карты */
const T = 16; // размер тайла (px)
const GRAV = 900; // гравитация (px/с^2)

// gaps — пропасти в земле (колонки, включительно), plats — платформы [от, до, ряд]
// coins — [колонка, ряд], enemies — колонки, spikes — колонки шипов на земле
const LEVEL_DEFS = [
  {
    name: "Green Hills",
    w: 50,
    theme: { sky: "#6ec6ff", hill: "#4a9e5c", cloud: "#ffffff" },
    gaps: [
      [16, 18],
      [33, 35],
    ],
    plats: [
      [14, 18, 8],
      [19, 23, 7],
      [30, 36, 8],
    ],
    spikes: [],
    coins: [
      [6, 9],
      [8, 9],
      [20, 9],
      [22, 9],
      [16, 7],
      [21, 6],
      [33, 7],
      [34, 7],
      [44, 9],
      [46, 9],
    ],
    enemies: [12, 28, 40],
    flag: 47,
  },
  {
    name: "Sunset Ridge",
    w: 60,
    theme: { sky: "#f4a261", hill: "#8a5a44", cloud: "#ffd9b3" },
    gaps: [
      [12, 14],
      [25, 28],
      [40, 42],
      [50, 52],
    ],
    plats: [
      [11, 15, 8],
      [24, 29, 8],
      [26, 28, 6],
      [39, 43, 8],
      [49, 53, 8],
      [45, 47, 7],
    ],
    spikes: [20, 21, 36, 47],
    coins: [
      [5, 9],
      [9, 9],
      [13, 7],
      [26, 5],
      [27, 5],
      [41, 7],
      [51, 7],
      [54, 9],
      [56, 9],
    ],
    enemies: [8, 22, 32, 45],
    flag: 57,
  },
  {
    name: "Midnight Pass",
    w: 70,
    theme: { sky: "#1e1b4b", hill: "#2c2f6b", cloud: "#3b3f8c", stars: true },
    gaps: [
      [10, 12],
      [22, 24],
      [30, 33],
      [44, 47],
      [55, 58],
    ],
    plats: [
      [9, 13, 8],
      [21, 25, 8],
      [29, 34, 8],
      [31, 33, 6],
      [43, 48, 8],
      [45, 46, 6],
      [54, 59, 8],
    ],
    spikes: [17, 18, 19, 38, 39, 50, 51, 63],
    coins: [
      [4, 9],
      [11, 7],
      [16, 9],
      [23, 7],
      [31, 5],
      [32, 5],
      [45, 5],
      [46, 5],
      [56, 7],
      [65, 9],
    ],
    enemies: [6, 15, 27, 36, 52, 61],
    flag: 67,
  },
];

// Строим карту: 12 рядов, земля в рядах 10–11
function buildLevel(def) {
  const w = def.w,
    h = 12,
    tiles = [];
  for (let y = 0; y < h; y++) tiles.push(new Array(w).fill("."));
  for (let x = 0; x < w; x++) {
    const gap = def.gaps.some((g) => x >= g[0] && x <= g[1]);
    if (!gap) {
      tiles[10][x] = "#";
      tiles[11][x] = "#";
    }
  }
  def.plats.forEach(([a, b, r]) => {
    for (let x = a; x <= b; x++) tiles[r][x] = "=";
  });
  def.spikes.forEach((c) => {
    tiles[9][c] = "^";
  });
  return {
    name: def.name,
    w,
    h,
    tiles,
    theme: def.theme,
    coins: def.coins.map(([c, r]) => ({
      x: c * T + 4,
      y: r * T + 4,
      got: false,
    })),
    enemies: def.enemies.map((c) => ({ col: c })),
    flag: { x: def.flag * T, y: 10 * T - 32 },
  };
}
