import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('minnese_') || key.startsWith('minnie_')) {
          localStorage.removeItem(key);
        }
      });
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F9FA] text-[#0A1A17] flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#E0EAE7] p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs">
              ⚠️
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#0A1A17]">Đã xảy ra sự cố hiển thị</h2>
              <p className="text-xs text-[#51635F] leading-relaxed">
                Ứng dụng gặp lỗi ngoài dự kiến trong khi tải dữ liệu. Bạn có thể tải lại trang để phục hồi phiên làm việc.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-left overflow-auto max-h-32 text-xs font-mono text-gray-700">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-[#0F9B84] hover:bg-[#0B7A68] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Tải lại trang
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Xóa cache & Tải lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
