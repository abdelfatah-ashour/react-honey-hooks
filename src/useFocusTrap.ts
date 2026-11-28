import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], area[href], button, input:not([type="hidden"]), select, textarea, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]';

/** The active traps, newest last; only the newest acts, so stacked dialogs don't fight. */
const traps: object[] = [];

/** Whether Tab can reach `element`: enabled, not hidden or inert, and not tabindex=-1. */
function isTabbable(element: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.matches(":disabled")) return false;
  if (element.closest("[hidden], [inert]")) return false;
  // Also skips elements hidden by CSS; missing only in old browsers and jsdom.
  return typeof element.checkVisibility === "function" ? element.checkVisibility() : true;
}

/**
 * The elements inside `container` that Tab stops at, in document order. Like browsers, a radio
 * group is one stop: its checked radio, or else its first.
 */
function tabbables(container: HTMLElement): HTMLElement[] {
  const candidates = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isTabbable);
  return candidates.filter((element) => {
    if (!(element instanceof HTMLInputElement) || element.type !== "radio" || !element.name) {
      return true;
    }
    const group = candidates.filter(
      (other): other is HTMLInputElement =>
        other instanceof HTMLInputElement && other.type === "radio" && other.name === element.name,
    );
    return element === (group.find((radio) => radio.checked) ?? group[0]);
  });
}

export interface FocusTrapOptions {
  /** Return focus to where it was before when the trap stops. Defaults to `true`. */
  restoreFocus?: boolean;
}

/**
 * Keeps keyboard focus inside the element held by `ref` while `active` is true (the default),
 * as a modal dialog should. On activation it focuses the first focusable element inside (or the
 * container itself), unless focus is already inside. Tab and Shift+Tab wrap around at the ends,
 * and focus moving outside, for example by a click, is brought back. Disabled, hidden and inert
 * elements are skipped. When it stops or unmounts, focus returns to where it was before, unless
 * `restoreFocus` is false. With several active traps, only the newest acts.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active = true,
  { restoreFocus = true }: FocusTrapOptions = {},
): void {
  const restore = useRef(restoreFocus);
  useEffect(() => {
    restore.current = restoreFocus;
  });

  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return;
    const previous = document.activeElement;
    let lastInside: HTMLElement | null = null;
    const token = {};
    const isNewest = () => traps[traps.length - 1] === token;
    // With nothing focusable inside, the container itself takes focus.
    const addedTabIndex = !container.hasAttribute("tabindex");
    if (addedTabIndex) container.tabIndex = -1;

    const focusFirst = () => {
      (tabbables(container)[0] ?? container).focus();
    };
    // Every Tab moves focus here rather than in the browser: some browsers' own rules, such as
    // Safari skipping buttons by default, would otherwise move focus out of the page.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !isNewest()) return;
      event.preventDefault();
      const elements = tabbables(container);
      const index = elements.indexOf(document.activeElement as HTMLElement);
      const step = event.shiftKey ? -1 : 1;
      // From outside the list (the container itself), Tab goes to the first, Shift+Tab the last.
      const start = index === -1 ? (event.shiftKey ? 0 : -1) : index;
      const next = elements[(start + step + elements.length) % elements.length];
      (next ?? container).focus();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!isNewest()) return;
      if (event.target instanceof HTMLElement && container.contains(event.target)) {
        lastInside = event.target;
        return;
      }
      if (lastInside?.isConnected && container.contains(lastInside)) lastInside.focus();
      else focusFirst();
    };

    // On the stack before focus moves in, so the trap below ignores that move.
    traps.push(token);
    if (!container.contains(document.activeElement)) focusFirst();
    lastInside = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      traps.splice(traps.indexOf(token), 1);
      if (addedTabIndex) container.removeAttribute("tabindex");
      if (restore.current && previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, [ref, active]);
}
