import { useEffect, useState } from "react";

/** Schedules a call; each new call replaces the pending one and restarts the wait. */
export interface DebouncedFunction<A extends unknown[]> {
  (...args: A): void;
  /** Drops the pending call, if any. */
  readonly cancel: () => void;
  /** Runs the pending call now, if any. */
  readonly flush: () => void;
}

/**
 * The timer state lives in this closure rather than in refs, so the hook only has to create
 * it once and hand it the latest `fn` and `delayMs` after each render.
 */
function createDebounced<A extends unknown[]>(fn: (...args: A) => void, delayMs: number) {
  let latest = { fn, delayMs };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: A | undefined;

  const cancel = () => {
    clearTimeout(timer);
    pending = undefined;
  };
  const flush = () => {
    const args = pending;
    cancel();
    if (args) latest.fn(...args);
  };
  const debounced: DebouncedFunction<A> = Object.assign(
    (...args: A) => {
      clearTimeout(timer);
      pending = args;
      timer = setTimeout(flush, latest.delayMs);
    },
    { cancel, flush },
  );
  const update = (fn: (...args: A) => void, delayMs: number) => {
    latest = { fn, delayMs };
  };
  return { debounced, update };
}

/**
 * Returns a debounced version of `fn`: calling it repeatedly runs `fn` once, with the last
 * arguments, after `delayMs` with no further calls. A delay of 0 still waits for the current
 * task to finish. The latest `fn` is always called, so it does not need to be memoised, and the
 * returned function keeps its identity for the component's lifetime. A pending call keeps the
 * delay it was scheduled with, and is dropped when the component unmounts.
 */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): DebouncedFunction<A> {
  const [{ debounced, update }] = useState(() => createDebounced(fn, delayMs));

  useEffect(() => {
    update(fn, delayMs);
  });

  useEffect(() => debounced.cancel, [debounced]);

  return debounced;
}
