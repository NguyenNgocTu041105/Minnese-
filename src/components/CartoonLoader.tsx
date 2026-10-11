import React from 'react';

export type MascotType =
  | 'panda_study'
  | 'cat_loader'
  | 'brush_calligraphy'
  | 'grammar_doctor'
  | 'ai_thinking'
  | 'celebration';

interface CartoonLoaderProps {
  type?: MascotType;
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'inline-typing' | 'bubble' | 'card';
  showPandaBadge?: boolean;
  className?: string;
}

/**
 * 🐼 Panda Scholar Vector Animation (Gấu Trúc Học Giả Đọc Sách HSK)
 * Hoàn toàn bằng SVG + CSS Keyframes 60fps, trong suốt 100%, siêu dễ thương
 */
export const PandaScholarSvg: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 28,
}) => {
  return (
    <div className={`inline-flex items-center justify-center select-none pointer-events-none ${className}`}>
      <svg
        width={size * 1.3}
        height={size}
        viewBox="0 0 52 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Soft Ambient Floating Shadow */}
        <ellipse cx="26" cy="38" rx="14" ry="2" fill="#000000" opacity="0.15" />

        {/* Panda Body Group with gentle breathing/nodding animation */}
        <g
          style={{
            animation: 'pandaNod 1.4s ease-in-out infinite alternate',
            transformOrigin: '26px 36px',
          }}
        >
          {/* Black Ears */}
          <circle
            cx="14"
            cy="11"
            r="5.5"
            fill="#1E293B"
            style={{
              animation: 'earWiggleLeft 1.2s infinite ease-in-out alternate',
              transformOrigin: '14px 11px',
            }}
          />
          <circle
            cx="38"
            cy="11"
            r="5.5"
            fill="#1E293B"
            style={{
              animation: 'earWiggleRight 1.2s infinite ease-in-out alternate',
              transformOrigin: '38px 11px',
            }}
          />

          {/* Main Head Base */}
          <ellipse cx="26" cy="21" rx="16" ry="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />

          {/* Eye Patches (Signature Panda Eyepatches) */}
          <ellipse
            cx="19"
            cy="19"
            rx="4.8"
            ry="4"
            fill="#1E293B"
            transform="rotate(-15 19 19)"
          />
          <ellipse
            cx="33"
            cy="19"
            rx="4.8"
            ry="4"
            fill="#1E293B"
            transform="rotate(15 33 19)"
          />

          {/* Big Sparkly Eyes (Blinking animation) */}
          <g style={{ animation: 'pandaBlink 3.2s infinite' }}>
            <circle cx="19.5" cy="18.5" r="2.2" fill="#FFFFFF" />
            <circle cx="32.5" cy="18.5" r="2.2" fill="#FFFFFF" />
            <circle cx="20" cy="18.5" r="1.3" fill="#0F172A" />
            <circle cx="32" cy="18.5" r="1.3" fill="#0F172A" />
            {/* Catchlight sparkles */}
            <circle cx="20.5" cy="17.8" r="0.6" fill="#FFFFFF" />
            <circle cx="32.5" cy="17.8" r="0.6" fill="#FFFFFF" />
          </g>

          {/* Rosy Blush Cheeks */}
          <ellipse cx="14.5" cy="23.5" rx="2.5" ry="1.4" fill="#FDA4AF" opacity="0.85" />
          <ellipse cx="37.5" cy="23.5" rx="2.5" ry="1.4" fill="#FDA4AF" opacity="0.85" />

          {/* Cute Nose & Smile */}
          <ellipse cx="26" cy="22.5" rx="2" ry="1.3" fill="#0F172A" />
          <path
            d="M 24.5 24.5 Q 26 26 27.5 24.5"
            stroke="#0F172A"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
          />

          {/* Scholar Cap / Mũ Cử Nhân Trạng Nguyên Mini */}
          <g
            style={{
              animation: 'capTilt 1.4s ease-in-out infinite alternate',
              transformOrigin: '26px 8px',
            }}
          >
            {/* Diamond top plate */}
            <polygon points="26,1 39,6 26,11 13,6" fill="#0F766E" stroke="#134E4A" strokeWidth="0.8" />
            {/* Cap base band */}
            <path d="M 19 8 L 33 8 L 31 12 L 21 12 Z" fill="#115E59" />
            {/* Golden Ribbon Bead */}
            <circle cx="26" cy="6" r="1.2" fill="#F59E0B" />
            {/* Swaying Red/Gold Tassel */}
            <path
              d="M 26 6 Q 36 7 35 14"
              stroke="#E11D48"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="35" cy="14" r="1.2" fill="#E11D48" />
          </g>

          {/* Small Scholar Wire Glasses */}
          <circle cx="19" cy="19" r="4.2" stroke="#D97706" strokeWidth="0.9" fill="none" opacity="0.9" />
          <circle cx="33" cy="19" r="4.2" stroke="#D97706" strokeWidth="0.9" fill="none" opacity="0.9" />
          <line x1="23.2" y1="19" x2="28.8" y2="19" stroke="#D97706" strokeWidth="0.9" />

          {/* Study Scroll / HSK Book in front */}
          <g transform="translate(0, 1)">
            {/* Book Base Cover (Emerald/Gold) */}
            <rect x="16" y="27" width="20" height="11" rx="2" fill="#059669" stroke="#047857" strokeWidth="0.8" />
            {/* Book Pages */}
            <rect x="18" y="28" width="7.5" height="9" rx="1" fill="#FEF3C7" />
            <rect x="26.5" y="28" width="7.5" height="9" rx="1" fill="#FEF3C7" />
            {/* Hanzi "学" (Học) or "HSK" on book */}
            <text
              x="22"
              y="34.5"
              textAnchor="middle"
              fontSize="6"
              fill="#B45309"
              fontWeight="bold"
              fontFamily="serif"
            >
              学
            </text>
            <text
              x="30.5"
              y="34.5"
              textAnchor="middle"
              fontSize="5"
              fill="#0F766E"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              HSK
            </text>

            {/* Little Panda Paws holding book */}
            <circle cx="16" cy="32" r="2.8" fill="#1E293B" />
            <circle cx="36" cy="32" r="2.8" fill="#1E293B" />
          </g>
        </g>

        {/* Floating Sparkle Star */}
        <g style={{ animation: 'sparkleStar 1.6s infinite ease-in-out' }}>
          <polygon points="46,4 47,7 50,8 47,9 46,12 45,9 42,8 45,7" fill="#F59E0B" />
        </g>
      </svg>

      {/* Embedded CSS Keyframes */}
      <style>{`
        @keyframes pandaNod {
          0% { transform: translateY(0px) rotate(-1deg); }
          100% { transform: translateY(-2px) rotate(2deg); }
        }
        @keyframes earWiggleLeft {
          0% { transform: rotate(-5deg); }
          100% { transform: rotate(8deg); }
        }
        @keyframes earWiggleRight {
          0% { transform: rotate(5deg); }
          100% { transform: rotate(-8deg); }
        }
        @keyframes capTilt {
          0% { transform: rotate(-3deg); }
          100% { transform: rotate(4deg); }
        }
        @keyframes pandaBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes sparkleStar {
          0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.3; }
          50% { transform: scale(1.1) rotate(45deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export const CartoonLoader: React.FC<CartoonLoaderProps> = ({
  type = 'panda_study',
  message = 'Gia sư AI đang suy nghĩ & soạn câu trả lời...',
  subMessage,
  size = 'md',
  layout = 'inline-typing',
  showPandaBadge = true,
  className = '',
}) => {
  // 1. INLINE TYPING LOADER (Tối ưu tuyệt đối cho khung chat lặp lại: Nhẹ, Gọn, Không che chữ)
  if (layout === 'inline-typing' || layout === 'bubble') {
    return (
      <div className={`space-y-2.5 animate-fade-in ${className}`}>
        {/* Top Header with Status & Panda Badge */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <p className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] font-sans">
              {message}
            </p>
          </div>

          {/* Cute Panda Scholar Badge */}
          {showPandaBadge ? (
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full shadow-2xs">
              <PandaScholarSvg size={20} />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                Gia sư AI thinking...
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Sub-context message with clear contrast */}
        {subMessage && (
          <p className="text-xs text-[var(--color-text-secondary)] dark:text-slate-300 font-medium leading-relaxed">
            {subMessage}
          </p>
        )}

        {/* Indeterminate Smooth Glowing Shimmer Track (Dải ánh sáng mượt mà, không che chữ, không có số % giả) */}
        <div className="relative w-full h-1 bg-[var(--color-border)]/70 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full w-2/5 animate-pulse"
            style={{
              animation: 'smoothSlide 1.6s infinite ease-in-out',
            }}
          />
        </div>

        <style>{`
          @keyframes smoothSlide {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(120%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  // 2. CARD / MODAL LOADER (Dành riêng cho tác vụ tạo nội dung nặng: Đề thi HSK, Dệt bài đọc)
  return (
    <div className={`flex flex-col items-center justify-center p-5 text-center animate-fade-in ${className}`}>
      {/* Panda Scholar Illustration Card */}
      <div className="relative flex flex-col items-center justify-center mb-3.5">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/25 via-teal-500/20 to-amber-500/20 rounded-3xl blur-xl animate-pulse" />

        <div className="relative z-10 p-3 rounded-2xl bg-white/20 dark:bg-white/5 backdrop-blur-md border border-[var(--color-border)] shadow-md hover:scale-105 transition-transform duration-300">
          <PandaScholarSvg size={size === 'lg' ? 68 : size === 'sm' ? 42 : 54} />
        </div>
      </div>

      {/* Message Title */}
      <div className="flex items-center justify-center flex-wrap gap-2">
        <p className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] font-sans">
          {message}
        </p>
      </div>

      {/* Subtext with Good Contrast */}
      {subMessage && (
        <p className="text-xs text-[var(--color-text-secondary)] dark:text-slate-300 mt-1.5 max-w-md leading-relaxed font-medium">
          {subMessage}
        </p>
      )}

      {/* Indeterminate Progress Bar */}
      <div className="w-full max-w-xs h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden mt-3.5">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full animate-pulse w-full" />
      </div>
    </div>
  );
};
