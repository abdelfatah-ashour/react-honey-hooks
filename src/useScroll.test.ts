import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useScroll } from "./useScroll";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** A scrolled element, as a ref; `scroll` moves it and fires a scroll event. */
function scrollable(left = 0, top = 0) {
  const element = document.createElement("div");
  element.scrollLeft = left;
  element.scrollTop = top;
  const ref: RefObject<HTMLDivElement | null> = { current: element };
  const scroll = (x: number, y: number) => {
    element.scrollLeft = x;
    element.scrollTop = y;
    element.dispatchEvent(new Event("scroll"));
  };
  return { element, ref, scroll };
}

/** Runs the next animation frame. */
function nextFrame() {
  act(() => {
    vi.advanceTimersByTime(16);
  });
}

describe("useScroll", () => {
  it("reads the element's scroll offset, then follows it as it scrolls, once per frame", () => {
    const { ref, scroll } = scrollable(5, 10);
    const { result } = renderHook(() => useScroll(ref));
    expect(result.current).toEqual({ x: 5, y: 10 });

    act(() => {
      scroll(20, 30);
      scroll(25, 40);
    });
    expect(result.current).toEqual({ x: 5, y: 10 });
    nextFrame();
    expect(result.current).toEqual({ x: 25, y: 40 });
  });

  it("follows the ref to a new element after a render, and stops listening to the old one", () => {
    const first = scrollable(1, 1);
    const second = scrollable(2, 2);
    const ref: RefObject<HTMLDivElement | null> = { current: first.element };
    const { result, rerender } = renderHook(() => useScroll(ref));

    ref.current = second.element;
    rerender();
    expect(result.current).toEqual({ x: 2, y: 2 });

    act(() => {
      first.scroll(50, 50);
    });
    nextFrame();
    expect(result.current).toEqual({ x: 2, y: 2 });
    act(() => {
      second.scroll(3, 4);
    });
    nextFrame();
    expect(result.current).toEqual({ x: 3, y: 4 });
  });

  it("keeps the same object while the position is unchanged, and the last one while there's no element", () => {
    const { ref, scroll } = scrollable(5, 5);
    const { result, rerender } = renderHook(() => useScroll(ref));
    const first = result.current;

    act(() => {
      scroll(5, 5);
    });
    nextFrame();
    expect(result.current).toBe(first);

    ref.current = null;
    rerender();
    expect(result.current).toBe(first);
  });

  it("is 0, 0 while the ref is empty, and leaves no listener or frame behind on unmount", () => {
    const empty: RefObject<HTMLDivElement | null> = { current: null };
    expect(renderHook(() => useScroll(empty)).result.current).toEqual({ x: 0, y: 0 });

    const { element, ref, scroll } = scrollable();
    const removed = vi.spyOn(element, "removeEventListener");
    const { unmount } = renderHook(() => useScroll(ref));
    act(() => {
      scroll(1, 1);
    });

    unmount();
    expect(removed.mock.calls.map(([type]) => type)).toContain("scroll");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("is 0, 0 on the server, where window and document don't exist", () => {
    function Probe() {
      const { x, y } = useScroll({ current: null });
      return `${String(x)},${String(y)}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("0,0");
  });
});
