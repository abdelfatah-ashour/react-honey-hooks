import { useEventListener } from "./useEventListener";

interface Hotkey {
  key: string;
  ctrl: boolean;
  alt: boolean;
  /** `"any"` for symbols such as `?`, which some layouts type with Shift and some without. */
  shift: boolean | "any";
  meta: boolean;
}

/** Read when a key is pressed, never during render, so this is safe on the server. */
function isApple(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isSymbol(key: string): boolean {
  return key.length === 1 && !/[a-z0-9 ]/.test(key);
}

const MODIFIERS = new Set(["ctrl", "alt", "shift", "meta", "mod"]);
const KEY_NAMES: Readonly<Record<string, string>> = { space: " ", plus: "+" };

/** Splits `"mod+shift+k"` into modifiers and key; `null` when it is not a valid hotkey. */
function parse(keys: string): Hotkey | null {
  const lower = keys.toLowerCase();
  let parts: string[];
  let key: string;
  if (lower === "+") {
    parts = [];
    key = "+";
  } else if (lower.endsWith("++")) {
    parts = lower.slice(0, -2).split("+");
    key = "+";
  } else {
    parts = lower.split("+");
    key = parts.pop() ?? "";
  }
  if (parts.length === 1 && parts[0] === "") parts = [];
  if (key === "" || parts.some((part) => !MODIFIERS.has(part))) return null;
  key = KEY_NAMES[key] ?? key;

  const mod = parts.includes("mod");
  const apple = mod && isApple();
  return {
    key,
    ctrl: parts.includes("ctrl") || (mod && !apple),
    alt: parts.includes("alt"),
    shift: parts.includes("shift") || (isSymbol(key) ? "any" : false),
    meta: parts.includes("meta") || apple,
  };
}

function matches(hotkey: Hotkey | null, event: KeyboardEvent): boolean {
  return (
    hotkey !== null &&
    event.key.toLowerCase() === hotkey.key &&
    event.ctrlKey === hotkey.ctrl &&
    event.altKey === hotkey.alt &&
    (hotkey.shift === "any" || event.shiftKey === hotkey.shift) &&
    event.metaKey === hotkey.meta
  );
}

const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

function isTyping(event: KeyboardEvent): boolean {
  return event.target instanceof Element && event.target.closest(EDITABLE) !== null;
}

export interface HotkeyOptions {
  /** Set to `false` to stop listening. Defaults to `true`. */
  enabled?: boolean;
  /** Ignore presses while focus is in a form field or editable content. Defaults to `true`. */
  ignoreInputs?: boolean;
}

/**
 * Calls `handler` when the hotkey in `keys` is pressed anywhere on the page, for example
 * `"Escape"`, `"/"`, `"ctrl+s"` or `"mod+shift+k"`. Modifiers are `ctrl`, `alt`, `shift`,
 * `meta` and `mod` (Cmd on Apple platforms, Ctrl elsewhere) and must match exactly. Letters
 * ignore case, Shift is not checked for symbols such as `?` unless listed, and `space` and
 * `plus` (or a trailing `++`) name those keys. Presses while typing in a form field or
 * editable content are ignored unless `ignoreInputs` is `false`. An invalid hotkey never
 * fires. The latest `handler` is always called, so it does not need to be memoised.
 */
export function useHotkey(
  keys: string,
  handler: (event: KeyboardEvent) => void,
  { enabled = true, ignoreInputs = true }: HotkeyOptions = {},
): void {
  useEventListener(
    "keydown",
    (event) => {
      if (ignoreInputs && isTyping(event)) return;
      if (matches(parse(keys), event)) handler(event);
    },
    { enabled },
  );
}
