export type MetronomeSound = 'click' | 'woodblock' | 'beep';

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private nextNoteTime = 0;
  private currentBeat = 0;
  private timerID: number | null = null;
  private isPlaying = false;
  private _bpm = 80;
  private beatsPerMeasure = 4;
  private accentPattern: boolean[] = [true, false, false, false];
  private sound: MetronomeSound = 'click';
  private onBeat: ((beat: number, isAccent: boolean) => void) | null = null;

  private readonly scheduleAheadTime = 0.1; // seconds
  private readonly lookahead = 25; // ms

  get bpm() { return this._bpm; }
  set bpm(v: number) { this._bpm = Math.max(20, Math.min(300, v)); }

  get playing() { return this.isPlaying; }

  async init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  setOnBeat(cb: (beat: number, isAccent: boolean) => void) {
    this.onBeat = cb;
  }

  setAccentPattern(pattern: boolean[]) {
    this.accentPattern = pattern;
    this.beatsPerMeasure = pattern.length;
  }

  setSound(sound: MetronomeSound) {
    this.sound = sound;
  }

  private scheduleNote(time: number) {
    if (!this.audioContext) return;

    const isAccent = this.accentPattern[this.currentBeat % this.beatsPerMeasure];

    if (this.sound === 'click' || this.sound === 'woodblock') {
      // Noise-based click
      const bufferSize = this.audioContext.sampleRate * 0.02;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Sharp attack, fast decay
        const envelope = Math.exp(-i / (bufferSize * (this.sound === 'woodblock' ? 0.15 : 0.08)));
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // Filter for tone shaping
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = isAccent ? 3500 : 2500;
      filter.Q.value = this.sound === 'woodblock' ? 2 : 5;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(isAccent ? 1.4 : 0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioContext.destination);
      source.start(time);
      source.stop(time + 0.05);
    } else {
      // Beep (oscillator)
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = isAccent ? 1000 : 800;
      gain.gain.setValueAtTime(isAccent ? 1.0 : 0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start(time);
      osc.stop(time + 0.04);
    }

    // Fire callback (approximate - for visual feedback)
    const beatIndex = this.currentBeat;
    const delay = Math.max(0, (time - this.audioContext.currentTime) * 1000);
    setTimeout(() => {
      this.onBeat?.(beatIndex, isAccent);
    }, delay);
  }

  private scheduler() {
    if (!this.audioContext || !this.isPlaying) return;

    // Resume if browser suspended the AudioContext (e.g. tab switch)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      return;
    }

    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.nextNoteTime);
      const secondsPerBeat = 60.0 / this._bpm;
      this.nextNoteTime += secondsPerBeat;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
    }
  }

  async start() {
    await this.init();
    if (this.isPlaying || !this.audioContext) return;

    this.isPlaying = true;
    this.currentBeat = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    this.timerID = window.setInterval(() => this.scheduler(), this.lookahead);
  }

  stop() {
    if (this.timerID !== null) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
    this.isPlaying = false;
    this.currentBeat = 0;
  }

  async toggle() {
    if (this.isPlaying) this.stop();
    else await this.start();
  }

  destroy() {
    this.stop();
    this.audioContext?.close();
    this.audioContext = null;
  }
}
