/* entities.js — физика, игрок, враги */
const SPEED = 90, JUMP = 300, MAXFALL = 400;

function solidAt(L, tx, ty) {
  if (tx < 0 || tx >= L.w) return true;           // границы уровня — стены
  if (ty < 0 || ty >= L.h) return false;
  const c = L.tiles[ty][tx];
  return c === '#' || c === '=';
}
function tileAt(L, tx, ty) {
  if (tx < 0 || tx >= L.w || ty < 0 || ty >= L.h) return '.';
  return L.tiles[ty][tx];
}
function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Движение тела по осям отдельно с разрешением столкновений с тайлами
function moveBody(b, L, dt) {
  b.onGround = false; b.hitWall = false;
  const vx = b.vx;
  b.x += vx * dt;
  let x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.001) / T);
  let y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.001) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (solidAt(L, tx, ty)) {
      if (vx > 0) b.x = tx * T - b.w; else if (vx < 0) b.x = (tx + 1) * T;
      b.hitWall = true;
    }
  }
  const vy = b.vy;
  b.y += vy * dt;
  x0 = Math.floor(b.x / T); x1 = Math.floor((b.x + b.w - 0.001) / T);
  y0 = Math.floor(b.y / T); y1 = Math.floor((b.y + b.h - 0.001) / T);
  let hit = false;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (solidAt(L, tx, ty)) {
      if (vy > 0) { b.y = ty * T - b.h; b.onGround = true; }
      else if (vy < 0) b.y = (ty + 1) * T;
      hit = true;
    }
  }
  if (hit) b.vy = 0;
}

function touchesSpike(L, p) {
  const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 1) / T);
  const y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + p.h - 1) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (tileAt(L, tx, ty) === '^' && overlap(p.x, p.y, p.w, p.h, tx * T + 3, ty * T + 8, 10, 8)) return true;
  }
  return false;
}

class Player {
  constructor(hp) {
    this.w = 10; this.h = 14; this.hp = hp; this.facing = 1;
    this.respawn(); this.inv = 0;
  }
  respawn() {
    this.x = 2 * T + 3; this.y = 10 * T - this.h;
    this.vx = 0; this.vy = 0; this.inv = 1.5;
    this.onGround = false; this.jb = 0; this.ct = 0; this.anim = 0;
  }
  update(dt, L) {
    const dir = (Input.isDown('right') ? 1 : 0) - (Input.isDown('left') ? 1 : 0);
    const target = dir * SPEED;
    const acc = 900 * dt;
    if (this.vx < target) this.vx = Math.min(target, this.vx + acc);
    else if (this.vx > target) this.vx = Math.max(target, this.vx - acc);
    if (dir) this.facing = dir;

    this.vy = Math.min(this.vy + GRAV * dt, MAXFALL);
    // Буфер прыжка и «койот-тайм» — прыжок прощает небольшие ошибки по времени
    if (Input.pressed('jump')) this.jb = 0.1; else this.jb -= dt;
    if (this.onGround) this.ct = 0.1; else this.ct -= dt;
    if (this.jb > 0 && this.ct > 0) { this.vy = -JUMP; this.jb = 0; this.ct = 0; Sfx.play('jump'); }
    if (!Input.isDown('jump') && this.vy < -100) this.vy = -100; // короткий прыжок

    moveBody(this, L, dt);
    this.anim += dt * Math.abs(this.vx) / 90;
    if (this.inv > 0) this.inv -= dt;
  }
  hurt() {
    if (this.inv > 0) return false;
    this.hp--; this.inv = 1.3; this.vy = -180; Sfx.play('hurt');
    return true;
  }
}

class Enemy {
  constructor(col) {
    this.w = 12; this.h = 8;
    this.x = col * T + 2; this.y = 10 * T - 8;
    this.vx = -28; this.vy = 0; this.dead = false; this.t = Math.random() * 2;
  }
  update(dt, L) {
    this.t += dt;
    this.vy = Math.min(this.vy + GRAV * dt, MAXFALL);
    moveBody(this, L, dt);
    if (this.hitWall) this.vx = -this.vx;
    if (this.onGround) {
      // Разворот перед краем платформы или шипами
      const ax = this.vx > 0 ? this.x + this.w + 1 : this.x - 1;
      const tx = Math.floor(ax / T);
      const fy = Math.floor((this.y + this.h - 1) / T);
      const by = Math.floor((this.y + this.h + 1) / T);
      if (!solidAt(L, tx, by) || tileAt(L, tx, fy) === '^') this.vx = -this.vx;
    }
  }
}
