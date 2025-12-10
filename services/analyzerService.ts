
export interface AnalyzedFormants {
    f1: number;
    f2: number;
    energy: number;
    spectrum?: number[]; // Added spectrum data (0-1 normalized magnitude approx)
}

class AnalyzerService {
    private audioContext: AudioContext | null = null;
    private analyzer: AnalyserNode | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;
    private bufferValues: Float32Array;
    private frequencyBuffer: Uint8Array; // Buffer for FFT frequency data
    private updateInterval: number | null = null;

    // LPC Configuration
    private readonly ORDER = 12; // LPC Order (p=12 usually good for standard speech)
    private readonly SAMPLE_RATE = 11025; // Downsample for performance and focus on < 5500Hz

    constructor() {
        this.bufferValues = new Float32Array(512); // Small buffer for low latency
        this.frequencyBuffer = new Uint8Array(1024); // Will be resized based on fftSize
    }

    public async start(onUpdate: (data: AnalyzedFormants) => void): Promise<void> {
        try {
            // 1. Get Microphone Access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });

            // 2. Set up Audio Context (Lower sample rate for efficiency if possible, else resample)
            // Note: Browsers usually enforce hardware sample rate (e.g. 44100 or 48000). 
            // We will just process at native rate or use a ScriptProcessor/AudioWorklet if needed.
            // For simplicity in this demo, we'll use AnalyserNode at native rate but limiting FFT, 
            // OR simpler: just process time domain data.
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // 3. Create Source and Analyzer
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.analyzer = this.audioContext.createAnalyser();
            this.analyzer.fftSize = 2048; // 1024 bins
            this.analyzer.smoothingTimeConstant = 0.5; // Smooth visual transition

            this.bufferValues = new Float32Array(this.analyzer.fftSize);
            this.frequencyBuffer = new Uint8Array(this.analyzer.frequencyBinCount);

            this.source.connect(this.analyzer);

            // 4. Start analysis loop
            this.updateInterval = window.setInterval(() => {
                if (!this.analyzer || !this.audioContext) return;

                // A. Get Time Domain Data (for LPC)
                this.analyzer.getFloatTimeDomainData(this.bufferValues as any);

                // B. Get Frequency Data (for Visual Overlay)
                this.analyzer.getByteFrequencyData(this.frequencyBuffer as any);

                // Calculate Energy (RMS) to gate silence
                let rms = 0;
                for (let i = 0; i < this.bufferValues.length; i++) {
                    rms += this.bufferValues[i] * this.bufferValues[i];
                }
                rms = Math.sqrt(rms / this.bufferValues.length);

                // Noise Gate
                if (rms < 0.02) {
                    // Send empty data to clear viz if silence
                    onUpdate({ f1: 0, f2: 0, energy: 0, spectrum: [] });
                    return;
                }

                // Perform LPC Analysis
                const formants = this.performLPC(this.bufferValues, this.audioContext.sampleRate);

                // Process Spectrum for Visualization
                // We want to map 1024 bins to a smaller set for Recharts performance (e.g. 50-100 points)
                // And normalize to roughly match the visual scale of the theoretical curve (0-1 approx)
                const spectrumPoints: number[] = [];
                const binCount = this.frequencyBuffer.length;
                const maxFreq = this.audioContext.sampleRate / 2;

                // Downsample to ~60 points for 0-5000Hz range roughly
                const targetPoints = 60;
                // Sample rate is likely 44100 or 48000. Nyquist 22k-24k.
                // We care about 0-5500Hz mostly.
                // 5500 / 22050 ~= 0.25 of the array.
                const effectiveIndexEnd = Math.floor(binCount * (5500 / maxFreq));
                const step = Math.max(1, Math.floor(effectiveIndexEnd / targetPoints));

                for (let i = 0; i < effectiveIndexEnd; i += step) {
                    // Average/Max pooling for the bin
                    let val = this.frequencyBuffer[i];
                    // Normalize 0-255 to 0-1.2 (boost a bit for visibility)
                    spectrumPoints.push((val / 255.0) * 4.0);
                }

                if (formants) {
                    onUpdate({ ...formants, energy: rms, spectrum: spectrumPoints });
                } else {
                    onUpdate({ f1: 0, f2: 0, energy: rms, spectrum: spectrumPoints });
                }

            }, 50); // 20fps

        } catch (error) {
            console.error("Microphone access failed:", error);
            throw error;
        }
    }

