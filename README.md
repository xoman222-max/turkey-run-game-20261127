# Gobble Dash — A Turkey's Thanksgiving Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/xoman222-max/turkey-run-game-20261127/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/xoman222-max/turkey-run-game-20261127/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Thanksgiving is coming — and you are the main course. **Gobble Dash** is a complete, original 2D runner: outrun the farmer, leap the hay bales and the glowing oven, duck the flying carving knives, grab corn to stay ahead, and reach the forest gate at 1000 m to escape.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `game/index.html` and its ES modules, with all art drawn in code and all sounds synthesized with WebAudio.

## How to play

| Input | Action |
| --- | --- |
| Space / ↑ / W / click | Jump |
| ↓ / S | Duck under flying knives |
| ← / → (A / D) | Slow down / sprint |
| P / Esc | Pause |
| M | Mute |
| R / Enter | Restart |

- **HUD:** score, distance to the 1000 m forest gate, 3 lives, and a farmer-proximity meter — he gains on you when you run slow or get hit, and falls back when you sprint or grab corn.
- **Hazards:** hay bales, fences, rolling pumpkins, the glowing oven, and flying carving knives.
- **Pickups:** corn (+50, pushes the farmer back) and the rare golden feather (4 s speed burst).
- **Endings:** caught by the farmer (or out of lives) vs. escaped through the forest gate — both with stats and one-key restart. Your best distance is saved locally.

## Files

- `game/` — the game (`index.html`, `src/main.js`, `src/game.js`, `src/world.js`, `src/sprites.js`, `src/rng.js`, `src/audio.js`)
- `screenshots/` — 4 real renders: title, gameplay, caught, escaped
- `main.ts` — the entry program: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the make.fun dossier library, unchanged from the kit
- `serve.ts` — tiny static server for local play
- `shots.json` — the `?shot=` scenes the screenshots were taken from (deterministic, seeded)

---

<sub>Entered on [make.fun](https://make.fun/?ref=b8rrz4sr&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
