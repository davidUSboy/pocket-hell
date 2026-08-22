import { FOV, PALETTE, SCREEN_HEIGHT, SCREEN_WIDTH, VIEW_HEIGHT } from './constants.js';
const SHADES = [PALETTE.light, PALETTE.mid, PALETTE.dark, PALETTE.darkest];
export class Renderer {
    level;
    context;
    zBuffer = new Float32Array(SCREEN_WIDTH);
    enemySprite;
    enemyHitSprite;
    ammoSprite;
    healthSprite;
    constructor(canvas, level) {
        this.level = level;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) {
            throw new Error('Canvas 2D is not supported in this browser.');
        }
        this.context = context;
        this.context.imageSmoothingEnabled = false;
        this.enemySprite = this.createEnemySprite(false);
        this.enemyHitSprite = this.createEnemySprite(true);
        this.ammoSprite = this.createPickupSprite('ammo');
        this.healthSprite = this.createPickupSprite('health');
    }
    render(state) {
        this.renderWorld(state);
        this.renderSprites(state);
        this.renderWeapon(state.weaponKick);
        this.renderHud(state);
        if (state.showMap && state.mode === 'running') {
            this.renderMinimap(state);
        }
        if (state.damageFlash > 0) {
            this.renderDamageFlash(state.damageFlash);
        }
        this.renderModeOverlay(state);
    }
    renderWorld(state) {
        const { context } = this;
        context.fillStyle = PALETTE.mid;
        context.fillRect(0, 0, SCREEN_WIDTH, Math.floor(VIEW_HEIGHT / 2));
        context.fillStyle = PALETTE.dark;
        context.fillRect(0, Math.floor(VIEW_HEIGHT / 2), SCREEN_WIDTH, Math.ceil(VIEW_HEIGHT / 2));
        for (let y = Math.floor(VIEW_HEIGHT / 2); y < VIEW_HEIGHT; y += 2) {
            const distanceShade = Math.min(3, Math.floor((y - VIEW_HEIGHT / 2) / 11));
            context.fillStyle = SHADES[Math.max(1, 3 - distanceShade)];
            for (let x = (y % 4) / 2; x < SCREEN_WIDTH; x += 4) {
                context.fillRect(x, y, 1, 1);
            }
        }
        const directionX = Math.cos(state.player.angle);
        const directionY = Math.sin(state.player.angle);
        const planeLength = Math.tan(FOV / 2);
        const planeX = -directionY * planeLength;
        const planeY = directionX * planeLength;
        for (let screenX = 0; screenX < SCREEN_WIDTH; screenX += 1) {
            const cameraX = (2 * screenX) / SCREEN_WIDTH - 1;
            const rayDirectionX = directionX + planeX * cameraX;
            const rayDirectionY = directionY + planeY * cameraX;
            const hit = this.castRay(state.player.x, state.player.y, rayDirectionX, rayDirectionY);
            this.zBuffer[screenX] = hit.distance;
            const lineHeight = Math.min(VIEW_HEIGHT * 3, Math.floor(VIEW_HEIGHT / hit.distance));
            const drawStart = Math.max(0, Math.floor(VIEW_HEIGHT / 2 - lineHeight / 2));
            const drawEnd = Math.min(VIEW_HEIGHT - 1, Math.floor(VIEW_HEIGHT / 2 + lineHeight / 2));
            this.drawWallColumn(screenX, drawStart, drawEnd, hit);
        }
    }
    castRay(originX, originY, rayDirectionX, rayDirectionY) {
        let mapX = Math.floor(originX);
        let mapY = Math.floor(originY);
        const deltaDistanceX = rayDirectionX === 0 ? 1e30 : Math.abs(1 / rayDirectionX);
        const deltaDistanceY = rayDirectionY === 0 ? 1e30 : Math.abs(1 / rayDirectionY);
        const stepX = rayDirectionX < 0 ? -1 : 1;
        const stepY = rayDirectionY < 0 ? -1 : 1;
        let sideDistanceX = rayDirectionX < 0
            ? (originX - mapX) * deltaDistanceX
            : (mapX + 1 - originX) * deltaDistanceX;
        let sideDistanceY = rayDirectionY < 0
            ? (originY - mapY) * deltaDistanceY
            : (mapY + 1 - originY) * deltaDistanceY;
        let side = 0;
        let tile = 0;
        for (let step = 0; step < 64; step += 1) {
            if (sideDistanceX < sideDistanceY) {
                sideDistanceX += deltaDistanceX;
                mapX += stepX;
                side = 0;
            }
            else {
                sideDistanceY += deltaDistanceY;
                mapY += stepY;
                side = 1;
            }
            tile = this.level.getTile(mapX, mapY);
            if (tile !== 0 && tile !== 9) {
                break;
            }
        }
        const rawDistance = side === 0
            ? (mapX - originX + (1 - stepX) / 2) / rayDirectionX
            : (mapY - originY + (1 - stepY) / 2) / rayDirectionY;
        const distance = Math.max(0.001, Math.abs(rawDistance));
        const wallCoordinate = side === 0
            ? originY + distance * rayDirectionY
            : originX + distance * rayDirectionX;
        return {
            distance,
            tile,
            side,
            mapX,
            mapY,
            wallOffset: wallCoordinate - Math.floor(wallCoordinate),
        };
    }
    drawWallColumn(screenX, start, end, hit) {
        const height = Math.max(1, end - start + 1);
        const distanceShade = hit.distance < 2.2 ? 0 : hit.distance < 4 ? 1 : hit.distance < 7 ? 2 : 3;
        const sidePenalty = hit.side === 1 ? 1 : 0;
        for (let y = start; y <= end; y += 1) {
            const textureY = (y - start) / height;
            let shade = Math.min(3, distanceShade + sidePenalty);
            const textureX = Math.floor(hit.wallOffset * 16);
            const textureRow = Math.floor(textureY * 16);
            if (hit.tile === 1) {
                const brickRow = Math.floor(textureY * 8);
                const shiftedX = textureX + (brickRow % 2 === 0 ? 0 : 4);
                const mortar = textureRow % 4 === 0 || shiftedX % 8 === 0;
                if (mortar) {
                    shade = Math.min(3, shade + 1);
                }
            }
            else if (hit.tile === 2) {
                const panelLine = textureX % 8 === 0 || textureRow % 8 === 0;
                const bolt = textureX % 8 === 2 && textureRow % 8 === 2;
                if (panelLine) {
                    shade = Math.min(3, shade + 1);
                }
                else if (bolt) {
                    shade = Math.max(0, shade - 1);
                }
            }
            else if (hit.tile === 3) {
                const groove = textureX % 4 === 0;
                const warningBand = textureRow > 6 && textureRow < 9 && (textureX + textureRow) % 3 === 0;
                if (groove) {
                    shade = Math.min(3, shade + 1);
                }
                else if (warningBand) {
                    shade = Math.max(0, shade - 1);
                }
            }
            this.context.fillStyle = SHADES[shade];
            this.context.fillRect(screenX, y, 1, 1);
        }
    }
    renderSprites(state) {
        const jobs = [];
        for (const enemy of state.enemies) {
            if (!enemy.alive) {
                continue;
            }
            jobs.push({
                x: enemy.x,
                y: enemy.y,
                canvas: enemy.hitFlash > 0 ? this.enemyHitSprite : this.enemySprite,
                scale: 0.9,
                bob: Math.sin(state.elapsed * 5 + enemy.phase) * 0.025,
                distance: Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y),
            });
        }
        for (const pickup of state.pickups) {
            if (!pickup.active) {
                continue;
            }
            jobs.push({
                x: pickup.x,
                y: pickup.y,
                canvas: pickup.kind === 'ammo' ? this.ammoSprite : this.healthSprite,
                scale: 0.48,
                bob: Math.sin(state.elapsed * 3.2 + pickup.phase) * 0.09 - 0.1,
                distance: Math.hypot(pickup.x - state.player.x, pickup.y - state.player.y),
            });
        }
        jobs.sort((a, b) => b.distance - a.distance);
        for (const job of jobs) {
            this.drawBillboard(job, state.player.x, state.player.y, state.player.angle);
        }
    }
    drawBillboard(job, playerX, playerY, playerAngle) {
        const directionX = Math.cos(playerAngle);
        const directionY = Math.sin(playerAngle);
        const planeLength = Math.tan(FOV / 2);
        const planeX = -directionY * planeLength;
        const planeY = directionX * planeLength;
        const relativeX = job.x - playerX;
        const relativeY = job.y - playerY;
        const determinant = planeX * directionY - directionX * planeY;
        const inverseDeterminant = 1 / determinant;
        const transformX = inverseDeterminant * (directionY * relativeX - directionX * relativeY);
        const transformY = inverseDeterminant * (-planeY * relativeX + planeX * relativeY);
        if (transformY <= 0.05) {
            return;
        }
        const spriteScreenX = Math.floor((SCREEN_WIDTH / 2) * (1 + transformX / transformY));
        const projectedHeight = Math.abs(Math.floor((VIEW_HEIGHT / transformY) * job.scale));
        const projectedWidth = Math.max(1, Math.floor(projectedHeight * (job.canvas.width / job.canvas.height)));
        const verticalOffset = Math.floor(job.bob * projectedHeight);
        const drawStartY = Math.floor(VIEW_HEIGHT / 2 - projectedHeight / 2 + verticalOffset);
        const drawStartX = Math.floor(spriteScreenX - projectedWidth / 2);
        const drawEndX = drawStartX + projectedWidth;
        for (let stripe = Math.max(0, drawStartX); stripe < Math.min(SCREEN_WIDTH, drawEndX); stripe += 1) {
            if (transformY >= this.zBuffer[stripe]) {
                continue;
            }
            const sourceX = Math.floor(((stripe - drawStartX) / projectedWidth) * job.canvas.width);
            this.context.drawImage(job.canvas, sourceX, 0, 1, job.canvas.height, stripe, drawStartY, 1, projectedHeight);
        }
    }
    renderWeapon(kick) {
        const { context } = this;
        const offsetY = Math.round(kick * 5);
        const baseY = VIEW_HEIGHT - 20 + offsetY;
        context.fillStyle = PALETTE.darkest;
        context.fillRect(69, baseY + 8, 22, 12);
        context.fillRect(73, baseY + 2, 14, 10);
        context.fillRect(76, baseY - 2, 8, 7);
        context.fillStyle = PALETTE.dark;
        context.fillRect(72, baseY + 10, 16, 8);
        context.fillRect(75, baseY + 3, 10, 7);
        context.fillStyle = PALETTE.mid;
        context.fillRect(77, baseY, 6, 5);
        context.fillRect(74, baseY + 10, 3, 7);
        context.fillStyle = PALETTE.light;
        context.fillRect(79, baseY, 2, 2);
        context.fillStyle = PALETTE.darkest;
        context.fillRect(79, 51, 2, 2);
        context.fillRect(78, 52, 4, 1);
    }
    renderHud(state) {
        const { context } = this;
        const hudY = VIEW_HEIGHT;
        const aliveEnemies = state.enemies.filter((enemy) => enemy.alive).length;
        context.fillStyle = PALETTE.darkest;
        context.fillRect(0, hudY, SCREEN_WIDTH, SCREEN_HEIGHT - hudY);
        context.fillStyle = PALETTE.mid;
        context.fillRect(0, hudY, SCREEN_WIDTH, 1);
        context.font = 'bold 7px monospace';
        context.textBaseline = 'top';
        context.fillStyle = PALETTE.light;
        context.fillText(`HP ${String(Math.max(0, state.player.health)).padStart(3, '0')}`, 5, hudY + 5);
        context.fillText(`AM ${String(state.player.ammo).padStart(2, '0')}`, 53, hudY + 5);
        context.fillText(`K ${state.player.kills}/${state.enemies.length}`, 101, hudY + 5);
        context.fillStyle = PALETTE.dark;
        context.fillRect(5, hudY + 16, 44, 5);
        context.fillStyle = state.player.health > 30 ? PALETTE.light : PALETTE.mid;
        context.fillRect(6, hudY + 17, Math.max(0, Math.floor(42 * (state.player.health / 100))), 3);
        context.fillStyle = PALETTE.dark;
        context.fillRect(53, hudY + 16, 34, 5);
        context.fillStyle = PALETTE.light;
        context.fillRect(54, hudY + 17, Math.min(32, Math.floor(32 * (state.player.ammo / 24))), 3);
        context.fillStyle = PALETTE.mid;
        context.font = '6px monospace';
        context.fillText(aliveEnemies === 0 ? 'EXIT OPEN' : `${aliveEnemies} LEFT`, 101, hudY + 17);
        if (state.message) {
            const width = Math.min(150, context.measureText(state.message).width + 8);
            context.fillStyle = PALETTE.darkest;
            context.fillRect(Math.floor((SCREEN_WIDTH - width) / 2), 4, width, 11);
            context.fillStyle = PALETTE.light;
            context.fillText(state.message, Math.floor((SCREEN_WIDTH - width) / 2) + 4, 6);
        }
    }
    renderMinimap(state) {
        const { context } = this;
        const tiles = this.level.cloneTiles();
        const scale = 2;
        const originX = SCREEN_WIDTH - tiles[0].length * scale - 3;
        const originY = 3;
        context.fillStyle = PALETTE.darkest;
        context.fillRect(originX - 2, originY - 2, tiles[0].length * scale + 4, tiles.length * scale + 4);
        for (let y = 0; y < tiles.length; y += 1) {
            for (let x = 0; x < tiles[y].length; x += 1) {
                const tile = tiles[y][x];
                context.fillStyle = tile === 0 || tile === 9 ? PALETTE.dark : PALETTE.mid;
                if (tile === 9) {
                    context.fillStyle = PALETTE.light;
                }
                context.fillRect(originX + x * scale, originY + y * scale, scale, scale);
            }
        }
        for (const enemy of state.enemies) {
            if (!enemy.alive) {
                continue;
            }
            context.fillStyle = PALETTE.darkest;
            context.fillRect(originX + Math.floor(enemy.x * scale), originY + Math.floor(enemy.y * scale), 1, 1);
        }
        context.fillStyle = PALETTE.light;
        context.fillRect(originX + Math.floor(state.player.x * scale) - 1, originY + Math.floor(state.player.y * scale) - 1, 3, 3);
    }
    renderDamageFlash(intensity) {
        const { context } = this;
        context.save();
        context.globalAlpha = Math.min(0.55, intensity * 0.6);
        context.fillStyle = PALETTE.light;
        for (let y = 0; y < VIEW_HEIGHT; y += 2) {
            for (let x = y % 4 === 0 ? 0 : 1; x < SCREEN_WIDTH; x += 2) {
                context.fillRect(x, y, 1, 1);
            }
        }
        context.restore();
    }
    renderModeOverlay(state) {
        if (state.mode === 'running') {
            return;
        }
        const { context } = this;
        context.save();
        context.globalAlpha = 0.78;
        context.fillStyle = PALETTE.darkest;
        context.fillRect(14, 28, 132, 58);
        context.globalAlpha = 1;
        context.strokeStyle = PALETTE.light;
        context.strokeRect(16.5, 30.5, 127, 53);
        context.textAlign = 'center';
        context.textBaseline = 'top';
        if (state.mode === 'title') {
            context.fillStyle = PALETTE.light;
            context.font = 'bold 15px monospace';
            context.fillText('POCKET HELL', 80, 37);
            context.fillStyle = PALETTE.mid;
            context.font = '6px monospace';
            context.fillText('A BEGINNER RAYCASTER', 80, 56);
            if (Math.floor(state.elapsed * 2) % 2 === 0) {
                context.fillStyle = PALETTE.light;
                context.fillText('PRESS START OR A', 80, 70);
            }
        }
        else if (state.mode === 'paused') {
            context.fillStyle = PALETTE.light;
            context.font = 'bold 13px monospace';
            context.fillText('PAUSED', 80, 43);
            context.fillStyle = PALETTE.mid;
            context.font = '6px monospace';
            context.fillText('PRESS START TO CONTINUE', 80, 64);
        }
        else if (state.mode === 'dead') {
            context.fillStyle = PALETTE.light;
            context.font = 'bold 13px monospace';
            context.fillText('YOU DIED', 80, 42);
            context.fillStyle = PALETTE.mid;
            context.font = '6px monospace';
            context.fillText('PRESS START TO RETRY', 80, 64);
        }
        else {
            context.fillStyle = PALETTE.light;
            context.font = 'bold 13px monospace';
            context.fillText('LEVEL CLEAR', 80, 40);
            context.fillStyle = PALETTE.mid;
            context.font = '6px monospace';
            context.fillText(`DEMONS ${state.player.kills}/${state.enemies.length}`, 80, 58);
            context.fillText('PRESS START TO REPLAY', 80, 70);
        }
        context.restore();
        context.textAlign = 'left';
    }
    createEnemySprite(hit) {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 24;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Unable to create enemy sprite.');
        }
        const light = hit ? PALETTE.light : PALETTE.mid;
        const mid = hit ? PALETTE.mid : PALETTE.dark;
        const dark = PALETTE.darkest;
        context.clearRect(0, 0, 16, 24);
        context.fillStyle = dark;
        context.fillRect(2, 1, 3, 2);
        context.fillRect(11, 1, 3, 2);
        context.fillRect(3, 3, 10, 7);
        context.fillRect(2, 10, 12, 8);
        context.fillRect(0, 11, 3, 8);
        context.fillRect(13, 11, 3, 8);
        context.fillRect(3, 18, 4, 6);
        context.fillRect(9, 18, 4, 6);
        context.fillStyle = mid;
        context.fillRect(4, 4, 8, 5);
        context.fillRect(4, 10, 8, 7);
        context.fillRect(1, 12, 2, 5);
        context.fillRect(13, 12, 2, 5);
        context.fillRect(4, 18, 2, 4);
        context.fillRect(10, 18, 2, 4);
        context.fillStyle = light;
        context.fillRect(5, 5, 2, 2);
        context.fillRect(9, 5, 2, 2);
        context.fillRect(6, 8, 4, 1);
        context.fillRect(6, 12, 4, 3);
        context.fillStyle = dark;
        context.fillRect(6, 5, 1, 1);
        context.fillRect(9, 5, 1, 1);
        context.fillRect(7, 13, 2, 1);
        return canvas;
    }
    createPickupSprite(kind) {
        const canvas = document.createElement('canvas');
        canvas.width = 12;
        canvas.height = 12;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Unable to create pickup sprite.');
        }
        context.clearRect(0, 0, 12, 12);
        context.fillStyle = PALETTE.darkest;
        context.fillRect(1, 2, 10, 9);
        context.fillStyle = PALETTE.dark;
        context.fillRect(2, 3, 8, 7);
        context.fillStyle = PALETTE.light;
        if (kind === 'ammo') {
            context.fillRect(3, 4, 2, 5);
            context.fillRect(7, 4, 2, 5);
            context.fillStyle = PALETTE.mid;
            context.fillRect(3, 3, 2, 2);
            context.fillRect(7, 3, 2, 2);
        }
        else {
            context.fillRect(5, 3, 2, 6);
            context.fillRect(3, 5, 6, 2);
        }
        return canvas;
    }
}
