import { useEffect } from "react";

/** How many mounted hooks hold the lock, and the page's own styles to put back after. */
let locks = 0;
let saved = { overflow: "", paddingRight: "" };

function lock(): void {
  locks++;
  if (locks > 1) return;
  const root = document.documentElement;
  // Measured before hiding it: the scrollbar's width, which the content would shift into.
  const scrollbar = window.innerWidth - root.clientWidth;
  saved = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
  if (scrollbar > 0) {
    const padding = Number.parseFloat(getComputedStyle(root).paddingRight) || 0;
    root.style.paddingRight = `${String(padding + scrollbar)}px`;
  }
  root.style.overflow = "hidden";
}

function unlock(): void {
  locks--;
  if (locks > 0) return;
  const root = document.documentElement;
  root.style.overflow = saved.overflow;
  root.style.paddingRight = saved.paddingRight;
}

/**
 * Stops the page from scrolling while `locked` is true (the default), for example while a
 * modal is open: it hides the overflow of `<html>`, and pads it by the scrollbar's width so the
 * content doesn't shift sideways. Locks from several components are counted, and the page's
 * own inline styles are restored when the last one is released or unmounts. Scrolling inside
 * an element with its own overflow, such as the modal, still works.
 */
export function useScrollLock(locked = true): void {
  useEffect(() => {
    if (!locked) return;
    lock();
    return unlock;
  }, [locked]);
}
