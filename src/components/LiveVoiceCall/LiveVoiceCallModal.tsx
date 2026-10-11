import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  RotateCcw,
  Eye,
  EyeOff,
  Flame,
  Award,
  Zap,
  Clock,
  Radio,
  Loader2,
  CheckCircle2,
  ArrowRight,
  User,
  Headphones,
  Languages,
  Globe,
  Timer,
  Send,
} from 'lucide-react';
import {
  playMultilingualVoice,
  stopChineseAudio,
  getSavedVoiceSettings,
  saveVoiceSettings,
} from '../../utils/chineseAudio';

export interface VoiceCallMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pinyin?: string;
  vietnamese?: string;
  lang?: 'zh' | 'en' | 'vi';
  timestamp: string;
}

interface LiveVoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  userHskLevel?: number;
}

type CallStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended';

interface SuggestedReply {
  chinese: string;
  pinyin?: string;
  vietnamese?: string;
}

type RecognitionLangMode = 'auto' | 'zh-CN' | 'en-US' | 'vi-VN';

interface VoicePersonaOption {
  id: string;
  name: string;
  avatar: string;
  role: string;
  description: string;
  voice: string;
}

const PERSONAS: VoicePersonaOption[] = [
  {
    id: 'beijing_female',
    name: 'Giọng Nữ Bắc Kinh (Chuẩn Phổ Thông)',
    avatar: '🎙️',
    role: 'Bắc Kinh • Nữ',
    description: 'Giọng nữ chuẩn Bắc Kinh, ngữ điệu tự nhiên, phát âm tròn vành rõ chữ chuẩn quốc gia.',
    voice: 'gemini-kore',
  },
  {
    id: 'shanghai_male',
    name: 'Giọng Nam Thượng Hải / Miền Đông',
    avatar: '🎙️',
    role: 'Thượng Hải • Nam',
    description: 'Giọng nam hiện đại khu vực phía Đông/Thượng Hải, tốc độ nói tự nhiên, phong thái lịch thiệp.',
    voice: 'gemini-zephyr',
  },
  {
    id: 'standard_female',
    name: 'Giọng Nữ Chuẩn Phát Thanh',
    avatar: '📻',
    role: 'Chuẩn Toàn Quốc • Nữ',
    description: 'Giọng đọc chuẩn phát thanh viên toàn quốc, nhả chữ chậm rãi, rõ ràng, tối ưu cho học viên.',
    voice: 'gemini-puck',
  },
];

const SCENARIOS = [
  { id: 'free', title: 'Tự do linh hoạt (Nói gì đáp nấy)', icon: '💬' },
  { id: 'daily', title: 'Tự do tán gẫu ngày thường (日常随聊)', icon: '☕' },
  { id: 'restaurant', title: 'Đi nhà hàng & Gọi món Trung Hoa (在餐厅点菜)', icon: '🍜' },
  { id: 'travel', title: 'Đi taxi, hỏi đường & du lịch (打车与旅行)', icon: '🚕' },
  { id: 'hotel', title: 'Nhận phòng khách sạn & Mua sắm (入住酒店与购物)', icon: '🏨' },
  { id: 'business_hsk4', title: 'Thảo luận công việc & Đàm phán HSK 4 (商务与工作讨论)', icon: '💼' },
  { id: 'environment_hsk4', title: 'Bảo vệ môi trường & Đời sống xanh HSK 4 (环境保护与生活)', icon: '🌿' },
  { id: 'interview', title: 'Phỏng vấn xin việc & Giao tiếp công sở (求职面试)', icon: '📋' },
  { id: 'hskk', title: 'Luyện phản xạ thi khẩu ngữ HSKK (HSKK口语模拟)', icon: '🏆' },
];

