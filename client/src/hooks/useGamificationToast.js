import { useCallback, useEffect, useRef, useState } from "react";

export function useGamificationToast(timeoutMs = 3000) {
  const [toast, setToast] = useState(null);
  const queueRef = useRef([]);

  const showToast = useCallback((type, message) => {
    const next = { type, message };
    setToast((current) => {
      if (current) {
        queueRef.current.push(next);
        return current;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const id = setTimeout(() => {
      const upcoming = queueRef.current.shift() || null;
      setToast(upcoming);
    }, timeoutMs);

    return () => clearTimeout(id);
  }, [toast, timeoutMs]);

  const clearToast = useCallback(() => {
    queueRef.current = [];
    setToast(null);
  }, []);

  return { toast, showToast, clearToast };
}
