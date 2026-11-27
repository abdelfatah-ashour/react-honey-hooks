import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
  };
}

function getVisible(): boolean {
  return document.visibilityState === "visible";
}

/** A page being rendered is about to be shown, so the server assumes it is visible. */
function getServerVisible(): boolean {
  return true;
}

/**
 * Returns whether the page is visible (`document.visibilityState === "visible"`), updating
 * when the user switches tabs, minimises the window or locks the screen. It returns `true`
 * during server rendering and hydration.
 */
export function usePageVisibility(): boolean {
  return useSyncExternalStore(subscribe, getVisible, getServerVisible);
}
