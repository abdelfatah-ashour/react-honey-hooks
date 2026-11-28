import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncStatus = "idle" | "pending" | "success" | "error";

export interface AsyncState<R> {
  readonly status: AsyncStatus;
  /** The result of the last call that succeeded, kept while a newer call is pending. */
  readonly data: R | undefined;
  /** Why the last call failed, until a call succeeds. */
  readonly error: Error | undefined;
}

export interface AsyncResult<A extends unknown[], R> extends AsyncState<R> {
  /** Starts a call, aborting any call in progress. Resolves to its result, or `undefined`. */
  readonly run: (...args: A) => Promise<R | undefined>;
  /** Aborts the call in progress, if any, and goes back to the status before it. */
  readonly cancel: () => void;
}

export interface RetryOptions {
  /** How many times to retry a failed call. Defaults to 3. */
  count?: number;
  /**
   * The wait before the first retry, in milliseconds; each later one waits twice as long.
   * Defaults to 1000.
   */
  delayMs?: number;
  /** Whether to retry after `error`; `attempt` counts retries from 0. Defaults to always. */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface AsyncOptions {
  /** Retry a failed call before reporting it as an error. */
  retry?: RetryOptions;
  /** Run again, with the same arguments, this many milliseconds after each call settles. */
  pollMs?: number;
  /** Keep polling while the tab is hidden, instead of waiting for it to be shown. */
  pollWhenHidden?: boolean;
}

interface State<R> extends AsyncState<R> {
  /** The status to go back to if the pending call is cancelled. */
  settled: AsyncStatus;
}

function toError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown));
}

/** Waits `ms`, or rejects as soon as `signal` aborts. */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        reject(new Error("Aborted"));
      },
      { once: true },
    );
  });
}

/**
 * Runs an async function on demand and tracks it: returns `{ status, data, error, run,
 * cancel }`. `run(...args)` calls `fn` with an `AbortSignal` and the arguments; starting a
 * new call aborts the one in progress, and only the newest call's result counts. `data` keeps
 * the last successful result while a new call is pending. `run` resolves to the result, or to
 * `undefined` when the call failed, was superseded or was cancelled, and never rejects. Errors
 * are wrapped in `Error` if needed, and an aborted call is not an error. `cancel` and unmounting
 * abort the call in progress. The latest `fn` is always called, and `run` and `cancel` keep
 * their identity.
 *
 * With `retry`, a failed call is retried up to `retry.count` times, waiting `retry.delayMs` and
 * then twice as long before each next try, while `status` stays `"pending"`; `shouldRetry` can
 * stop early, and aborting stops the retries. With `pollMs`, each call that settles (succeeding
 * or failing) is followed `pollMs` later by another with the same arguments; while the tab is
 * hidden it waits for it to be shown, unless `pollWhenHidden`. A new `run` restarts the wait,
 * and `cancel` and unmounting stop polling. Without options it neither retries nor polls.
 */
export function useAsync<A extends unknown[], R>(
  fn: (signal: AbortSignal, ...args: A) => Promise<R>,
  options: AsyncOptions = {},
): AsyncResult<A, R> {
  const [state, setState] = useState<State<R>>({
    status: "idle",
    settled: "idle",
    data: undefined,
    error: undefined,
  });
  /** The controller of the call in progress; a call's result only counts while it is this one. */
  const current = useRef<AbortController | null>(null);
  const latest = useRef(fn);
  const latestOptions = useRef(options);

  useEffect(() => {
    latest.current = fn;
    latestOptions.current = options;
  });

  /** Calls `fn`, retrying failures as `retry` says, until it succeeds or gives up. */
  const attempt = useCallback(async (signal: AbortSignal, args: A): Promise<R> => {
    for (let retries = 0; ; retries++) {
      try {
        // Inside the try, so a function that throws instead of rejecting is caught too.
        return await latest.current(signal, ...args);
      } catch (thrown) {
        const { retry } = latestOptions.current;
        if (!retry || signal.aborted) throw thrown;
        const { count = 3, delayMs = 1000, shouldRetry } = retry;
        if (retries >= count || (shouldRetry && !shouldRetry(toError(thrown), retries))) {
          throw thrown;
        }
        await wait(delayMs * 2 ** retries, signal);
      }
    }
  }, []);

  /** Cancels the poll that is waiting (for its timer, or for the tab to be shown), if any. */
  const cancelPoll = useRef<(() => void) | undefined>(undefined);
  const stopPolling = () => {
    cancelPoll.current?.();
    cancelPoll.current = undefined;
  };

  const run = useCallback(
    async function start(...args: A): Promise<R | undefined> {
      stopPolling();
      current.current?.abort();
      const controller = new AbortController();
      current.current = controller;
      setState((previous) => ({ ...previous, status: "pending" }));
      /** Schedules the next poll, if polling, once this call has settled. */
      const pollAgain = () => {
        const { pollMs, pollWhenHidden = false } = latestOptions.current;
        if (pollMs === undefined || !(pollMs > 0 && Number.isFinite(pollMs))) return;
        const id = setTimeout(() => {
          if (pollWhenHidden || !document.hidden) {
            cancelPoll.current = undefined;
            void start(...args);
            return;
          }
          // Hidden: poll as soon as the tab is shown again.
          const onVisible = () => {
            if (document.hidden) return;
            stopPolling();
            void start(...args);
          };
          document.addEventListener("visibilitychange", onVisible);
          cancelPoll.current = () => {
            document.removeEventListener("visibilitychange", onVisible);
          };
        }, pollMs);
        cancelPoll.current = () => {
          clearTimeout(id);
        };
      };
      try {
        const data = await attempt(controller.signal, args);
        if (current.current !== controller) return undefined;
        setState({ status: "success", settled: "success", data, error: undefined });
        pollAgain();
        return data;
      } catch (thrown) {
        if (current.current !== controller) return undefined;
        const error = toError(thrown);
        setState((previous) => ({ ...previous, status: "error", settled: "error", error }));
        pollAgain();
        return undefined;
      } finally {
        if (current.current === controller) current.current = null;
      }
    },
    [attempt],
  );

  const cancel = useCallback(() => {
    stopPolling();
    if (!current.current) return;
    current.current.abort();
    current.current = null;
    setState((previous) => ({ ...previous, status: previous.settled }));
  }, []);

  useEffect(
    () => () => {
      stopPolling();
      current.current?.abort();
      current.current = null;
    },
    [],
  );

  return { status: state.status, data: state.data, error: state.error, run, cancel };
}
