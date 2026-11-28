import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderOnServer } from "./testing/renderOnServer";
import { useWindowScroll } from "./useWindowScroll";

/** jsdom doesn't scroll: set the position and fire `scroll` like a browser would. */
function scrollTo(x: number, y: number) {
  Object.defineProperty(window, "scrollX", { value: x, configurable: true });
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

function nextFrame() {
  act(() => {
    vi.advanceTimersToNextFrame();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  scrollTo(0, 0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useWindowScroll", () => {
  it("returns the scroll position, updated on the next frame after scrolling", () => {
    const { result } = renderHook(() => useWindowScroll());
    expect(result.current).toEqual({ x: 0, y: 0 });

    act(() => {
      scrollTo(0, 450);
    });
    expect(result.current).toEqual({ x: 0, y: 0 });

    nextFrame();
    expect(result.current).toEqual({ x: 0, y: 450 });
  });

  it("updates once per frame, however many scroll events arrive", () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useWindowScroll();
    });
    const rendersBefore = renders;

    // Each in its own act, as real scroll events arrive as separate tasks.
    for (let y = 10; y <= 100; y += 10) {
      act(() => {
        scrollTo(0, y);
      });
    }
    nextFrame();

    expect(result.current).toEqual({ x: 0, y: 100 });
    expect(renders).toBe(rendersBefore + 1);
  });

  it("keeps the same object while the position is unchanged", () => {
    const { result, rerender } = renderHook(() => useWindowScroll());
    const first = result.current;

    rerender();
    act(() => {
      scrollTo(0, 0);
    });
    nextFrame();

    expect(result.current).toBe(first);
  });

  it("cancels a pending frame and stops listening when it unmounts", () => {
    const { unmount } = renderHook(() => useWindowScroll());
    act(() => {
      scrollTo(0, 300);
    });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("renders on the server as 0, 0", () => {
    function Probe() {
      const { x, y } = useWindowScroll();
      return `${String(x)},${String(y)}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("0,0");
  });

  it("hydrates at 0, 0 to match the server, then shows the real position", async () => {
    scrollTo(0, 800);
    const container = document.createElement("div");
    container.innerHTML = "0,0";
    const errors = vi.spyOn(console, "error");
    const rendered: string[] = [];
    function Probe() {
      const { x, y } = useWindowScroll();
      const text = `${String(x)},${String(y)}`;
      rendered.push(text);
      return text;
    }

    const root = await act(() => hydrateRoot(container, createElement(Probe)));

    expect(rendered[0]).toBe("0,0");
    expect(container.textContent).toBe("0,800");
    expect(errors).not.toHaveBeenCalled();
    act(() => {
      root.unmount();
    });
  });
});
