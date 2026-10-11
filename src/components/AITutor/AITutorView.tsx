import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  Bot,
  User,
  Database,
  MessageSquare,
  Stethoscope,
  ArrowDown,
  PhoneCall,
  Headphones,
} from 'lucide-react';
import { ChatMessage, HSKLevel, UserProfile } from '../../types';
import { playChineseAudio } from '../../utils/chineseAudio';
import { AIMarkdownRenderer } from './AIMarkdownRenderer';
import { LiveVoiceCallModal } from '../LiveVoiceCall/LiveVoiceCallModal';
import { CartoonLoader } from '../CartoonLoader';
import { HSKReadingStudio } from './HSKReadingStudio';
import { BookOpen } from 'lucide-react';

type TutorMode = 'general' | 'reading_studio';

const LEVEL_SUGGESTIONS: Record<HSKLevel, Array<{ type: 'qa' | 'diag' | 'chat'; label?: string; text?: string; sentence?: string }>> = {
  1: [
    { type: 'qa', text: 'Giải thích cách dùng từ 是, 有 và 在 trong HSK 1 kèm ví dụ' },
    { type: 'qa', text: 'Cách hỏi giá tiền trong tiếng Trung: 这个多少钱？' },
    { type: 'diag', label: 'Sai trật tự từ', sentence: '我去北京昨天。' },
    { type: 'diag', label: 'Thừa trợ từ 的', sentence: '我买两个的苹果。' },
    { type: 'chat', text: '你好！很高兴认识你，今天天气怎么样？' },
  ],
  2: [
    { type: 'qa', text: 'Giải thích cách dùng & đặt câu với từ 打算 (dǎsuàn)' },
    { type: 'qa', text: 'Phân biệt cách dùng trợ từ 的, 得 và 地 kèm ví dụ' },
    { type: 'diag', label: 'Thừa 的', sentence: '我昨天去商店买两本的书。' },
    { type: 'diag', label: 'Sai trợ từ 得', sentence: '他跑得很慢慢。' },
    { type: 'chat', text: '你好！今天我们一起用中文聊天吧。' },
  ],
  3: [
    { type: 'qa', text: 'Giải thích toàn tập câu chữ 把 (把字句) trong HSK 3' },
    { type: 'qa', text: 'Phân biệt cách dùng 越...越... và 越来越' },
    { type: 'diag', label: 'Sai câu chữ 把', sentence: '我把衣服洗了干净。' },
    { type: 'diag', label: 'Sai câu chữ 被', sentence: '蛋糕吃被弟弟了。' },
    { type: 'chat', text: '老师好！我想练习用HSK 3语法谈谈我的周末计划。' },
  ],
  4: [
    { type: 'qa', text: 'Giải thích ngữ pháp HSK 4: Cấu trúc 无论……都…… và 尽管……但是……' },
    { type: 'qa', text: 'Phân biệt cặp từ dễ nhầm trong HSK 4: 关键 (guānjiàn) vs 重要 (zhòngyào)' },
    { type: 'qa', text: 'Giải thích cách dùng cấu trúc 拿……来说 và 随着…… trong HSK 4' },
    { type: 'diag', label: 'Sai ngữ pháp HSK 4', sentence: '无论遇到困难，我都要坚持下去。' },
    { type: 'diag', label: 'Sai bổ ngữ khả năng', sentence: '工作压力太大，我都受不了这个压力。' },
    { type: 'diag', label: 'Sai trật tự 连...都', sentence: '他连早饭不吃就去上班了。' },
    { type: 'chat', text: '你好！我们用HSK 4词汇聊聊工作压力与生活平衡吧。' },
  ],
  5: [
    { type: 'qa', text: 'Phân biệt các phó từ liên kết văn viết HSK 5: 从而, 进而, 因而' },
    { type: 'qa', text: 'Giải thích cấu trúc 哪怕……也…… và 与其……不如……' },
    { type: 'diag', label: 'Sai logic liên từ HSK 5', sentence: '哪怕天气很冷，所以他还是去游泳了。' },
    { type: 'chat', text: '您好！我想探讨一下人工智能对现代职场的影响。' },
  ],
  6: [
    { type: 'qa', text: 'Phân tích các thành ngữ HSK 6 cao cấp: 循序渐进, 络绎不绝, 举足轻重' },
    { type: 'diag', label: 'Sai sắc thái biểu cảm HSK 6', sentence: '他的成功是由于他拔苗助长的努力。' },
    { type: 'chat', text: '老师好！请与我讨论关于可持续发展与环境保护的议题。' },
  ],
};

