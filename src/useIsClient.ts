import { useSyncExternalStore } from "react";

function subscribeToNothing(): () => void {
  return () => undefined;
}

function onClient(): boolean {
  return true;
}

function onServer(): boolean {
  return false;
}

/**
 * Returns `false` during server rendering and on the first render while hydrating, and `true`
 * after that, or from the first render in an app without server rendering. Use it to render
 * browser-only content without a hydration mismatch, and without the extra render an effect
 * would cost when there was no server rendering.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeToNothing, onClient, onServer);
}
