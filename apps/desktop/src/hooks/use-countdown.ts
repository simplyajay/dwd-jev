import { useCallback, useEffect, useState } from "react";

/** Whole seconds left of a wait started with `start`; 0 when none is running. */
export function useCountdown() {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endsAt === null) return;
    // Ticks more often than once a second, so the display doesn't skip a number.
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= endsAt) setEndsAt(null);
    }, 250);
    return () => clearInterval(timer);
  }, [endsAt]);

  const start = useCallback((seconds: number) => {
    const time = Date.now();
    setNow(time);
    setEndsAt(time + seconds * 1000);
  }, []);

  const secondsLeft = endsAt === null ? 0 : Math.max(0, Math.ceil((endsAt - now) / 1000));
  return { secondsLeft, start };
}
