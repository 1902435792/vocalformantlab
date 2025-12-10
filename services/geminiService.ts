
import { GoogleGenAI } from "@google/genai";
import { FormantData, VowelDefinition, Gender, VowelType } from "../types";

export const analyzeVowel = async (
  vowel: VowelDefinition,
  pitch: number,
  gender: Gender
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please set REACT_APP_GEMINI_API_KEY or similar in your environment.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Helper to handle Custom display
  const isCustom = vowel.name.includes('Custom') || vowel.name.includes('自定义');
  
  const prompt = `
    作为一名专业的声学语音学家和声音科学家，请对以下合成元音进行简洁但详细的声学分析。请使用中文回答。
    
    元音类型: ${vowel.name} ${isCustom ? '(用户手动合成)' : `(${vowel.ipa})`}
    声道模型性别: ${gender === 'male' ? '男声' : '女声'}
    基频 (F0): ${pitch} Hz
    共振峰数据: 
    - F1 (下颌开合): ${gender === 'male' ? vowel.male.f1 : vowel.female.f1} Hz
    - F2 (舌位前后): ${gender === 'male' ? vowel.male.f2 : vowel.female.f2} Hz
    - F3: ${gender === 'male' ? vowel.male.f3 : vowel.female.f3} Hz

    请解释:
    1. 听感质量 (例如：明亮、暗淡、开阔、闭塞)。
    2. F1 (${Math.round(gender === 'male' ? vowel.male.f1 : vowel.female.f1)} Hz) 如何对应下颌位置。
    3. F2 (${Math.round(gender === 'male' ? vowel.male.f2 : vowel.female.f2)} Hz) 如何对应舌头位置 (前/后)。
    4. 音高 (F0) 与共振峰之间的相互关系 (是否形成共鸣调谐/Formant Tuning?)。
    
    ${isCustom ? '由于这是自定义发音，请描述它最接近哪个标准国际音标元音。' : ''}
    
    请保持语气专业但通俗易懂。使用清晰的要点格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "无法获取分析结果。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "分析生成失败。请检查网络或API密钥配额。";
  }
};
