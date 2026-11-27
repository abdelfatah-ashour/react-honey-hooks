import { useEffect, useState } from "react";

/** Runs at most once every `ms`; see `useThrottledCallback`. */
export interface ThrottledFunction<A extends unknown[]> {
  (...args: A): void;
  /** Drops the pending call, if any, and ends the wait, so the next call starts a new one. */
  readonly cancel: () => void;
  /** Runs the pending call now, if any, and ends the wait. */
  readonly flush: () => void;
}

export interface ThrottleOptions {
  /** Run the call that starts a wait at once. Defaults to `true`. */
  leading?: boolean;
  /** Run the last call made during a wait when it ends. Defaults to `true`. */
  trailing?: boolean;
}

interface Settings<A extends unknown[]> {
  fn: (...args: A) => void;
  ms: number;
  leading: boolean;
  trailing: boolean;
}

function createThrottled<A extends unknown[]>(settings: Settings<A>) {
  let latest = settings;
  let waiting = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: A | undefined;

  const startWait = () => {
    waiting = true;
    // An infinite wait only ends with cancel or flush; setTimeout would treat it as 0.
    if (Number.isFinite(latest.ms)) timer = setTimeout(endWait, latest.ms);
  };
  const run = (args: A) => {
    latest.fn(...args);
    startWait();
  };
  const endWait = () => {
    waiting = false;
    const args = pending;
    pending = undefined;
    if (args) run(args);
  };
  const cancel = () => {
    clearTimeout(timer);
    waiting = false;
    pending = undefined;
  };
  const flush = () => {
    const args = pending;
    cancel();
    if (args) latest.fn(...args);
  };
  // `pending` is the call to run when the wait ends, so it is only kept with `trailing`.
  const throttled: ThrottledFunction<A> = Object.assign(
    (...args: A) => {
      // A delay of 0 or less, or NaN, doesn't throttle.
      if (!(latest.ms > 0)) {
        latest.fn(...args);
        return;
      }
      if (!waiting && latest.leading) {
        run(args);
        return;
      }
      if (latest.trailing) pending = args;
      if (!waiting) startWait();
    },
    { cancel, flush },
  );
  const update = (next: Settings<A>) => {
    latest = next;
  };
  return { throttled, update };
}

/**
 * Returns a throttled version of `fn` that runs at most once every `ms`. By default the first
 * call runs at once and starts a wait; calls during the wait collapse into one call with the
 * last arguments when it ends, which starts a new wait. `leading: false` makes the first call
 * wait too, and `trailing: false` drops calls made during the wait. A delay of 0 or less (or
 * NaN) doesn't throttle; with `Infinity`, later calls wait for `flush` or `cancel`. The latest
 * `fn` and options are always used, so they do not need to be memoised, and the returned
 * function keeps its identity for the component's lifetime. A pending call is dropped when the
 * component unmounts.
 */
export function useThrottledCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
  { leading = true, trailing = true }: ThrottleOptions = {},
): ThrottledFunction<A> {
  const [{ throttled, update }] = useState(() => createThrottled({ fn, ms, leading, trailing }));

  useEffect(() => {
    update({ fn, ms, leading, trailing });
  });

  useEffect(() => throttled.cancel, [throttled]);

  return throttled;
}
