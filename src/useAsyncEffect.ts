import { type DependencyList, useEffect } from "react";

/** Whether `error` comes from cancelling the run, which is expected rather than a failure. */
function isAbort(error: unknown, signal: AbortSignal): boolean {
  return (
    (signal.aborted && error === signal.reason) ||
    (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError")
  );
}

/**
 * Reports `error` like an uncaught exception: to the console and the window's `error` event,
 * where error monitoring picks it up, without stopping other code.
 */
function report(error: unknown): void {
  if (typeof reportError === "function") reportError(error);
  else
    setTimeout(() => {
      throw error;
    });
}

/**
 * `useEffect` for async work. `effect` receives an `AbortSignal` that is aborted when the
 * dependencies change and when the component unmounts, so it can cancel `fetch` calls and skip
 * stale updates (check `signal.aborted` after each `await`). If `effect` fails, the error is
 * reported like an uncaught exception, except for an `AbortError` or the signal's own abort
 * reason, which are expected after cancelling. With no `deps`, it runs after every render, as
 * `useEffect` does.
 */
export function useAsyncEffect(
  effect: (signal: AbortSignal) => Promise<unknown>,
  deps?: DependencyList,
): void {
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    // Run inside a promise, so an effect that throws before returning one is reported the same.
    new Promise((resolve) => {
      resolve(effect(signal));
    }).catch((error: unknown) => {
      if (!isAbort(error, signal)) report(error);
    });
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller's deps, as with useEffect.
  }, deps);
}
