import { useCallback, useEffect, useState } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable (private mode, quota). Keep working in memory.
    }
  }, [key, value]);

  const update = useCallback((next) => {
    setValue((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  return [value, update];
}
