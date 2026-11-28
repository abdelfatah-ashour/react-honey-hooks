import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Keeps Errors and DOMExceptions (not Errors in every environment) as they are. */
function toError(thrown: unknown): Error {
  if (thrown instanceof Error || thrown instanceof DOMException) return thrown;
  return new Error(String(thrown));
}

export interface WakeLock {
  /** Whether the screen is being kept on now. */
  readonly active: boolean;
  /** Whether the browser has the Wake Lock API. */
  readonly supported: boolean;
  /** Why the last request failed, such as a `NotAllowedError`; cleared by the next success. */
  readonly error: Error | null;
  /** Asks to keep the screen on; resolves whether it did. */
  readonly request: () => Promise<boolean>;
  /** Lets the screen sleep again. */
  readonly release: () => Promise<void>;
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

function isSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

/** Assume support on the server, so it renders like a supporting browser's first render. */
function isSupportedOnServer(): boolean {
  return true;
}

/**
 * Keeps the screen from dimming or locking, using the Screen Wake Lock API: returns `{ active,
 * supported, error, request, release }`. Nothing happens until `request()`, which resolves
 * whether the lock was granted; call it from a user action, as some browsers refuse it
 * otherwise. A refusal is reported in `error` and not retried. Browsers
 * release the lock when the tab is hidden, so it is taken again when the tab is visible, until
 * `release()` is called. It is released when the component unmounts.
 */
export function useWakeLock(): WakeLock {
  const supported = useSyncExternalStore(subscribeToNothing, isSupported, isSupportedOnServer);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sentinel = useRef<WakeLockSentinel | null>(null);
  /** Whether the app wants the lock: true from request until release or a refusal. */
  const wanted = useRef(false);
  const mounted = useRef(true);

  const acquire = useCallback(async (): Promise<boolean> => {
    if (sentinel.current && !sentinel.current.released) return true;
    if (!isSupported()) return false;
    try {
      const lock = await navigator.wakeLock.request("screen");
      if (!mounted.current) {
        // Granted after unmounting: nothing will release it later, so release it now.
        await lock.release();
        return false;
      }
      sentinel.current = lock;
      lock.addEventListener("release", () => {
        setActive(false);
      });
      setActive(true);
      setError(null);
      return true;
    } catch (thrown) {
      wanted.current = false;
      setError(toError(thrown));
      return false;
    }
  }, []);

  const request = useCallback((): Promise<boolean> => {
    wanted.current = true;
    return acquire();
  }, [acquire]);

  const release = useCallback(async (): Promise<void> => {
    wanted.current = false;
    await sentinel.current?.release();
  }, []);

  // The browser releases the lock when the tab is hidden; take it again when it is visible.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && wanted.current) void acquire();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [acquire]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      wanted.current = false;
      void sentinel.current?.release();
    };
  }, []);

  return { active, supported, error, request, release };
}
