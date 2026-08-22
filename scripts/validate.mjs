import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import process from 'node:process';

const REQUIRED_FILES = [
  'index.html',
  'src/main.ts',
  'src/style.css',
  'src/game/game.ts',
  'src/game/renderer.ts',
  'src/game/level.ts',
  '.github/workflows/deploy.yml',
  'README.md',
  'LICENSE',
];

const failures = [];

for (const path of REQUIRED_FILES) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
  }
}

const levelSource = await readFile('src/game/level.ts', 'utf8');
const rowsBlock = levelSource.match(/rows:\s*\[(?<rows>[\s\S]*?)\],\s*player:/u)?.groups?.rows;
const rows = rowsBlock ? [...rowsBlock.matchAll(/'([0-9]+)'/gu)].map((match) => match[1]) : [];

if (rows.length === 0) {
  failures.push('Could not read LEVEL.rows from src/game/level.ts.');
} else {
  const width = rows[0].length;
  const allowedTiles = new Set(['0', '1', '2', '3', '9']);

  rows.forEach((row, rowIndex) => {
    if (row.length !== width) {
      failures.push(`Row ${rowIndex} has width ${row.length}; expected ${width}.`);
    }

    [...row].forEach((tile, columnIndex) => {
      if (!allowedTiles.has(tile)) {
        failures.push(`Unsupported tile '${tile}' at (${columnIndex}, ${rowIndex}).`);
      }
    });
  });

  const topClosed = [...rows[0]].every((tile) => tile !== '0' && tile !== '9');
  const bottomClosed = [...rows.at(-1)].every((tile) => tile !== '0' && tile !== '9');
  const sidesClosed = rows.every((row) => row[0] !== '0' && row[0] !== '9' && row.at(-1) !== '0' && row.at(-1) !== '9');

  if (!topClosed || !bottomClosed || !sidesClosed) {
    failures.push('The level boundary must remain closed so every ray eventually hits a wall.');
  }

  const exitCount = rows.join('').split('').filter((tile) => tile === '9').length;
  if (exitCount !== 1) {
    failures.push(`Expected exactly one exit tile (9); found ${exitCount}.`);
  }

  const pointPatterns = [
    ['player', /player:\s*\{\s*x:\s*([0-9.]+),\s*y:\s*([0-9.]+)/u],
    ['enemy', /\{\s*x:\s*([0-9.]+),\s*y:\s*([0-9.]+)\s*\}/gu],
    ['pickup', /\{\s*x:\s*([0-9.]+),\s*y:\s*([0-9.]+),\s*kind:/gu],
  ];

  for (const [label, pattern] of pointPatterns) {
    const matches = pattern.global ? [...levelSource.matchAll(pattern)] : [levelSource.match(pattern)].filter(Boolean);
    for (const match of matches) {
      const x = Number(match[1]);
      const y = Number(match[2]);
      const tile = rows[Math.floor(y)]?.[Math.floor(x)];
      if (tile === undefined || !['0', '9'].includes(tile)) {
        failures.push(`${label} spawn (${x}, ${y}) is not on a walkable tile.`);
      }
    }
  }

  console.log(`Level: ${width}×${rows.length}, ${exitCount} exit, closed boundary.`);
}

if (failures.length > 0) {
  console.error('\nValidation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Repository validation passed.');
}
