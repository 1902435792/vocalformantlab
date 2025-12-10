
import { VowelDefinition, VowelType } from './types';

// Updated Formant Chart Constants
// Based on user provided table for "Mean Vowel Formants"
// Male values are exact from table. Female values scaled approx 1.15x.

export const VOWELS: Record<VowelType, VowelDefinition> = {
  // --- FRONT VOWELS ---
  // --- HILLENBRAND (1995) MEAN FORMANT DATA ---
  // Values: Male, Female, Child (Average)

  // 1. FRONT VOWELS
  [VowelType.I]: {
    symbol: 'i',
    ipa: 'i',
    name: '闭前元音 (Close Front)',
    description: '尖锐、明亮。',
    male: { f1: 342, f2: 2322, f3: 3000, bandwidths: [60, 90, 100] },
    female: { f1: 437, f2: 2761, f3: 3372, bandwidths: [70, 100, 120] },
    child: { f1: 430, f2: 3200, f3: 3700, bandwidths: [80, 110, 130] }, // Keeping previous Child estimates or updating if H95 child known
  },
  [VowelType.I_SHORT]: {
    symbol: 'I',
    ipa: 'ɪ',
    name: '次闭次前元音',
    description: 'Kit.',
    male: { f1: 427, f2: 2034, f3: 2684, bandwidths: [70, 100, 120] },
    female: { f1: 483, f2: 2365, f3: 3053, bandwidths: [80, 100, 120] },
    child: { f1: 530, f2: 2730, f3: 3400, bandwidths: [90, 120, 140] },
  },
  [VowelType.E_CLOSE]: {
    symbol: 'e',
    ipa: 'e',
    name: '半闭前元音',
    description: 'Face (start).',
    male: { f1: 476, f2: 2089, f3: 2691, bandwidths: [70, 90, 110] },
    female: { f1: 536, f2: 2530, f3: 3047, bandwidths: [80, 100, 120] },
    child: { f1: 600, f2: 2600, f3: 3200, bandwidths: [90, 110, 130] },
  },
  [VowelType.E_OPEN]: {
    symbol: 'E',
    ipa: 'ɛ',
    name: '半开前元音',
    description: 'Bed.',
    male: { f1: 580, f2: 1799, f3: 2605, bandwidths: [70, 90, 110] }, // H95
    female: { f1: 731, f2: 2058, f3: 2979, bandwidths: [80, 100, 120] },
    child: { f1: 700, f2: 2600, f3: 3400, bandwidths: [90, 110, 130] },
  },
  [VowelType.AE]: {
    symbol: 'ae',
    ipa: 'æ',
    name: '次开前元音',
    description: 'Cat.',
    male: { f1: 588, f2: 1720, f3: 2434, bandwidths: [80, 100, 120] }, // H95 AE
    female: { f1: 669, f2: 2349, f3: 2972, bandwidths: [90, 110, 130] },
    child: { f1: 1010, f2: 2320, f3: 3320, bandwidths: [100, 120, 140] },
  },

  // 2. BACK / CENTRAL VOWELS
  [VowelType.A]: { // /ɑ/
    symbol: 'A',
    ipa: 'ɑ',
    name: '开后元音',
    description: 'Hot / Father.',
    male: { f1: 768, f2: 1333, f3: 2522, bandwidths: [80, 100, 120] }, // H95
    female: { f1: 936, f2: 1551, f3: 2815, bandwidths: [90, 110, 130] },
    child: { f1: 1030, f2: 1370, f3: 3170, bandwidths: [100, 120, 140] },
  },
  [VowelType.O_OPEN]: { // /ɔ/
    symbol: 'c',
    ipa: 'ɔ',
    name: '半开后圆唇元音',
    description: 'Thought.',
    male: { f1: 652, f2: 997, f3: 2538, bandwidths: [80, 90, 110] },
    female: { f1: 781, f2: 1136, f3: 2824, bandwidths: [90, 100, 120] },
    child: { f1: 680, f2: 1060, f3: 3180, bandwidths: [100, 110, 130] },
  },
  [VowelType.O_CLOSE]: { // /o/
    symbol: 'o',
    ipa: 'o',
    name: '半闭后圆唇元音',
    description: 'Goat.',
    male: { f1: 497, f2: 910, f3: 2459, bandwidths: [75, 90, 110] },
    female: { f1: 555, f2: 1035, f3: 2828, bandwidths: [85, 100, 120] },
    child: { f1: 580, f2: 1100, f3: 3100, bandwidths: [95, 110, 130] },
  },
  [VowelType.U_SHORT]: { // /ʊ/
    symbol: 'U',
    ipa: 'ʊ',
    name: '次闭次后元音',
    description: 'Foot.',
    male: { f1: 469, f2: 1122, f3: 2434, bandwidths: [70, 90, 110] },
    female: { f1: 519, f2: 1225, f3: 2827, bandwidths: [80, 100, 120] },
    child: { f1: 560, f2: 1410, f3: 3310, bandwidths: [90, 110, 130] },
  },
  [VowelType.U]: { // /u/
    symbol: 'u',
    ipa: 'u',
    name: '闭后圆唇元音',
    description: 'Boot.',
    male: { f1: 378, f2: 997, f3: 2343, bandwidths: [65, 80, 100] },
    female: { f1: 459, f2: 1105, f3: 2735, bandwidths: [75, 90, 110] },
    child: { f1: 430, f2: 1170, f3: 3260, bandwidths: [85, 100, 120] },
  },
  [VowelType.CARET]: { // /ʌ/
    symbol: 'v',
    ipa: 'ʌ',
    name: '半开后元音',
    description: 'Strut.',
    male: { f1: 623, f2: 1200, f3: 2550, bandwidths: [80, 100, 120] },
    female: { f1: 753, f2: 1426, f3: 2933, bandwidths: [90, 110, 130] },
    child: { f1: 860, f2: 1590, f3: 3280, bandwidths: [100, 120, 140] },
  },
  [VowelType.BIRD]: { // /ɜː/
    symbol: '3',
    ipa: 'ɜː',
    name: '中元音',
    description: 'Bird.',
    male: { f1: 474, f2: 1379, f3: 1710, bandwidths: [75, 90, 110] },
    female: { f1: 523, f2: 1588, f3: 1929, bandwidths: [85, 100, 120] },
    child: { f1: 560, f2: 1820, f3: 2250, bandwidths: [95, 110, 130] },
  },

  // --- Interpolated / Others (Rough estimates for missing Hillenbrand data) ---
  [VowelType.Y]: {
    symbol: 'y',
    ipa: 'y',
    name: '闭前圆唇',
    description: 'Uber /u/',
    male: { f1: 270, f2: 1900, f3: 2300, bandwidths: [60, 90, 100] },
    female: { f1: 320, f2: 2400, f3: 3000, bandwidths: [70, 100, 120] },
    child: { f1: 430, f2: 2800, f3: 3400, bandwidths: [80, 110, 130] },
  },
  [VowelType.SCHWA]: {
    symbol: '@',
    ipa: 'ə',
    name: '中央元音',
    description: 'About.',
    male: { f1: 500, f2: 1500, f3: 2500, bandwidths: [70, 90, 110] },
    female: { f1: 590, f2: 1750, f3: 2900, bandwidths: [80, 100, 120] },
    child: { f1: 670, f2: 2000, f3: 3300, bandwidths: [90, 110, 130] },
  },

  // Custom & Rare Vowels approximated
  [VowelType.O_SLASH]: { symbol: 'ø', ipa: 'ø', name: 'ø', description: '', male: { f1: 470, f2: 1600, f3: 2400, bandwidths: [70, 90, 110] }, female: { f1: 530, f2: 1900, f3: 2800, bandwidths: [80, 100, 120] }, child: { f1: 600, f2: 2200, f3: 3100, bandwidths: [90, 110, 130] } },
  [VowelType.OE]: { symbol: 'oe', ipa: 'œ', name: 'œ', description: '', male: { f1: 530, f2: 1500, f3: 2400, bandwidths: [70, 90, 110] }, female: { f1: 610, f2: 1800, f3: 2900, bandwidths: [80, 100, 120] }, child: { f1: 700, f2: 2100, f3: 3300, bandwidths: [90, 110, 130] } },
  [VowelType.A_FRONT]: { symbol: 'a', ipa: 'a', name: 'a', description: '', male: { f1: 700, f2: 1500, f3: 2400, bandwidths: [80, 100, 120] }, female: { f1: 850, f2: 1800, f3: 2800, bandwidths: [90, 110, 130] }, child: { f1: 1000, f2: 2100, f3: 3300, bandwidths: [100, 120, 140] } },
  [VowelType.A_ROUND]: { symbol: 'Q', ipa: 'ɒ', name: 'ɒ', description: '', male: { f1: 730, f2: 900, f3: 2400, bandwidths: [80, 100, 120] }, female: { f1: 850, f2: 1100, f3: 2800, bandwidths: [90, 110, 130] }, child: { f1: 1030, f2: 1200, f3: 3170, bandwidths: [100, 120, 140] } },
  [VowelType.GAMMA]: { symbol: '7', ipa: 'ɤ', name: 'ɤ', description: '', male: { f1: 450, f2: 1300, f3: 2400, bandwidths: [80, 90, 110] }, female: { f1: 500, f2: 1500, f3: 2800, bandwidths: [90, 100, 120] }, child: { f1: 580, f2: 1800, f3: 3100, bandwidths: [95, 110, 130] } },
  [VowelType.U_UNROUND]: { symbol: 'W', ipa: 'ɯ', name: 'ɯ', description: '', male: { f1: 300, f2: 1400, f3: 2200, bandwidths: [70, 90, 110] }, female: { f1: 370, f2: 1600, f3: 2700, bandwidths: [80, 100, 120] }, child: { f1: 430, f2: 1900, f3: 3300, bandwidths: [85, 100, 120] } },
  [VowelType.CUSTOM]: { symbol: '?', ipa: '?', name: 'Custom', description: '', male: { f1: 500, f2: 1500, f3: 2500, bandwidths: [80, 100, 120] }, female: { f1: 550, f2: 1650, f3: 2700, bandwidths: [90, 110, 130] }, child: { f1: 650, f2: 2000, f3: 3300, bandwidths: [100, 120, 140] } },
};

export const MIN_PITCH = 80;
export const MAX_PITCH = 800;
export const DEFAULT_PITCH = 120;

// Explicit Chart Boundaries (Based on table data + margin)
export const F1_MIN = 150;
export const F1_MAX = 1000; // Cap at 1000Hz (Data max 850 + headroom)
export const F2_MIN = 500;
export const F2_MAX = 2600; // Cap at 2600Hz (Data max 2400 + headroom)
