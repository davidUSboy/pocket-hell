# Customization guide

## Change the level

Open `src/game/level.ts`. Each character is one tile:

| Value | Meaning |
| --- | --- |
| `0` | Empty floor |
| `1` | Brick wall |
| `2` | Tech-panel wall |
| `3` | Door opened with the Use action |
| `9` | Exit tile |

Keep the outer edge closed with walls so rays always hit something.

## Change game balance

Most balancing values live in `src/game/constants.ts`:

- movement and rotation speed;
- player radius;
- starting health and ammo;
- field of view;
- shooting cooldown;
- door interaction distance.

Enemy speed, damage and detection range are intentionally visible in `src/game/game.ts` beside the AI logic.

## Change the handheld

The device, buttons, scanlines, hands and responsive layout are all CSS in `src/style.css`. No image is required.

## Change the pixel palette

Edit `PALETTE` in `src/game/constants.ts`, then update the matching CSS custom properties at the top of `src/style.css`.

## Add a new pickup

1. Add a new value to `PickupKind` in `src/game/types.ts`.
2. Place it in `LEVEL.pickups`.
3. Draw it in `Renderer.createPickupSprite()`.
4. Apply its effect in `Game.updatePickups()`.
