// Gobble Dash: game state, physics, HUD and every screen.
// States: title -> playing -> paused | caught | escaped.
import { World, WORLD } from './world.js';
import { SoundBank } from './audio.js';
import {
  drawSky, drawGround, drawForestGate, drawTurkey, drawFarmer,
  drawOven, drawKnife, drawHayBale, drawFence, drawPumpkin, drawCorn, drawFeather,
} from './sprites.js';

const TURKEY_X = 230;
const GRAVITY = 2000;
const JUMP_V = -920;
const BEST_KEY = 'gobble-dash-best';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = WORLD.width;
    this.H = WORLD.height;
    this.sounds = new SoundBank();
    this.world = new World(1);
    this.state = 'title';
    this.time = 0;
    this.runPhase = 0;
    this.score = 0;
    this.lives = 3;
    this.speed = WORLD.baseSpeed;
    this.speedBoost = 0; // +1 faster, -1 slower (arrow keys)
    this.farmerGap = 150; // px between farmer and turkey; 0 = caught
    this.invuln = 0;
    this.particles = [];
    this.turkey = this.freshTurkey();
    this.best = Number(localStorage.getItem(BEST_KEY) || 0);
    this.message = '';
    this.messageT = 0;
    this.endReason = '';
    this.endStats = null;
    this.shot = null; // 'start' | 'play' | 'caught' | 'escaped'
    this.keys = new Set();
    this.buttons = []; // {x,y,w,h,label,action} for mouse clicks
    this.statusEl = document.getElementById('status');
  }

  freshTurkey() {
    return {
      x: TURKEY_X, y: WORLD.groundY - 46,
      w: 64, h: 88, vy: 0,
      onGround: true, sliding: false, flapping: false,
    };
  }

  start(seed) {
    this.world.reset(seed ?? (Date.now() % 100000));
    this.state = 'playing';
    this.time = 0;
    this.score = 0;
    this.lives = 3;
    this.speed = WORLD.baseSpeed;
    this.speedBoost = 0;
    this.farmerGap = 150;
    this.invuln = 0;
    this.particles = [];
    this.turkey = this.freshTurkey();
    this.message = 'RUN! The farmer is coming!';
    this.messageT = 2.2;
    this.sounds.ensure();
    this.sounds.gobble();
    this.announce('Game started. Run from the farmer, jump the bales and ovens, duck the knives.');
  }

  restart() { this.start(); }

  togglePause() {
    if (this.state === 'playing') { this.state = 'paused'; this.announce('Paused.'); }
    else if (this.state === 'paused') { this.state = 'playing'; this.announce('Resumed.'); }
  }

  toggleMute() {
    this.sounds.muted = !this.sounds.muted;
    this.message = this.sounds.muted ? 'Sound off (M to turn on)' : 'Sound on';
    this.messageT = 1.4;
  }

  jump() {
    if (this.state !== 'playing') return;
    const t = this.turkey;
    if (t.onGround) {
      t.vy = JUMP_V;
      t.onGround = false;
      t.flapping = true;
      this.sounds.ensure();
      this.sounds.jump();
      this.burst(t.x, WORLD.groundY, 6, '#c9a227');
    }
  }

  slide(on) {
    if (this.state !== 'playing') return;
    this.turkey.sliding = on && this.turkey.onGround;
  }

  announce(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  burst(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 260,
        vy: -Math.random() * 200 - 40,
        life: 0.5 + Math.random() * 0.4,
        color,
        size: 3 + Math.random() * 5,
      });
    }
  }

  hitObstacle(ob) {
    if (this.invuln > 0 || this.world.featherTimer > 0) return;
    this.lives -= 1;
    this.invuln = 1.6;
    this.farmerGap = Math.max(24, this.farmerGap - 28);
    this.sounds.hit();
    this.burst(this.turkey.x, this.turkey.y, 14, '#d23c2e');
    this.burst(this.turkey.x, this.turkey.y, 8, '#f7c873');
    this.world.obstacles = this.world.obstacles.filter((o) => o !== ob);
    if (this.lives <= 0) {
      this.endRun('caught', 'The farmer got you!');
    } else {
      this.message = ob.type === 'oven' ? 'Ouch! That oven is HOT!' :
        ob.type === 'knife' ? 'A carving knife! Duck next time!' :
        'Watch out! The farmer is closer!';
      this.messageT = 1.6;
      this.announce(`Hit a ${ob.type}. ${this.lives} ${this.lives === 1 ? 'life' : 'lives'} left.`);
    }
  }

  endRun(kind, reason) {
    this.state = kind; // 'caught' or 'escaped'
    this.endReason = reason;
    this.messageT = 0;
    const d = Math.floor(this.world.distance);
    this.endStats = {
      score: this.score,
      distance: d,
      corn: this.cornCount || 0,
      time: this.time.toFixed(1),
      best: Math.max(this.best, d),
    };
    if (d > this.best) {
      this.best = d;
      localStorage.setItem(BEST_KEY, String(d));
    }
    if (kind === 'caught') this.sounds.caught();
    else this.sounds.escaped();
    this.announce(kind === 'caught'
      ? `Caught! ${reason} You ran ${d} metres and scored ${this.score}. Press R to run again.`
      : `Escaped! You reached the forest after ${d} metres and scored ${this.score}. Press R to run again.`);
  }

  update(dt) {
    this.time += dt;
    if (this.messageT > 0) this.messageT -= dt;
    if (this.invuln > 0) this.invuln -= dt;

    // Particles always drift.
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.state !== 'playing') return;

    // Speed: base ramps with distance; arrows nudge it; feather gives a burst.
    const ramp = Math.min(70, this.world.distance * 0.07);
    let target = WORLD.baseSpeed + ramp + this.speedBoost * 70;
    if (this.world.featherTimer > 0) target += 150;
    this.speed += (target - this.speed) * Math.min(1, dt * 2);

    const t = this.turkey;
    // Vertical physics.
    if (!t.onGround) {
      t.vy += GRAVITY * dt;
      t.y += t.vy * dt;
      if (t.y >= WORLD.groundY - 46) {
        t.y = WORLD.groundY - 46;
        t.vy = 0; t.onGround = true; t.flapping = false;
        this.burst(t.x, WORLD.groundY, 4, '#c9a227');
      }
    }
    t.h = t.sliding ? 52 : 88;
    t.y = t.onGround ? WORLD.groundY - t.h / 2 - 2 : t.y;

    this.runPhase += dt * (this.speed / 260);
    this.world.update(dt, this.speed);

    // Cleanly passing an obstacle buys a little breathing room.
    for (const ob of this.world.obstacles) {
      if (!ob.passed && ob.x + ob.w / 2 < this.turkey.x - this.turkey.w / 2) {
        ob.passed = true;
        this.farmerGap = Math.min(220, this.farmerGap + 3);
      }
    }

    // Farmer chase: he gains when you run slow or get hit, loses when
    // you sprint or grab corn. Gap 0 means caught.
    const pace = this.speed - WORLD.baseSpeed - ramp;
    this.farmerGap += (pace * 0.045 - 1.2) * dt;
    this.farmerGap = Math.max(0, Math.min(220, this.farmerGap));
    if (this.farmerGap <= 0) {
      this.endRun('caught', 'The farmer ran you down!');
      return;
    }

    // Pickups.
    const got = this.world.collect(t);
    for (const kind of got) {
      if (kind === 'corn') {
        this.score += 50;
        this.cornCount = (this.cornCount || 0) + 1;
        this.farmerGap = Math.min(220, this.farmerGap + 12);
        this.sounds.pickup();
      } else if (kind === 'feather') {
        this.world.featherTimer = 4;
        this.score += 100;
        this.message = 'Golden feather! Speed burst!';
        this.messageT = 1.6;
        this.sounds.pickup();
      }
    }

    // Collisions.
    const ob = this.world.collide(t);
    if (ob) this.hitObstacle(ob);

    // Score ticks up with distance.
    this.score += Math.floor(this.speed * dt * 0.25);

    // Escape!
    if (this.world.distance >= WORLD.escapeDistance) {
      this.endRun('escaped', 'You made it to the forest!');
    }
  }

  // ---------- rendering ----------
  draw() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    ctx.clearRect(0, 0, W, H);
    this.buttons = [];

    drawSky(ctx, W, H, this.time, this.world.pixels);
    drawGround(ctx, W, H, WORLD.groundY, this.time, this.world.pixels);

    if (this.state === 'title') { this.drawTitle(); return; }

    // World objects.
    for (const ob of this.world.obstacles) {
      if (ob.type === 'oven') drawOven(ctx, ob.x, WORLD.groundY, 1, this.time);
      else if (ob.type === 'knife') drawKnife(ctx, ob.x, ob.y, 1, ob.rot);
      else if (ob.type === 'hay') drawHayBale(ctx, ob.x, WORLD.groundY, 1);
      else if (ob.type === 'fence') drawFence(ctx, ob.x, WORLD.groundY, 1);
      else if (ob.type === 'pumpkin') drawPumpkin(ctx, ob.x, WORLD.groundY, 1, this.time);
    }
    for (const p of this.world.pickups) {
      if (p.kind === 'corn') drawCorn(ctx, p.x, p.y, 1, this.time);
      else drawFeather(ctx, p.x, p.y, 1, this.time);
    }

    // Forest gate near the end.
    const gateX = TURKEY_X + (WORLD.escapeDistance - this.world.distance) * 28;
    if (gateX < W + 200 && gateX > -200) drawForestGate(ctx, gateX, WORLD.groundY);

    // Farmer behind the turkey.
    const farmerX = TURKEY_X - this.farmerGap - 30;
    const blink = (this.time % 3.4) < 0.12;
    drawFarmer(ctx, farmerX, WORLD.groundY - 40, 1.05, this.runPhase, this.farmerGap < 70);

    // Turkey (blink while invulnerable).
    if (this.invuln <= 0 || Math.floor(this.time * 12) % 2 === 0) {
      drawTurkey(ctx, TURKEY_X, this.turkey.y, 1, this.runPhase, this.turkey.sliding, this.turkey.flapping, blink);
    }

    // Particles.
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    this.drawHud();

    if (this.state === 'paused') this.drawPaused();
    if (this.state === 'caught') this.drawEnd(false);
    if (this.state === 'escaped') this.drawEnd(true);
  }

  drawHud() {
    const ctx = this.ctx;
    const d = Math.floor(this.world.distance);
    // Top bar.
    ctx.fillStyle = 'rgba(20, 8, 20, 0.55)';
    ctx.fillRect(0, 0, this.W, 64);
    ctx.fillStyle = '#f7c873';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE  ${this.score.toLocaleString()}`, 20, 42);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(`DISTANCE  ${d} m / ${WORLD.escapeDistance} m`, 330, 40);
    // Distance progress.
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(330, 50, 260, 6);
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(330, 50, 260 * Math.min(1, d / WORLD.escapeDistance), 6);
    // Lives as hearts.
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < this.lives ? '#ff4d6d' : 'rgba(255,255,255,0.25)';
      const hx = 640 + i * 36, hy = 34;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 10);
      ctx.bezierCurveTo(hx - 12, hy - 2, hx - 7, hy - 12, hx, hy - 4);
      ctx.bezierCurveTo(hx + 7, hy - 12, hx + 12, hy - 2, hx, hy + 10);
      ctx.fill();
    }
    // Farmer proximity meter.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('FARMER', 1075, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(975, 38, 180, 10);
    const danger = 1 - this.farmerGap / 220;
    ctx.fillStyle = danger > 0.7 ? '#ff3b2e' : danger > 0.4 ? '#f2a93b' : '#7ec850';
    ctx.fillRect(975, 38, 180 * danger, 10);
    ctx.fillStyle = danger > 0.7 ? '#ff6b5e' : '#fff';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(danger > 0.7 ? 'HE IS RIGHT BEHIND YOU!' : danger > 0.4 ? 'He is gaining...' : 'Keep running!', 1155, 66);

    // Feather burst timer.
    if (this.world.featherTimer > 0) {
      ctx.fillStyle = '#f7c873';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(`FEATHER BURST ${this.world.featherTimer.toFixed(1)}s`, 20, 96);
    }
    // Toast message.
    if (this.messageT > 0) {
      ctx.fillStyle = 'rgba(20, 8, 20, 0.6)';
      const tw = ctx.measureText(this.message).width + 36;
      ctx.fillRect((this.W - tw) / 2, 84, tw, 38);
      ctx.fillStyle = '#ffe9b0';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, this.W / 2, 110);
    }
    // Bottom hint.
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = '15px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('SPACE / click: jump    ↓ / S: duck    ← →: pace    P: pause    M: mute', 20, this.H - 14);
  }

  button(x, y, w, h, label, action, fill) {
    const ctx = this.ctx;
    ctx.fillStyle = fill || '#d23c2e';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 8);
    this.buttons.push({ x, y, w, h, action });
  }

  drawTitle() {
    const ctx = this.ctx;
    const W = this.W;
    // Warm panel.
    ctx.fillStyle = 'rgba(20, 8, 20, 0.45)';
    ctx.fillRect(0, 0, W, this.H);

    // Big turkey mascot.
    drawTurkey(ctx, W * 0.78, 430, 2.1, 1.2, false, false, false);
    drawFarmer(ctx, 175, 568, 1.1, 0.6, true);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f7c873';
    ctx.font = 'bold 92px Georgia, serif';
    ctx.fillText('GOBBLE DASH', W / 2, 150);
    ctx.fillStyle = '#ffb08a';
    ctx.font = 'italic bold 30px Georgia, serif';
    ctx.fillText('A turkey\'s Thanksgiving escape', W / 2, 198);

    ctx.fillStyle = '#fff';
    ctx.font = '21px Georgia, serif';
    const lines = [
      'Thanksgiving is coming — and you are the main course.',
      'Outrun the farmer, leap the hay bales and the glowing oven,',
      'duck the flying carving knives, and grab corn to stay ahead.',
      'Reach the forest gate at 1000 m and you are free.',
    ];
    lines.forEach((ln, i) => ctx.fillText(ln, W / 2, 268 + i * 32));

    this.button(W / 2 - 130, 430, 260, 64, '▶  START RUN', 'start', '#c96a2e');
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('SPACE / click: jump      ↓ / S: duck under knives      ← →: change pace', W / 2, 540);
    ctx.fillText('P: pause      M: mute      R: restart', W / 2, 570);
    if (this.best > 0) {
      ctx.fillStyle = '#f7c873';
      ctx.font = 'bold 20px Georgia, serif';
      ctx.fillText(`Best escape so far: ${this.best} m`, W / 2, 610);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '15px Georgia, serif';
    ctx.fillText('A completely original game — art, code and sounds made for this bounty.', W / 2, 690);
  }

  drawPaused() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 4, 10, 0.6)';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.W / 2, 320);
    ctx.font = '22px Georgia, serif';
    ctx.fillText('The farmer waits for no turkey. Press P to keep running.', this.W / 2, 368);
    this.button(this.W / 2 - 110, 400, 220, 56, 'RESUME', 'resume', '#2a7a3a');
  }

  drawEnd(escaped) {
    const ctx = this.ctx;
    const W = this.W;
    ctx.fillStyle = escaped ? 'rgba(10, 40, 16, 0.72)' : 'rgba(30, 6, 8, 0.72)';
    ctx.fillRect(0, 0, W, this.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = escaped ? '#a8e88a' : '#ff8a7a';
    ctx.font = 'bold 76px Georgia, serif';
    ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', W / 2, 190);
    ctx.fillStyle = '#fff';
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText(escaped
      ? 'You burst through the forest gate — no Thanksgiving dinner today!'
      : 'The farmer grabs you by the drumstick... Thanksgiving dinner it is.', W / 2, 240);

    const s = this.endStats || { score: 0, distance: 0, corn: 0, time: '0', best: 0 };
    ctx.font = '24px Georgia, serif';
    ctx.fillText(`Distance  ${s.distance} m      Score  ${s.score.toLocaleString()}`, W / 2, 310);
    ctx.fillText(`Corn grabbed  ${s.corn}      Time  ${s.time}s      Best  ${s.best} m`, W / 2, 350);
    if (!escaped) {
      ctx.fillStyle = '#f7c873';
      ctx.font = '20px Georgia, serif';
      ctx.fillText('Tip: corn pushes the farmer back — and duck under flying knives with ↓.', W / 2, 398);
    } else {
      ctx.fillStyle = '#f7c873';
      ctx.font = '20px Georgia, serif';
      ctx.fillText('The forest is yours. Gobble gobble!', W / 2, 398);
    }
    this.button(W / 2 - 130, 440, 260, 64, '↻  RUN AGAIN  (R)', 'start', escaped ? '#2a7a3a' : '#c96a2e');
  }

  clickAt(cx, cy) {
    // Logical coordinates (canvas is 1280x720).
    const rect = this.canvas.getBoundingClientRect();
    const x = (cx - rect.left) * (this.W / rect.width);
    const y = (cy - rect.top) * (this.H / rect.height);
    for (const b of this.buttons) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.sounds.ensure();
        this.sounds.click();
        if (b.action === 'start') this.start();
        else if (b.action === 'resume') this.togglePause();
        return true;
      }
    }
    if (this.state === 'playing') { this.jump(); return true; }
    return false;
  }
}
