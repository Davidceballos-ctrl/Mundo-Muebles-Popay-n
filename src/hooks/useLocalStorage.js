import { useState, useEffect } from "react";

/**
 * Like useState but persisted in localStorage.
 * @param {string} key
 * @param {any}    initial
 */
export function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem("mm_" + key);
      return raw ? JSON.parse(raw) : (typeof initial === "function" ? initial() : initial);
    } catch { return typeof initial === "function" ? initial() : initial; }
  });

  useEffect(() => {
    try { localStorage.setItem("mm_" + key, JSON.stringify(val)); } catch {}
  }, [key, val]);

  return [val, setVal];
}
