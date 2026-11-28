import { useCallback, useSyncExternalStore, type RefObject } from "react";

function subscribe(onChange: () => void): () => void {
  document.addEventListener("fullscreenchange", onChange);
  return () => {
    document.removeEventListener("fullscreenchange", onChange);
  };
}

export interface Fullscreen {
  /** Whether this element is the one shown fullscreen. */
  readonly isFullscreen: boolean;
  /** Whether the browser can show elements fullscreen; false on iPhone Safari, for example. */
  readonly supported: boolean;
  /** Shows the element fullscreen; resolves whether it worked. */
  readonly enter: () => Promise<boolean>;
  /** Leaves fullscreen if this element is the one shown; resolves whether it did. */
  readonly exit: () => Promise<boolean>;
  readonly toggle: () => Promise<boolean>;
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

/** False without the API, and where elements can't go fullscreen, such as iPhone Safari. */
function isSupported(): boolean {
  return (
    typeof document !== "undefined" && "fullscreenEnabled" in document && document.fullscreenEnabled
  );
}

/** Assume support on the server, so it renders like a supporting browser's first render. */
function isSupportedOnServer(): boolean {
  return true;
}

/**
 * Shows the element held by `ref` fullscreen with the Fullscreen API: returns `{ isFullscreen,
 * supported, enter, exit, toggle }`. `isFullscreen` is true only while this element is the
 * fullscreen one, and follows the user leaving with Escape. `enter` must be called from a user
 * action, as browsers require, and resolves whether it worked, never rejecting. `exit` only
 * leaves fullscreen if this element is the one shown. `supported` is false without the API and
 * where elements can't go fullscreen, such as iPhone Safari. During server rendering
 * `isFullscreen` is false.
 */
export function useFullscreen(ref: RefObject<Element | null>): Fullscreen {
  const supported = useSyncExternalStore(subscribeToNothing, isSupported, isSupportedOnServer);
  const isFullscreen = useSyncExternalStore(
    subscribe,
    () => ref.current !== null && document.fullscreenElement === ref.current,
    () => false,
  );

  const enter = useCallback(async (): Promise<boolean> => {
    const element = ref.current;
    if (!element || !isSupported()) return false;
    try {
      await element.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }, [ref]);

  // Only exits when this element is the fullscreen one, leaving another component's alone.
  const exit = useCallback(async (): Promise<boolean> => {
    if (ref.current === null || document.fullscreenElement !== ref.current) return false;
    try {
      await document.exitFullscreen();
      return true;
    } catch {
      return false;
    }
  }, [ref]);

  const toggle = useCallback(
    (): Promise<boolean> =>
      ref.current !== null && document.fullscreenElement === ref.current ? exit() : enter(),
    [ref, enter, exit],
  );

  return { isFullscreen, supported, enter, exit, toggle };
}
