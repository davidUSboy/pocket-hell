import { PocketHellGame } from './game/game.js';
import type { GameStats, RunResult } from './game/game.js';
import { InputManager } from './game/input.js';
import { LeaderboardService } from './leaderboard.js';
import type { ScoreEntry } from './leaderboard.js';
import { HandAnimator } from './ui/hands.js';

const DEFAULT_REPOSITORY_URL = 'https://github.com/davidUSboy/pocket-hell';
const STAGE_WIDTH = 470;
const STAGE_HEIGHT = 690;

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element;
}

function formatScore(score: number): string {
  return Math.max(0, Math.floor(score)).toString().padStart(6, '0');
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, '0')}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
}

function modeLabel(mode: GameStats['mode']): string {
  return ({ title: 'READY', running: 'RUNNING', paused: 'PAUSED', dead: 'K.I.A.', won: 'CLEARED' } as const)[mode];
}

const canvas = requireElement<HTMLCanvasElement>('#game-canvas');
const stage = requireElement<HTMLElement>('#device-stage');
const viewport = requireElement<HTMLElement>('#device-viewport');
const healthValue = requireElement<HTMLElement>('#health-value');
const ammoValue = requireElement<HTMLElement>('#ammo-value');
const enemyValue = requireElement<HTMLElement>('#enemy-value');
const scoreValue = requireElement<HTMLElement>('#score-value');
const timeValue = requireElement<HTMLElement>('#time-value');
const modeValue = requireElement<HTMLElement>('#mode-value');
const playPrompt = requireElement<HTMLElement>('#play-prompt');
const fullscreenButton = requireElement<HTMLButtonElement>('#fullscreen-button');
const soundButton = requireElement<HTMLButtonElement>('#sound-button');
const leaderboardOverlay = requireElement<HTMLElement>('#leaderboard-overlay');
const leaderboardOpen = requireElement<HTMLButtonElement>('#leaderboard-open');
const leaderboardOpenSecondary = requireElement<HTMLButtonElement>('#leaderboard-open-secondary');
const leaderboardClose = requireElement<HTMLButtonElement>('#leaderboard-close');
const leaderboardDismiss = requireElement<HTMLButtonElement>('#leaderboard-dismiss');
const leaderboardStatus = requireElement<HTMLElement>('#leaderboard-status');
const leaderboardList = requireElement<HTMLOListElement>('#leaderboard-list');
const communityTab = requireElement<HTMLButtonElement>('#community-tab');
const localTab = requireElement<HTMLButtonElement>('#local-tab');
const playerNameInput = requireElement<HTMLInputElement>('#player-name');
const localBestValue = requireElement<HTMLElement>('#local-best-value');
const submitScoreValue = requireElement<HTMLElement>('#submit-score-value');
const submitScoreLink = requireElement<HTMLAnchorElement>('#submit-score-link');
const toast = requireElement<HTMLElement>('#toast');

const input = new InputManager(document);
new HandAnimator(stage, input);

const leaderboard = new LeaderboardService();
let leaderboardMode: 'community' | 'local' = 'community';
let latestWin: ScoreEntry | null = leaderboard.getBestLocal();
let communityLoaded = false;
let pausedForLeaderboard = false;
let toastTimer = 0;

playerNameInput.value = leaderboard.getPlayerName();

const game = new PocketHellGame(canvas, input, handleStats, handleRunComplete);
game.start();

function handleStats(stats: GameStats): void {
  healthValue.textContent = String(stats.health);
  ammoValue.textContent = String(stats.ammo);
  enemyValue.textContent = `${stats.kills}/${stats.enemies}`;
  scoreValue.textContent = formatScore(stats.score);
  timeValue.textContent = formatTime(stats.timeSeconds);
  modeValue.textContent = modeLabel(stats.mode);
  document.body.dataset.gameMode = stats.mode;
  updatePrompt(stats.mode);
}

function handleRunComplete(result: RunResult): void {
  if (result.outcome === 'won') {
    latestWin = leaderboard.recordWin(result, playerNameInput.value);
    updateLeaderboardSummary();
    configureSubmission(latestWin);
    showToast(`RUN SAVED · ${formatScore(result.score)} POINTS`);
    window.setTimeout(() => openLeaderboard('local'), 650);
  } else {
    showToast('RUN ENDED · TAP A OR START TO RETRY');
  }
}

