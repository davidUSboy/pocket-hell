import { MOVE_SPEED, PLAYER_RADIUS, ROTATION_SPEED, SHOT_COOLDOWN, STARTING_AMMO, STARTING_HEALTH, STRAFE_SPEED, USE_DISTANCE, } from './constants.js';
import { AudioEngine } from './audio.js';
import { createEnemies, createPickups, LEVEL, LevelMap } from './level.js';
import { Renderer } from './renderer.js';
export class PocketHellGame {
    canvas;
    input;
    onStats;
    onRunComplete;
    level;
    renderer;
    audio = new AudioEngine();
    player;
    enemies;
    pickups;
    mode = 'title';
    lastFrame = performance.now();
    elapsed = 0;
    runElapsed = 0;
    runSequence = 0;
    runFinished = false;
    weaponCooldown = 0;
    weaponKick = 0;
    damageFlash = 0;
    message = '';
    messageTime = 0;
    showMap = false;
    constructor(canvas, input, onStats, onRunComplete = () => undefined) {
        this.canvas = canvas;
        this.input = input;
        this.onStats = onStats;
        this.onRunComplete = onRunComplete;
        this.level = new LevelMap(LEVEL.rows);
        this.renderer = new Renderer(canvas, this.level);
        this.player = this.createPlayer();
        this.enemies = createEnemies();
        this.pickups = createPickups();
    }
    start() {
        requestAnimationFrame(this.frame);
    }
    pauseForOverlay() {
        if (this.mode !== 'running') {
            return false;
        }
        this.mode = 'paused';
        this.input.releaseAll();
        return true;
    }
    resumeFromOverlay() {
        if (this.mode === 'paused') {
            this.mode = 'running';
        }
    }
    frame = (now) => {
        const deltaTime = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
        this.lastFrame = now;
        this.elapsed += deltaTime;
        if (this.mode === 'running') {
            this.runElapsed += deltaTime;
        }
        this.update(deltaTime);
        this.renderer.render(this.createRenderState());
        this.publishStats();
        requestAnimationFrame(this.frame);
    };
    update(deltaTime) {
        this.weaponKick = Math.max(0, this.weaponKick - deltaTime * 7);
        this.damageFlash = Math.max(0, this.damageFlash - deltaTime * 2.8);
        this.weaponCooldown = Math.max(0, this.weaponCooldown - deltaTime);
        this.updateMessage(deltaTime);
        if (this.mode === 'title') {
            if (this.input.consumePress('pause') ||
                this.input.consumePress('shoot') ||
                this.input.consumePress('use')) {
                this.beginRun();
            }
            return;
        }
        if (this.mode === 'dead' || this.mode === 'won') {
            if (this.input.consumePress('pause') ||
                this.input.consumePress('shoot') ||
                this.input.consumePress('use')) {
                this.resetWorld();
                this.beginRun();
            }
            return;
        }
        if (this.input.consumePress('pause')) {
            this.mode = this.mode === 'paused' ? 'running' : 'paused';
            this.setMessage(this.mode === 'paused' ? 'GAME PAUSED' : 'BACK TO HELL', 1.1);
        }
        if (this.mode === 'paused') {
            return;
        }
        if (this.input.consumePress('toggleMap')) {
            this.showMap = !this.showMap;
            this.setMessage(this.showMap ? 'DEBUG MAP ON' : 'DEBUG MAP OFF', 1.1);
        }
        this.updatePlayer(deltaTime);
        if (this.input.consumePress('shoot')) {
            this.shoot();
        }
        if (this.input.consumePress('use')) {
            this.use();
        }
        this.updateEnemies(deltaTime);
        this.updatePickups();
        this.checkExit();
    }
    beginRun() {
        this.mode = 'running';
        this.runElapsed = 0;
        this.runFinished = false;
        this.setMessage('CLEAR 4 DEMONS — FIND EXIT', 3.2);
    }
    resetWorld() {
        this.level = new LevelMap(LEVEL.rows);
        this.renderer = new Renderer(this.canvas, this.level);
        this.player = this.createPlayer();
        this.enemies = createEnemies();
        this.pickups = createPickups();
        this.weaponCooldown = 0;
        this.weaponKick = 0;
        this.damageFlash = 0;
        this.showMap = false;
        this.message = '';
        this.messageTime = 0;
        this.runElapsed = 0;
        this.runFinished = false;
    }
    createPlayer() {
        return {
            x: LEVEL.player.x,
            y: LEVEL.player.y,
            angle: LEVEL.player.angle,
            health: STARTING_HEALTH,
            ammo: STARTING_AMMO,
            kills: 0,
        };
    }
    updatePlayer(deltaTime) {
        const forwardInput = Number(this.input.isHeld('forward')) - Number(this.input.isHeld('backward'));
        const turnInput = Number(this.input.isHeld('turnRight')) - Number(this.input.isHeld('turnLeft'));
        const strafeInput = Number(this.input.isHeld('strafeRight')) - Number(this.input.isHeld('strafeLeft'));
        this.player.angle = this.normalizeAngle(this.player.angle + turnInput * ROTATION_SPEED * deltaTime);
        const forwardDistance = forwardInput * MOVE_SPEED * deltaTime;
        const strafeDistance = strafeInput * STRAFE_SPEED * deltaTime;
        const directionX = Math.cos(this.player.angle);
        const directionY = Math.sin(this.player.angle);
        const rightX = Math.cos(this.player.angle + Math.PI / 2);
        const rightY = Math.sin(this.player.angle + Math.PI / 2);
        let moveX = directionX * forwardDistance + rightX * strafeDistance;
        let moveY = directionY * forwardDistance + rightY * strafeDistance;
        const movementLength = Math.hypot(moveX, moveY);
        const maximumLength = MOVE_SPEED * deltaTime;
        if (movementLength > maximumLength && movementLength > 0) {
            moveX = (moveX / movementLength) * maximumLength;
            moveY = (moveY / movementLength) * maximumLength;
        }
        this.movePlayer(moveX, moveY);
    }
    movePlayer(deltaX, deltaY) {
        const nextX = this.player.x + deltaX;
        const nextY = this.player.y + deltaY;
        if (this.canOccupy(nextX, this.player.y, PLAYER_RADIUS)) {
            this.player.x = nextX;
        }
        if (this.canOccupy(this.player.x, nextY, PLAYER_RADIUS)) {
            this.player.y = nextY;
        }
    }
    canOccupy(x, y, radius) {
        return (!this.level.isBlocking(x - radius, y - radius) &&
            !this.level.isBlocking(x + radius, y - radius) &&
            !this.level.isBlocking(x - radius, y + radius) &&
            !this.level.isBlocking(x + radius, y + radius));
    }
    shoot() {
        if (this.weaponCooldown > 0) {
            return;
        }
        this.weaponCooldown = SHOT_COOLDOWN;
        this.weaponKick = 1;
        if (this.player.ammo <= 0) {
            this.audio.empty();
            this.setMessage('CLICK — OUT OF AMMO', 1.2);
            return;
        }
        this.player.ammo -= 1;
        this.audio.shot();
        let target = null;
        let targetDistance = Number.POSITIVE_INFINITY;
        for (const enemy of this.enemies) {
            if (!enemy.alive) {
                continue;
            }
            const deltaX = enemy.x - this.player.x;
            const deltaY = enemy.y - this.player.y;
            const distance = Math.hypot(deltaX, deltaY);
            const angleToEnemy = Math.atan2(deltaY, deltaX);
            const angleDifference = Math.abs(this.shortestAngle(angleToEnemy - this.player.angle));
            const hitWindow = Math.max(0.035, Math.atan(0.32 / distance));
            if (angleDifference < hitWindow &&
                distance < targetDistance &&
                this.hasLineOfSight(this.player.x, this.player.y, enemy.x, enemy.y)) {
                target = enemy;
                targetDistance = distance;
            }
        }
        if (!target) {
            return;
        }
        target.health -= 1;
        target.hitFlash = 0.16;
        this.audio.hit();
        if (target.health <= 0) {
            target.alive = false;
            this.player.kills += 1;
            this.setMessage(this.player.kills === this.enemies.length ? 'ALL CLEAR — FIND EXIT' : 'DEMON DOWN', 1.6);
        }
        else {
            this.setMessage('DIRECT HIT', 0.8);
        }
    }
    use() {
        const targetX = Math.floor(this.player.x + Math.cos(this.player.angle) * USE_DISTANCE);
        const targetY = Math.floor(this.player.y + Math.sin(this.player.angle) * USE_DISTANCE);
        const tile = this.level.getTile(targetX, targetY);
        if (tile === 3) {
            this.level.setTile(targetX, targetY, 0);
            this.audio.door();
            this.setMessage('DOOR OPENED', 1.1);
        }
        else {
            this.setMessage('NOTHING TO USE', 0.7);
        }
    }
    updateEnemies(deltaTime) {
        for (const enemy of this.enemies) {
            if (!enemy.alive) {
                continue;
            }
            enemy.attackCooldown = Math.max(0, enemy.attackCooldown - deltaTime);
            enemy.hitFlash = Math.max(0, enemy.hitFlash - deltaTime);
            const deltaX = this.player.x - enemy.x;
            const deltaY = this.player.y - enemy.y;
            const distance = Math.hypot(deltaX, deltaY);
            const canSeePlayer = distance < 8 && this.hasLineOfSight(enemy.x, enemy.y, this.player.x, this.player.y);
            if (!canSeePlayer) {
                continue;
            }
            if (distance > 0.7) {
                const speed = 0.56 * deltaTime;
                const directionX = deltaX / distance;
                const directionY = deltaY / distance;
                const nextX = enemy.x + directionX * speed;
                const nextY = enemy.y + directionY * speed;
                if (this.canEnemyOccupy(nextX, enemy.y, enemy.id)) {
                    enemy.x = nextX;
                }
                if (this.canEnemyOccupy(enemy.x, nextY, enemy.id)) {
                    enemy.y = nextY;
                }
            }
            else if (enemy.attackCooldown <= 0) {
                enemy.attackCooldown = 0.9;
                this.player.health = Math.max(0, this.player.health - 12);
                this.damageFlash = 1;
                this.audio.hurt();
                this.setMessage('YOU TOOK DAMAGE', 0.8);
                if (this.player.health <= 0) {
                    this.finishRun('dead');
                    return;
                }
            }
        }
    }
    canEnemyOccupy(x, y, enemyId) {
        if (!this.canOccupy(x, y, 0.18)) {
            return false;
        }
        return this.enemies.every((other) => {
            if (!other.alive || other.id === enemyId) {
                return true;
            }
            return Math.hypot(other.x - x, other.y - y) > 0.35;
        });
    }
    updatePickups() {
        for (const pickup of this.pickups) {
            if (!pickup.active || Math.hypot(pickup.x - this.player.x, pickup.y - this.player.y) > 0.42) {
                continue;
            }
            if (pickup.kind === 'health') {
                if (this.player.health >= STARTING_HEALTH) {
                    continue;
                }
                this.player.health = Math.min(STARTING_HEALTH, this.player.health + 30);
                this.setMessage('HEALTH +30', 1.2);
            }
            else {
                this.player.ammo = Math.min(30, this.player.ammo + 8);
                this.setMessage('AMMO +8', 1.2);
            }
            pickup.active = false;
            this.audio.pickup();
        }
    }
    checkExit() {
        if (this.level.getTile(this.player.x, this.player.y) !== 9) {
            return;
        }
        if (this.player.kills < this.enemies.length) {
            this.setMessage('EXIT LOCKED — CLEAR DEMONS', 1.2);
            return;
        }
        this.finishRun('won');
    }
    finishRun(outcome) {
        if (this.runFinished) {
            return;
        }
        this.runFinished = true;
        this.mode = outcome;
        this.input.releaseAll();
        if (outcome === 'won') {
            this.audio.win();
        }
        const score = this.calculateScore(outcome);
        this.runSequence += 1;
        const runId = `ph-${Date.now().toString(36)}-${this.runSequence.toString(36)}-${score.toString(36)}`;
        this.onRunComplete({
            outcome,
            score,
            timeSeconds: this.runElapsed,
            health: this.player.health,
            ammo: this.player.ammo,
            kills: this.player.kills,
            runId,
        });
    }
    calculateScore(outcome = this.mode === 'won' ? 'won' : this.mode === 'dead' ? 'dead' : 'running') {
        if (this.mode === 'title') {
            return 0;
        }
        const clearBonus = outcome === 'won' ? 7000 : 0;
        const speedBonus = outcome === 'dead' ? 0 : Math.max(0, 6000 - Math.floor(this.runElapsed * 35));
        const killScore = this.player.kills * 1500;
        const survivalScore = this.player.health * 18;
        const ammoScore = this.player.ammo * 12;
        return Math.max(0, Math.round(clearBonus + speedBonus + killScore + survivalScore + ammoScore));
    }
    hasLineOfSight(startX, startY, endX, endY) {
        const distance = Math.hypot(endX - startX, endY - startY);
        const steps = Math.max(1, Math.ceil(distance / 0.07));
        for (let index = 1; index < steps; index += 1) {
            const progress = index / steps;
            const sampleX = startX + (endX - startX) * progress;
            const sampleY = startY + (endY - startY) * progress;
            if (this.level.isBlocking(sampleX, sampleY)) {
                return false;
            }
        }
        return true;
    }
    updateMessage(deltaTime) {
        if (this.messageTime <= 0) {
            return;
        }
        this.messageTime = Math.max(0, this.messageTime - deltaTime);
        if (this.messageTime === 0) {
            this.message = '';
        }
    }
    setMessage(message, duration) {
        this.message = message;
        this.messageTime = duration;
    }
    createRenderState() {
        return {
            mode: this.mode,
            player: this.player,
            enemies: this.enemies,
            pickups: this.pickups,
            weaponKick: this.weaponKick,
            damageFlash: this.damageFlash,
            elapsed: this.elapsed,
            message: this.message,
            showMap: this.showMap,
        };
    }
    publishStats() {
        this.onStats({
            health: this.player.health,
            ammo: this.player.ammo,
            kills: this.player.kills,
            enemies: this.enemies.length,
            mode: this.mode,
            timeSeconds: this.runElapsed,
            score: this.calculateScore(),
        });
    }
    normalizeAngle(angle) {
        const fullTurn = Math.PI * 2;
        return ((angle % fullTurn) + fullTurn) % fullTurn;
    }
    shortestAngle(angle) {
        return Math.atan2(Math.sin(angle), Math.cos(angle));
    }
}
