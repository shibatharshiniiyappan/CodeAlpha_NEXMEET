// Pure Web Audio API Ambient Soundscape Generator for Spatial Rooms
// 100% offline, zero network requests, zero external assets required.

export type SoundscapeType = 'none' | 'cyber-drone' | 'focus-rain' | 'lofi-pad' | 'alpha-wave';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: SoundscapeType = 'none';
  private gainNode: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private volume: number = 0.35;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): SoundscapeType {
    return this.currentType;
  }

  public stop() {
    this.currentType = 'none';
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
    setTimeout(() => {
      this.activeNodes.forEach((node) => {
        try {
          if (typeof node === 'number') {
            clearInterval(node);
          } else {
            (node as any).stop?.();
            node.disconnect();
          }
        } catch (_) {}
      });
      this.activeNodes = [];
    }, 250);
  }

  public play(type: SoundscapeType) {
    if (type === 'none') {
      this.stop();
      return;
    }

    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentType = type;
    const now = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.setTargetAtTime(this.volume, now, 0.5);
    masterGain.connect(this.ctx.destination);
    this.gainNode = masterGain;

    if (type === 'cyber-drone') {
      // Dual sub-oscillators for futuristic Innovation Lab ambiance
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, now); // A1 note
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(110, now); // A2 note
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(165, now); // E3 note

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260, now);
      filter.Q.setValueAtTime(4, now);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.2, now);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(subGain);
      subGain.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      this.activeNodes.push(osc1, osc2, osc3, filter, subGain);
    } else if (type === 'focus-rain') {
      // Pink/Brownian noise rain generator
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.12;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.setValueAtTime(800, now);
      rainFilter.Q.setValueAtTime(0.8, now);

      whiteNoise.connect(rainFilter);
      rainFilter.connect(masterGain);
      whiteNoise.start(now);

      this.activeNodes.push(whiteNoise, rainFilter);
    } else if (type === 'lofi-pad') {
      // Warm triad chord for Creative Studio
      const freqs = [130.81, 164.81, 196.0, 246.94]; // C3, E3, G3, B3 (Cmaj7)
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const flt = this.ctx.createBiquadFilter();
        const gn = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (idx * 0.25), now);

        flt.type = 'lowpass';
        flt.frequency.setValueAtTime(450, now);

        gn.gain.setValueAtTime(0.08, now);

        osc.connect(flt);
        flt.connect(gn);
        gn.connect(masterGain);
        osc.start(now);

        this.activeNodes.push(osc, flt, gn);
      });
    } else if (type === 'alpha-wave') {
      // 10Hz Alpha wave binaural beat for Boardroom focus
      const leftOsc = this.ctx.createOscillator();
      const rightOsc = this.ctx.createOscillator();
      const merger = this.ctx.createChannelMerger(2);

      leftOsc.type = 'sine';
      leftOsc.frequency.setValueAtTime(200, now); // 200 Hz

      rightOsc.type = 'sine';
      rightOsc.frequency.setValueAtTime(210, now); // 210 Hz -> 10Hz alpha difference

      leftOsc.connect(merger, 0, 0);
      rightOsc.connect(merger, 0, 1);
      merger.connect(masterGain);

      leftOsc.start(now);
      rightOsc.start(now);

      this.activeNodes.push(leftOsc, rightOsc, merger);
    }
  }
}

export const ambientAudio = new AmbientSoundEngine();
