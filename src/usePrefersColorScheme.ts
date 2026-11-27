import { useMediaQuery } from "./useMediaQuery";

/** The colour scheme `usePrefersColorScheme` reports. */
export type ColorScheme = "light" | "dark";

/**
 * Returns the colour scheme the user's system asks for, `"dark"` or `"light"`, updating when
 * they change it. Anything other than dark (including no preference) counts as `"light"`.
 * Returns `"light"` during server rendering and hydration.
 */
export function usePrefersColorScheme(): ColorScheme {
  return useMediaQuery("(prefers-color-scheme: dark)") ? "dark" : "light";
}