    public stop() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.source) this.source.disconnect();
        if (this.stream) this.stream.getTracks().forEach(track => track.stop());
        if (this.audioContext) this.audioContext.close();

        this.updateInterval = null;
        this.source = null;
        this.stream = null;
        this.audioContext = null;
    }

    /**
     * Levinson-Durbin Recursion & Root Solving for Formant Estimation
     * This is a simplified JS implementation suitable for real-time visualization.
     */
    private performLPC(buffer: Float32Array, sampleRate: number): { f1: number, f2: number } | null {
        const n = buffer.length;
        const p = this.ORDER;

        // 1. Windowing (Hamming) & Pre-emphasis
        const signal = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            // Hamming Window
            const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1));
            // Pre-emphasis (x[n] - 0.9x[n-1]) to boost high frequencies
            const pre = max0(i) ? buffer[i] - 0.95 * buffer[i - 1] : buffer[i];
            signal[i] = pre * window;
        }

        function max0(i: number) { return i > 0; }

        // 2. Autocorrelation (R)
        const R = new Float32Array(p + 1);
        for (let k = 0; k <= p; k++) {
            let sum = 0;
            for (let i = 0; i < n - k; i++) {
                sum += signal[i] * signal[i + k];
            }
            R[k] = sum;
        }

        // 3. Levinson-Durbin Recursion
        // Solves Yule-Walker equations to find LPC coefficients (a)
        const a = new Float32Array(p + 1);
        const e = new Float32Array(p + 1);
        const k_ref = new Float32Array(p + 1);

        // Init
        a[0] = 1;
        e[0] = R[0];

        for (let k = 1; k <= p; k++) {
            let sum = 0;
            for (let j = 1; j < k; j++) {
                sum += a[j] * R[k - j];
            }
            const lambda = (R[k] - sum) / e[k - 1]; // Reflection coeff
            k_ref[k] = lambda;

            a[k] = lambda;
            const a_prev = arrCopy(a);
            for (let j = 1; j < k; j++) {
                a[j] = a_prev[j] - lambda * a_prev[k - j];
            }

            e[k] = e[k - 1] * (1 - lambda * lambda);
        }

        // 4. Find Roots - Fast Spectral Evaluation Method
        const freqs = [];
        const magnitudes = [];

        // Scan frequencies from 200Hz to 4000Hz (Vowel range)
        const startFreq = 200;
        const endFreq = 4000;

        let peaks: { f: number, mag: number }[] = [];

        // Evaluate A(z) polynomial on Unit Circle: z = e^(j * w)
        // w = 2*pi*f / Fs
        // Response = 1 / |A|

        // We will scan with fine granularity
        for (let f = startFreq; f <= endFreq; f += 25) {
            const w = (2 * Math.PI * f) / sampleRate;
            let real = 1;
            let imag = 0;
            for (let k = 1; k <= p; k++) {
                const angle = -w * k;
                const r_part = Math.cos(angle);
                const i_part = Math.sin(angle);

                real += a[k] * r_part;
                imag += a[k] * i_part;
            }
            const magSquared = real * real + imag * imag;
            const mag = 1 / Math.sqrt(magSquared);

            magnitudes.push(mag);
        }

        // Re-scan magnitudes to find peaks
        for (let i = 1; i < magnitudes.length - 1; i++) {
            if (magnitudes[i] > magnitudes[i - 1] && magnitudes[i] > magnitudes[i + 1]) {
                // Found peak
                const f = startFreq + (i * 25);
                peaks.push({ f, mag: magnitudes[i] });
            }
        }

        // Sort peaks by frequency
        peaks.sort((a, b) => a.f - b.f);

        let f1 = 0;
        let f2 = 0;

        if (peaks.length >= 1) f1 = peaks[0].f;
        if (peaks.length >= 2) f2 = peaks[1].f;

        if (f1 > 0 && f2 > 0) {
            return { f1, f2 };
        }

        return null;
    }
}

function arrCopy(src: Float32Array) {
    return Float32Array.from(src);
}

export const analyzerService = new AnalyzerService();
