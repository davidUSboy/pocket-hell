import type { Action } from './types';

const KEY_BINDINGS: Readonly<Record<string, Action>> = {
  ArrowUp: 'forward',
  KeyW: 'forward',
  ArrowDown: 'backward',
  KeyS: 'backward',
  ArrowLeft: 'turnLeft',
  KeyA: 'turnLeft',
  ArrowRight: 'turnRight',
  KeyD: 'turnRight',
  KeyQ: 'strafeLeft',
  KeyE: 'strafeRight',
  Space: 'shoot',
  KeyF: 'use',
  Enter: 'pause',
  Escape: 'pause',
  KeyM: 'toggleMap',
};

const PREVENTED_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
]);

export type ActionListener = (action: Action, active: boolean) => void;

export class InputManager {
  private readonly held = new Set<Action>();
  private readonly pressed = new Set<Action>();
  private readonly listeners = new Set<ActionListener>();
  private readonly buttons: HTMLButtonElement[];

  constructor(root: ParentNode = document) {
    this.buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action]'));
    this.bindKeyboard();
    this.bindPointerControls();
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.releaseAll();
      }
    });
  }

  isHeld(action: Action): boolean {
    return this.held.has(action);
  }

  consumePress(action: Action): boolean {
    const wasPressed = this.pressed.has(action);
    this.pressed.delete(action);
    return wasPressed;
  }

  onAction(listener: ActionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  releaseAll(): void {
    for (const action of this.held) {
      this.emit(action, false);
    }

    this.held.clear();
    this.pressed.clear();
    this.buttons.forEach((button) => button.classList.remove('is-active'));
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (event) => {
      const action = KEY_BINDINGS[event.code];
      if (!action) {
        return;
      }

      if (PREVENTED_KEYS.has(event.code)) {
        event.preventDefault();
      }

      this.setAction(action, true);
    });

    window.addEventListener('keyup', (event) => {
      const action = KEY_BINDINGS[event.code];
      if (!action) {
        return;
      }

      if (PREVENTED_KEYS.has(event.code)) {
        event.preventDefault();
      }

      this.setAction(action, false);
    });
  }

  private bindPointerControls(): void {
    for (const button of this.buttons) {
      const action = button.dataset.action as Action | undefined;
      if (!action) {
        continue;
      }

      const press = (event: PointerEvent): void => {
        event.preventDefault();
        try {
          button.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture can be unavailable for synthetic or interrupted events.
        }
        button.classList.add('is-active');
        this.setAction(action, true);
      };

      const release = (event: PointerEvent): void => {
        event.preventDefault();
        try {
          if (button.hasPointerCapture(event.pointerId)) {
            button.releasePointerCapture(event.pointerId);
          }
        } catch {
          // The pointer may already have been released by the browser.
        }
        button.classList.remove('is-active');
        this.setAction(action, false);
      };

      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('contextmenu', (event) => event.preventDefault());
    }
  }

  private setAction(action: Action, active: boolean): void {
    if (active) {
      if (!this.held.has(action)) {
        this.pressed.add(action);
      }
      this.held.add(action);
    } else {
      this.held.delete(action);
    }

    this.emit(action, active);
  }

  private emit(action: Action, active: boolean): void {
    for (const listener of this.listeners) {
      listener(action, active);
    }
  }
}