export const LiveVoiceCallModal: React.FC<LiveVoiceCallModalProps> = ({
  isOpen,
  onClose,
  initialTopic = 'Tự do linh hoạt (Nói gì đáp nấy)',
  userHskLevel = 2,
}) => {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [targetHsk, setTargetHsk] = useState<number>(userHskLevel || 2);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [recognitionLang, setRecognitionLang] = useState<RecognitionLangMode>('auto');
  const [detectedActiveLang, setDetectedActiveLang] = useState<'zh' | 'en' | 'vi'>('zh');

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false); // Clean voice-first default: minimalist subtle subtitle
  const [isHandsFree, setIsHandsFree] = useState(true);
  const [speechSpeed, setSpeechSpeed] = useState(0.9);
  const [silenceDelay, setSilenceDelay] = useState<number>(1000); // 1.0 second fast interactive conversational turn
  const [pauseCountdownMs, setPauseCountdownMs] = useState<number>(0);

  // Conversation State
  const [messages, setMessages] = useState<VoiceCallMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentReply, setCurrentReply] = useState<{
    spokenText: string;
    spokenLang: 'zh' | 'en' | 'vi';
    chinese?: string;
    pinyin?: string;
    vietnamese?: string;
  } | null>(null);
  const [pronunciationTip, setPronunciationTip] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>([]);
  const [typedInput, setTypedInput] = useState('');

  // Call timer
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<any>(null);

  // Speech Recognition and State Refs (to avoid stale closures & TDZ)
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const statusRef = useRef<CallStatus>(status);
  const isMutedRef = useRef<boolean>(isMuted);
  const isSpeakerMutedRef = useRef<boolean>(isSpeakerMuted);
  const messagesRef = useRef<VoiceCallMessage[]>(messages);
  const recognitionLangRef = useRef<RecognitionLangMode>(recognitionLang);
  const detectedActiveLangRef = useRef<'zh' | 'en' | 'vi'>(detectedActiveLang);
  const silenceDelayRef = useRef<number>(silenceDelay);
  const silenceTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const handleUserSpokeRef = useRef<(text: string) => Promise<void>>(async () => {});

  // Keep state refs in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    recognitionLangRef.current = recognitionLang;
  }, [recognitionLang]);

  useEffect(() => {
    detectedActiveLangRef.current = detectedActiveLang;
  }, [detectedActiveLang]);

  useEffect(() => {
    silenceDelayRef.current = silenceDelay;
  }, [silenceDelay]);

  const clearSilenceTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setPauseCountdownMs(0);
  };

  // Audio level simulator for dynamic visualizer
  const [audioLevel, setAudioLevel] = useState(0);

  // Setup Speech Recognition with auto-healing and silence debounce
  const initSpeechRecognition = (langMode: RecognitionLangMode) => {
    if (typeof window === 'undefined' || !isOpen) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Set target language: if auto, default to detected language or zh-CN
    if (langMode === 'auto') {
      const active = detectedActiveLangRef.current || 'zh';
      recognition.lang = active === 'en' ? 'en-US' : active === 'vi' ? 'vi-VN' : 'zh-CN';
    } else {
      recognition.lang = langMode;
    }

    recognition.onresult = (event: any) => {
      // Ignore incoming speech if AI is currently speaking or thinking
      if (isSpeakingRef.current || statusRef.current === 'thinking' || statusRef.current === 'speaking') {
        return;
      }

      let currentBatchFinal = '';
      let currentBatchInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentBatchFinal += event.results[i][0].transcript;
        } else {
          currentBatchInterim += event.results[i][0].transcript;
        }
      }

      if (currentBatchFinal) {
        accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + currentBatchFinal).trim();
      }

      const fullText = (accumulatedTranscriptRef.current + ' ' + currentBatchInterim).trim();
      if (fullText) {
        setCurrentTranscript(fullText);
        setAudioLevel(Math.min(1, Math.max(0.35, fullText.length * 0.08)));

        // Quick client-side language badge detection
        if (/[\u4e00-\u9fa5]/.test(fullText)) {
          setDetectedActiveLang('zh');
        } else if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(fullText)) {
          setDetectedActiveLang('vi');
        } else if (/^[a-zA-Z0-9\s.,!?'"():;\-_/]+$/.test(fullText.trim())) {
          setDetectedActiveLang('en');
        }
      }

      // Reset silence debounce timer on every spoken syllable
      clearSilenceTimers();

      // Allow natural interactive pause (e.g. 1.0s) before finalizing sentence
      if (accumulatedTranscriptRef.current.trim() || currentBatchInterim.trim()) {
        const delay = silenceDelayRef.current || 1000;
        const startTime = Date.now();
        setPauseCountdownMs(delay);

        // Smooth countdown interval for UI visual feedback
        countdownIntervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, delay - elapsed);
          setPauseCountdownMs(remaining);
          if (remaining <= 0 && countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }, 100);

        silenceTimerRef.current = setTimeout(() => {
          clearSilenceTimers();
          const textToSend = (accumulatedTranscriptRef.current || currentBatchInterim).trim();
          if (
            textToSend &&
            statusRef.current === 'listening' &&
            !isSpeakingRef.current &&
            !isMutedRef.current
          ) {
            accumulatedTranscriptRef.current = '';
            if (handleUserSpokeRef.current) {
              handleUserSpokeRef.current(textToSend);
            }
          }
        }, delay);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[SpeechRecognition] Status:', event.error);
      if (event.error === 'not-allowed') {
        alert('Vui lòng cấp quyền Micro trong trình duyệt để đàm thoại trực tiếp cùng AI.');
      } else if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'aborted') {
        // Benign notice, seamlessly auto-recover if we are in listening mode
        if (statusRef.current === 'listening' && !isSpeakingRef.current && !isMutedRef.current) {
          setTimeout(() => {
            if (statusRef.current === 'listening' && !isSpeakingRef.current && !isMutedRef.current) {
              try {
                recognition.start();
              } catch {
                // Ignore
              }
            }
          }, 300);
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart recognition whenever browser speech times out if we are still active in call
      if (
        statusRef.current === 'listening' &&
        !isSpeakingRef.current &&
        !isMutedRef.current &&
        isListeningRef.current
      ) {
        setTimeout(() => {
          if (
            statusRef.current === 'listening' &&
            !isSpeakingRef.current &&
            !isMutedRef.current
          ) {
            try {
              recognition.start();
            } catch {
              // Ignore
            }
          }
        }, 200);
      }
    };

    recognitionRef.current = recognition;
  };

  // Re-initialize recognition when language mode changes
  useEffect(() => {
    if (isOpen) {
      initSpeechRecognition(recognitionLang);
    }
  }, [isOpen, recognitionLang]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopChineseAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Call timer interval
  useEffect(() => {
    if (status !== 'idle' && status !== 'ended') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Audio level animation for Orb
  useEffect(() => {
    let interval: any;
    if (status === 'listening') {
      interval = setInterval(() => {
        setAudioLevel((prev) => Math.sin(Date.now() / 200) * 0.2 + 0.4);
      }, 100);
    } else if (status === 'speaking') {
      interval = setInterval(() => {
        setAudioLevel((prev) => Math.abs(Math.sin(Date.now() / 150)) * 0.5 + 0.5);
      }, 80);
    } else {
      setAudioLevel(0.15);
    }
    return () => clearInterval(interval);
  }, [status]);

  if (!isOpen) return null;

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Dynamic language switcher during active call or idle
  const changeRecognitionLanguage = (newMode: RecognitionLangMode) => {
    setRecognitionLang(newMode);
    recognitionLangRef.current = newMode;
    if (newMode === 'en-US') {
      setDetectedActiveLang('en');
      detectedActiveLangRef.current = 'en';
    } else if (newMode === 'vi-VN') {
      setDetectedActiveLang('vi');
      detectedActiveLangRef.current = 'vi';
    } else if (newMode === 'zh-CN') {
      setDetectedActiveLang('zh');
      detectedActiveLangRef.current = 'zh';
    }

    initSpeechRecognition(newMode);
    if (statusRef.current === 'listening' && !isSpeakingRef.current && !isMutedRef.current) {
      setTimeout(() => {
        startListening();
      }, 100);
    }
  };

  // Start speech recognition safely
  const startListening = () => {
    if (isMutedRef.current) return;
    isListeningRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // Recognition might already be running
      }
    }
  };

  // Stop speech recognition safely
  const stopListening = () => {
    isListeningRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
  };

  // Speak AI Partner Response in the appropriate language
  const speakPartnerResponse = async (text: string, lang: 'zh' | 'en' | 'vi' = 'zh') => {
    if (isSpeakerMutedRef.current) {
      setStatus('listening');
      startListening();
      return;
    }

    setStatus('speaking');
    isSpeakingRef.current = true;
    stopListening();

    try {
      // Use preferInstantNative=true for zero-delay speech playback in live voice calls
      await playMultilingualVoice(text, lang, speechSpeed, undefined, true);
    } catch (err) {
      console.warn('Speech playback notice:', err);
    } finally {
      isSpeakingRef.current = false;
      // Brief pause to prevent AI voice loopback into microphone
      setTimeout(() => {
        if (statusRef.current !== 'ended' && statusRef.current !== 'idle') {
          setStatus('listening');
          setCurrentTranscript('');
          accumulatedTranscriptRef.current = '';
          startListening();
        }
      }, 350);
    }
  };

  // Start the Live Call
  const handleStartCall = async () => {
    setStatus('connecting');
    setCallDuration(0);
    setMessages([]);
    setCurrentTranscript('');
    accumulatedTranscriptRef.current = '';
    setCurrentReply(null);
    setPronunciationTip(null);
    setScore(null);
    setTypedInput('');

    // Proactively unlock AudioContext and request microphone permissions inside user gesture
    try {
      if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const tempCtx = new AudioContextClass();
          if (tempCtx.state === 'suspended') {
            tempCtx.resume();
          }
        }
        if (window.speechSynthesis) {
          window.speechSynthesis.resume();
        }
      }
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => {});
      }
    } catch {
      // Non-blocking
    }

    // Save voice preference
    saveVoiceSettings({ voiceId: selectedPersona.voice, rate: speechSpeed });

    const effectiveTopic = customTopicInput.trim() || selectedTopic || 'Tự do linh hoạt (Nói gì đáp nấy)';
    setSelectedTopic(effectiveTopic);

    try {
      // Connect to server for initial greeting with fast 4s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort();
        } catch {
          // Ignore
        }
      }, 4000);

      let res: Response | null = null;
      try {
        res = await fetch('/api/voice-chat/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            userSpokenText: '',
            history: [],
            persona: selectedPersona.id,
            topic: effectiveTopic,
            hskLevel: targetHsk,
          }),
        });
      } catch (fetchErr: any) {
        if (fetchErr?.name === 'AbortError') {
          console.warn('Initial call request timed out, falling back to local greeting');
        } else {
          console.warn('Initial call connection error:', fetchErr);
        }
        res = null;
      } finally {
        clearTimeout(timeoutId);
      }

      let data: any = null;
      if (res && res.ok) {
        data = await res.json().catch(() => null);
      }

      const spokenText = data?.spokenReply || data?.replyChinese || '你好！很高兴和你语音通话。今天想和我聊点什么呢？';
      const spokenLang: 'zh' | 'en' | 'vi' = data?.spokenLang || 'zh';

      const initialGreeting = {
        spokenText,
        spokenLang,
        chinese: data?.replyChinese || (spokenLang === 'zh' ? spokenText : ''),
        pinyin: data?.replyPinyin || 'Nǐ hǎo! Hěn gāoxìng hé nǐ yǔyīn tōnghuà. Jīntiān xiǎng hé wǒ liáo diǎn shénme ne?',
        vietnamese: data?.replyVietnamese || 'Chào bạn! Rất vui được gọi thoại cùng bạn. Hôm nay bạn muốn trò chuyện về chủ đề gì nè?',
      };

      setDetectedActiveLang(spokenLang);
      setCurrentReply(initialGreeting);
      setSuggestedReplies(data?.suggestedReplies && data.suggestedReplies.length > 0 ? data.suggestedReplies : [
        { chinese: '你好！我们开始吧。', pinyin: 'Nǐ hǎo! Wǒmen kāishǐ ba.', vietnamese: 'Chào bạn! Chúng ta bắt đầu nhé.' },
        { chinese: '今天天气真好。', pinyin: 'Jīntiān tiānqì zhēn hǎo.', vietnamese: 'Hôm nay thời tiết thật đẹp.' },
        { chinese: '我想练习一下中文。', pinyin: 'Wǒ xiǎng liànxí yíxià zhōngwén.', vietnamese: 'Tôi muốn luyện tập tiếng Trung một chút.' },
      ]);
      
      const welcomeMsg: VoiceCallMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        text: spokenText,
        pinyin: initialGreeting.pinyin,
        vietnamese: initialGreeting.vietnamese,
        lang: spokenLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([welcomeMsg]);

      // Speak Greeting in target language
      await speakPartnerResponse(spokenText, spokenLang);
    } catch (e) {
      console.warn('Call start fallback:', e);
      setStatus('listening');
      startListening();
    }
  };

  // When User Finishes Speaking
  const handleUserSpoke = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    accumulatedTranscriptRef.current = '';

    stopListening();
    setStatus('thinking');
    setCurrentTranscript('');

    const newMsg: VoiceCallMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messagesRef.current, newMsg];
    setMessages(updatedHistory);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        try {
          controller.abort();
        } catch {
          // Ignore
        }
      }, 4000);

      let res: Response | null = null;
      try {
        res = await fetch('/api/voice-chat/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            userSpokenText: spokenText,
            history: updatedHistory.slice(-10).map((m) => ({ role: m.role, text: m.text })),
            persona: selectedPersona.id,
            topic: selectedTopic,
            hskLevel: targetHsk,
          }),
        });
      } catch (fetchErr: any) {
        if (fetchErr?.name === 'AbortError') {
          console.warn('Voice response timed out, using fallback reply');
        } else {
          console.warn('Voice chat fetch error:', fetchErr);
        }
        res = null;
      } finally {
        clearTimeout(timeoutId);
      }

      let data: any = null;
      if (res && res.ok) {
        data = await res.json().catch(() => null);
      }

      const spoken = data?.spokenReply || data?.replyChinese || '我听到了，你说得很好！继续加油！';
      const spokenLang: 'zh' | 'en' | 'vi' = data?.spokenLang || 'zh';
      const userLang: 'zh' | 'en' | 'vi' = data?.detectedUserLang || spokenLang;

      setDetectedActiveLang(userLang);
      detectedActiveLangRef.current = userLang;

      // In auto mode, adjust the speech recognizer language for upcoming user turns
      if (recognitionLangRef.current === 'auto' && recognitionRef.current) {
        const nextBrowserLang = userLang === 'en' ? 'en-US' : userLang === 'vi' ? 'vi-VN' : 'zh-CN';
        try {
          recognitionRef.current.lang = nextBrowserLang;
        } catch {
          // Ignore
        }
      }

      const aiReply = {
        spokenText: spoken,
        spokenLang: spokenLang,
        chinese: data?.replyChinese || (spokenLang === 'zh' ? spoken : ''),
        pinyin: data?.replyPinyin || '',
        vietnamese: data?.replyVietnamese || 'Mình đã nghe rõ câu của bạn, bạn nói rất tự nhiên!',
      };

      setCurrentReply(aiReply);
      setPronunciationTip(data?.pronunciationTip || 'Phát âm tự nhiên và rõ ràng.');
      setScore(data?.score || 95);
      setSuggestedReplies(data?.suggestedReplies && data.suggestedReplies.length > 0 ? data.suggestedReplies : [
        { chinese: '请问你能再说一遍吗？', pinyin: 'Qǐngwèn nǐ néng zài shuō yí biàn ma?', vietnamese: 'Bạn có thể nhắc lại một lần nữa không?' },
        { chinese: '我明白了，谢谢你。', pinyin: 'Wǒ míngbái le, xièxie nǐ.', vietnamese: 'Tôi hiểu rồi, cảm ơn bạn.' },
        { chinese: '接下来我们聊什么？', pinyin: 'Jiē xiàlái wǒmen liáo shénme?', vietnamese: 'Tiếp theo chúng ta nói về gì?' },
      ]);

      const newAiMsg: VoiceCallMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: spoken,
        pinyin: aiReply.pinyin,
        vietnamese: aiReply.vietnamese,
        lang: spokenLang,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, newAiMsg]);

      await speakPartnerResponse(spoken, spokenLang);
    } catch (e) {
      console.warn('Error in conversation turn:', e);
      setStatus('listening');
      startListening();
    }
  };
  handleUserSpokeRef.current = handleUserSpoke;

  // End the Call
  const handleEndCall = () => {
    clearSilenceTimers();
    accumulatedTranscriptRef.current = '';
    stopChineseAudio();
    stopListening();
    setStatus('ended');
  };

  // Reset to Start Screen
  const handleRestart = () => {
    clearSilenceTimers();
    accumulatedTranscriptRef.current = '';
    stopChineseAudio();
    stopListening();
    setStatus('idle');
    setCallDuration(0);
    setMessages([]);
    setCurrentReply(null);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopChineseAudio();
          stopListening();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="bg-[#0B0F19] text-white border border-[#1E293B] rounded-3xl w-full max-w-4xl 2xl:max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-[88vh] 2xl:h-[84vh] max-h-[920px] relative"
        id="live-voice-call-studio"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#1E293B] bg-[#0E1526]/80 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-lg shadow-lg border border-blue-400/30">
                {selectedPersona.avatar}
              </div>
              {status !== 'idle' && status !== 'ended' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0B0F19] animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  {selectedPersona.name}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                    {selectedPersona.role}
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-gray-400 truncate max-w-[160px] sm:max-w-xs">
                {selectedTopic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Active Language Switcher & Indicator */}
            {status !== 'idle' && status !== 'ended' && (
              <div className="flex items-center gap-1 bg-[#131B2E] p-1 rounded-2xl border border-[#1E293B]">
                <span className="text-[10px] text-gray-400 px-1 font-semibold hidden xl:inline flex items-center gap-1">
                  <Languages className="w-3 h-3 text-cyan-400" />
                  Ngôn ngữ:
                </span>
                {[
                  { id: 'auto' as RecognitionLangMode, label: '🌐 Auto', title: 'Tự động thích ứng đa ngôn ngữ' },
                  { id: 'zh-CN' as RecognitionLangMode, label: '🇨🇳 Trung', title: 'Nhận diện Tiếng Trung (zh-CN)' },
                  { id: 'en-US' as RecognitionLangMode, label: '🇺🇸 Anh', title: 'Nhận diện Tiếng Anh (en-US)' },
                  { id: 'vi-VN' as RecognitionLangMode, label: '🇻🇳 Việt', title: 'Nhận diện Tiếng Việt (vi-VN)' },
                ].map((l) => {
                  const isSelected = recognitionLang === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => changeRecognitionLanguage(l.id)}
                      className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-[#1E293B]'
                      }`}
                      title={l.title}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Speed & Silence Delay Selector Button */}
            <button
              type="button"
              onClick={() => {
                const nextDelay = silenceDelay === 1000 ? 1500 : silenceDelay === 1500 ? 2500 : 1000;
                setSilenceDelay(nextDelay);
              }}
              className="px-2.5 py-1.5 rounded-xl border bg-[#131B2E] border-[#1E293B] hover:border-amber-500/50 text-amber-300 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
              title={`Độ trễ phản hồi: ${silenceDelay / 1000}s (Bấm để đổi 1.0s Cực nhanh / 1.5s Tiêu chuẩn / 2.5s Thong thả)`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Phản hồi:</span>
              <span className="font-bold font-mono">{silenceDelay === 1000 ? '⚡ 1.0s' : `${silenceDelay / 1000}s`}</span>
            </button>

            {/* Call Status & Timer Badge */}
            {status !== 'idle' && status !== 'ended' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{formatTime(callDuration)}</span>
              </div>
            )}

            {/* Subtitles Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                showSubtitles
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-[#1E293B] border-[#334155] text-gray-400 hover:text-white'
              }`}
              title={showSubtitles ? 'Đang hiện phụ đề' : 'Ẩn phụ đề (Luyện khẩu ngữ thuần âm thanh)'}
            >
              {showSubtitles ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="hidden lg:inline">{showSubtitles ? 'Phụ đề BẬT' : 'Phụ đề TẮT'}</span>
            </button>

            {/* Close / Minimize */}
            <button
              type="button"
              onClick={() => {
                stopChineseAudio();
                stopListening();
                onClose();
              }}
              className="px-3 py-1.5 text-gray-200 hover:text-white rounded-xl bg-white/10 hover:bg-rose-500/40 hover:border-rose-500/50 border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
              title="Đóng cửa sổ gọi thoại (hoặc nhấn ESC)"
            >
              <X className="w-4 h-4" />
              <span>Đóng</span>
            </button>
          </div>
        </div>

        {/* Main Interactive Stage Body - Fully Scrollable on Laptops */}
        <div className="flex-1 relative overflow-y-auto custom-scrollbar flex flex-col items-center justify-between p-4 sm:p-6 select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#111A33] via-[#0B0F19] to-[#060911]">
          {/* Ambient Space Elements */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-600/15 rounded-full blur-[80px]" />
          </div>

          {/* STATE 1: IDLE / CONFIGURATION SCREEN */}
          {status === 'idle' && (
            <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center space-y-4 z-10 py-1">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                  Đàm Thoại Trực Tiếp 2 Chiều (Live Voice AI)
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Gọi Thoại Đa Ngôn Ngữ Tự Nhiên
                </h1>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Trò chuyện thoại cùng AI bản xứ với khoảng chờ tự nhiên để bạn thoải mái suy nghĩ và ghép câu!
                </p>
              </div>

              {/* Step 1: Select Voice Region / Accent */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  1. Chọn Giọng Nói & Vùng Miền:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PERSONAS.map((p) => {
                    const isSelected = selectedPersona.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPersona(p)}
                        className={`p-2.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                            : 'bg-[#131B2E] border-[#1E293B] hover:border-[#334155] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-lg">{p.avatar}</span>
                          <div>
                            <p className="text-xs font-bold text-white">{p.name}</p>
                            <p className="text-[10px] text-blue-400 font-medium">{p.role}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-snug line-clamp-2">{p.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: HSK Level & Language Preference Switch */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    2. Trình Độ HSK & Ngôn Ngữ Nhận Diện:
                  </label>
                  <div className="flex items-center gap-1 bg-[#131B2E] p-0.5 rounded-lg border border-[#1E293B]">
                    {[1, 2, 3, 4, 5, 6].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setTargetHsk(lvl)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          targetHsk === lvl
                            ? 'bg-cyan-500 text-black font-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        HSK {lvl}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'auto', label: '🌐 Tự động đa ngữ' },
                    { id: 'zh-CN', label: '🇨🇳 Tiếng Trung' },
                    { id: 'en-US', label: '🇺🇸 Tiếng Anh' },
                    { id: 'vi-VN', label: '🇻🇳 Tiếng Việt' },
                  ].map((l) => {
                    const isSelected = recognitionLang === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setRecognitionLang(l.id as RecognitionLangMode)}
                        className={`p-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-600/20 border-cyan-500 text-cyan-200 shadow-sm'
                            : 'bg-[#131B2E] border-[#1E293B] text-gray-400 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Thinking / Pause Delay (Khoảng thời gian chờ suy nghĩ) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    3. Tốc Độ Phản Hồi Khi Bạn Dừng Nói:
                  </span>
                  <span className="text-[11px] text-amber-300 font-mono font-bold">
                    {silenceDelay / 1000}s chờ
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1000, label: '⚡ 1.0s (Cực nhanh)', desc: 'Phản xạ tức thì (Khuyên dùng)' },
                    { val: 1500, label: '🎯 1.5s (Tiêu chuẩn)', desc: 'Vừa nói vừa suy nghĩ từ' },
                    { val: 2500, label: '🧘 2.5s (Thong thả)', desc: 'Kiên nhẫn chờ ghép câu dài' },
                  ].map((item) => {
                    const isSelected = silenceDelay === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setSilenceDelay(item.val)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 shadow-sm'
                            : 'bg-[#131B2E] border-[#1E293B] text-gray-400 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold text-white">{item.label}</p>
                        <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Topic Selection / Free Spontaneous Conversation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    4. Chủ Đề Đàm Thoại:
                  </label>
                  <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
                    ✨ Siêu linh hoạt: Nói gì đáp nấy
                  </span>
                </div>

                {/* Custom Topic Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={customTopicInput}
                    onChange={(e) => {
                      setCustomTopicInput(e.target.value);
                      if (e.target.value.trim()) {
                        setSelectedTopic(e.target.value.trim());
                      }
                    }}
                    placeholder="Nhập chủ đề bạn muốn luyện (hoặc để trống để nói chuyện tự do linh hoạt)..."
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#131B2E] border border-[#1E293B] focus:border-cyan-500 text-xs text-white placeholder-gray-500 focus:outline-hidden transition-colors"
                  />
                  {customTopicInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTopicInput('');
                        setSelectedTopic('Tự do linh hoạt (Nói gì đáp nấy)');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer px-1 py-0.5"
                      title="Xóa chủ đề tùy chỉnh"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Start Call Action Button */}
              <button
                type="button"
                onClick={handleStartCall}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <Mic className="w-3.5 h-3.5 text-white" />
                </div>
                <span>Bắt Đầu Cuộc Gọi (Start Voice Call)</span>
              </button>
            </div>
          )}

          {/* STATE 2: ACTIVE LIVE CALL (CONNECTING, LISTENING, THINKING, SPEAKING) */}
          {status !== 'idle' && status !== 'ended' && (
            <div className="w-full h-full flex flex-col items-center justify-between relative z-10">
              {/* Subtle Top Subtitle Capsule (Discrete & Non-Intrusive) */}
              <div className="w-full max-w-2xl px-4 min-h-[50px] flex items-center justify-center text-center">
                {showSubtitles && currentReply && (
                  <div className="px-4 py-2 rounded-2xl bg-[#131B2E]/70 border border-blue-500/20 backdrop-blur-md space-y-0.5 animate-in fade-in duration-200">
                    <p className="text-sm sm:text-lg font-bold text-white tracking-wide">
                      {currentReply.spokenText}
                    </p>
                    {currentReply.pinyin && (
                      <p className="text-[11px] font-mono text-blue-300">
                        {currentReply.pinyin}
                      </p>
                    )}
                    {currentReply.vietnamese && (
                      <p className="text-[10px] text-gray-300 italic">
                        "{currentReply.vietnamese}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CENTERPIECE: THE 3D LUMINOUS GLOWING AUDIO ORB */}
              <div className="my-auto flex flex-col items-center justify-center relative">
                {/* Concentric Soundwave Rings */}
                <div
                  className={`absolute w-72 h-72 sm:w-84 sm:h-84 rounded-full border border-blue-500/20 transition-transform duration-300 pointer-events-none ${
                    status === 'speaking' || status === 'listening' ? 'scale-125 opacity-60 animate-ping' : 'scale-100 opacity-20'
                  }`}
                />
                <div
                  className={`absolute w-60 h-60 sm:w-72 sm:h-72 rounded-full border-2 border-indigo-400/30 transition-all duration-300 pointer-events-none ${
                    status === 'listening' ? 'scale-110 border-cyan-400/50' : 'scale-100'
                  }`}
                />

                {/* THE 3D LUMINOUS SPHERICAL GLOWING ORB */}
                <div
                  className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full cursor-pointer flex items-center justify-center transition-all duration-500 shadow-2xl group"
                  onClick={() => {
                    if (status === 'speaking') {
                      stopChineseAudio();
                      setStatus('listening');
                      startListening();
                    } else if (status === 'listening') {
                      const text = (accumulatedTranscriptRef.current || currentTranscript).trim();
                      if (text) {
                        clearSilenceTimers();
                        accumulatedTranscriptRef.current = '';
                        handleUserSpoke(text);
                      }
                    }
                  }}
                  style={{
                    background:
                      status === 'thinking'
                        ? 'radial-gradient(circle at 35% 35%, #93c5fd 0%, #3b82f6 40%, #1d4ed8 75%, #0f172a 100%)'
                        : status === 'speaking'
                        ? detectedActiveLang === 'en'
                          ? 'radial-gradient(circle at 30% 30%, #e0e7ff 0%, #818cf8 35%, #4f46e5 70%, #1e1b4b 100%)'
                          : 'radial-gradient(circle at 30% 30%, #bfdbfe 0%, #60a5fa 35%, #2563eb 70%, #1e1b4b 100%)'
                        : status === 'listening'
                        ? 'radial-gradient(circle at 35% 35%, #a7f3d0 0%, #38bdf8 35%, #3b82f6 75%, #0f172a 100%)'
                        : 'radial-gradient(circle at 35% 35%, #c7d2fe 0%, #6366f1 40%, #4338ca 75%, #0f172a 100%)',
                    boxShadow:
                      status === 'speaking'
                        ? '0 0 80px rgba(59, 130, 246, 0.7), inset 0 -15px 30px rgba(0, 0, 0, 0.6), inset 0 10px 20px rgba(255, 255, 255, 0.8)'
                        : status === 'listening'
                        ? '0 0 90px rgba(56, 189, 248, 0.75), inset 0 -15px 30px rgba(0, 0, 0, 0.6), inset 0 10px 20px rgba(255, 255, 255, 0.8)'
                        : status === 'thinking'
                        ? '0 0 70px rgba(99, 102, 241, 0.6), inset 0 -15px 30px rgba(0, 0, 0, 0.6), inset 0 10px 20px rgba(255, 255, 255, 0.8)'
                        : '0 0 50px rgba(99, 102, 241, 0.4), inset 0 -15px 30px rgba(0, 0, 0, 0.6), inset 0 10px 20px rgba(255, 255, 255, 0.7)',
                    transform: `scale(${1 + audioLevel * 0.15})`,
                  }}
                >
                  {/* Subtle Curved Inner Highlight Crescent */}
                  <div className="absolute top-4 left-7 w-32 h-16 bg-white/40 rounded-full blur-[8px] transform -rotate-25 pointer-events-none" />

                  {/* Status Indicator Icon or Dynamic Audio Waves */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center">
                    {status === 'connecting' && (
                      <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-md" />
                    )}

                    {status === 'thinking' && (
                      <div className="flex flex-col items-center gap-2">
                        <Sparkles className="w-10 h-10 text-white animate-spin drop-shadow-lg" />
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                          Đang suy nghĩ...
                        </span>
                      </div>
                    )}

                    {status === 'speaking' && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 rounded-full backdrop-blur-xs">
                          {[40, 75, 100, 65, 90, 50, 85].map((h, i) => (
                            <div
                              key={i}
                              className="w-1.5 bg-white rounded-full transition-all duration-150 animate-pulse"
                              style={{
                                height: `${Math.max(12, h * audioLevel)}px`,
                                animationDelay: `${i * 0.1}s`,
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-white tracking-wider bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                          {selectedPersona.name} đang nói...
                        </span>
                      </div>
                    )}

                    {status === 'listening' && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg animate-bounce">
                          <Mic className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[11px] font-bold text-white tracking-wider bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                          {currentTranscript ? 'Đang nhận câu nói...' : 'Đang lắng nghe bạn nói...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Real-time Spoken Text Preview with Natural Thinking Countdown Bar */}
                {currentTranscript && (
                  <div className="mt-4 w-full max-w-md rounded-2xl bg-[#131B2E]/90 border border-cyan-500/30 p-3 shadow-xl backdrop-blur-md animate-in fade-in duration-150 space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-cyan-200 truncate text-center">
                      <span className="text-gray-400 text-xs mr-1">Bạn đang nói:</span>
                      <span className="text-white font-semibold">"{currentTranscript}"</span>
                    </p>

                    {/* Thinking / Pause Tolerance Countdown Indicator */}
                    {pauseCountdownMs > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                          <span className="flex items-center gap-1 text-amber-300 font-medium">
                            <Timer className="w-3 h-3 text-amber-400 animate-spin" />
                            Đang chờ bạn nói tiếp (còn {(pauseCountdownMs / 1000).toFixed(1)}s)...
                          </span>
                          <span className="text-gray-400 text-[9px]">Tự gửi khi hết giờ</span>
                        </div>
                        {/* Smooth Progress Bar */}
                        <div className="w-full h-1.5 bg-[#0B0F19] rounded-full overflow-hidden border border-[#1E293B]">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-100 ease-linear rounded-full"
                            style={{
                              width: `${Math.max(0, Math.min(100, (pauseCountdownMs / silenceDelay) * 100))}%`,
                            }}
                          />
                        </div>
                        {/* Instant Send Action */}
                        <button
                          type="button"
                          onClick={() => {
                            const textToSend = (accumulatedTranscriptRef.current || currentTranscript).trim();
                            if (textToSend && statusRef.current === 'listening') {
                              clearSilenceTimers();
                              accumulatedTranscriptRef.current = '';
                              handleUserSpoke(textToSend);
                            }
                          }}
                          className="w-full py-1 px-2.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>Gửi AI phản hồi ngay (0s)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Real-time Speaking Feedback Capsule (Score & Pronunciation Tips) */}
                {score !== null && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap justify-center max-w-lg text-center animate-in fade-in duration-200">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      Lưu loát: {score}/100
                    </div>

                    {pronunciationTip && (
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#1E293B]/80 text-gray-300 border border-[#334155] text-[11px] text-left">
                        <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{pronunciationTip}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Interactive Area: Quick Suggested Spoken Phrases & Call Controls */}
              <div className="w-full max-w-2xl space-y-3 z-10">
                {/* 1-Tap Quick Spoken Suggestions */}
                {suggestedReplies.length > 0 && status === 'listening' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                      <span className="font-semibold flex items-center gap-1 text-cyan-300">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Chạm để nói nhanh:
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {suggestedReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleUserSpoke(reply.chinese)}
                          className="p-2 rounded-xl bg-[#131B2E]/90 border border-[#1E293B] hover:border-cyan-500/50 hover:bg-cyan-600/20 text-left transition-all group cursor-pointer"
                        >
                          <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                            {reply.chinese}
                          </p>
                          {reply.pinyin && (
                            <p className="text-[10px] text-cyan-400 truncate font-mono">
                              {reply.pinyin}
                            </p>
                          )}
                          {reply.vietnamese && (
                            <p className="text-[10px] text-gray-400 truncate">
                              {reply.vietnamese}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Typed Message / Manual Input Bar */}
                <div className="flex items-center gap-2 bg-[#131B2E] border border-[#1E293B] rounded-2xl p-1.5 focus-within:border-cyan-500/60 shadow-lg transition-all">
                  <input
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && typedInput.trim() && status === 'listening') {
                        const text = typedInput.trim();
                        setTypedInput('');
                        handleUserSpoke(text);
                      }
                    }}
                    placeholder={status === 'listening' ? 'Nhập câu bạn muốn nói hoặc nói qua micro...' : 'Đang xử lý hội thoại...'}
                    disabled={status !== 'listening'}
                    className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 px-3 py-1 outline-hidden disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={!typedInput.trim() || status !== 'listening'}
                    onClick={() => {
                      if (typedInput.trim() && status === 'listening') {
                        const text = typedInput.trim();
                        setTypedInput('');
                        handleUserSpoke(text);
                      }
                    }}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Gửi</span>
                  </button>
                </div>

                {/* Call Control Buttons Bar */}
                <div className="p-3 rounded-2xl bg-[#0E1526]/90 border border-[#1E293B] backdrop-blur-md flex items-center justify-between gap-4">
                  {/* Left: Speaker Mute / Unmute */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSpeakerMuted) stopChineseAudio();
                      setIsSpeakerMuted(!isSpeakerMuted);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSpeakerMuted
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-[#1E293B] border-[#334155] text-gray-300 hover:text-white'
                    }`}
                    title={isSpeakerMuted ? 'Bật loa AI' : 'Tắt tiếng loa AI'}
                  >
                    {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  {/* Center: Push-to-Talk or Mute Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isMuted;
                        setIsMuted(next);
                        if (next) stopListening();
                        else startListening();
                      }}
                      className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                        isMuted
                          ? 'bg-amber-600 text-white shadow-amber-600/20'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-pulse" />}
                      <span>{isMuted ? 'Đang Tắt Mic' : 'Micro BẬT (Đang nghe bạn)'}</span>
                    </button>
                  </div>

                  {/* Right: End Call (Gác máy) */}
                  <button
                    type="button"
                    onClick={handleEndCall}
                    className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5 font-bold text-xs cursor-pointer"
                    title="Kết thúc cuộc gọi"
                  >
                    <PhoneOff className="w-5 h-5" />
                    <span className="hidden sm:inline">Gác máy</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: CALL SUMMARY REPORT (AFTER ENDING CALL) */}
          {status === 'ended' && (
            <div className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center space-y-5 z-10 py-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white">Báo Cáo Cuộc Gọi Luyện Nói</h2>
                <p className="text-xs text-gray-400">
                  Bạn đã hoàn thành buổi đàm thoại cùng {selectedPersona.name}!
                </p>
              </div>

              {/* Core Call Statistics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#131B2E] border border-[#1E293B] text-center space-y-1">
                  <Clock className="w-4 h-4 text-blue-400 mx-auto" />
                  <p className="text-base font-bold text-white font-mono">{formatTime(callDuration)}</p>
                  <p className="text-[10px] text-gray-400">Thời gian thoại</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#131B2E] border border-[#1E293B] text-center space-y-1">
                  <Mic className="w-4 h-4 text-indigo-400 mx-auto" />
                  <p className="text-base font-bold text-white font-mono">{messages.length}</p>
                  <p className="text-[10px] text-gray-400">Lượt đối thoại</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#131B2E] border border-[#1E293B] text-center space-y-1">
                  <Flame className="w-4 h-4 text-amber-400 mx-auto" />
                  <p className="text-base font-bold text-amber-400 font-mono">+{Math.max(10, messages.length * 5)} XP</p>
                  <p className="text-[10px] text-gray-400">Điểm kinh nghiệm</p>
                </div>
              </div>

              {/* Spoken Turn Transcript Highlights */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Trích đoạn câu đã nói trong cuộc gọi:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-2xl bg-[#131B2E] border border-[#1E293B] custom-scrollbar">
                  {messages.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">Chưa có lượt thoại nào.</p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl text-xs space-y-0.5 ${
                          m.role === 'user'
                            ? 'bg-blue-600/20 border border-blue-500/30 text-blue-200 ml-4'
                            : 'bg-[#0B0F19] border border-[#1E293B] text-gray-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span className="font-bold">{m.role === 'user' ? '👤 Bạn' : `🤖 ${selectedPersona.name}`}</span>
                          <span className="font-mono">{m.timestamp}</span>
                        </div>
                        <p className="font-semibold text-white">{m.text}</p>
                        {m.pinyin && <p className="text-[10px] text-blue-300 font-mono">{m.pinyin}</p>}
                        {m.vietnamese && <p className="text-[10px] text-gray-400 italic">"{m.vietnamese}"</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="flex-1 py-3 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Gọi Lại Cuộc Khác</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <span>Hoàn Tất & Đóng</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

