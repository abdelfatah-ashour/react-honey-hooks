import { useEffect, useRef, useState } from "react";

// Plain literals, not products such as `60 * SECOND`: bundlers can't prove a product is free of
// side effects, so they would keep it in apps that never import this hook.
const SECOND = 1_000;
const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** Anything `new Date()` accepts: a `Date`, a millisecond timestamp or a date string. */
export type CountdownTarget = Date | number | string;

export interface Countdown {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly totalMilliseconds: number;
  readonly isExpired: boolean;
}

export interface CountdownOptions {
  /**
   * Called once each time a running countdown reaches zero. It is not called on mount when
   * the target has already passed. The latest function is always used.
   */
  onExpire?: () => void;
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
 * Remaining time never goes below zero; `isExpired` becomes `true` at zero, and
 * `onExpire` is called then.
 */
export function useCountdown(
  target: CountdownTarget,
  { onExpire }: CountdownOptions = {},
): Countdown {
  const targetTime = toTime(target);
  const [state, setState] = useState(() => ({
    targetTime,
    remaining: remainingUntil(targetTime),
  }));

  if (state.targetTime !== targetTime) {
    setState({ targetTime, remaining: remainingUntil(targetTime) });
  }

  const isExpired = state.remaining === 0;

  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  const wasExpired = useRef(isExpired);
  useEffect(() => {
    if (isExpired && !wasExpired.current) onExpireRef.current?.();
    wasExpired.current = isExpired;
  }, [isExpired]);

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
