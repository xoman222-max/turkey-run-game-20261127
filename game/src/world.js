// Level generation and the moving world: obstacles, pickups, the
// farmer's chase and the escape at 1000 m.
import { makeRng, range, pick } from './rng.js';

export const WORLD = {
  width: 1280,
  height: 720,
  groundY: 620,
  escapeDistance: 1000, // metres to the forest gate
  baseSpeed: 260,
  maxSpeed: 460,
};

const OBSTACLE_TYPES = ['hay', 'fence', 'oven', 'knife', 'pumpkin'];

// Hitbox sizes (w, h, y-offset from ground) per obstacle type.
// Widths are a touch narrower than the art, so a jump that looks
// clean never clips a corner.
const SHAPES = {
  hay: { w: 52, h: 62, y: 62 },
  fence: { w: 68, h: 64, y: 64 },
  oven: { w: 72, h: 96, y: 96 },
  knife: { w: 76, h: 20, y: 0 }, // flies at body height; set per instance
  pumpkin: { w: 48, h: 48, y: 48 },
};

export class World {
  constructor(seed) {
    this.rng = makeRng(seed);
    this.distance = 0; // metres run
    this.pixels = 0; // pixels scrolled
    this.obstacles = [];
    this.pickups = [];
    this.nextSpawnAt = 320; // pixels ahead before first obstacle
    this.gateShown = false;
    this.featherTimer = 0;
  }

  reset(seed) {
    this.rng = makeRng(seed);
    this.distance = 0;
    this.pixels = 0;
    this.obstacles = [];
    this.pickups = [];
    this.nextSpawnAt = 320;
    this.gateShown = false;
    this.featherTimer = 0;
  }

  spawnAhead() {
    const rng = this.rng;
    const d = this.distance;
    // Difficulty: tighter gaps and more knives/ovens as distance grows.
    const gap = Math.max(420, range(rng, 380, 600) - Math.min(90, d * 0.08));
    const x = WORLD.width + 120;
    const roll = rng();
    let type;
    if (d < 60) type = pick(rng, ['hay', 'fence']);
    else if (d < 200) type = pick(rng, ['hay', 'fence', 'pumpkin']);
    else if (d < 450) type = pick(rng, ['hay', 'fence', 'pumpkin', 'knife']);
    else type = pick(rng, OBSTACLE_TYPES);
    if (roll < 0.12 && d > 120) type = 'oven';

    const shape = SHAPES[type];
    const ob = {
      type,
      x,
      w: shape.w,
      h: shape.h,
      // Knives fly at turkey-body height; everything else sits on the ground.
      y: type === 'knife' ? WORLD.groundY - range(rng, 75, 115) : WORLD.groundY,
      vx: type === 'knife' ? -70 : 0, // knives drift toward the turkey
      rot: rng() * Math.PI,
      spin: range(rng, -2.4, 2.4),
      passed: false,
    };
    this.obstacles.push(ob);

    // Corn trails: a line of 3-5 cobs, sometimes arcing over a hay bale.
    if (rng() < 0.62) {
      const n = 3 + Math.floor(rng() * 3);
      const arc = type === 'hay' && rng() < 0.5;
      for (let i = 0; i < n; i++) {
        this.pickups.push({
          kind: 'corn',
          x: x + 90 + i * 46,
          y: arc ? WORLD.groundY - 110 - Math.sin((i / (n - 1)) * Math.PI) * 70
                 : WORLD.groundY - 46,
        });
      }
    }
    // Rare golden feather: brief burst of speed + invulnerability.
    if (rng() < 0.10 && d > 150) {
      this.pickups.push({ kind: 'feather', x: x + 220, y: WORLD.groundY - 150 });
    }
    this.nextSpawnAt = this.pixels + gap;
  }

  update(dt, speed) {
    const move = speed * dt;
    this.pixels += move;
    this.distance = this.pixels / 28; // ~28 px per metre
    if (this.featherTimer > 0) this.featherTimer -= dt;

    while (this.pixels > this.nextSpawnAt) this.spawnAhead();

    for (const ob of this.obstacles) {
      ob.x -= move;
      ob.x += ob.vx * dt;
      ob.rot += ob.spin * dt;
    }
    for (const p of this.pickups) p.x -= move;

    this.obstacles = this.obstacles.filter((o) => o.x > -160);
    this.pickups = this.pickups.filter((p) => p.x > -80);
  }

  // Turkey hitbox vs obstacle hitbox. Returns the obstacle hit, or null.
  collide(turkey) {
    for (const ob of this.obstacles) {
      const top = ob.y - ob.h;
      if (
        turkey.x + turkey.w / 2 > ob.x - ob.w / 2 &&
        turkey.x - turkey.w / 2 < ob.x + ob.w / 2 &&
        turkey.y + turkey.h / 2 > top + 6 &&
        turkey.y - turkey.h / 2 < ob.y - 4
      ) return ob;
    }
    return null;
  }

  collect(turkey) {
    const got = [];
    this.pickups = this.pickups.filter((p) => {
      const dx = p.x - turkey.x;
      const dy = p.y - turkey.y;
      if (Math.abs(dx) < 46 && Math.abs(dy) < 52) {
        got.push(p.kind);
        return false;
      }
      return true;
    });
    return got;
  }
}
