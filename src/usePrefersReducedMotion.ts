import { useMediaQuery } from "./useMediaQuery";

/**
 * Returns whether the user has asked the system to reduce motion, updating when they change
 * the setting. Returns `false` during server rendering and hydration.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
