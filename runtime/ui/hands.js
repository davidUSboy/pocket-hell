const LEFT_ACTIONS = ['forward', 'backward', 'turnLeft', 'turnRight'];
const RIGHT_ACTIONS = ['shoot', 'use', 'pause'];
export class HandAnimator {
    active = new Set();
    stage;
    constructor(stage, input) {
        this.stage = stage;
        input.onAction((action, isActive) => {
            if (isActive) {
                this.active.add(action);
            }
            else {
                this.active.delete(action);
            }
            this.render();
        });
    }
    render() {
        const left = LEFT_ACTIONS.find((action) => this.active.has(action)) ?? 'idle';
        const right = RIGHT_ACTIONS.find((action) => this.active.has(action)) ?? 'idle';
        this.stage.dataset.leftAction = left;
        this.stage.dataset.rightAction = right;
    }
}