function updatePrompt(mode: GameStats['mode']): void {
  const strong = playPrompt.querySelector('strong');
  const detail = playPrompt.querySelector('span:last-child');
  if (!strong || !detail) {
    return;
  }

  const copy = {
    title: ['TAP A OR START', 'then use the D-pad'],
    running: ['SURVIVE THE FACILITY', 'D-pad to move · A to fire · B to use'],
    paused: ['GAME PAUSED', 'tap START to continue'],
    dead: ['SYSTEM FAILURE', 'tap A or START to retry'],
    won: ['FACILITY CLEARED', 'score saved to this device'],
  } as const;
  strong.textContent = copy[mode][0];
  detail.textContent = copy[mode][1];
}

function resizeDevice(): void {
  const visualWidth = window.visualViewport?.width ?? window.innerWidth;
  const visualHeight = window.visualViewport?.height ?? window.innerHeight;
  const compact = window.matchMedia('(max-width: 1120px)').matches;
  const immersive = document.body.classList.contains('immersive');
  const availableWidth = Math.max(280, visualWidth - (compact ? 8 : 28));
  const availableHeight = Math.max(480, visualHeight - (immersive ? 16 : compact ? 100 : 110));
  const scale = Math.max(0.56, Math.min(compact ? 1 : 1.08, availableWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT));

  document.documentElement.style.setProperty('--stage-scale', scale.toFixed(4));
  viewport.style.width = `${STAGE_WIDTH * scale}px`;
  viewport.style.height = `${STAGE_HEIGHT * scale}px`;
}

function showToast(message: string): void {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function updateLeaderboardSummary(): void {
  const best = leaderboard.getBestLocal();
  localBestValue.textContent = best ? formatScore(best.score) : '—';
  submitScoreValue.textContent = latestWin ? `${formatScore(latestWin.score)} · ${formatTime(latestWin.time)}` : 'No completed run yet';
}

function configureSubmission(entry: ScoreEntry | null): void {
  if (!entry) {
    submitScoreLink.href = '#';
    submitScoreLink.classList.add('is-disabled');
    submitScoreLink.setAttribute('aria-disabled', 'true');
    return;
  }

  submitScoreLink.href = leaderboard.createSubmissionUrl(entry, playerNameInput.value);
  submitScoreLink.target = '_blank';
  submitScoreLink.rel = 'noreferrer';
  submitScoreLink.classList.remove('is-disabled');
  submitScoreLink.removeAttribute('aria-disabled');
}

function renderLeaderboard(entries: ScoreEntry[]): void {
  leaderboardList.replaceChildren();
  if (entries.length === 0) {
    const empty = document.createElement('li');
    empty.innerHTML = '<span class="leaderboard-rank">--</span><span class="leaderboard-player"><strong>NO RUNS YET</strong><small>Be the first survivor on this board.</small></span><span class="leaderboard-score">000000</span><span class="leaderboard-time">--:--</span>';
    leaderboardList.append(empty);
    return;
  }

  entries.slice(0, 12).forEach((entry, index) => {
    const item = document.createElement('li');
    item.classList.toggle('is-local', entry.source === 'local');
    item.innerHTML = `<span class="leaderboard-rank">${String(index + 1).padStart(2, '0')}</span><span class="leaderboard-player"><strong></strong><small></small></span><span class="leaderboard-score">${formatScore(entry.score)}</span><span class="leaderboard-time">${formatTime(entry.time)}</span>`;

    const player = item.querySelector<HTMLElement>('.leaderboard-player strong');
    const detail = item.querySelector<HTMLElement>('.leaderboard-player small');
    if (player) player.textContent = entry.player;
    if (detail) detail.textContent = entry.githubUser ? `@${entry.githubUser} · ${entry.kills} DEMONS` : `THIS DEVICE · ${entry.kills} DEMONS`;

    if (entry.url) {
      item.title = 'Open score submission on GitHub';
      item.addEventListener('click', () => window.open(entry.url, '_blank', 'noopener,noreferrer'));
    }
    leaderboardList.append(item);
  });
}

async function loadCommunity(force = false): Promise<void> {
  leaderboardStatus.textContent = 'Connecting to GitHub…';
  try {
    const entries = await leaderboard.fetchCommunity(force);
    communityLoaded = true;
    if (leaderboardMode === 'community') {
      renderLeaderboard(entries);
      leaderboardStatus.textContent = entries.length > 0 ? `${entries.length} PUBLIC RUN${entries.length === 1 ? '' : 'S'} · LIVE FROM GITHUB ISSUES` : 'NO PUBLIC SCORES YET · FINISH A RUN AND CLAIM THE FIRST SLOT';
    }
  } catch (error) {
    if (leaderboardMode === 'community') {
      renderLeaderboard([]);
      leaderboardStatus.textContent = `COMMUNITY BOARD OFFLINE · ${error instanceof Error ? error.message : 'GitHub API error'}`;
    }
  }
}

function setLeaderboardMode(mode: 'community' | 'local'): void {
  leaderboardMode = mode;
  const isCommunity = mode === 'community';
  communityTab.classList.toggle('is-active', isCommunity);
  localTab.classList.toggle('is-active', !isCommunity);
  communityTab.setAttribute('aria-selected', String(isCommunity));
  localTab.setAttribute('aria-selected', String(!isCommunity));

  if (isCommunity) {
    const entries = leaderboard.getCommunityEntries();
    renderLeaderboard(entries);
    leaderboardStatus.textContent = communityLoaded ? `${entries.length} PUBLIC RUN${entries.length === 1 ? '' : 'S'} · LIVE FROM GITHUB ISSUES` : 'Connecting to GitHub…';
    if (!communityLoaded) void loadCommunity();
  } else {
    const entries = leaderboard.getLocalEntries();
    renderLeaderboard(entries);
    leaderboardStatus.textContent = entries.length > 0 ? `${entries.length} RUN${entries.length === 1 ? '' : 'S'} SAVED ON THIS DEVICE` : 'NO LOCAL RUNS YET · CLEAR THE FACILITY TO SAVE ONE';
  }
}

function openLeaderboard(mode: 'community' | 'local' = leaderboardMode): void {
  pausedForLeaderboard = game.pauseForOverlay();
  leaderboardOverlay.classList.add('is-open');
  leaderboardOverlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setLeaderboardMode(mode);
}

function closeLeaderboard(): void {
  leaderboardOverlay.classList.remove('is-open');
  leaderboardOverlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (pausedForLeaderboard) {
    game.resumeFromOverlay();
    pausedForLeaderboard = false;
  }
}

function configureRepositoryLinks(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('[data-repo-link]');
  const hostname = window.location.hostname;
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let repositoryUrl = DEFAULT_REPOSITORY_URL;
  if (hostname.endsWith('.github.io') && pathParts.length > 0) {
    repositoryUrl = `https://github.com/${hostname.slice(0, -'.github.io'.length)}/${pathParts[0]}`;
  }
  links.forEach((link) => {
    link.href = repositoryUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
  });
}

async function toggleImmersiveMode(): Promise<void> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      document.body.classList.remove('immersive');
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
      document.body.classList.add('immersive');
    } else {
      document.body.classList.toggle('immersive');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch {
    document.body.classList.toggle('immersive');
  }
  resizeDevice();
}

