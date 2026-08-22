# Contributing to Pocket Hell

Pocket Hell is deliberately small and beginner-friendly. Contributions should keep the code readable before making it clever.

## Local setup

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run typecheck
npm run build
```

## Good first contributions

- Add a second level in `src/game/level.ts`.
- Add a new wall pattern in `src/game/renderer.ts`.
- Create a new procedural pickup sprite.
- Improve keyboard accessibility or mobile controls.
- Add a small pure-function test suite for ray and collision math.
- Expand the learning notes without hiding the core algorithm behind a library.

## Project rules

1. Do not add proprietary DOOM, Nintendo or other commercial game assets.
2. Keep the runtime dependency-free unless a dependency solves a clearly documented problem.
3. Preserve keyboard, pointer and touch input.
4. Explain non-obvious math with comments or documentation.
5. Keep the game playable as a static GitHub Pages site.
