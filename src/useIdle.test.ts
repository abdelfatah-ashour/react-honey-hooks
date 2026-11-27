import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useIdle } from "./useIdle";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Records listeners added to and removed from `target`. A listener is only removed by a call
 * with the same type, function and capture flag, so `active` matches on all three.
 */
function trackListeners(target: EventTarget) {
  const active = new Set<string>();
  const ids = new Map<unknown, number>();
  const keyOf = (
    type: string,
    listener: unknown,
    options: boolean | EventListenerOptions | undefined,
  ) => {
    if (!ids.has(listener)) ids.set(listener, ids.size);
    const capture = typeof options === "boolean" ? options : (options?.capture ?? false);
    return `${type}#${String(ids.get(listener))}#${String(capture)}`;
  };
  const add = target.addEventListener.bind(target);
  const remove = target.removeEventListener.bind(target);
  vi.spyOn(target, "addEventListener").mockImplementation((type, listener, options) => {
    active.add(keyOf(type, listener, options));
    add(type, listener, options);
  });
  vi.spyOn(target, "removeEventListener").mockImplementation((type, listener, options) => {
    active.delete(keyOf(type, listener, options));
    remove(type, listener, options);
  });
  return { active: () => [...active.keys()] };
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useIdle", () => {
  it("is false at first, and true once ms pass with no activity", () => {
    const { result } = renderHook(() => useIdle(1000));
    expect(result.current).toBe(false);

    wait(999);
    expect(result.current).toBe(false);
    wait(1);
    expect(result.current).toBe(true);
  });

  it.each(["pointermove", "pointerdown", "keydown", "wheel", "touchstart"])(
    "a %s sets it back to false and restarts the wait",
    (type) => {
      const { result } = renderHook(() => useIdle(1000));
      wait(1000);
      expect(result.current).toBe(true);

      act(() => {
        document.body.dispatchEvent(new Event(type, { bubbles: true }));
      });
      expect(result.current).toBe(false);

      wait(999);
      expect(result.current).toBe(false);
      wait(1);
      expect(result.current).toBe(true);
    },
  );

  it("activity before going idle pushes the wait back", () => {
    const { result } = renderHook(() => useIdle(1000));

    wait(800);
    act(() => {
      document.body.dispatchEvent(new Event("keydown", { bubbles: true }));
    });
    wait(800);

    expect(result.current).toBe(false);
    wait(200);
    expect(result.current).toBe(true);
  });

  it("scrolling any element counts as activity, though scroll events don't bubble", () => {
    const scroller = document.createElement("div");
    document.body.append(scroller);
    const { result } = renderHook(() => useIdle(1000));
    wait(1000);

    act(() => {
      scroller.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(false);
    scroller.remove();
  });

  it("the tab becoming visible again counts as activity, but becoming hidden doesn't", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get");
    const { result } = renderHook(() => useIdle(1000));
    wait(1000);

    visibility.mockReturnValue("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
    });
    expect(result.current).toBe(true);

    visibility.mockReturnValue("visible");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
    });
    expect(result.current).toBe(false);
  });

  it("restarts the wait from false when ms changes", () => {
    const { result, rerender } = renderHook(({ ms }) => useIdle(ms), {
      initialProps: { ms: 1000 },
    });
    wait(1000);
    expect(result.current).toBe(true);

    rerender({ ms: 5000 });
    expect(result.current).toBe(false);
    wait(4999);
    expect(result.current).toBe(false);
    wait(1);
    expect(result.current).toBe(true);

    rerender({ ms: 0 });
    expect(result.current).toBe(false);
  });

  it.each([0, -100, Number.NaN, Number.POSITIVE_INFINITY])(
    "with ms of %s, never goes idle and schedules nothing",
    (ms) => {
      const { result } = renderHook(() => useIdle(ms));

      expect(vi.getTimerCount()).toBe(0);
      wait(60_000);
      expect(result.current).toBe(false);
    },
  );

  it("leaves no timer or listener behind when it unmounts", () => {
    const windowListeners = trackListeners(window);
    const documentListeners = trackListeners(document);
    const { unmount } = renderHook(() => useIdle(1000));
    expect(windowListeners.active()).not.toEqual([]);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    expect(windowListeners.active()).toEqual([]);
    expect(documentListeners.active()).toEqual([]);
  });

  it("renders on the server as false", () => {
    function Probe() {
      return String(useIdle(1000));
    }

    expect(renderOnServer(createElement(Probe))).toBe("false");
  });
});
