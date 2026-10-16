"use client";

import { useEffect } from "react";

/** Schedule a data load outside the effect body to satisfy react-hooks/set-state-in-effect. */
export function useAsyncLoad(enabled: boolean, load: () => void | Promise<void>) {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) {
        void load();
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, load]);
}