leaderboardOpen.addEventListener('click', () => openLeaderboard('community'));
leaderboardOpenSecondary.addEventListener('click', () => openLeaderboard('community'));
leaderboardClose.addEventListener('click', closeLeaderboard);
leaderboardDismiss.addEventListener('click', closeLeaderboard);
communityTab.addEventListener('click', () => setLeaderboardMode('community'));
localTab.addEventListener('click', () => setLeaderboardMode('local'));
fullscreenButton.addEventListener('click', () => void toggleImmersiveMode());
soundButton.addEventListener('click', () => showToast('AUDIO UNLOCKS ON YOUR FIRST GAME INPUT'));
playerNameInput.addEventListener('change', () => {
  playerNameInput.value = leaderboard.setPlayerName(playerNameInput.value);
  configureSubmission(latestWin);
});
playerNameInput.addEventListener('input', () => {
  playerNameInput.value = playerNameInput.value.toUpperCase().slice(0, 16);
});
window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && leaderboardOverlay.classList.contains('is-open')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeLeaderboard();
  }
}, true);
window.addEventListener('resize', resizeDevice, { passive: true });
window.visualViewport?.addEventListener('resize', resizeDevice, { passive: true });
document.addEventListener('fullscreenchange', resizeDevice);

configureRepositoryLinks();
updateLeaderboardSummary();
configureSubmission(latestWin);
resizeDevice();
window.setTimeout(() => void loadCommunity(), 900);

if (new URLSearchParams(window.location.search).get('scores') === '1') {
  window.setTimeout(() => openLeaderboard('community'), 250);
}

if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' }).catch(() => {
      // Offline support is optional; gameplay must never depend on registration.
    });
  }, { once: true });
}
