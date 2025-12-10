
export enum VowelType {
  I = 'i',         // /i/ Close Front
  Y = 'y',         // /y/ Close Front Rounded (New)
  I_SHORT = 'I',   // /ɪ/ Near-close Near-front
  E_CLOSE = 'e',   // /e/ Close-mid Front
  O_SLASH = 'ø',   // /ø/ Close-mid Front Rounded (New)
  E_OPEN = 'E',    // /ɛ/ Open-mid Front
  OE = 'oe',       // /œ/ Open-mid Front Rounded (New)
  AE = 'ae',       // /æ/ Near-open Front
  A_FRONT = 'a',   // /a/ Open Front (New)
  A = 'A',         // /ɑ/ Open Back
  A_ROUND = 'Q',   // /ɒ/ Open Back Rounded (New)
  O_OPEN = 'c',    // /ɔ/ Open-mid Back
  CARET = 'v',     // /ʌ/ Open-mid Back-central
  GAMMA = '7',     // /ɤ/ Close-mid Back Unrounded (New)
  O_CLOSE = 'o',   // /o/ Close-mid Back
  BIRD = '3',      // /ɜː/ Open-mid Central
  U_SHORT = 'U',   // /ʊ/ Near-close Near-back
  U_UNROUND = 'W', // /ɯ/ Close Back Unrounded (New)
  U = 'u',         // /u/ Close Back
  SCHWA = '@',     // /ə/ Mid Central
  CUSTOM = 'custom', // User defined via chart
}

export interface FormantData {
  f1: number;
  f2: number;
  f3: number;
  bandwidths: [number, number, number]; // approximate bandwidths
}

export interface VowelDefinition {
  symbol: string;
  ipa: string;
  name: string;
  description: string;
  male: FormantData;
  female: FormantData;
  child: FormantData;
}

export type Gender = 'male' | 'female' | 'child';

export interface HarmonicBoost {
  active: boolean;
  freq: number; // Frequency center
  gain: number; // dB boost
  q: number;    // Bandwidth (fixed or variable)
}

export interface SimulationState {
  isPlaying: boolean;
  pitch: number; // F0
  vowel: VowelType;
  gender: Gender;
  volume: number;
  customFormants?: FormantData; // Optional override for custom positions

  // New Features
  singersFormant: boolean; // The 3kHz cluster (F4+F5+F6)
  harmonicBoost: HarmonicBoost; // User defined parametric gain

  // Physiology
  physics: VocalPhysics;
}

export interface VocalPhysics {
  tractLength: number; // in cm, default 17.5 (Standard Male)
  foldThickness: number; // 0-100, default 50
  closedQuotient: number; // 0.0-1.0, default 0.5 (Normal)
}

// --- VRA (Vocal Resonance Architect) Types ---

export enum ResonanceStrategy {
  DEEP_COVER = 'DEEP_COVER',   // F1 ≈ H1
  OPEN_CHEST = 'OPEN_CHEST',   // F1 ≈ H2
  GOLDEN_RING = 'GOLDEN_RING', // F1 ≈ H2, F2 ≈ H4
  METAL_BELT = 'METAL_BELT',   // F1 ≈ H2, F2 ≈ H3
  TWANG_MIX = 'TWANG_MIX',     // F1 ≈ H1, F2 ≈ H3 (New)
  SUPER_HEAD = 'SUPER_HEAD',   // F1 ≈ H1, F2 ≈ H3 (Modified High Pitch)
}

export interface VraResult {
  strategy: ResonanceStrategy;
  pitch: number; // Hz
  harmonics: number[]; // [H1, H2, H3, H4...]
  targetF1: number;
  targetF2: number | null; // Null if strategy doesn't enforce F2
  targetF3?: number | null; // Null if strategy doesn't enforce F3
  isFeasible: boolean;
  warning?: string;
  closestVowel: {
    type: VowelType;
    ipa: string;
    distance: number;
    description: string;
  };
  instruction: {
    jaw: string;
    tongue: string;
    general: string;
  };
}
