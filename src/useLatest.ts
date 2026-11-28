import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";

/**
 * A layout effect in the browser, so the ref is updated before any component's effects run,
 * and a plain effect (which doesn't run) on the server, where React 18 warns about layout
 * effects.
 */
const useBeforeEffects = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Returns a ref holding the latest `value`, for reading in effects, timers and event handlers
 * without listing it as a dependency. The ref is the same object on every render, and is
 * updated once a render commits, before any effects run (including children's), so read it
 * there rather than while rendering.
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useBeforeEffects(() => {
    ref.current = value;
  });
  return ref;
}