interface AITutorViewProps {
  userProfile?: UserProfile;
}

export const AITutorView: React.FC<AITutorViewProps> = ({ userProfile }) => {
  const [activeMode, setActiveMode] = useState<TutorMode>('general');
  const [hskLevel, setHskLevel] = useState<HSKLevel>(2);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content: `### 你好！我是敏思中文 AI 导师 (Minnese AI Tutor) 🌟

Tôi là Gia sư AI kiêm Trợ lý ngôn ngữ Tiếng Trung chuẩn **HSK 3.0** (HSK 1 - 6). Tôi có thể hỗ trợ bạn toàn diện:

- 💬 **Hỏi đáp & Trò chuyện**: Hỏi từ vựng, cách đặt câu, giải thích ngữ pháp, dịch thuật hoặc luyện chat giao tiếp tự do.
- 🩺 **Tự động Chẩn đoán & Sửa lỗi câu**: Gửi câu tiếng Trung bất kỳ, AI sẽ lập tức bắt lỗi trật tự từ, trợ từ 的/得/地, câu chữ 把/被 và kê đơn sửa câu chuẩn bản xứ.
- 📖 **Tạo Bài Đọc Hiểu HSK**: Chuyển sang thẻ bên cạnh để dệt bài đọc HSK 1-6 chuẩn mực kèm Pinyin và câu hỏi trắc nghiệm.

Ngoài ra, bạn có thể bấm **"Gọi Thoại Luyện Nói Ngay"** ở góc trên để gọi thoại 2 chiều trực tiếp qua Micro!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'Giải thích cách dùng và đặt câu với từ 打算 (dǎsuàn)',
        'Kiểm tra câu này giúp tôi: 我昨天去商店买两本的书。',
        'Phân biệt cách dùng trợ từ 的, 得 và 地 kèm ví dụ',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastMsgRef = useRef<HTMLDivElement | null>(null);
  const lastUserMsgRef = useRef<HTMLDivElement | null>(null);

  const lastUserMsgIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        return i;
      }
    }
    return -1;
  }, [messages]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 120) {
      setShowScrollBottomBtn(true);
    } else {
      setShowScrollBottomBtn(false);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    if (lastUserMsgRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const element = lastUserMsgRef.current;
      const elementTop = element.offsetTop - container.offsetTop;
      container.scrollTo({
        top: Math.max(0, elementTop - 12),
        behavior: 'smooth',
      });
    } else if (lastMsgRef.current && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const element = lastMsgRef.current;
      const elementTop = element.offsetTop - container.offsetTop;
      container.scrollTo({
        top: Math.max(0, elementTop - 12),
        behavior: 'smooth',
      });
    } else if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/rag-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          mode: activeMode,
          hskLevel,
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned an error');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ragSources: data.ragSources,
        suggestedFollowUps: data.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: '抱歉 (Xin lỗi), tôi gặp sự cố khi kết nối với máy chủ AI. Vui lòng kiểm tra kết nối mạng hoặc thử lại nhé!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Browser Speech Recognition for voice input
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Trình duyệt chưa hỗ trợ nhận diện giọng nói. Bạn có thể gõ câu hỏi tiếng Trung trực tiếp!');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <div className="w-full max-w-6xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6" id="tutor-container">
      {/* Top Header & Mode Switcher */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)] shadow-md mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                Gia sư Tiếng Trung AI Minnese
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] dark:text-[var(--color-primary)] font-semibold border border-[var(--color-primary)]/20 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-pulse"></span>
                RAG HSK 3.0 Trực tuyến
              </span>
            </div>
          </div>

          {/* HSK Level Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] font-mono">
              Trình độ HSK:
            </span>
            <div className="flex bg-[var(--color-background)] p-1 rounded-xl border border-[var(--color-border)] gap-1 flex-wrap">
              {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setHskLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    hskLevel === lvl
                      ? 'bg-[var(--color-primary)] text-white shadow-xs font-black scale-105'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  New HSK {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs (2 clean dedicated modes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4 pt-4 border-t border-[var(--color-border)]">
          {/* Tab 1: Hỏi đáp, Trò chuyện & Sửa Ngữ pháp AI (Gộp chung) */}
          <button
            type="button"
            onClick={() => setActiveMode('general')}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left text-xs font-medium transition-all cursor-pointer ${
              activeMode === 'general'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] dark:text-[var(--color-primary)] font-bold shadow-xs'
                : 'border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-[var(--color-text-primary)]">Hỏi đáp, Trò chuyện & Sửa Ngữ pháp AI</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold font-mono">
                  All-in-One
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                Hỏi từ vựng, ngữ pháp, chat tự do & tự động chẩn đoán câu sai chuẩn bản xứ
              </p>
            </div>
          </button>

          {/* Tab 2: Tạo Bài Đọc Hiểu HSK AI */}
          <button
            type="button"
            onClick={() => setActiveMode('reading_studio')}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left text-xs font-medium transition-all cursor-pointer ${
              activeMode === 'reading_studio'
                ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                : 'border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-[var(--color-text-primary)]">Tạo Bài Đọc Hiểu HSK 📖</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold font-mono">
                  HSK 1 - 6
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                Dệt bài đọc HSK 1-6 theo chủ đề, bẻ khóa văn bản, Pinyin chuẩn & trắc nghiệm
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Conditional View: Dedicated Reading Studio vs Chat Stream */}
      {activeMode === 'reading_studio' ? (
        <HSKReadingStudio
          initialHskLevel={hskLevel}
          userProfile={userProfile}
          onAskAiAboutStory={(prompt) => {
            setActiveMode('general');
            setInput(prompt);
            handleSendMessage(prompt);
          }}
        />
      ) : (
        <>
          {/* Main Conversation Stream */}
          <div className="relative mb-4">
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 sm:p-5 pb-8 min-h-[420px] max-h-[620px] overflow-y-auto space-y-4 shadow-sm"
          id="chat-stream"
        >
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            const isLastUser = idx === lastUserMsgIndex;
            return (
              <div
                key={msg.id}
                ref={isLastUser ? lastUserMsgRef : isLast ? lastMsgRef : null}
                className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[var(--color-primary)] text-white font-bold'
                      : 'bg-[var(--color-primary-light)] border border-[var(--color-primary)]/30 text-[var(--color-primary)]'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
                  }`}
                >
                  {/* Header inside assistant message */}
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2 mb-2">
                      <span className="text-xs font-bold flex items-center gap-1.5 font-mono text-[var(--color-primary-dark)] dark:text-[var(--color-primary)]">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
                        敏思 AI 导师 (Minnese AI Tutor)
                      </span>
                      <button
                        type="button"
                        onClick={() => playChineseAudio(msg.content)}
                        className="p-1 rounded-md hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                        title="Phát âm tiếng Trung"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Message Content */}
                  {msg.sender === 'assistant' ? (
                    <AIMarkdownRenderer content={msg.content} />
                  ) : (
                    <div className="text-sm leading-relaxed text-white font-medium whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}

                  {/* Compact Collapsible RAG Sources Badge */}
                  {msg.ragSources && msg.ragSources.length > 0 && (
                    <details className="mt-2.5 pt-2 border-t border-[var(--color-border)]/60 text-[11px] group">
                      <summary className="cursor-pointer select-none font-semibold text-blue-600/90 dark:text-blue-400/90 hover:text-blue-600 flex items-center gap-1.5 w-fit">
                        <Database className="w-3.5 h-3.5 text-blue-500 inline shrink-0" />
                        <span>Nguồn tri thức RAG HSK tham khảo ({msg.ragSources.length})</span>
                      </summary>
                      <div className="flex flex-wrap gap-1.5 mt-2 pl-2">
                        {msg.ragSources.map((source, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] font-mono border border-blue-500/20"
                            title={source.snippet}
                          >
                            📌 {source.title}
                          </span>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Suggested Follow-Ups */}
                  {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="mt-3 pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((prompt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="px-2.5 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/50 text-xs font-medium transition-colors border border-[var(--color-border)] cursor-pointer"
                        >
                          💡 {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-right mt-1.5 text-[var(--color-text-secondary)] font-mono">
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              ref={lastMsgRef}
              className="flex items-start gap-3 animate-fade-in"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-[var(--color-primary-light)] border border-[var(--color-primary)]/30 text-[var(--color-primary)]">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>

              <div className="max-w-[85%] sm:max-w-[78%] w-full rounded-2xl p-4 bg-[var(--color-background)] border border-[var(--color-border)] shadow-xs">
                <CartoonLoader
                  layout="inline-typing"
                  message="Gia sư AI đang suy nghĩ & phân tích..."
                  subMessage="Đang kết hợp tri thức RAG, kiểm tra ngữ pháp HSK & chuẩn hóa giải thích."
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>

        {showScrollBottomBtn && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-20 px-3.5 py-2 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold shadow-xl hover:bg-[var(--color-primary-dark)] flex items-center gap-1.5 transition-all cursor-pointer border border-white/20 animate-fade-in"
            title="Cuộn xuống tin nhắn mới nhất"
          >
            <ArrowDown className="w-4 h-4 animate-bounce" />
            <span>Xuống tin nhắn mới nhất</span>
          </button>
        )}
      </div>

      {/* Dynamic Level Suggestions Bar */}
      <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Gợi ý HSK {hskLevel}:</span>
        </span>
        {(
          hskLevel === 4
            ? [
                'Phân biệt 无论 và 尽管 trong HSK 4',
                'Cấu trúc 连……都…… và cách dùng',
                'Kiểm tra câu: 尽管下雨，我们还是准时出发了。',
                'Phân biệt phó từ 恐怕 và 怕',
                'Cách dùng cấu trúc 拿……来说',
                'Phân biệt 对于 và 关于',
              ]
            : hskLevel === 3
            ? [
                'Phân biệt 把字句 và 被字句',
                'Cách dùng 越来越 và 越……越……',
                'Kiểm tra câu: 我把那本书看完了。',
                'Bổ ngữ xu hướng phức hợp',
              ]
            : hskLevel === 1
            ? [
                'Biến điệu chữ 不 và 一',
                'Cách chào hỏi và giới thiệu bản thân',
                'Trật tự câu cơ bản S + V + O',
              ]
            : hskLevel >= 5
            ? [
                'Giải thích thành ngữ 胸有成竹',
                'Phân biệt 进而, 从而 và 因而',
                'Sửa bài văn nghị luận HSK 5-6',
              ]
            : [
                'Phân biệt 的, 得 và 地',
                'Biến điệu thanh 3 trong tiếng Trung',
                'Phân biệt 会, 能 và 可以',
                'Kiểm tra câu: 我昨天去商店买两本的书。',
              ]
        ).map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)] dark:hover:text-[var(--color-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            💡 {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar & Voice Mic */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-[var(--color-surface)] rounded-2xl p-2.5 border border-[var(--color-border)] shadow-md flex items-center gap-2"
        id="tutor-input-form"
      >
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
            isRecording
              ? 'bg-red-500 text-white animate-bounce shadow-md'
              : 'bg-[var(--color-background)] hover:bg-[var(--color-border)]/40 border border-[var(--color-border)] text-[var(--color-text-secondary)]'
          }`}
          title={isRecording ? 'Đang lắng nghe tiếng Trung...' : 'Nói tiếng Trung qua Mic (Speech-to-Text)'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi từ vựng, ngữ pháp, dán câu tiếng Trung để AI kiểm tra/sửa lỗi hoặc chat tự do..."
          className="flex-1 px-3 py-2 bg-transparent text-xs sm:text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] focus:outline-hidden"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span>Gửi</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
      </>
      )}

      {/* Live Voice Call Modal */}
      <LiveVoiceCallModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        initialTopic="Trò chuyện giao tiếp tiếng Trung"
        userHskLevel={hskLevel}
      />
    </div>
  );
};
