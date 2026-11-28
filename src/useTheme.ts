import { useState } from "react";
import { useLatest } from "./useLatest";
import { useLocalStorage } from "./useLocalStorage";
import { type ColorScheme, usePrefersColorScheme } from "./usePrefersColorScheme";

/** The user's choice: a fixed color scheme, or the system's. */
export type ThemeMode = ColorScheme | "system";

export interface ThemeOptions {
  /** The `localStorage` key the mode is kept under. Defaults to `"theme"`. */
  storageKey?: string;
}

export interface Theme {
  /** The color scheme to show: the chosen one, or the system's in `"system"` mode. */
  readonly theme: ColorScheme;
  /** What the user chose. */
  readonly mode: ThemeMode;
  /** Changes the mode, and remembers it. */
  readonly setMode: (mode: ThemeMode) => void;
}

const MODES: readonly unknown[] = ["light", "dark", "system"];

function isMode(value: unknown): value is ThemeMode {
  return MODES.includes(value);
}

/**
 * A light/dark theme switch that can follow the system. Returns `{ theme, mode, setMode }`:
 * `mode` is what the user chose (`"light"`, `"dark"` or `"system"`, the default), and `theme` is
 * the color scheme to show, following the system's `prefers-color-scheme` in `"system"` mode.
 * The mode is kept in `localStorage` under `storageKey`, so it survives reloads and syncs across
 * tabs; anything stored there that isn't a mode counts as `"system"`. It doesn't touch the page:
 * apply `theme` yourself, such as with a class on `<html>`. On the server and while hydrating it
 * is `{ mode: "system", theme: "light" }`. `setMode` never changes, and writes under the
 * latest `storageKey`.
 */
export function useTheme({ storageKey = "theme" }: ThemeOptions = {}): Theme {
  const [stored, setStored] = useLocalStorage<unknown>(storageKey, "system");
  const system = usePrefersColorScheme();
  // `setStored` changes with `storageKey`, so `setMode` calls the latest one.
  const latestSetStored = useLatest(setStored);
  const [setMode] = useState(() => (next: ThemeMode) => {
    latestSetStored.current(next);
  });
  const mode = isMode(stored) ? stored : "system";
  return { theme: mode === "system" ? system : mode, mode, setMode };
}
