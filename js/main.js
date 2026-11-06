/* main.js — состояния игры, игровой цикл, отрисовка */
(() => {
  'use strict';
  const W = 320, H = 192;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  // Адаптивный canvas: целочисленный масштаб (если окно меньше — дробный)
  function resize() {
    const r = Math.min(innerWidth / W, innerHeight / H);
    const s = r >= 1 ? Math.floor(r) : r;
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
  }
  addEventListener('resize', resize); resize();

  let state = 'menu';       // menu | controls | credits | play | pause | clear | over | win
  let menuIdx = 0, pauseIdx = 0;
  let hi = loadHi();
  let g = null;             // текущая игровая сессия
  const particles = [];

  function loadHi() { try { return +localStorage.getItem('pixelquest_hi') || 0; } catch (e) { return 0; } }
  function saveHi() { if (g && g.score > hi) { hi = g.score; try { localStorage.setItem('pixelquest_hi', String(hi)); } catch (e) {} } }
  function go(s) { state = s; Input.clear(); }

  // ---------- Сессия ----------
  function newGame() { g = { score: 0, lv: 0, time: 0, lt: 0, hp: 3, rec: false, clearT: 0 }; loadLevel(0); }
  function loadLevel(i) {
    g.lv = i; g.lt = 0; g.clearT = 0;
    g.level = buildLevel(LEVEL_DEFS[i]);
    g.player = new Player(g.hp);
    g.enemies = g.level.enemies.map(e => new Enemy(e.col));
    g.camX = 0; particles.length = 0;
  }
  function startGame() { newGame(); go('play'); Sfx.startMusic(); }
  function burst(x, y, col, n) {
    for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random() - 0.5) * 90, vy: -Math.random() * 90, life: 0.5, col });
  }
  function gameOver() {
    g.rec = g.score > hi; saveHi(); Sfx.stopMusic(); Sfx.play('over'); go('over');
  }
  function nextLevel() {
    if (g.lv + 1 < LEVEL_DEFS.length) {
      g.hp = Math.min(3, g.player.hp + 1);              // бонус: +1 сердце за уровень
      loadLevel(g.lv + 1); go('play');
    } else {
      g.rec = g.score > hi; saveHi(); Sfx.stopMusic(); Sfx.play('win'); go('win');
    }
  }

  // ---------- Обновление ----------
  function nav(idx, n) {
    if (Input.pressed('up')) { idx = (idx + n - 1) % n; Sfx.play('select'); }
    if (Input.pressed('down')) { idx = (idx + 1) % n; Sfx.play('select'); }
    return idx;
  }
  function updatePlay(dt) {
    const L = g.level, p = g.player;
    g.time += dt; g.lt += dt;
    p.update(dt, L);
    g.enemies.forEach(e => e.update(dt, L));

    for (const c of L.coins) {
      if (!c.got && overlap(p.x, p.y, p.w, p.h, c.x, c.y, 8, 8)) {
        c.got = true; g.score += 10; Sfx.play('coin'); burst(c.x + 4, c.y + 4, '#ffd54a', 5);
      }
    }
    for (const e of g.enemies) {
      if (e.dead || !overlap(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.h)) continue;
      if (p.vy > 0 && p.y + p.h - e.y < 9) {             // прыжок сверху — убиваем врага
        e.dead = true; p.vy = -210; g.score += 50; Sfx.play('stomp'); burst(e.x + 6, e.y + 4, '#4fbf4f', 8);
      } else p.hurt();
    }
    g.enemies = g.enemies.filter(e => !e.dead);
    if (touchesSpike(L, p) && p.hurt()) p.vy = -200;

    if (p.y > L.h * T + 24) {                            // упал в пропасть
      p.hp--; Sfx.play('hurt'); if (p.hp > 0) p.respawn();
    }
    if (p.hp <= 0) { gameOver(); return; }

    if (overlap(p.x, p.y, p.w, p.h, L.flag.x, L.flag.y, 16, 32)) {
      g.score += 100; Sfx.play('win'); go('clear'); return;
    }
    g.camX = Math.max(0, Math.min(L.w * T - W, p.x + p.w / 2 - W / 2));
    for (const q of particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; q.life -= dt; }
    for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
  }

  function update(dt) {
    if (Input.pressed('mute')) Sfx.toggleMute();
    switch (state) {
      case 'menu':
        menuIdx = nav(menuIdx, 3);
        if (Input.pressed('enter')) {
          Sfx.play('select');
          if (menuIdx === 0) startGame(); else go(menuIdx === 1 ? 'controls' : 'credits');
        }
        break;
      case 'controls': case 'credits':
        if (Input.pressed('enter') || Input.pressed('pause')) go('menu');
        break;
      case 'play':
        if (Input.pressed('pause')) { pauseIdx = 0; go('pause'); break; }
        updatePlay(dt);
        break;
      case 'pause':
        pauseIdx = nav(pauseIdx, 3);
        if (Input.pressed('pause')) { go('play'); break; }
        if (Input.pressed('enter')) {
          if (pauseIdx === 0) go('play');
          else if (pauseIdx === 1) { Sfx.startMusic(); startGame(); }
          else { Sfx.stopMusic(); go('menu'); }
        }
        break;
      case 'clear':
        g.clearT += dt;
        if (g.clearT > 3 || (g.clearT > 0.8 && Input.pressed('enter'))) nextLevel();
        break;
      case 'over': case 'win':
        if (Input.pressed('enter')) startGame();
        else if (Input.pressed('pause')) go('menu');
        break;
    }
  }

  // ---------- Отрисовка ----------
  function txt(s, x, y, col = '#fff', size = 8, align = 'left') {
    ctx.font = 'bold ' + size + 'px monospace'; ctx.textAlign = align; ctx.textBaseline = 'top';
    ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = col; ctx.fillText(s, x, y);
  }
  function drawBg(th, camX) {
    ctx.fillStyle = th.sky; ctx.fillRect(0, 0, W, H);
    if (th.stars) {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 40; i++) ctx.fillRect((i * 73) % W, (i * 41) % 110, 1, 1);
    }
    ctx.fillStyle = th.cloud;                                // облака (параллакс 0.2)
    for (let i = 0; i < 5; i++) {
      const x = Math.floor((((i * 110 - camX * 0.2) % 550) + 550) % 550) - 60, y = 20 + (i * 37) % 50;
      ctx.fillRect(x, y, 34, 8); ctx.fillRect(x + 6, y - 6, 20, 6);
    }
    ctx.fillStyle = th.hill;                                 // холмы (параллакс 0.4)
    for (let x = 0; x < W; x += 2) {
      const hx = x + camX * 0.4;
      const h = Math.floor(34 + 18 * Math.sin(hx / 40) + 9 * Math.sin(hx / 17));
      ctx.fillRect(x, H - 32 - h, 2, h + 32);
    }
  }
  const solidCh = ch => ch === '#' || ch === '=';
  function drawWorld() {
    const L = g.level, cx = Math.round(g.camX);
    drawBg(L.theme, cx);
    const c0 = Math.floor(cx / T), c1 = Math.min(L.w - 1, c0 + Math.ceil(W / T));
    for (let y = 0; y < L.h; y++) for (let x = c0; x <= c1; x++) {
      const t = L.tiles[y][x], dx = x * T - cx, dy = y * T;
      if (t === '#') ctx.drawImage(L.tiles[y - 1] && solidCh(L.tiles[y - 1][x]) ? Sprites.dirt : Sprites.grass, dx, dy);
      else if (t === '=') ctx.drawImage(Sprites.plat, dx, dy);
      else if (t === '^') ctx.drawImage(Sprites.spike, dx, dy);
    }
    const now = performance.now() / 1000;
    for (const c of L.coins) {                               // вращающиеся монеты
      if (c.got) continue;
      const w = Math.max(2, Math.round(Math.abs(Math.cos(now * 5 + c.x)) * 8));
      const x = Math.round(c.x - cx + 4 - w / 2);
      ctx.fillStyle = '#c79100'; ctx.fillRect(x, c.y, w, 8);
      ctx.fillStyle = '#ffd54a'; ctx.fillRect(x + 1, c.y + 1, Math.max(1, w - 2), 6);
    }
    const f = L.flag, fx = f.x - cx;                         // флаг финиша
    ctx.fillStyle = '#eceff1'; ctx.fillRect(fx + 2, f.y, 2, 32);
    ctx.fillStyle = '#ffd54a'; ctx.fillRect(fx + 1, f.y - 3, 4, 4);
    ctx.fillStyle = '#e53935';
    for (let i = 0; i < 10; i++) ctx.fillRect(fx + 4, f.y + 2 + i, Math.round(12 - i + Math.sin(now * 6 + i * 0.5) * 1.5), 1);

    for (const e of g.enemies) ctx.drawImage(Sprites.enemy[Math.floor(e.t * 4) % 2], Math.round(e.x - cx), Math.round(e.y));

    const p = g.player;
    if (!(p.inv > 0 && Math.floor(p.inv * 12) % 2 === 0)) {  // мигание при неуязвимости
      const img = !p.onGround ? Sprites.player.jump : Math.abs(p.vx) > 10 ? (Math.floor(p.anim * 3) % 2 ? Sprites.player.w1 : Sprites.player.w2) : Sprites.player.idle;
      const x = Math.round(p.x - cx), y = Math.round(p.y);
      if (p.facing < 0) { ctx.save(); ctx.translate(x + p.w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
      else ctx.drawImage(img, x, y);
    }
    for (const q of particles) { ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x - cx), Math.round(q.y), 2, 2); }
  }
  function drawHud() {
    for (let i = 0; i < 3; i++) ctx.drawImage(i < g.player.hp ? Sprites.heart : Sprites.heartEmpty, 4 + i * 9, 4);
    txt('SCORE ' + String(g.score).padStart(6, '0'), W / 2, 4, '#fff', 8, 'center');
    txt('LV ' + (g.lv + 1) + '/' + LEVEL_DEFS.length, W - 4, 4, '#fff', 8, 'right');
    txt('HI ' + String(Math.max(hi, g.score)).padStart(6, '0'), W - 4, 14, '#ffd54a', 8, 'right');
    if (Sfx.isMuted()) txt('MUTE', 4, 14, '#aaa', 8);
    if (g.lt < 1.8 && state === 'play') txt('LEVEL ' + (g.lv + 1) + ': ' + g.level.name, W / 2, 60, '#fff', 12, 'center');
  }
  function dim() { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); }
  function drawMenuItems(items, idx, y0) {
    items.forEach((s, i) => txt((i === idx ? '> ' : '  ') + s, W / 2, y0 + i * 14, i === idx ? '#ffd54a' : '#fff', 10, 'center'));
  }
  function drawMenuBg() {
    const cx = performance.now() / 40;
    drawBg(LEVEL_DEFS[0].theme, cx);
    const off = Math.floor(cx) % T;
    for (let x = -1; x <= W / T + 1; x++) { ctx.drawImage(Sprites.grass, x * T - off, 10 * T); ctx.drawImage(Sprites.dirt, x * T - off, 11 * T); }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    if (state === 'menu' || state === 'controls' || state === 'credits') {
      drawMenuBg();
      dim();
      if (state === 'menu') {
        txt('PIXEL QUEST', W / 2, 36, '#ffd54a', 24, 'center');
        drawMenuItems(['Start', 'Controls', 'Credits'], menuIdx, 90);
        txt('HI SCORE ' + String(hi).padStart(6, '0'), W / 2, 150, '#fff', 8, 'center');
        txt('UP/DOWN + ENTER', W / 2, 168, '#aaa', 8, 'center');
      } else if (state === 'controls') {
        txt('CONTROLS', W / 2, 20, '#ffd54a', 14, 'center');
        ['A / D / Arrows  - move', 'W / Up / Space  - jump', 'Jump on slimes to stomp',
         'P / Esc          - pause', 'M               - mute', 'Reach the flag!'].forEach((s, i) => txt(s, 60, 56 + i * 14, '#fff', 8));
        txt('ENTER - back', W / 2, 168, '#aaa', 8, 'center');
      } else {
        txt('CREDITS', W / 2, 20, '#ffd54a', 14, 'center');
        ['Pixel Quest', 'Code, sprites, sounds: original,', 'generated procedurally (Canvas,', 'Web Audio). No external assets.', 'License: CC0 / public domain']
          .forEach((s, i) => txt(s, W / 2, 56 + i * 14, '#fff', 8, 'center'));
        txt('ENTER - back', W / 2, 168, '#aaa', 8, 'center');
      }
      return;
    }
    drawWorld(); drawHud();
    if (state === 'pause') {
      dim(); txt('PAUSED', W / 2, 52, '#ffd54a', 18, 'center');
      drawMenuItems(['Resume', 'Restart', 'Main menu'], pauseIdx, 90);
    } else if (state === 'clear') {
      dim(); txt('LEVEL CLEAR!', W / 2, 60, '#ffd54a', 18, 'center');
      txt('+100', W / 2, 90, '#fff', 10, 'center');
      txt('ENTER - continue', W / 2, 120, '#aaa', 8, 'center');
    } else if (state === 'over' || state === 'win') {
      dim();
      const win = state === 'win';
      txt(win ? 'YOU WIN!' : 'GAME OVER', W / 2, 44, win ? '#7CFC7C' : '#ff5252', 22, 'center');
      txt('SCORE ' + String(g.score).padStart(6, '0'), W / 2, 84, '#fff', 10, 'center');
      txt('HI ' + String(hi).padStart(6, '0'), W / 2, 98, '#ffd54a', 8, 'center');
      if (g.rec) txt('NEW RECORD!', W / 2, 112, '#ffd54a', 10, 'center');
      txt('ENTER - restart', W / 2, 136, '#fff', 8, 'center');
      txt('ESC - main menu', W / 2, 148, '#aaa', 8, 'center');
    }
  }

  // Пауза при потере фокуса
  addEventListener('blur', () => { if (state === 'play') { pauseIdx = 0; state = 'pause'; } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') { pauseIdx = 0; state = 'pause'; } });

  // ---------- Игровой цикл: фиксированный шаг 1/60 с ----------
  // Запускается один раз, поэтому утечек requestAnimationFrame при рестарте нет
  const STEP = 1 / 60;
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.25, (now - last) / 1000); last = now;
    while (acc >= STEP) { update(STEP); Input.endFrame(); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
