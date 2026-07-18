"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ToastItem = {
  id: string;
  message: string;
  tone?: "success" | "error" | "info";
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastItem["tone"]) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastItem["tone"] = "info") => {
    const id = `t_${Date.now()}`;
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-md",
              item.tone === "success" && "border-green-200 bg-green-50 text-green-800",
              item.tone === "error" && "border-red-200 bg-red-50 text-red-800",
              item.tone === "info" && "border-border bg-white text-foreground",
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
