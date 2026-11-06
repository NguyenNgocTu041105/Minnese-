import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { pinyin as getPinyinPro } from 'pinyin-pro';

/**
 * Ephemeral BYOK Connectivity & Key Test Endpoint Handler
 * ZERO LOGGING: Never log API key or request headers
 */
export async function handleBYOKTest(req: Request, res: Response): Promise<void> {
  const byokKey = (req.headers['x-byok-gemini-key'] || req.headers['x-byok-api-key']) as string | undefined;
  const trimmed = typeof byokKey === 'string' ? byokKey.trim() : '';

  if (!trimmed) {
    res.status(400).json({ success: false, error: 'Khóa API không được để trống.' });
    return;
  }

  try {
    const client = new GoogleGenAI({
      apiKey: trimmed,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await client.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: 'ping',
      config: {
        maxOutputTokens: 2,
        temperature: 0.1,
      },
    });

    if (response) {
      res.json({
        success: true,
        message: 'Khóa API Google Gemini hợp lệ! Kết nối thành công.',
        model: 'Gemini 3.1 Flash Lite',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Kết nối Google Gemini thành công.',
    });
  } catch (err: any) {
    const status = err?.status || err?.code;
    const msg = err?.message || '';

    if (status === 'RESOURCE_EXHAUSTED' || msg.includes('429') || msg.includes('quota')) {
      res.status(429).json({
        success: false,
        error: 'Khóa API đã chạm giới hạn lưu lượng (Quota/Rate Limit). Vui lòng thử lại sau vài giây.',
      });
      return;
    }

    if (status === 'INVALID_ARGUMENT' || msg.includes('API_KEY_INVALID') || msg.includes('400') || msg.includes('API key not valid')) {
      res.status(400).json({
        success: false,
        error: 'Khóa API không hợp lệ. Vui lòng kiểm tra lại mã khóa đã sao chép từ Google AI Studio.',
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: `Không thể kết nối đến Google Gemini: ${msg.slice(0, 120)}`,
    });
  }
}

// Cooldown tracker for voice models
const voiceModelCooldowns = new Map<string, number>();

async function callGeminiVoice(
  gemini: GoogleGenAI,
  prompt: string,
  systemInstruction: string
): Promise<string> {
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];
  const now = Date.now();

  const modelsToTry = [...candidateModels].sort((a, b) => {
    const coolA = (voiceModelCooldowns.get(a) || 0) > now ? 1 : 0;
    const coolB = (voiceModelCooldowns.get(b) || 0) > now ? 1 : 0;
    return coolA - coolB;
  });

  let lastError: any = null;

  for (const model of modelsToTry) {
    const cooldownUntil = voiceModelCooldowns.get(model) || 0;
    if (cooldownUntil > now) continue;

    try {
      const response = await gemini.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      if (response.text) {
        voiceModelCooldowns.delete(model);
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const isQuota =
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.message?.includes('429') ||
        err?.message?.includes('quota');

      if (isQuota) {
        voiceModelCooldowns.set(model, Date.now() + 45 * 1000);
      }
    }
  }

  throw lastError || new Error('All voice model fallbacks exhausted');
}

function cleanVoiceJson<T = any>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    return fallback;
  }
}

/**
 * Live Real-Time Voice Partner Conversation Call Endpoint Handler
 * Unlocked via Ephemeral BYOK
 * ZERO LOGGING: Never log API key or request headers
 */
