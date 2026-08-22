const KEY_BINDINGS = {
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
export class InputManager {
    held = new Set();
    pressed = new Set();
    listeners = new Set();
    buttons;
    constructor(root = document) {
        this.buttons = Array.from(root.querySelectorAll('[data-action]'));
        this.bindKeyboard();
        this.bindPointerControls();
        window.addEventListener('blur', () => this.releaseAll());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.releaseAll();
            }
        });
    }
    isHeld(action) {
        return this.held.has(action);
    }
    consumePress(action) {
        const wasPressed = this.pressed.has(action);
        this.pressed.delete(action);
        return wasPressed;
    }
    onAction(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    releaseAll() {
        for (const action of this.held) {
            this.emit(action, false);
        }
        this.held.clear();
        this.pressed.clear();
        this.buttons.forEach((button) => button.classList.remove('is-active'));
    }
    bindKeyboard() {
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
    bindPointerControls() {
        for (const button of this.buttons) {
            const action = button.dataset.action;
            if (!action) {
                continue;
            }
            const press = (event) => {
                event.preventDefault();
                try {
                    button.setPointerCapture(event.pointerId);
                }
                catch {
                    // Pointer capture can be unavailable for synthetic or interrupted events.
                }
                button.classList.add('is-active');
                this.setAction(action, true);
            };
            const release = (event) => {
                event.preventDefault();
                try {
                    if (button.hasPointerCapture(event.pointerId)) {
                        button.releasePointerCapture(event.pointerId);
                    }
                }
                catch {
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
    setAction(action, active) {
        if (active) {
            if (!this.held.has(action)) {
                this.pressed.add(action);
            }
            this.held.add(action);
        }
        else {
            this.held.delete(action);
        }
        this.emit(action, active);
    }
    emit(action, active) {
        for (const listener of this.listeners) {
            listener(action, active);
        }
    }
}
