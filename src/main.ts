import './style.css';
import { PocketHellGame } from './game/game';
import { InputManager } from './game/input';
import { HandAnimator } from './ui/hands';

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element;
}

const canvas = requireElement<HTMLCanvasElement>('#game-canvas');
const stage = requireElement<HTMLElement>('#device-stage');
const healthValue = requireElement<HTMLElement>('#health-value');
const ammoValue = requireElement<HTMLElement>('#ammo-value');
const enemyValue = requireElement<HTMLElement>('#enemy-value');

const input = new InputManager(document);
new HandAnimator(stage, input);

const game = new PocketHellGame(canvas, input, (stats) => {
  healthValue.textContent = String(stats.health);
  ammoValue.textContent = String(stats.ammo);
  enemyValue.textContent = `${stats.kills}/${stats.enemies}`;
});

game.start();

const DEFAULT_REPOSITORY_URL = 'https://github.com/davidUSboy/pocket-hell';
const DEFAULT_DEMO_URL = 'https://davidusboy.github.io/pocket-hell/';

function configureProjectLinks(): void {
  const repositoryLinks = document.querySelectorAll<HTMLAnchorElement>('[data-repo-link]');
  const demoLinks = document.querySelectorAll<HTMLAnchorElement>('[data-demo-link]');
  const hostname = window.location.hostname;
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  let repositoryUrl = DEFAULT_REPOSITORY_URL;
  let demoUrl = DEFAULT_DEMO_URL;

  if (hostname.endsWith('.github.io') && pathParts.length > 0) {
    const username = hostname.slice(0, -'.github.io'.length);
    const repository = pathParts[0];
    repositoryUrl = `https://github.com/${username}/${repository}`;
    demoUrl = `${window.location.origin}/${repository}/`;
  }

  repositoryLinks.forEach((link) => {
    link.href = repositoryUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
  });

  demoLinks.forEach((link) => {
    link.href = demoUrl;
  });
}

configureProjectLinks();
