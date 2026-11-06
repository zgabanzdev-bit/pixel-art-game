/* sprites.js — все спрайты рисуются кодом (единый стиль, без внешних ассетов) */
const Sprites = (() => {
  function mk(w, h, fn) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    fn(c.getContext("2d"));
    return c;
  }
  // Спрайт из текстовой пиксельной карты и палитры
  function px(rows, pal) {
    return mk(rows[0].length, rows.length, (g) =>
      rows.forEach((r, y) => {
        for (let x = 0; x < r.length; x++) {
          const col = pal[r[x]];
          if (col) {
            g.fillStyle = col;
            g.fillRect(x, y, 1, 1);
          }
        }
      }),
    );
  }
  function rnd(seed) {
    let s = seed;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  const pal = {
    r: "#d93a3a",
    s: "#f2c39b",
    k: "#222034",
    b: "#3a6fd9",
    p: "#3b3b6e",
  };
  const body = [
    "..rrrrrr..",
    ".rrrrrrrr.",
    "..ssssss..",
    "..sksskss.",
    "..ssssss..",
    "..bbbbbb..",
    ".bbbbbbbb.",
    "sbbbbbbbbs",
    ".bbbbbbbb.",
    "..bbbbbb..",
  ];
  const legs = {
    idle: ["..pp..pp..", "..pp..pp..", "..pp..pp..", "..kk..kk.."],
    w1: ["..pp..pp..", "..pp...pp.", ".pp....pp.", ".kk....kk."],
    w2: ["..pp..pp..", "..pp.pp...", "..pp..pp..", ".kk...kk.."],
    jump: ["..ppppp...", "..pp..pp..", ".pp....pp.", ".kk....kk."],
  };
  const player = {};
  for (const k in legs) player[k] = px(body.concat(legs[k]), pal);

  const ep = { g: "#4fbf4f", d: "#2e7d32", w: "#ffffff", k: "#222034" };
  const enemyA = px(
    [
      "............",
      "....gggg....",
      "..gggggggg..",
      ".gggwgggwgg.",
      ".gggkgggkgg.",
      "gggggggggggg",
      "gggggggggggg",
      "dddddddddddd",
    ],
    ep,
  );
  const enemyB = px(
    [
      "............",
      "............",
      "............",
      "..gggggggg..",
      ".gggwgggwgg.",
      ".gggkgggkgg.",
      "gggggggggggg",
      "dddddddddddd",
    ],
    ep,
  );

  const heart = px(
    [".rr.rr.", "rrrrrrr", "rrrrrrr", ".rrrrr.", "..rrr..", "...r..."],
    { r: "#ff4d6d" },
  );
  const heartEmpty = px(
    [".rr.rr.", "rrrrrrr", "rrrrrrr", ".rrrrr.", "..rrr..", "...r..."],
    { r: "#4a4a5a" },
  );

  const dirt = mk(16, 16, (g) => {
    g.fillStyle = "#7b4a26";
    g.fillRect(0, 0, 16, 16);
    const r = rnd(7);
    g.fillStyle = "#5e3718";
    for (let i = 0; i < 14; i++)
      g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1);
    g.fillStyle = "#9a6234";
    for (let i = 0; i < 6; i++)
      g.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
  });
  const grass = mk(16, 16, (g) => {
    g.drawImage(dirt, 0, 0);
    g.fillStyle = "#4caf50";
    g.fillRect(0, 0, 16, 4);
    g.fillStyle = "#81c784";
    g.fillRect(0, 0, 16, 1);
    g.fillStyle = "#388e3c";
    for (let x = 0; x < 16; x += 3) g.fillRect(x, 4, 2, 1 + (x % 2));
  });
  const plat = mk(16, 16, (g) => {
    g.fillStyle = "#a1887f";
    g.fillRect(0, 0, 16, 16);
    g.fillStyle = "#d7ccc8";
    g.fillRect(0, 0, 16, 1);
    g.fillStyle = "#6d4c41";
    g.fillRect(0, 7, 16, 1);
    g.fillRect(0, 15, 16, 1);
    g.fillRect(8, 0, 1, 7);
    g.fillRect(4, 8, 1, 7);
    g.fillRect(12, 8, 1, 7);
  });
  const spike = mk(16, 16, (g) => {
    for (let t = 0; t < 2; t++)
      for (let i = 0; i < 8; i++) {
        g.fillStyle = "#cfd8dc";
        g.fillRect(t * 8 + 4 - (i >> 1), 8 + i, 1 + (i >> 1) * 2, 1);
        g.fillStyle = "#78909c";
        g.fillRect(t * 8 + 4 + (i >> 1), 8 + i, 1, 1);
      }
  });
  return {
    player,
    enemy: [enemyA, enemyB],
    heart,
    heartEmpty,
    dirt,
    grass,
    plat,
    spike,
  };
})();
