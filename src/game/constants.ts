export const SCREEN_WIDTH = 160;
export const SCREEN_HEIGHT = 144;
export const VIEW_HEIGHT = 111;
export const HUD_HEIGHT = SCREEN_HEIGHT - VIEW_HEIGHT;

export const FOV = Math.PI / 3;
export const MOVE_SPEED = 2.15;
export const STRAFE_SPEED = 1.7;
export const ROTATION_SPEED = 1.85;
export const PLAYER_RADIUS = 0.2;

export const STARTING_HEALTH = 100;
export const STARTING_AMMO = 18;
export const SHOT_COOLDOWN = 0.28;
export const USE_DISTANCE = 0.9;

export const PALETTE = {
  darkest: '#0f380f',
  dark: '#306230',
  mid: '#8bac0f',
  light: '#9bbc0f',
  paper: '#dce6a0',
} as const;
