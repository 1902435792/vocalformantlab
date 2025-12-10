import { FormantData, HarmonicBoost, VocalPhysics } from '../types';

class AudioService {
  private ctx: AudioContext | null = null;

  // Voices
  private mainOsc: OscillatorNode | null = null;
  private detuneOsc1: OscillatorNode | null = null;
  private detuneOsc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private sourceFilter: BiquadFilterNode | null = null; // Spectral Tilt (Thickness)

  // LFOs
  private vibratoLfo: OscillatorNode | null = null;
  private vibratoGain: GainNode | null = null;
  private jitterGainNode: GainNode | null = null;
  private jitterNode: AudioBufferSourceNode | null = null;

  // Mix
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Formant Filters (F1, F2, F3)
  private filters: BiquadFilterNode[] = [];

  // Special Effect Filters
  private singersFilter: BiquadFilterNode | null = null;
  private boostFilter: BiquadFilterNode | null = null;

  private isInit = false;

  public init() {
    if (this.isInit) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Compressor (Make it LOUD but controlled)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(this.ctx.destination);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.compressor);
    this.masterGain.gain.value = 0;

    this.isInit = true;
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }
    return buffer;
  }

  public setParams(
    pitch: number,
    formants: FormantData,
    volume: number,
    singersFormant: boolean = false,
    harmonicBoost: HarmonicBoost = { active: false, freq: 0, gain: 0, q: 0 },
    physics: VocalPhysics = { tractLength: 17.5, foldThickness: 50, closedQuotient: 0.5 }
  ) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const ramp = 0.05; // Smoothing

    // --- 0. PHYSICS CALCULATION ---

    // VTL Scaling: Formants shift inversely proportional to length
    // Standard Male VTL = 17.5cm
    // If VTL = 13cm (Child), scale = 17.5 / 13 = 1.34 (Higher Pitch)
    // If VTL = 22cm (Giant), scale = 17.5 / 22 = 0.79 (Lower Pitch)
    const vtlScale = 17.5 / Math.max(10, physics.tractLength);

    // Thickness (Spectral Tilt)
    // Modeled as a global Lowpass Filter on the output/input
    // Thinner (0) = Brighter (Higher Cutoff)
    // Thicker (100) = Darker (Lower Cutoff)
    // Range: 1500Hz (Thickest) to 15000Hz (Thinnest)
    // Mapping: 100 -> 1500, 50 -> 4000, 0 -> 15000
    // Logarithmic mapping feels better

    // Simple Linear mapping for robust control: 
    // Thickness 0   => 12000 Hz
    // Thickness 50  => 5000 Hz
    // Thickness 100 => 1000 Hz
    const thicknessCutoff = 12000 - (physics.foldThickness * 110);

    // Closed Quotient (CQ) - Update Glottal Pulse if changed significantly
    // TODO: Regeneration is expensive, so we might just use a filter or rely on the initial generation
    // For now, let's implement VTL and Thickness first which are efficient filter updates.


    // 1. Oscillators Pitch
    if (this.mainOsc) {
      try {
        this.mainOsc.frequency.setTargetAtTime(pitch, now, ramp);
      } catch (e) {
        // Ignore nodes that might be stopped/cleared
      }
    }
    if (this.detuneOsc1) this.detuneOsc1.frequency.setTargetAtTime(pitch, now, ramp);
    if (this.detuneOsc2) this.detuneOsc2.frequency.setTargetAtTime(pitch, now, ramp);
    // Sub oscillator is less affected by VTL, but let's keep it tracking pitch
    if (this.subOsc) this.subOsc.frequency.setTargetAtTime(pitch / 2, now, ramp);

    // 2. Master Volume
    if (this.masterGain) {
      // Thickness Boost: 0% -> 1.0x, 100% -> 3.0x (Simulating higher pressure/mass)
      // Thicker vocal folds = interactions with more mass = louder sound pressure
      const thicknessBoost = 1.0 + (physics.foldThickness / 100) * 2.0;
      this.masterGain.gain.setTargetAtTime(volume * 6.0 * thicknessBoost, now, ramp);
    }

    // 3. Formant Filters (Apply VTL Scaling)
    this.filters.forEach((filter, index) => {
      let freq = 0;
      let bw = 100;

      if (index === 0) { freq = formants.f1; bw = formants.bandwidths?.[0] || 80; }
      if (index === 1) { freq = formants.f2; bw = formants.bandwidths?.[1] || 100; }
      if (index === 2) { freq = formants.f3; bw = formants.bandwidths?.[2] || 120; }

      // Apply VTL Scaling
      freq = freq * vtlScale;

      const Q = freq / (bw || 100);

      // Protect against weird values
      if (freq > 0 && Number.isFinite(freq)) {
        filter.frequency.setTargetAtTime(freq, now, ramp);
      }
      if (Q > 0 && Number.isFinite(Q)) {
        filter.Q.setTargetAtTime(Q, now, ramp);
      }
    });

    // 4. Singer's Filter & Boost (Apply VTL Scaling too for consistency)
    if (this.singersFilter) {
      const targetGain = singersFormant ? 8 : 0; // +8dB boost
      this.singersFilter.gain.setTargetAtTime(targetGain, now, ramp);
      // Singers formant usually stays around 3kHz due to ear canal resonance, 
      // but let's scale it slightly with head size
      const scaledSingersFreq = 3000 * Math.sqrt(vtlScale);
      this.singersFilter.frequency.setTargetAtTime(scaledSingersFreq, now, ramp);
    }

    if (this.boostFilter) {
      if (harmonicBoost.active) {
        this.boostFilter.frequency.setTargetAtTime(harmonicBoost.freq, now, ramp);
        this.boostFilter.gain.setTargetAtTime(harmonicBoost.gain, now, ramp);
        this.boostFilter.Q.setTargetAtTime(harmonicBoost.q, now, ramp);
      } else {
        this.boostFilter.gain.setTargetAtTime(0, now, ramp);
      }
    }

    // 5. THICKNESS SIMULATION (Spectral Tilt via Jitter Filter or New Filter)
    // We can reuse the Jitter filter or the Noise filter, but ideally we need a global lowpass.
    // However, since we don't have a dedicated global lowpass in buildFilterChain yet, 
    // let's create one or hijack an existing one.
    //
    // Actually, `buildFilterChain()` has a highpass at the start. 
    // Let's add a "SpectralTilt" filter in buildFilterChain() if we can, 
    // OR just modify the bandwidths of the formants aka "Q" to be lower for thicker sounds?
    // 
    // Better: In `start()`, we create the source. We should add a Lowpass Filter after the source before the formant chain.
    // Since `setParams` is called often, we need access to this source filter.
    // Let's add `this.sourceFilter` to the class.

    if (this.sourceFilter) {
      // Linear mapping:
      const cutoff = 12000 - (physics.foldThickness / 100) * 11200;
      this.sourceFilter.frequency.setTargetAtTime(Math.max(800, cutoff), now, ramp);
    }

    // 6. CLOSED QUOTIENT (CQ) - Dynamic Updates
    // Recalculate Wave
    if (this.mainOsc) {
      const cq = physics.closedQuotient;
      // Make the slope difference EXTREME
      // CQ 0.1 (Breathy) -> Power 3.5 (Very dull sine-like)
      // CQ 0.9 (Pressed) -> Power 0.5 (Very bright buzz-saw)
      const power = 3.5 - (cq * 3.0);

      const real = new Float32Array(512);
      const imag = new Float32Array(512);
      real[0] = 0; imag[0] = 0;
      for (let n = 1; n < 512; n++) {
        imag[n] = 1 / Math.pow(n, power);
      }

      try {
        const newWave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
        // some browsers might not support setPeriodicWave on running osc, but modern ones do
        (this.mainOsc as any).setPeriodicWave(newWave);
      } catch (e) {
        // console.warn("Cannot set periodic wave", e);
      }
    }

    // Effect 3: Noise Level (Breathiness)
    // Low CQ = More Breath Noise
    // High CQ = Less Breath Noise
    if (this.noiseGain) {
      // CQ 0.1 -> Noise Gain 0.15 (Audible Breath)
      // CQ 0.9 -> Noise Gain 0.00 (Silent)
      const breathiness = Math.max(0, (1.0 - physics.closedQuotient) * 0.2);
      this.noiseGain.gain.setTargetAtTime(breathiness, now, ramp);
    }
  }

  private createFilters() {
    if (!this.ctx || !this.masterGain) return;

    this.filters = [];
    this.singersFilter = null;
    this.boostFilter = null;

    // Chain: Source -> [HPF] -> Filter1 -> Filter2 -> Filter3 -> SingersEQ -> BoostEQ -> MasterGain

    // Safety Highpass (remove sub-rumble)
    let previousNode: AudioNode = this.ctx.createBiquadFilter();
    (previousNode as BiquadFilterNode).type = 'highpass';
    (previousNode as BiquadFilterNode).frequency.value = 80;

    // The source will connect to this 'previousNode' later.
    // Ideally we return the input node of the chain.
    // But for simplicity let's rebuild the chain logic.

    // Actually, we need to store the input node to the filter chain so we can connect oscillators to it.
    // Let's call it 'chainInput'.

    // Rewriting createFilters isn't enough, we need to know where to connect the oscillators.
    // Let's assume oscillators connect to this.filters[0] if exists.
  }

  // Simplified: Just creates the filter chain and returns the INPUT node
  private buildFilterChain(): AudioNode {
    if (!this.ctx || !this.masterGain) throw new Error("No Context");

    const chainInput = this.ctx.createGain(); // Summing point
    let currentNode: AudioNode = chainInput;

    // 1. Formants (Series)
    for (let i = 0; i < 3; i++) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      this.filters.push(filter);
      currentNode.connect(filter);
      currentNode = filter;
    }

    // 2. Singers Formant
    this.singersFilter = this.ctx.createBiquadFilter();
    this.singersFilter.type = 'peaking';
    this.singersFilter.frequency.value = 3000;
    this.singersFilter.Q.value = 1.5;
    currentNode.connect(this.singersFilter);
    currentNode = this.singersFilter;

    // 3. User Boost
    this.boostFilter = this.ctx.createBiquadFilter();
    this.boostFilter.type = 'peaking';
    // defaults
    currentNode.connect(this.boostFilter);
    currentNode = this.boostFilter;

    // 4. Output
    currentNode.connect(this.masterGain);

    return chainInput;
  }

  public start(
    pitch: number,
    formants: FormantData,
    volume: number,
    singersFormant: boolean,
    harmonicBoost: HarmonicBoost,
    physics: VocalPhysics = { tractLength: 17.5, foldThickness: 50, closedQuotient: 0.5 }
  ) {
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.stop();

      // Rebuild Filter Chain
      this.filters = []; // clear ref
      const chainInput = this.buildFilterChain();

      // --- NEW: Source Filter (Spectral Tilt / Thickness) ---
      this.sourceFilter = this.ctx.createBiquadFilter();
      this.sourceFilter.type = 'lowpass';
      this.sourceFilter.Q.value = 0.5; // Smooth rolloff
      this.sourceFilter.frequency.value = 10000; // Default open
      this.sourceFilter.connect(chainInput);

      const oscDestination = this.sourceFilter;

      // 0. GENERATE CUSTOM GLOTTAL PULSE (PeriodicWave)
      // CQ Logic: High CQ = Bright/Pressed, Low CQ = Dark/Breathy
      const real = new Float32Array(512);
      const imag = new Float32Array(512);
      real[0] = 0; imag[0] = 0;

      const cq = physics.closedQuotient;
      const power = 2.5 - (cq * 1.7); // 0.1->2.33 (Soft), 0.9->0.97 (Bright)

      for (let n = 1; n < 512; n++) {
        imag[n] = 1 / Math.pow(n, power);
      }
      const glottalWave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });




      // 1. Vibrato & Jitter LFOs
      // Jitter: Fast, random frequency modulation (simulates vocal fold instability)
      this.jitterNode = this.ctx.createBufferSource();
      const jitterBuffer = this.createNoiseBuffer(); // Reuse noise buffer
      if (jitterBuffer) {
        this.jitterNode.buffer = jitterBuffer;
        this.jitterNode.loop = true;
        const jitterFilter = this.ctx.createBiquadFilter();
        jitterFilter.type = 'lowpass';
        jitterFilter.frequency.value = 50; // Jitter is low freq random
        this.jitterGainNode = this.ctx.createGain();
        this.jitterGainNode.gain.value = 8; // +/- 8Hz instability
        this.jitterNode.connect(jitterFilter);
        jitterFilter.connect(this.jitterGainNode);

        // Save to connect to oscs
        // this.jitterGainNode = jitterGain; // Already assigned above
        this.jitterNode.start();
      }

      this.vibratoLfo = this.ctx.createOscillator();
      this.vibratoLfo.frequency.value = 5.5; // 5.5Hz Human Vibrato
      this.vibratoGain = this.ctx.createGain();
      this.vibratoGain.gain.value = 3.0; // +/- 3Hz depth
      this.vibratoLfo.connect(this.vibratoGain);
      this.vibratoLfo.start();

      // --- Create Oscillators ---
      const now = this.ctx.currentTime;

      // Helper to setup voice
      const createVoice = (type: OscillatorType | 'custom', detune: number, gainVal: number) => {
        const osc = this.ctx!.createOscillator();
        if (type === 'custom') {
          osc.setPeriodicWave(glottalWave);
        } else {
          osc.type = type;
        }
        osc.frequency.value = pitch;
        osc.detune.value = detune;

        // Connect LFO for vibrato
        if (this.vibratoGain) this.vibratoGain.connect(osc.frequency);
        // Connect Jitter
        if (this.jitterGainNode) this.jitterGainNode.connect(osc.frequency);

        const gain = this.ctx!.createGain();
        gain.gain.value = gainVal;

        // Shimmer Effect: Modulate Amplitude with Noise
        // Reuse noise logic or create simple one
        // For simplicity: Just static gain for now to avoid complexity explosion, 
        // relying on Jitter for realism is usually enough.

        osc.connect(gain);
        gain.connect(oscDestination);
        return osc;
      };

      // Main Voice (Custom Glottal Pulse)
      this.mainOsc = createVoice('custom', 0, 0.9);
      this.mainOsc.start();

      // Detune 1 (Slight sharp, Chorus) - Use Sawtooth for texture contrast
      this.detuneOsc1 = createVoice('sawtooth', 3, 0.5);
      this.detuneOsc1.start();

      // Detune 2 (Slight flat, Chorus)
      this.detuneOsc2 = createVoice('sawtooth', -3, 0.5);
      this.detuneOsc2.start();

      // Sub Bass (Triangle - body)
      this.subOsc = this.ctx.createOscillator();
      this.subOsc.type = 'triangle';
      this.subOsc.frequency.value = pitch / 2; // -1 Octave
      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.7;
      this.subOsc.connect(subGain);
      subGain.connect(oscDestination);
      this.subOsc.start();

      // Noise (Breath)
      const buffer = this.createNoiseBuffer();
      if (buffer) {
        this.noiseNode = this.ctx.createBufferSource();
        this.noiseNode.buffer = buffer;
        this.noiseNode.loop = true;
        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.value = 0.08; // Very subtle breath

        // Lowpass the noise so it's not "hissy" but "breathy"
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 1000;

        this.noiseNode.connect(noiseFilter);
        noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(oscDestination);
        this.noiseNode.start();
      }

      // Apply params immediately
      this.setParams(pitch, formants, volume, singersFormant, harmonicBoost, physics);

    } catch (e) {
      console.error("AudioService.start error", e);
      this.stop(); // Cleanup partial state
      throw e; // Re-throw to caller
    }
  }

  public stop() {
    const stopNode = (node: AudioScheduledSourceNode | null) => {
      if (node) {
        try { node.stop(); node.disconnect(); } catch (e) { }
      }
    };
    stopNode(this.mainOsc);
    stopNode(this.detuneOsc1);
    stopNode(this.detuneOsc2);
    stopNode(this.subOsc);
    stopNode(this.noiseNode);
    stopNode(this.vibratoLfo);
    stopNode(this.jitterNode);

    this.mainOsc = null;
    this.detuneOsc1 = null;
    this.detuneOsc2 = null;
    this.subOsc = null;
    this.noiseNode = null;
    this.vibratoLfo = null;
    this.jitterNode = null;
  }
}

export const audioService = new AudioService();
