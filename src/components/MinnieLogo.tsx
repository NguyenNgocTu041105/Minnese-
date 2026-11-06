import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';

export interface MinnieLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'badge' | 'avatar' | 'horizontal';
  allowZoom?: boolean;
}

const LOCAL_STORAGE_LOGO_KEY = 'minnie_custom_logo_img';
const DEFAULT_MASCOT_SRC = '/minnie-mascot.png?v=3';

export const MinnieLogo: React.FC<MinnieLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
  variant = 'horizontal',
  allowZoom = false,
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom logo if user uploaded one
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LOGO_KEY);
      if (saved && (saved.includes('iVBORw0KGgoAAAANSUhEUgAA') || saved.length > 50000)) {
        localStorage.removeItem(LOCAL_STORAGE_LOGO_KEY);
        setCustomLogoUrl(null);
      } else if (saved) {
        setCustomLogoUrl(saved);
      }
    } catch {}

    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_LOGO_KEY);
        if (saved && (saved.includes('iVBORw0KGgoAAAANSUhEUgAA') || saved.length > 50000)) {
          localStorage.removeItem(LOCAL_STORAGE_LOGO_KEY);
          setCustomLogoUrl(null);
        } else {
          setCustomLogoUrl(saved || null);
        }
      } catch {}
    };

    window.addEventListener('minnie-logo-updated', handleStorageUpdate);
    return () => window.removeEventListener('minnie-logo-updated', handleStorageUpdate);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        try {
          localStorage.setItem(LOCAL_STORAGE_LOGO_KEY, dataUrl);
          setCustomLogoUrl(dataUrl);
          window.dispatchEvent(new Event('minnie-logo-updated'));
        } catch {
          setCustomLogoUrl(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomLogo = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_LOGO_KEY);
    } catch {}
    setCustomLogoUrl(null);
    window.dispatchEvent(new Event('minnie-logo-updated'));
  };

  const mascotSrc = customLogoUrl || DEFAULT_MASCOT_SRC;

  // Mascot circular badge image element with soft lavender border (#D8B4FE)
  const renderMascotImg = (imgSize: number, extraClasses = '') => (
    <div
      className={`relative rounded-full ring-2 ring-[#D8B4FE] ring-offset-1 ring-offset-transparent shadow-xs overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105 bg-purple-50/50 dark:bg-purple-950/30 ${extraClasses}`}
      style={{ width: imgSize, height: imgSize }}
      onClick={(e) => {
        if (allowZoom) {
          e.stopPropagation();
          setIsZoomOpen(true);
        }
      }}
    >
      <img
        src={mascotSrc}
        alt="Minnie & Corgi Mascot"
        className="w-full h-full object-cover rounded-full select-none"
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </div>
  );

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {variant === 'avatar' || !showText ? (
        /* Pure Avatar Mode */
        <div className={`inline-flex items-center select-none ${className}`}>
          {renderMascotImg(size)}
        </div>
      ) : variant === 'badge' ? (
        /* Vertical Badge Mode (prominent mascot badge + stacked typography) */
        <div className={`flex flex-col items-center text-center select-none ${className}`}>
          <div className="relative group">
            {renderMascotImg(size, 'ring-3 ring-[#D8B4FE] shadow-md shadow-purple-500/15')}
          </div>
          <div className="mt-2.5 flex flex-col items-center leading-none">
            <div className="flex items-center gap-1 sm:gap-1.5 font-sans">
              <span className="font-black text-base sm:text-lg tracking-wide text-[#7C3AED] dark:text-[#D8B4FE]">
                MINNIE
              </span>
              <span className="font-black text-base sm:text-lg tracking-wide text-stone-900 dark:text-[#FFFFFF]">
                CHINESE
              </span>
            </div>
            <span className="mt-1 text-[9px] sm:text-[10px] font-bold tracking-wider text-teal-600 dark:text-teal-300 uppercase">
              Khảo Thí Tiếng Trung 3.0
            </span>
          </div>
        </div>
      ) : (
        /* Horizontal Navbar Logo (Mascot circular avatar + MINNIE CHINESE + Subtitle) */
        <div className={`flex items-center gap-2 sm:gap-2.5 select-none shrink min-w-0 ${className}`}>
          {renderMascotImg(size)}
          <div className="flex flex-col justify-center min-w-0 leading-none">
            <div className="flex items-center gap-1 sm:gap-1.5 font-sans whitespace-nowrap">
              <span className="font-black text-sm sm:text-base md:text-lg tracking-normal sm:tracking-wide text-[#7C3AED] dark:text-[#D8B4FE] transition-colors">
                MINNIE
              </span>
              <span className="font-black text-sm sm:text-base md:text-lg tracking-normal sm:tracking-wide text-stone-900 dark:text-[#FFFFFF] transition-colors">
                CHINESE
              </span>
            </div>
            <span className="text-[8px] sm:text-[9.5px] font-bold tracking-tight sm:tracking-wider text-teal-600 dark:text-teal-300 mt-0.5 sm:mt-1 whitespace-nowrap transition-colors">
              Khảo Thí Tiếng Trung 3.0
            </span>
          </div>
        </div>
      )}

      {/* Modal only if zoom enabled and open */}
      {allowZoom && isZoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl shadow-2xl p-6 space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">MINNIE CHINESE</h3>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1.5 rounded-lg bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 flex flex-col items-center justify-center space-y-3">
              <div className="w-32 h-32 rounded-full ring-4 ring-[#D8B4FE] ring-offset-2 ring-offset-transparent overflow-hidden shadow-xl">
                <img
                  src={mascotSrc}
                  alt="Minnie & Corgi Mascot"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2 font-sans">
                <span className="font-black text-2xl text-[#7C3AED] dark:text-[#D8B4FE]">
                  MINNIE
                </span>
                <span className="font-black text-2xl text-stone-900 dark:text-[#FFFFFF]">
                  CHINESE
                </span>
              </div>
              <span className="text-xs font-bold tracking-wider text-teal-600 dark:text-teal-300">
                Khảo Thí Tiếng Trung 3.0
              </span>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh logo</span>
              </button>
              {customLogoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveCustomLogo}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-600 text-xs cursor-pointer"
                  title="Xóa ảnh tùy chỉnh"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
