"use client";

import * as React from "react";

export interface ToastMessage {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

type ToastCallback = (toast: Omit<ToastMessage, 'id'>) => void;
let toastCallback: ToastCallback | null = null;

export const toast = (msg: Omit<ToastMessage, 'id'>) => {
  if (toastCallback) {
    toastCallback(msg);
  } else {
    console.log("Toast fallback: ", msg);
  }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  React.useEffect(() => {
    toastCallback = (newToast) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { ...newToast, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    return () => {
      toastCallback = null;
    };
  }, []);

  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-md pointer-events-none p-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex flex-col p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 scale-100 ${
              t.variant === 'destructive'
                ? 'bg-red-50 border-red-200 text-red-800'
                : t.variant === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-600/5'
                : 'bg-white border-border text-foreground shadow-sm'
            }`}
          >
            {t.title && <span className="font-bold text-sm leading-tight">{t.title}</span>}
            {t.description && <span className="text-xs opacity-90 mt-1">{t.description}</span>}
          </div>
        ))}
      </div>
    </>
  );
}
