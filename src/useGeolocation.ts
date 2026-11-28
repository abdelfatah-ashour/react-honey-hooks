import { useEffect, useState, useSyncExternalStore } from "react";

export type GeolocationStatus = "idle" | "pending" | "success" | "error" | "unsupported";

export interface GeolocationState {
  readonly status: GeolocationStatus;
  /** The last position the browser gave, kept after a later error or when disabled. */
  readonly position: GeolocationPosition | null;
  readonly error: GeolocationPositionError | null;
}

export interface GeolocationOptions extends PositionOptions {
  /** Set to `false` to not ask yet, for example until the user clicks. Defaults to `true`. */
  enabled?: boolean;
  /** Keep following the position as it changes. Defaults to `false`: ask once. */
  watch?: boolean;
}

interface Answer {
  /** The request this answers; a newer request shows as pending until it is answered. */
  request: string;
  status: "success" | "error";
  position: GeolocationPosition | null;
  error: GeolocationPositionError | null;
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

function isSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/** Assume support on the server, so it renders like a supporting browser's first render. */
function isSupportedOnServer(): boolean {
  return true;
}

/**
 * Gets the user's position from the Geolocation API: returns `{ status, position, error }`.
 * It asks once on mount, which may prompt the user; set `enabled: false` to wait, for example
 * until a click. With `watch`, it follows the position as it changes. `status` is `"pending"`
 * while waiting for an answer (including after the options change), `"idle"` while disabled
 * with no position yet, and `"unsupported"` without the API. The last position is kept after a
 * later error and when disabled. Watching stops when disabled or unmounted. During server
 * rendering it is `"pending"`, or `"idle"` when disabled.
 */
export function useGeolocation({
  enabled = true,
  watch = false,
  enableHighAccuracy,
  timeout,
  maximumAge,
}: GeolocationOptions = {}): GeolocationState {
  const supported = useSyncExternalStore(subscribeToNothing, isSupported, isSupportedOnServer);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const request = enabled ? JSON.stringify([watch, enableHighAccuracy, timeout, maximumAge]) : null;

  useEffect(() => {
    if (request === null || !supported) return;
    let active = true;
    const options: PositionOptions = {};
    if (enableHighAccuracy !== undefined) options.enableHighAccuracy = enableHighAccuracy;
    if (timeout !== undefined) options.timeout = timeout;
    if (maximumAge !== undefined) options.maximumAge = maximumAge;
    const onPosition = (position: GeolocationPosition) => {
      if (active) setAnswer({ request, status: "success", position, error: null });
    };
    const onError = (error: GeolocationPositionError) => {
      if (!active) return;
      setAnswer((previous) => ({
        request,
        status: "error",
        position: previous?.position ?? null,
        error,
      }));
    };

    if (!watch) {
      navigator.geolocation.getCurrentPosition(onPosition, onError, options);
      return () => {
        active = false;
      };
    }
    const id = navigator.geolocation.watchPosition(onPosition, onError, options);
    return () => {
      active = false;
      navigator.geolocation.clearWatch(id);
    };
  }, [request, supported, watch, enableHighAccuracy, timeout, maximumAge]);

  const position = answer?.position ?? null;
  const error = answer?.error ?? null;
  if (!supported) return { status: "unsupported", position, error };
  if (request === null) return { status: position ? "success" : "idle", position, error };
  if (answer?.request !== request) return { status: "pending", position, error };
  return { status: answer.status, position, error };
}
