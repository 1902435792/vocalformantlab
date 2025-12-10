
import { VOWELS } from "../constants";
import { Gender, ResonanceStrategy, VowelType, VraResult } from "../types";

// Human physiological limits (approximate)
const LIMITS = {
  male: { f1Max: 900, f1Min: 200, f2Min: 600, f2Max: 2400 },
  female: { f1Max: 1100, f1Min: 250, f2Min: 700, f2Max: 2800 },
};

export const calculateResonanceStrategy = (
  pitch: number,
  strategy: ResonanceStrategy,
  gender: Gender
): VraResult => {
  const h1 = pitch;
  const h2 = pitch * 2;
  const h3 = pitch * 3;
  const h4 = pitch * 4;

  const limits = LIMITS[gender];

  let targetF1 = 0;
  let targetF2: number | null = null;
  let targetF3: number | null = null;

  // Macro Defaults (Standard Physics)
  let physicsOverride: Partial<VocalPhysics> = {};
  let boostOverride: HarmonicBoost | undefined = undefined;
  let singersFormantOverride = false;

  let generalInstruction = "";
  let jawInstruction = "";
  let tongueInstruction = "";
  let isFeasible = true;
  let warning = undefined;

  // 1. Calculate Targets based on Strategy
  switch (strategy) {
    case ResonanceStrategy.DEEP_COVER: // Whoop / Falsetto reinforcement
      targetF1 = h1;
      targetF2 = 900;
      physicsOverride = { closedQuotient: 0.4, tractLength: 17.5 }; // More breathy/fluty
      generalInstruction = "将 F1 调整至基频 (H1)。产生纯净、长笛般的音色，或用于假声增强 (Whoop Timbre)。";
      break;

    case ResonanceStrategy.OPEN_CHEST: // Call / Belting base
      targetF1 = h2;
      targetF2 = 1500;
      physicsOverride = { closedQuotient: 0.6, foldThickness: 60 }; // Thicker folds, firmer closure
      generalInstruction = "将 F1 调整至第二谐波 (H2)。产生铜管乐般、呐喊的音色，是真声Belting的基础 (Call Timbre)。";
      break;

    case ResonanceStrategy.GOLDEN_RING: // Classical / Noble
      targetF1 = h2;
      targetF2 = h4;
      physicsOverride = { tractLength: 19.0, closedQuotient: 0.5 }; // Lower larynx (longer tract)
      singersFormantOverride = true; // Activate Singer's Formant
      generalInstruction = "双重锁定：F1对齐H2，F2对齐H4。这是古典美声的'黄金共鸣'位置，喉位降低，投射力极强。";
      break;

    case ResonanceStrategy.METAL_BELT: // Rock / Edge
      targetF1 = h2;
      targetF2 = h3;
      physicsOverride = { closedQuotient: 0.75, foldThickness: 50 }; // High compression
      boostOverride = { active: true, freq: 3000, gain: 12, q: 2 }; // Edge boost
      generalInstruction = "金属强声：F1对齐H2，F2对齐H3。产生刺耳、尖锐、类似小号的金属音色 (Metal/Edge)。";
      break;

    case ResonanceStrategy.TWANG_MIX: // Bright / Nasty Mix
      targetF1 = h1;
      targetF2 = h3;
      // High Larynx (Shorter tract), High CQ
      physicsOverride = { tractLength: 15.5, closedQuotient: 0.7 };
      boostOverride = { active: true, freq: 3500, gain: 15, q: 3 }; // Nasty nasal ring
      generalInstruction = "Twang混声：F1对齐H1，F2对齐H3。利用高喉位(短声道)产生明亮、带有强烈的咽音色彩。";
      break;

    case ResonanceStrategy.SUPER_HEAD: // High Pitch Head
      targetF1 = h1;
      targetF2 = h3;
      targetF3 = null;
      physicsOverride = { foldThickness: 30 }; // Thin folds
      generalInstruction = "超高头声：F2锁定H3。声带边缘振动，产生极具穿透力的头声共鸣。";
      break;

    case ResonanceStrategy.SOB_CRY: // [NEW] Sobbing / Low Larynx
      targetF1 = h1; // F1 tracks H1 for stability
      targetF2 = 800; // Low F2 (Back vowelish)
      // Very Low Larynx (Long tract), Thin folds (Cry)
      physicsOverride = { tractLength: 20.0, foldThickness: 40, closedQuotient: 0.5 };
      boostOverride = { active: true, freq: 500, gain: 5, q: 1 }; // Warmth
      generalInstruction = "哭腔 (Sob)：极低喉位(长声道)，配合F1锁定基频。产生宽厚、悲伤、深沉的抒情音色。";
      break;

    case ResonanceStrategy.PHARYNGEAL: // [NEW] High Compression / Squeezed
      targetF1 = h2;
      targetF2 = 1200; // Centralized but constrained
      // Extreme Compression
      physicsOverride = { closedQuotient: 0.85, foldThickness: 60, tractLength: 16.5 };
      boostOverride = { active: true, freq: 1500, gain: 10, q: 2 }; // Mid-range punch
      generalInstruction = "咽音 (Pharyngeal)：极高闭合系数，声道缩短。产生极度挤压、充满力量和紧张感的音色。";
      break;
  }

  // 2. Feasibility Checks
  if (targetF1 > limits.f1Max) {
    isFeasible = false;
    warning = `目标 F1 (${Math.round(targetF1)}Hz) 超出了人类下颌张开的极限。`;
    targetF1 = limits.f1Max;
  } else if (targetF1 < limits.f1Min) {
    warning = "目标 F1 过低，需要极度闭合下颌或极度圆唇。";
  }

  if (targetF2 && targetF2 > limits.f2Max) {
    isFeasible = false;
    warning = `目标 F2 (${Math.round(targetF2)}Hz) 过高，舌位难以企及。`;
    targetF2 = limits.f2Max;
  }

  if (targetF3 && targetF3 < 2000) {
    isFeasible = false;
    warning = `目标 F3 (${Math.round(targetF3)}Hz) 过低。此策略需要更高的音高支持。`;
  }

  // 3. Inverse Vowel Mapping
  let minDist = Infinity;
  let closestVowelKey = VowelType.SCHWA;
  let closestVowelDef = VOWELS[VowelType.SCHWA];

  (Object.keys(VOWELS) as VowelType[]).forEach((key) => {
    if (key === VowelType.CUSTOM) return;
    const def = VOWELS[key];
    const data = gender === 'male' ? def.male : def.female;

    const f2Val = targetF2 ?? data.f2;

    const dF1 = data.f1 - targetF1;
    const dF2 = data.f2 - f2Val;

    let dist = 0;
    if (targetF3) {
      const dF3 = data.f3 - targetF3;
      dist = Math.sqrt(dF1 * dF1 + dF2 * dF2 * 0.5 + dF3 * dF3 * 0.3);
    } else {
      dist = Math.sqrt(dF1 * dF1 + dF2 * dF2 * 0.5);
    }

    if (dist < minDist) {
      minDist = dist;
      closestVowelKey = key;
      closestVowelDef = def;
    }
  });

  // 4. Instructions
  if (targetF1 < 350) jawInstruction = "闭合 (咬合肌放松)";
  else if (targetF1 < 500) jawInstruction = "微开 (一指宽)";
  else if (targetF1 < 700) jawInstruction = "张开 (拇指宽)";
  else if (targetF1 < 900) jawInstruction = "大开 (两指宽)";
  else jawInstruction = "极度张开 (下巴下掉)";

  if (targetF2) {
    if (targetF2 > 2200) tongueInstruction = "高前 (舌拱近硬腭前部)";
    else if (targetF2 > 1800) tongueInstruction = "中前 (舌拱近硬腭中部)";
    else if (targetF2 > 1300) tongueInstruction = "中性 / 中央";
    else if (targetF2 > 900) tongueInstruction = "后缩 (舌拱近软腭)";
    else tongueInstruction = "极度后缩 (咽腔收缩)";
  } else {
    tongueInstruction = "灵活 / 取决于元音选择";
  }

  let vowelDesc = `从 /${closestVowelDef.ipa}/ 开始`;
  const data = gender === 'male' ? closestVowelDef.male : closestVowelDef.female;

  if (targetF1 > data.f1 + 50) vowelDesc += "，但下巴需要更开一点。";
  else if (targetF1 < data.f1 - 50) vowelDesc += "，但下巴稍微收一点。";

  if (targetF2 && targetF2 > data.f2 + 100) vowelDesc += " 舌头更向前推。";
  else if (targetF2 && targetF2 < data.f2 - 100) vowelDesc += " 舌头稍微后缩。";


  return {
    strategy,
    pitch,
    harmonics: [h1, h2, h3, h4],
    targetF1,
    targetF2,
    targetF3,
    // Return Macro values
    physics: physicsOverride,
    harmonicBoost: boostOverride,
    singersFormant: singersFormantOverride,

    isFeasible,
    warning,
    closestVowel: {
      type: closestVowelKey,
      ipa: closestVowelDef.ipa,
      distance: minDist,
      description: vowelDesc
    },
    instruction: {
      general: generalInstruction,
      jaw: jawInstruction,
      tongue: tongueInstruction
    }
  };
};
