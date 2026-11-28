import { type DependencyList, type EffectCallback, useRef } from "react";
import { useLatest } from "./useLatest";
import { useUnmount } from "./useUnmount";
import { useUpdateEffect } from "./useUpdateEffect";

/**
 * An effect that waits for its dependencies to settle: `effect` runs once `deps` have stopped
 * changing for `ms`, such as a search request after the user stops typing. It doesn't run on
 * mount, only after `deps` change. Each change restarts the wait, and so does changing `ms`. When
 * it runs, it uses the latest `effect`. The cleanup `effect` returns runs before its next run
 * and on unmount, and a pending run is dropped on unmount. With `ms` of 0 or less (or `NaN`) it
 * runs on every change with no delay.
 */
export function useDebouncedEffect(effect: EffectCallback, deps: DependencyList, ms: number): void {
  const latest = useLatest(effect);
  /** The cleanup the last run returned, called before the next run and on unmount. */
  const cleanup = useRef<ReturnType<EffectCallback>>(undefined);

  useUpdateEffect(() => {
    const run = () => {
      cleanup.current?.();
      cleanup.current = latest.current();
    };
    if (!(ms > 0)) {
      run();
      return;
    }
    const id = setTimeout(run, ms);
    return () => {
      clearTimeout(id);
    };
  }, [...deps, ms]);

  useUnmount(() => {
    cleanup.current?.();
    cleanup.current = undefined;
  });
}
