# Beginner learning path

Pocket Hell is designed to be read in small passes rather than understood all at once.

## Lesson 1 — Change the world

Open `src/game/level.ts`, edit the number grid and run the game. Keep the outside border closed. This teaches how a 2D map can describe a first-person world.

## Lesson 2 — Follow one ray

Open `Renderer.castRay()` in `src/game/renderer.ts`. Trace how a screen column becomes a ray, how DDA walks through map cells and how wall distance becomes vertical height.

## Lesson 3 — Move and collide

Read `PocketHellGame.updatePlayer()` and `canOccupy()` in `src/game/game.ts`. Change movement speed and player radius, then test corners and narrow doors.

## Lesson 4 — Shoot an enemy

Follow `shoot()` from input to ammunition, angle checks, line of sight, damage and kill count. Change enemy health from two hits to three.

## Lesson 5 — Extend the game

Choose one small feature:

- animated doors;
- a second enemy type;
- armor pickup;
- gamepad input;
- a second level;
- saved high score;
- a tiny browser map editor.

Keep the first version small, document what changed and open a pull request.

## Suggested reading order

```text
level.ts → constants.ts → input.ts → game.ts → renderer.ts → audio.ts → hands.ts
```

Run this before sharing a change:

```bash
npm run check
```
