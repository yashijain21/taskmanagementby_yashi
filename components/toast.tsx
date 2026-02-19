"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string };

let pushToastFn: ((message: string) => void) | null = null;

export const showToast = (message: string): void => {
  pushToastFn?.(message);
};

export function ToastProvider(): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    pushToastFn = (message: string) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 2500);
    };

    return () => {
      pushToastFn = null;
    };
  }, []);

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
