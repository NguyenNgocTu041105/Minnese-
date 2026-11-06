import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  resetCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    resetCount: 0,
  };

  public static getDerivedStateFromError(error: any): Partial<State> {
    const normalizedError = error instanceof Error
      ? error
      : new Error(
          typeof error === 'string'
            ? error
            : (error && typeof error === 'object' && error.message)
              ? String(error.message)
              : String(error || 'Lỗi không xác định')
        );
    return { hasError: true, error: normalizedError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    const isMountedFiber = Boolean((this as any)._reactInternals || (this as any)._reactInternalFiber);
    if (isMountedFiber) {
      this.setState({ errorInfo });
    } else {
      this.state = {
        ...this.state,
        errorInfo,
      };
    }
  }

  public handleReset = () => {
    const isMountedFiber = Boolean((this as any)._reactInternals || (this as any)._reactInternalFiber);
    if (isMountedFiber) {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        resetCount: (prev?.resetCount || 0) + 1,
      }));
    } else {
      this.state = {
        hasError: false,
        error: null,
        errorInfo: null,
        resetCount: (this.state.resetCount || 0) + 1,
      };
    }
    this.props.onReset?.();
  };

  public handleReload = async () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('minnese_') || key.startsWith('minnie_')) {
          localStorage.removeItem(key);
        }
      });
      if (typeof window !== 'undefined' && 'caches' in window) {
        const names = await window.caches.keys().catch(() => [] as string[]);
        await Promise.all(names.map((name) => window.caches.delete(name).catch(() => false)));
      }
    } catch {}
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV !== 'production';
      return (
        <div className="min-h-screen bg-[#F7F9FA] text-[#0A1A17] flex items-center justify-center p-4 font-sans">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-[#E0EAE7] p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              ⚠️
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#0A1A17]">Đã xảy ra sự cố hiển thị</h2>
              <p className="text-xs text-[#51635F] leading-relaxed">
                Ứng dụng gặp sự cố ngoài dự kiến trong khi tải mô-đun hoặc dữ liệu. Bạn có thể bấm <strong>"Thử lại ngay"</strong> để kích hoạt lại mà không cần tải lại toàn bộ trang.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 text-left overflow-auto max-h-48 text-xs font-mono text-rose-950 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold text-rose-700 border-b border-rose-200 pb-1">
                  <span>Thông tin kỹ thuật (Diagnostic Details)</span>
                  {isDev && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-200 text-rose-800">Development</span>}
                </div>
                <p className="font-semibold text-rose-800 break-words">
                  {this.state.error.name ? `${this.state.error.name}: ` : ''}{this.state.error.message || 'Lỗi không xác định'}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-rose-700/80 whitespace-pre-wrap break-all leading-tight">
                    {this.state.error.stack.slice(0, 400)}
                  </pre>
                )}
                {isDev && this.state.errorInfo?.componentStack && (
                  <pre className="text-[9px] text-rose-900/70 border-t border-rose-200/60 pt-1 whitespace-pre-wrap break-all leading-tight">
                    {this.state.errorInfo.componentStack.slice(0, 300)}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-[#0F9B84] hover:bg-[#0B7A68] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                id="error-boundary-retry-btn"
              >
                <span>🔄</span>
                <span>Thử lại ngay</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                id="error-boundary-reload-btn"
              >
                Tải lại trang
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-xs transition-all cursor-pointer"
                id="error-boundary-clear-cache-btn"
              >
                Xóa cache & Tải lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.resetCount}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
