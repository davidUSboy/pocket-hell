export type Action =
  | 'forward'
  | 'backward'
  | 'turnLeft'
  | 'turnRight'
  | 'strafeLeft'
  | 'strafeRight'
  | 'shoot'
  | 'use'
  | 'pause'
  | 'toggleMap';

export type GameMode = 'title' | 'running' | 'paused' | 'dead' | 'won';

export interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  ammo: number;
  kills: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  alive: boolean;
  attackCooldown: number;
  hitFlash: number;
  phase: number;
}

export type PickupKind = 'ammo' | 'health';

export interface Pickup {
  id: number;
  x: number;
  y: number;
  kind: PickupKind;
  active: boolean;
  phase: number;
}

export interface LevelData {
  rows: string[];
  player: Pick<Player, 'x' | 'y' | 'angle'>;
  enemies: Array<Pick<Enemy, 'x' | 'y'>>;
  pickups: Array<Pick<Pickup, 'x' | 'y' | 'kind'>>;
}

export interface RenderState {
  mode: GameMode;
  player: Player;
  enemies: Enemy[];
  pickups: Pickup[];
  weaponKick: number;
  damageFlash: number;
  elapsed: number;
  message: string;
  showMap: boolean;
}

export interface RayHit {
  distance: number;
  tile: number;
  side: 0 | 1;
  mapX: number;
  mapY: number;
  wallOffset: number;
}
