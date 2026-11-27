import { useEventListener } from "./useEventListener";

/**
 * While `enabled` is true (the default), asks the browser to warn before the page is closed,
 * reloaded or navigated away from, for example while a form has unsaved changes. Browsers show
 * their own message; a custom one is no longer supported. It does nothing during server
 * rendering, and stops when the component unmounts.
 */
export function useBeforeUnload(enabled = true): void {
  useEventListener(
    "beforeunload",
    (event) => {
      event.preventDefault();
    },
    { enabled },
  );
}
