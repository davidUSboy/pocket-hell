import type { Action } from '../game/types';
import type { InputManager } from '../game/input';

const LEFT_ACTIONS: Action[] = ['forward', 'backward', 'turnLeft', 'turnRight'];
const RIGHT_ACTIONS: Action[] = ['shoot', 'use', 'pause'];

export class HandAnimator {
  private readonly active = new Set<Action>();
  private readonly stage: HTMLElement;

  constructor(stage: HTMLElement, input: InputManager) {
    this.stage = stage;
    input.onAction((action, isActive) => {
      if (isActive) {
        this.active.add(action);
      } else {
        this.active.delete(action);
      }
      this.render();
    });
  }

  private render(): void {
    const left = LEFT_ACTIONS.find((action) => this.active.has(action)) ?? 'idle';
    const right = RIGHT_ACTIONS.find((action) => this.active.has(action)) ?? 'idle';

    this.stage.dataset.leftAction = left;
    this.stage.dataset.rightAction = right;
  }
}
