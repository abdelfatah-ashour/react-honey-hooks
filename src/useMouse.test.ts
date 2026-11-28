import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useMouse } from "./useMouse";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Moves the mouse to `clientX, clientY` and runs the next animation frame. */
function moveTo(clientX: number, clientY: number, frame = true) {
  act(() => {
    window.dispatchEvent(
      new MouseEvent("mousemove", {
        clientX,
        clientY,
        screenX: clientX + 100,
        screenY: clientY + 200,
      }),
    );
    if (frame) vi.advanceTimersByTime(16);
  });
}

describe("useMouse", () => {
  it("is null until the mouse first moves, then follows it once per frame", () => {
    const { result } = renderHook(() => useMouse());
    expect(result.current).toBeNull();

    moveTo(10, 20, false);
    moveTo(30, 40);
    expect(result.current).toEqual({
      clientX: 30,
      clientY: 40,
      pageX: 30,
      pageY: 40,
      screenX: 130,
      screenY: 240,
      element: null,
    });
  });

  it("with a ref, also gives the position within the element and the element's size", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 50, 200, 80));
    const ref: RefObject<HTMLDivElement | null> = { current: element };
    const { result } = renderHook(() => useMouse(ref));

    moveTo(150, 70);
    expect(result.current?.element).toEqual({ x: 50, y: 20, width: 200, height: 80 });

    moveTo(10, 10);
    expect(result.current?.element).toEqual({ x: -90, y: -40, width: 200, height: 80 });

    ref.current = null;
    moveTo(11, 11);
    expect(result.current?.element).toBeNull();
  });

  it("adds the page's scroll to the page position", () => {
    Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
    try {
      const { result } = renderHook(() => useMouse());
      moveTo(10, 20);
      expect(result.current).toMatchObject({ pageX: 10, pageY: 520 });
    } finally {
      Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    }
  });

  it("stops listening and drops a pending frame on unmount", () => {
    const removed = vi.spyOn(window, "removeEventListener");
    const { result, unmount } = renderHook(() => useMouse());
    moveTo(1, 1, false);

    unmount();
    expect(removed.mock.calls.map(([type]) => type)).toContain("mousemove");
    expect(vi.getTimerCount()).toBe(0);
    expect(result.current).toBeNull();
  });

  it("is null on the server, where window and document don't exist", () => {
    function Probe() {
      return useMouse() === null ? "null" : "moved";
    }

    expect(renderOnServer(createElement(Probe))).toBe("null");
  });
});
