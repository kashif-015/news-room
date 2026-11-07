'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface Toast {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'alert';
}

interface ToastContextType {
  showToast: (message: string, type?: 'info' | 'success' | 'alert') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-[2px] bg-ink text-bone font-mono text-xs shadow-md border border-rule transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'alert'
                ? 'border-alert/50'
                : toast.type === 'success'
                ? 'border-pine/50'
                : 'border-rule/20'
            }`}
          >
            {toast.type === 'success' && (
              <span className="w-1.5 h-1.5 rounded-full bg-pine shrink-0" aria-hidden="true" />
            )}
            {toast.type === 'alert' && (
              <span className="w-1.5 h-1.5 rounded-full bg-alert shrink-0" aria-hidden="true" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

