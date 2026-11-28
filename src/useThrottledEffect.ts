import { type DependencyList, type EffectCallback, useRef } from "react";
import { useLatest } from "./useLatest";
import { useUnmount } from "./useUnmount";
import { useUpdateEffect } from "./useUpdateEffect";

interface Throttle {
  /** The wait after the last run, if it hasn't ended. */
  timer: ReturnType<typeof setTimeout> | undefined;
  /** Whether `deps` changed during the wait, so it ends with a run. */
  pending: boolean;
  /** The cleanup the last run returned. */
  cleanup: ReturnType<EffectCallback>;
}

/**
 * An effect that runs at most once every `ms`, for dependencies that change very often, such as
 * a scroll position. It doesn't run on mount, only after `deps` change. The first change runs it
 * at once and starts a wait; changes during the wait collapse into one run, with the latest
 * `effect`, when it ends, which starts a new wait. The cleanup `effect` returns runs before its
 * next run and on unmount, and a pending run is dropped on unmount. With `ms` of 0 or less (or
 * `NaN`) it runs on every change with no delay.
 */
export function useThrottledEffect(effect: EffectCallback, deps: DependencyList, ms: number): void {
  const latest = useLatest({ effect, ms });
  const throttle = useRef<Throttle>({ timer: undefined, pending: false, cleanup: undefined });

  useUpdateEffect(() => {
    const state = throttle.current;
    const run = () => {
      state.cleanup?.();
      state.cleanup = latest.current.effect();
    };
    const startWait = () => {
      const wait = latest.current.ms;
      if (!(wait > 0)) return;
      state.timer = setTimeout(() => {
        state.timer = undefined;
        if (state.pending) {
          state.pending = false;
          run();
          startWait();
        }
      }, wait);
    };
    if (state.timer === undefined) {
      run();
      startWait();
    } else state.pending = true;
  }, deps);

  useUnmount(() => {
    const state = throttle.current;
    clearTimeout(state.timer);
    state.timer = undefined;
    state.pending = false;
    state.cleanup?.();
    state.cleanup = undefined;
  });
}
