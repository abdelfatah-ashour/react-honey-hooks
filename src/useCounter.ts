import { useEffect, useRef, useState } from "react";

export interface CounterOptions {
  /** The lowest the count can go. No limit unless given. */
  min?: number;
  /** The highest the count can go. No limit unless given. */
  max?: number;
}

/** `inc` and `dec`: step by `delta`, or by 1 when called with no number or with an event. */
export interface CounterStep {
  (delta?: number): void;
  /** Steps by 1; this form lets it be passed straight to `onClick`. */
  (event: Event | { nativeEvent: Event }): void;
}

/** The functions `useCounter` returns alongside the count. */
export interface CounterActions {
  /** Adds `delta` (1 unless given); can be passed straight to `onClick`. */
  inc: CounterStep;
  /** Subtracts `delta` (1 unless given); can be passed straight to `onClick`. */
  dec: CounterStep;
  /** Sets the count, or computes it from the current count. */
  set: (value: number | ((current: number) => number)) => void;
  /** Goes back to the initial count from the first render. */
  reset: () => void;
}

/** `value` kept within `min` and `max`. */
function clamp(value: number, min = -Infinity, max = Infinity): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * A number with `inc`, `dec`, `set` and `reset`. Returns `[count, { inc, dec, set, reset }]`.
 * The count always stays within `min` and `max`: the initial value and every update are kept in
 * range, and if the limits change the count moves into the new range. `NaN` is ignored, whether
 * as the initial value (which then means 0), a delta or a value to set. The actions object and
 * its functions never change, and always use the latest `min` and `max`.
 */
export function useCounter(
  initial = 0,
  { min, max }: CounterOptions = {},
): readonly [number, CounterActions] {
  const [stored, setStored] = useState(() => (Number.isNaN(initial) ? 0 : initial));
  const limits = useRef({ min, max });
  useEffect(() => {
    limits.current = { min, max };
  });

  const [actions] = useState<CounterActions>(() => {
    const update = (to: (current: number) => number) => {
      setStored((current) => {
        const target = to(clamp(current, limits.current.min, limits.current.max));
        return Number.isNaN(target)
          ? current
          : clamp(target, limits.current.min, limits.current.max);
      });
    };
    // Anything but a number (such as a click event, when passed straight to `onClick`) is 1.
    const step = (delta: unknown) => (typeof delta === "number" ? delta : 1);
    return {
      inc: (delta?: unknown) => {
        update((current) => current + step(delta));
      },
      dec: (delta?: unknown) => {
        update((current) => current - step(delta));
      },
      set: (value) => {
        update((current) => (typeof value === "function" ? value(current) : value));
      },
      reset: () => {
        update(() => (Number.isNaN(initial) ? 0 : initial));
      },
    };
  });
  return [clamp(stored, min, max), actions] as const;
}
