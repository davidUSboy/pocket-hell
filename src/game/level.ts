import type { Enemy, LevelData, Pickup } from './types';

export const LEVEL: LevelData = {
  rows: [
    '1111111111111111',
    '1000000000000001',
    '1022220000110001',
    '1000020000010001',
    '1000000000010001',
    '1000111110010001',
    '1000100000010001',
    '1000100333310001',
    '1000100000010001',
    '1000111111010001',
    '1000000000010001',
    '1011110111010001',
    '1000000000000001',
    '1000022220000091',
    '1000000000000001',
    '1111111111111111',
  ],
  player: { x: 2.5, y: 1.8, angle: 0.15 },
  enemies: [
    { x: 7.4, y: 2.4 },
    { x: 12.5, y: 4.5 },
    { x: 7.2, y: 10.5 },
    { x: 12.7, y: 12.4 },
  ],
  pickups: [
    { x: 4.6, y: 4.3, kind: 'ammo' },
    { x: 13.2, y: 8.2, kind: 'health' },
    { x: 3.0, y: 13.2, kind: 'ammo' },
  ],
};

export class LevelMap {
  private tiles: number[][];

  constructor(rows: string[]) {
    this.tiles = rows.map((row) => [...row].map((value) => Number(value)));
  }

  get width(): number {
    return this.tiles[0]?.length ?? 0;
  }

  get height(): number {
    return this.tiles.length;
  }

  getTile(x: number, y: number): number {
    const mapX = Math.floor(x);
    const mapY = Math.floor(y);

    if (mapX < 0 || mapY < 0 || mapY >= this.height || mapX >= this.width) {
      return 1;
    }

    return this.tiles[mapY][mapX];
  }

  setTile(x: number, y: number, tile: number): void {
    if (x < 0 || y < 0 || y >= this.height || x >= this.width) {
      return;
    }

    this.tiles[y][x] = tile;
  }

  isBlocking(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile !== 0 && tile !== 9;
  }

  cloneTiles(): number[][] {
    return this.tiles.map((row) => [...row]);
  }
}

export function createEnemies(): Enemy[] {
  return LEVEL.enemies.map((enemy, index) => ({
    id: index,
    x: enemy.x,
    y: enemy.y,
    health: 2,
    alive: true,
    attackCooldown: 0,
    hitFlash: 0,
    phase: index * 1.7,
  }));
}

export function createPickups(): Pickup[] {
  return LEVEL.pickups.map((pickup, index) => ({
    id: index,
    x: pickup.x,
    y: pickup.y,
    kind: pickup.kind,
    active: true,
    phase: index * 2.1,
  }));
}
