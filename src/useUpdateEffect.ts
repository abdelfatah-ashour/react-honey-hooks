import { type DependencyList, type EffectCallback, useEffect, useRef } from "react";

/**
 * `useEffect` that skips the first render: `effect` runs only when `deps` change after mounting
 * (or after every later render, with no `deps`). Its cleanup runs before the next run and on
 * unmount, as with `useEffect`. React's development Strict Mode, which mounts, unmounts and
 * mounts again, doesn't count as an update.
 */
export function useUpdateEffect(effect: EffectCallback, deps?: DependencyList): void {
  const mounted = useRef(false);

  // Declared first, so on unmount (including Strict Mode's) it resets before anything else and
  // the next mount is skipped too.
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller's deps, as with useEffect.
  }, deps);
}
