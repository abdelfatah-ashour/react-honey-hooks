import { useCallback, useEffect, useRef, useState } from "react";

export interface StepOptions {
  /** The step to start at, counted from 0. Defaults to 0. */
  initial?: number;
}

export interface Steps {
  /** The current step, counted from 0. */
  readonly step: number;
  /** Moves to the next step; does nothing on the last. */
  readonly next: () => void;
  /** Moves to the previous step; does nothing on the first. */
  readonly prev: () => void;
  /** Moves to `step`, kept within the first and last steps; NaN is ignored. */
  readonly goTo: (step: number) => void;
  readonly isFirst: boolean;
  readonly isLast: boolean;
}

/** `step` kept within 0 and the last step; a `count` below 1 means a single step. */
function clamp(step: number, count: number): number {
  const last = Math.max(Math.floor(count) - 1, 0);
  return Math.min(Math.max(Math.trunc(step), 0), Number.isNaN(last) ? 0 : last);
}

/**
 * Tracks the current step of `count` steps, such as the pages of a wizard: returns `{ step,
 * next, prev, goTo, isFirst, isLast }`, with `step` counted from 0. The step always stays within
 * range: `next` on the last step and `prev` on the first do nothing, `goTo` keeps its target in
 * range, and if `count` shrinks the step moves to the new last step. A `count` below 1 means a
 * single step. `next`, `prev` and `goTo` keep their identity.
 */
export function useStep(count: number, { initial = 0 }: StepOptions = {}): Steps {
  const [stored, setStored] = useState(() => clamp(Number.isNaN(initial) ? 0 : initial, count));
  const latestCount = useRef(count);
  useEffect(() => {
    latestCount.current = count;
  });

  const move = useCallback((to: (step: number) => number) => {
    setStored((current) => {
      const target = to(clamp(current, latestCount.current));
      return Number.isNaN(target) ? current : clamp(target, latestCount.current);
    });
  }, []);
  const next = useCallback(() => {
    move((step) => step + 1);
  }, [move]);
  const prev = useCallback(() => {
    move((step) => step - 1);
  }, [move]);
  const goTo = useCallback(
    (step: number) => {
      move(() => step);
    },
    [move],
  );

  const step = clamp(stored, count);
  const last = clamp(Number.POSITIVE_INFINITY, count);
  return { step, next, prev, goTo, isFirst: step === 0, isLast: step === last };
}
