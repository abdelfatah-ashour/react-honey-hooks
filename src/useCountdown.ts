import { useEffect, useState } from "react";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Anything `new Date()` accepts: a `Date`, a millisecond timestamp or a date string. */
export type CountdownTarget = Date | number | string;

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMilliseconds: number;
  isExpired: boolean;
}

/** Invalid dates map to 0 (the epoch) so they read as expired and compare stably. */
function toTime(target: CountdownTarget): number {
  const time = new Date(target).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function remainingUntil(targetTime: number): number {
  return Math.max(0, targetTime - Date.now());
}

/**
 * Counts down to `target`, updating once per second until it is reached.
 * Remaining time never goes below zero; `isExpired` becomes `true` at zero.
 */
export function useCountdown(target: CountdownTarget): Countdown {
  const targetTime = toTime(target);
  const [state, setState] = useState(() => ({
    targetTime,
    remaining: remainingUntil(targetTime),
  }));

  if (state.targetTime !== targetTime) {
    setState({ targetTime, remaining: remainingUntil(targetTime) });
  }

  const isExpired = state.remaining === 0;

  useEffect(() => {
    if (isExpired) return;
    const id = setInterval(() => {
      setState({ targetTime, remaining: remainingUntil(targetTime) });
    }, SECOND);
    return () => {
      clearInterval(id);
    };
  }, [targetTime, isExpired]);

  const { remaining } = state;
  return {
    days: Math.floor(remaining / DAY),
    hours: Math.floor((remaining % DAY) / HOUR),
    minutes: Math.floor((remaining % HOUR) / MINUTE),
    seconds: Math.floor((remaining % MINUTE) / SECOND),
    totalMilliseconds: remaining,
    isExpired,
  };
}
