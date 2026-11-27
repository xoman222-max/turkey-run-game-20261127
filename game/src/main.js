// Bootstrap: input, the game loop, and the deterministic screenshot mode
// used to take the entry's screenshots (?shot=start|play|caught|escaped).
import { Game } from './game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);
window.__game = game; // play-test hook for the browser console

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1);

function applyShot() {
  if (!shot) return;
  game.shot = shot;
  if (shot === 'start') {
    game.state = 'title';
  } else if (shot === 'play') {
    // A lively mid-run frame: simulate ~7 s with an autopilot that
    // jumps over obstacles, on a fixed seed, so the shot is identical
    // every time it is taken.
    game.start(seed);
    const dt = 1 / 60;
    const autopilot = () => {
      const t = game.turkey;
      const near = game.world.obstacles.filter((o) => o.x - t.x < 220);
      const knifeNear = near.some((o) => o.type === 'knife' && o.x - t.x > -70);
      const ground = near.filter((o) => o.type !== 'knife' && o.x > t.x && o.x - t.x < 130).sort((a, b) => a.x - b.x)[0];
      if (knifeNear && t.onGround) game.slide(true);
      else {
        game.slide(false);
        if (ground && t.onGround) game.jump();
      }
    };
    for (let i = 0; i < 420; i++) {
      autopilot();
      game.update(dt);
      if (game.state !== 'playing') break;
    }
    game.slide(false);
    game.invuln = 0; // never catch the turkey mid-blink in the screenshot
    game.message = 'Corn ahead! Keep the farmer behind you!';
    game.messageT = 99;
  } else if (shot === 'caught') {
    game.start(seed);
    const dt = 1 / 60;
    for (let i = 0; i < 300; i++) {
      const t = game.turkey;
      const near = game.world.obstacles.filter((o) => o.x - t.x < 220);
      const knifeNear = near.some((o) => o.type === 'knife' && o.x - t.x > -70);
      const ground = near.filter((o) => o.type !== 'knife' && o.x > t.x && o.x - t.x < 130).sort((a, b) => a.x - b.x)[0];
      if (knifeNear && t.onGround) game.slide(true);
      else {
        game.slide(false);
        if (ground && t.onGround) game.jump();
      }
      game.update(dt);
      if (game.state !== 'playing') break;
    }
    game.slide(false);
    game.endRun('caught', 'The farmer got you!');
    // Put a few obstacles on screen behind the end panel for context.
    game.world.obstacles = [
      { type: 'oven', x: 1050, w: 88, h: 96, y: 620, vx: 0, rot: 0, spin: 0 },
      { type: 'hay', x: 180, w: 62, h: 62, y: 620, vx: 0, rot: 0, spin: 0 },
    ];
  } else if (shot === 'escaped') {
    game.start(seed);
    game.world.distance = 1000;
    game.score = 12450;
    game.cornCount = 21;
    game.time = 96.4;
    game.endRun('escaped', 'You made it to the forest!');
  }
  game.draw();
}

// Keyboard.
const HANDLED = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
window.addEventListener('keydown', (e) => {
  if (HANDLED.has(e.code)) e.preventDefault();
  if (e.repeat) return;
  game.keys.add(e.code);
  game.sounds.ensure();
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    if (game.state === 'title') game.start();
    else if (game.state === 'caught' || game.state === 'escaped') game.start();
    else game.jump();
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    game.slide(true);
  } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    game.speedBoost = Math.max(-1, game.speedBoost - 1);
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    game.speedBoost = Math.min(1, game.speedBoost + 1);
  } else if (e.code === 'KeyP' || e.code === 'Escape') {
    game.togglePause();
  } else if (e.code === 'KeyM') {
    game.toggleMute();
  } else if (e.code === 'KeyR') {
    if (game.state !== 'title') game.start();
  } else if (e.code === 'Enter') {
    if (game.state === 'title' || game.state === 'caught' || game.state === 'escaped') game.start();
  }
});
window.addEventListener('keyup', (e) => {
  game.keys.delete(e.code);
  if (e.code === 'ArrowDown' || e.code === 'KeyS') game.slide(false);
});

// Mouse / touch: buttons first, otherwise a click jumps.
canvas.addEventListener('pointerdown', (e) => {
  game.sounds.ensure();
  game.clickAt(e.clientX, e.clientY);
});

// Main loop.
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shot) {
    game.update(dt);
    game.draw();
  }
  requestAnimationFrame(frame);
}

applyShot();
if (!shot) requestAnimationFrame(frame);
else document.title = `Gobble Dash [shot=${shot}]`;
