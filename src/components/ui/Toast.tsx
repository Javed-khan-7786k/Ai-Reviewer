"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toastMethods = {
    success: (message: string, title?: string) =>
      addToast("success", message, title),
    error: (message: string, title?: string) =>
      addToast("error", message, title),
    info: (message: string, title?: string) => addToast("info", message, title),
    warning: (message: string, title?: string) =>
      addToast("warning", message, title),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      {/* Toast Render Area */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const config = {
            success: {
              icon: CheckCircle2,
              color: "text-emerald-600 bg-emerald-50 border-emerald-200",
              iconColor: "text-emerald-600",
            },
            error: {
              icon: AlertCircle,
              color: "text-rose-700 bg-rose-50 border-rose-200",
              iconColor: "text-rose-600",
            },
            warning: {
              icon: AlertTriangle,
              color: "text-amber-800 bg-amber-50 border-amber-200",
              iconColor: "text-amber-600",
            },
            info: {
              icon: Info,
              color: "text-blue-800 bg-blue-50 border-blue-200",
              iconColor: "text-blue-600",
            },
          }[t.type];

          const Icon = config.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-3 duration-200 bg-white ${config.color}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
              <div className="flex-1 min-w-0">
                {t.title && (
                  <h5 className="text-xs font-semibold text-slate-900 mb-0.5">
                    {t.title}
                  </h5>
                )}
                <p className="text-xs text-slate-700 leading-snug">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