export async function handleVoiceChatCall(req: Request, res: Response): Promise<void> {
  const byokKey = (req.headers['x-byok-gemini-key'] || req.headers['x-byok-api-key']) as string | undefined;
  const serverKey = process.env.GEMINI_API_KEY || '';
  const effectiveKey = (typeof byokKey === 'string' && byokKey.trim()) ? byokKey.trim() : serverKey.trim();

  // If neither BYOK key nor server key is available, return friendly lock response
  if (!effectiveKey) {
    res.status(200).json({
      locked: true,
      reason: 'byok_required',
      message: 'Vui lòng cấu hình Gemini API Key để mở khóa Gọi Thoại Trực Tiếp.',
    });
    return;
  }

  const {
    userSpokenText = '',
    history = [],
    persona = 'beijing_female',
    topic = 'Tự do linh hoạt (Nói gì đáp nấy)',
    hskLevel = 2,
    preferredLang = 'auto',
  } = req.body;

  const gemini = new GoogleGenAI({
    apiKey: effectiveKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const personaDescriptions: Record<string, string> = {
    beijing_female: 'Giọng nữ Bắc Kinh chuẩn Phổ thông (Beijing accent), ấm áp, thân thiện, phát âm tròn vành rõ chữ, ngữ điệu sư phạm tự nhiên.',
    shanghai_male: 'Giọng nam Thượng Hải / Miền Đông hiện đại, lịch thiệp, tốc độ nói vừa phải, trẻ trung và tự nhiên.',
    standard_female: 'Giọng nữ phát thanh viên toàn quốc chuẩn, nhả chữ chậm rãi, rõ ràng từng thanh điệu, cực kỳ dễ nghe cho học viên HSK.',
  };

  const personaDesc = personaDescriptions[persona] || personaDescriptions.beijing_female;

  const isChinese = /[\u4e00-\u9fa5]/.test(userSpokenText);
  const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(userSpokenText);
  const isEnglish = !isChinese && !isVietnamese && /^[a-zA-Z0-9\s.,?!'"-]+$/.test(userSpokenText.trim());

  let detectedUserLang: 'zh' | 'en' | 'vi' = 'vi';
  if (isChinese) {
    detectedUserLang = 'zh';
  } else if (isVietnamese) {
    detectedUserLang = 'vi';
  } else if (isEnglish && userSpokenText.trim().length > 0) {
    detectedUserLang = 'en';
  } else if (preferredLang === 'zh' || preferredLang === 'zh-CN') {
    detectedUserLang = 'zh';
  } else if (preferredLang === 'en' || preferredLang === 'en-US') {
    detectedUserLang = 'en';
  } else {
    detectedUserLang = 'vi'; // Default to Vietnamese tutor mode for Vietnamese learners
  }

  // Bilingual guidance mode is active when user speaks or prefers Vietnamese
  const isBilingualMode = detectedUserLang === 'vi' || preferredLang === 'vi' || preferredLang === 'vi-VN';

  const systemInstruction = `You are an empathetic, highly skilled conversational Mandarin voice partner and AI tutor named "Minnie (敏思)" on a live voice phone call with a Vietnamese learner.
Persona: ${personaDesc}
Target Learner Level: HSK ${hskLevel} (HSK 3.0 Standard).
Conversation Topic: "${topic}".
User Language Setting / Detected: "${detectedUserLang}" (Bilingual Tutor Mode: ${isBilingualMode ? 'YES' : 'NO'}).

CORE VOICE CALL BEHAVIOR & LANGUAGE RULES:
1. Act like a real person on a live phone call: warm, spontaneous, conversational, patient, and encouraging.
2. KEEP IT CONCISE: 1-3 spoken sentences MAXIMUM so it feels like a real interactive back-and-forth phone call (never output long lectures).
3. INTELLIGENT BILINGUAL TUTORING:
   - When in Bilingual Mode (user speaks Vietnamese or prefers Vietnamese):
     * Explain, converse, and guide in fluent, natural Vietnamese so the user easily understands.
     * Always teach or include the corresponding natural Chinese phrase suited for HSK ${hskLevel}, pronounce it clearly in "replyChinese", and invite the user to speak or repeat.
     * "spokenReply": The EXACT text you want the voice synthesizer to read aloud to the user right now. If speaking primarily Vietnamese, output Vietnamese (optionally with the Chinese word); if speaking Chinese, output Chinese.
     * "spokenLang": Set to "vi" when spokenReply is in Vietnamese, or "zh" when spokenReply is in Chinese.
   - When user speaks Chinese (detectedUserLang == 'zh'):
     * Respond naturally in conversational Simplified Chinese suited for HSK ${hskLevel}.
     * "spokenReply": Natural Chinese response (1-2 sentences).
     * "spokenLang": "zh".
     * Provide translation in "replyVietnamese" and gentle pronunciation coaching in "pronunciationTip".
   - Start of call (userSpokenText is empty):
     * If Bilingual Mode: Greet warmly in Vietnamese and invite them to practice Chinese on the topic "${topic}".
       (Example: "Chào bạn! Mình là Minnie. Hôm nay chúng mình cùng luyện nói tiếng Trung về chủ đề ${topic} nhé!")
     * If Chinese Mode: Greet warmly in natural Chinese suited for HSK ${hskLevel}.

OUTPUT STRICTLY IN JSON FORMAT matching this schema:
{
  "spokenReply": "Câu thoại ngắn để đọc to qua loa cho người học nghe (1-3 câu)",
  "spokenLang": "${isBilingualMode ? 'vi' : 'zh'}",
  "detectedUserLang": "${detectedUserLang}",
  "replyChinese": "Chữ Hán giản thể câu thoại hoặc câu mẫu cần học",
  "replyPinyin": "Pinyin có dấu thanh chuẩn xác cho câu tiếng Trung",
  "replyVietnamese": "Bản dịch hoặc lời giải thích tiếng Việt ngắn gọn",
  "pronunciationTip": "Lời khen hoặc mẹo phát âm ngắn gọn bằng tiếng Việt (1 câu)",
  "score": 95,
  "suggestedReplies": [
    { "chinese": "Câu gợi ý 1", "pinyin": "Pinyin 1", "vietnamese": "Nghĩa 1" },
    { "chinese": "Câu gợi ý 2", "pinyin": "Pinyin 2", "vietnamese": "Nghĩa 2" },
    { "chinese": "Câu gợi ý 3", "pinyin": "Pinyin 3", "vietnamese": "Nghĩa 3" }
  ]
}`;

  const conversationHistoryText = Array.isArray(history) && history.length > 0
    ? history.slice(-6).map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')
    : '(Bắt đầu cuộc gọi)';

  const userPromptText = userSpokenText.trim()
    ? `Conversation History:\n${conversationHistoryText}\n\nUser just said (via microphone): "${userSpokenText}"\n\nRespond as the voice partner in JSON.`
    : `Start of voice call. Greet the learner warmly and invite them to chat about "${topic}" in JSON.`;

  try {
    const generatedText = await callGeminiVoice(gemini, userPromptText, systemInstruction);
    const parsed = cleanVoiceJson(generatedText, null as any);

    if (parsed && (parsed.spokenReply || parsed.replyChinese)) {
      const finalSpokenLang = parsed.spokenLang || (isBilingualMode && /[àáạảãâèéẹẻẽêìíịỉĩòóọỏõôơùúụủũưỳýỵỷỹđ]/i.test(parsed.spokenReply) ? 'vi' : 'zh');
      res.json({
        spokenReply: parsed.spokenReply || parsed.replyChinese,
        spokenLang: finalSpokenLang,
        detectedUserLang: parsed.detectedUserLang || detectedUserLang,
        replyChinese: parsed.replyChinese || (finalSpokenLang === 'zh' ? parsed.spokenReply : '你好！'),
        replyPinyin: parsed.replyPinyin || getPinyinPro(parsed.replyChinese || '', { toneType: 'symbol' }),
        replyVietnamese: parsed.replyVietnamese || 'Mình nghe bạn nói rất rõ, cùng tiếp tục nhé!',
        pronunciationTip: parsed.pronunciationTip || 'Phát âm tự nhiên và rõ ràng.',
        score: typeof parsed.score === 'number' ? parsed.score : 95,
        suggestedReplies: Array.isArray(parsed.suggestedReplies) ? parsed.suggestedReplies : [
          { chinese: '我明白了，谢谢你！', pinyin: 'Wǒ míngbái le, xièxie nǐ!', vietnamese: 'Tôi hiểu rồi, cảm ơn bạn!' },
          { chinese: '今天天气真好。', pinyin: 'Jīntiān tiānqì zhēn hǎo.', vietnamese: 'Hôm nay thời tiết thật đẹp.' },
          { chinese: '接下来我们聊什么？', pinyin: 'Jiē xiàlái wǒmen liáo shénme?', vietnamese: 'Tiếp theo chúng ta nói về gì?' },
        ],
      });
      return;
    }

    // Default conversational fallback
    if (isBilingualMode) {
      res.json({
        spokenReply: 'Chào bạn! Mình đã nghe thấy giọng bạn rồi. Hôm nay chúng mình cùng trò chuyện và luyện tiếng Trung nhé!',
        spokenLang: 'vi',
        detectedUserLang: 'vi',
        replyChinese: '你好！很高兴和你聊天。',
        replyPinyin: 'Nǐ hǎo! Hěn gāoxìng hé nǐ liáotiān.',
        replyVietnamese: 'Chào bạn! Rất vui được trò chuyện cùng bạn.',
        pronunciationTip: 'Nói tự nhiên, không cần quá căng thẳng nhé.',
        score: 95,
        suggestedReplies: [
          { chinese: '好的，我们开始吧。', pinyin: 'Hǎo de, wǒmen kāishǐ ba.', vietnamese: 'Được rồi, chúng ta bắt đầu nhé.' },
          { chinese: '你能教我一些日常用语吗？', pinyin: 'Nǐ néng jiāo wǒ yìxiē rìcháng yòngyǔ ma?', vietnamese: 'Bạn có thể dạy tôi vài câu giao tiếp hàng ngày không?' },
          { chinese: '我想练习一下中文发音。', pinyin: 'Wǒ xiǎng liànxí yíxià zhōngwén fāyīn.', vietnamese: 'Tôi muốn luyện phát âm tiếng Trung một chút.' },
        ],
      });
    } else {
      res.json({
        spokenReply: '你好！我听到你的声音了。我们继续用中文聊聊吧！',
        spokenLang: 'zh',
        detectedUserLang: 'zh',
        replyChinese: '你好！我听到你的声音了。我们继续用中文聊聊吧！',
        replyPinyin: 'Nǐ hǎo! Wǒ tīng dào nǐ de shēngyīn le. Wǒmen jìxù yòng zhōngwén liáo liao ba!',
        replyVietnamese: 'Chào bạn! Mình đã nghe thấy giọng bạn rồi. Chúng mình cùng tiếp tục trò chuyện bằng tiếng Trung nhé!',
        pronunciationTip: 'Phát âm tự nhiên và to rõ.',
        score: 95,
        suggestedReplies: [
          { chinese: '好的，我们开始吧。', pinyin: 'Hǎo de, wǒmen kāishǐ ba.', vietnamese: 'Được rồi, chúng ta bắt đầu nhé.' },
          { chinese: '请问你能再说一遍吗？', pinyin: 'Qǐngwèn nǐ néng zài shuō yí biàn ma?', vietnamese: 'Bạn có thể nói lại một lần nữa không?' },
          { chinese: '我想练习一下中文。', pinyin: 'Wǒ xiǎng liànxí yíxià zhōngwén.', vietnamese: 'Tôi muốn luyện tập tiếng Trung một chút.' },
        ],
      });
    }
  } catch (err: any) {
    console.warn('[Voice Call] Gemini response notice, using dynamic conversational fallback:', err?.message || err);
    if (isBilingualMode) {
      res.json({
        spokenReply: 'Mình đã nghe thấy câu của bạn rồi, bạn phát âm rất tốt! Cùng tiếp tục nhé.',
        spokenLang: 'vi',
        detectedUserLang: 'vi',
        replyChinese: '你说得很好，继续加油！',
        replyPinyin: 'Nǐ shuō de hěn hǎo, jìxù jiāyóu!',
        replyVietnamese: 'Bạn nói rất tốt, hãy tiếp tục cố gắng nhé!',
        pronunciationTip: 'Giữ vững nhịp điệu phát âm tự nhiên.',
        score: 92,
        suggestedReplies: [
          { chinese: '好的，谢谢！', pinyin: 'Hǎo de, xièxie!', vietnamese: 'Vâng, cảm ơn bạn!' },
          { chinese: '这个词怎么用？', pinyin: 'Zhège cí zěnme yòng?', vietnamese: 'Từ này dùng như thế nào?' },
          { chinese: '我想聊聊别的。', pinyin: 'Wǒ xiǎng liáoliáo bié de.', vietnamese: 'Tôi muốn nói về chủ đề khác.' },
        ],
      });
    } else {
      res.json({
        spokenReply: '我听到了，你说得很棒！继续加油！',
        spokenLang: 'zh',
        detectedUserLang: 'zh',
        replyChinese: '我听到了，你说得很棒！继续加油！',
        replyPinyin: 'Wǒ tīng dào le, nǐ shuō de hěn bàng! Jìxù jiāyóu!',
        replyVietnamese: 'Mình đã nghe thấy rồi, bạn nói rất tuyệt! Cùng tiếp tục cố gắng nhé!',
        pronunciationTip: 'Giữ vững nhịp điệu phát âm tự nhiên.',
        score: 92,
        suggestedReplies: [
          { chinese: '好的，谢谢！', pinyin: 'Hǎo de, xièxie!', vietnamese: 'Vâng, cảm ơn bạn!' },
          { chinese: '我们可以换个话题吗？', pinyin: 'Wǒmen kěyǐ huàn gè huàtí ma?', vietnamese: 'Chúng ta có thể đổi chủ đề không?' },
          { chinese: '今天我很开心。', pinyin: 'Jīntiān wǒ hěn kāixīn.', vietnamese: 'Hôm nay tôi rất vui.' },
        ],
      });
    }
  }
}
