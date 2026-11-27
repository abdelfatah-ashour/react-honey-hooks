import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getOnline(): boolean {
  return navigator.onLine;
}

/** The server can't see the user's connection, so it assumes the common case. */
function getServerOnline(): boolean {
  return true;
}

/**
 * Returns whether the browser has a network connection (`navigator.onLine`), updating on the
 * `online` and `offline` events. It returns `true` during server rendering and hydration.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getOnline, getServerOnline);
}
