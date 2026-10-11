import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Maximize2 } from 'lucide-react';

interface MinnieLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: 'badge' | 'avatar' | 'horizontal';
  allowZoom?: boolean;
}

const LOCAL_STORAGE_LOGO_KEY = 'minnie_custom_logo_img';

export const MinnieLogo: React.FC<MinnieLogoProps> = ({
  className = '',
  size = 40,
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
      if (saved) {
        setCustomLogoUrl(saved);
      }
    } catch {}

    const handleStorageUpdate = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_LOGO_KEY);
        setCustomLogoUrl(saved || null);
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

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* If custom image uploaded by user, render image cleanly */}
      {customLogoUrl ? (
        <div className={`flex items-center gap-2 select-none ${className}`}>
          <img
            src={customLogoUrl}
            alt="Minnie Chinese Logo"
            className="h-9 sm:h-10 object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />
          {showText && (
            <span className="font-black text-lg sm:text-xl tracking-wider text-[var(--color-primary)] dark:text-purple-300 font-sans leading-none">
              MINNIE CHINESE
            </span>
          )}
        </div>
      ) : (
        /* Pure Clean Text Logo: MINNIE CHINESE */
        <div className={`flex items-center select-none ${className}`}>
          <span className="font-black text-lg sm:text-xl md:text-2xl tracking-wider text-[var(--color-primary)] dark:text-purple-300 font-sans leading-none hover:opacity-95 transition-opacity">
            MINNIE CHINESE
          </span>
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

            <div className="py-6 flex items-center justify-center">
              <span className="font-black text-3xl tracking-widest text-[var(--color-primary)] dark:text-purple-300">
                MINNIE CHINESE
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
