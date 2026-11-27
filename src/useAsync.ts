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

interface State<R> extends AsyncState<R> {
  /** The status to go back to if the pending call is cancelled. */
  settled: AsyncStatus;
}

function toError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown));
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
 */
export function useAsync<A extends unknown[], R>(
  fn: (signal: AbortSignal, ...args: A) => Promise<R>,
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

  useEffect(() => {
    latest.current = fn;
  });

  const run = useCallback(async (...args: A): Promise<R | undefined> => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    setState((previous) => ({ ...previous, status: "pending" }));
    try {
      // Inside the try, so a function that throws instead of rejecting is caught too.
      const data = await latest.current(controller.signal, ...args);
      if (current.current !== controller) return undefined;
      setState({ status: "success", settled: "success", data, error: undefined });
      return data;
    } catch (thrown) {
      if (current.current !== controller) return undefined;
      const error = toError(thrown);
      setState((previous) => ({ ...previous, status: "error", settled: "error", error }));
      return undefined;
    } finally {
      if (current.current === controller) current.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (!current.current) return;
    current.current.abort();
    current.current = null;
    setState((previous) => ({ ...previous, status: previous.settled }));
  }, []);

  useEffect(
    () => () => {
      current.current?.abort();
      current.current = null;
    },
    [],
  );

  return { status: state.status, data: state.data, error: state.error, run, cancel };
}
