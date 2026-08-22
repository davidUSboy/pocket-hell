export class AudioEngine {
    context = null;
    master = null;
    noiseBuffer = null;
    shot() {
        const context = this.ensureContext();
        if (!context || !this.master) {
            return;
        }
        const now = context.currentTime;
        const noise = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        noise.buffer = this.getNoiseBuffer(context);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(140, now + 0.14);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        noise.connect(filter).connect(gain).connect(this.master);
        noise.start(now);
        noise.stop(now + 0.17);
        this.tone(85, 38, 0.12, 0.12, 'square');
    }
    hit() {
        this.tone(260, 90, 0.09, 0.11, 'square');
    }
    hurt() {
        this.tone(105, 48, 0.22, 0.14, 'sawtooth');
    }
    pickup() {
        this.tone(330, 660, 0.13, 0.09, 'square');
        window.setTimeout(() => this.tone(520, 880, 0.09, 0.06, 'square'), 65);
    }
    door() {
        this.tone(145, 70, 0.18, 0.08, 'square');
    }
    empty() {
        this.tone(55, 45, 0.05, 0.05, 'square');
    }
    win() {
        this.tone(220, 440, 0.18, 0.08, 'square');
        window.setTimeout(() => this.tone(330, 660, 0.18, 0.08, 'square'), 150);
        window.setTimeout(() => this.tone(440, 880, 0.26, 0.1, 'square'), 300);
    }
    tone(startFrequency, endFrequency, duration, volume, type) {
        const context = this.ensureContext();
        if (!context || !this.master) {
            return;
        }
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(startFrequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        oscillator.connect(gain).connect(this.master);
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    ensureContext() {
        if (!this.context) {
            try {
                this.context = new AudioContext();
                this.master = this.context.createGain();
                this.master.gain.value = 0.42;
                this.master.connect(this.context.destination);
            }
            catch {
                return null;
            }
        }
        if (this.context.state === 'suspended') {
            void this.context.resume();
        }
        return this.context;
    }
    getNoiseBuffer(context) {
        if (this.noiseBuffer) {
            return this.noiseBuffer;
        }
        const length = Math.floor(context.sampleRate * 0.2);
        const buffer = context.createBuffer(1, length, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let index = 0; index < length; index += 1) {
            data[index] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
        return buffer;
    }
}
