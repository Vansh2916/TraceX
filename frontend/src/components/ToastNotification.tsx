import React from 'react';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const severityBg =
          toast.severity === 'CRITICAL'
            ? 'border-red-500/60 bg-red-950/90 text-red-200'
            : toast.severity === 'WARNING'
            ? 'border-amber-500/60 bg-amber-950/90 text-amber-200'
            : 'border-blue-500/60 bg-blue-950/90 text-blue-200';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-in flex items-start gap-3 ${severityBg}`}
          >
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs tracking-wider uppercase">{toast.title}</span>
                <span className="text-[10px] opacity-60 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity p-0.5"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};
