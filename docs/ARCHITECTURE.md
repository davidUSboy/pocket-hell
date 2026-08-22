# Pocket Hell architecture

Pocket Hell is a small pseudo-3D first-person shooter. The world is stored as a two-dimensional grid, while the renderer creates depth by casting one ray for each vertical screen column.

## Frame lifecycle

```text
requestAnimationFrame
        │
        ▼
 InputManager ──► Game.update(deltaTime)
                      │
                      ├── movement and collision
                      ├── shooting and doors
                      ├── enemy AI
                      ├── pickups and exit
                      └── game-state transitions
                              │
                              ▼
                       Renderer.render(state)
                              │
                              ├── wall rays
                              ├── depth-buffered sprites
                              ├── weapon and HUD
                              └── overlays
```

## Raycasting

For every screen column, the renderer:

1. Converts the column into a camera-space X coordinate from `-1` to `1`.
2. Combines the player direction with a camera plane to create a ray direction.
3. Uses Digital Differential Analysis (DDA) to step through map cells.
4. Stops when the ray enters a blocking tile.
5. Converts perpendicular wall distance into a vertical line height.
6. Chooses one of four monochrome shades using distance, wall side and a procedural pattern.

The result is not polygonal 3D. It is a fast 2D visibility technique that produces a convincing first-person view.

## Sprites

Enemies and pickups are small transparent canvases generated in code. Each sprite is transformed into camera space and projected onto the screen. A one-value-per-column depth buffer prevents sprites from drawing through walls.

## Collision

The player is represented by a circle. Movement is resolved separately on the X and Y axes so the player slides naturally along walls instead of stopping completely at a corner.

## Enemy AI

Each enemy has a compact state:

- alive or dead;
- health;
- attack cooldown;
- hit-flash timer;
- animation phase.

An enemy chases only when the player is within range and a sampled line-of-sight path contains no blocking tiles. At close range it attacks on a cooldown.

## Input and animated hands

Keyboard and on-screen controls map to the same semantic actions: `forward`, `turnLeft`, `shoot`, `use`, and so on. The hand animator listens to those actions and changes data attributes on the device stage. CSS transforms then move each thumb toward the active control.

## Audio

The Web Audio API creates short oscillators and noise bursts at runtime. This keeps the repository small and avoids external audio files.

## Extension points

The cleanest next steps are:

- multiple levels and a level-selection screen;
- animated doors instead of instant tile removal;
- ranged enemies and projectiles;
- texture atlases;
- a tiny in-browser map editor;
- saved settings through `localStorage`;
- gamepad support.
