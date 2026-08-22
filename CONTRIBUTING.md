# Contributing to Pocket Hell

Pocket Hell is deliberately small and beginner-friendly. Contributions should make the project easier to understand, play or extend before making it more complicated.

## Local setup

```bash
git clone https://github.com/davidUSboy/pocket-hell.git
cd pocket-hell
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run check
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
6. Keep pull requests focused; unrelated refactors should be separate.

## Pull requests

Describe what changed, why it helps and how it was tested. Visual changes should include a screenshot. Gameplay changes should mention any balance effect and whether the level remains completable.

By contributing, you agree that your contribution is licensed under the project's MIT License and that you have the right to submit all included code and assets.
