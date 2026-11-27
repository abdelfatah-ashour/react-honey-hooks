import { renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useLongPress } from "./useLongPress";

let element: HTMLButtonElement;

beforeEach(() => {
  vi.useFakeTimers();
  element = document.createElement("button");
  document.body.append(element);
});

afterEach(() => {
  element.remove();
  vi.useRealTimers();
});

function refTo(target: HTMLElement | null): RefObject<HTMLElement | null> {
  return { current: target };
}

function pointer(type: string, init: PointerEventInit = {}, target: EventTarget = element) {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, button: 0, isPrimary: true, ...init }),
  );
}

describe("useLongPress", () => {
  it("calls the handler once the pointer has been held down for delayMs", () => {
    const onLongPress = vi.fn();
    renderHook(() => {
      useLongPress(refTo(element), onLongPress, { delayMs: 500 });
    });

    pointer("pointerdown");
    vi.advanceTimersByTime(499);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onLongPress.mock.calls[0]?.[0]).toBeInstanceOf(PointerEvent);
  });

  it("does nothing when the pointer is released before delayMs", () => {
    const onLongPress = vi.fn();
    renderHook(() => {
      useLongPress(refTo(element), onLongPress, { delayMs: 500 });
    });

    pointer("pointerdown");
    vi.advanceTimersByTime(400);
    pointer("pointerup");
    vi.advanceTimersByTime(1000);

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it.each(["pointerleave", "pointercancel"])("a %s cancels the press", (type) => {
    const onLongPress = vi.fn();
    renderHook(() => {
      useLongPress(refTo(element), onLongPress, { delayMs: 500 });
    });

    pointer("pointerdown");
    pointer(type);
    vi.advanceTimersByTime(1000);

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("moving more than 10 px cancels the press, but a small wobble doesn't", () => {
    const onLongPress = vi.fn();
    renderHook(() => {
      useLongPress(refTo(element), onLongPress, { delayMs: 500 });
    });

    pointer("pointerdown", { clientX: 100, clientY: 100 });
    pointer("pointermove", { clientX: 106, clientY: 108 }); // exactly 10 px away
    vi.advanceTimersByTime(500);
    expect(onLongPress).toHaveBeenCalledTimes(1);

    pointer("pointerup");
    pointer("pointerdown", { clientX: 100, clientY: 100 });
    pointer("pointermove", { clientX: 100, clientY: 111 });
    vi.advanceTimersByTime(1000);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("ignores presses with other mouse buttons", () => {
    const onLongPress = vi.fn();
    renderHook(() => {
      useLongPress(refTo(element), onLongPress, { delayMs: 500 });
    });

    pointer("pointerdown", { button: 2 });
    vi.advanceTimersByTime(1000);

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("ignores a second finger, and keeps the first finger's press", () => {
    const onLongPress = vi.fn();
    renderHook(() => {
      useLongPress(refTo(element), onLongPress, { delayMs: 500 });
    });

    pointer("pointerdown", { pointerType: "touch", pointerId: 1 });
    vi.advanceTimersByTime(300);
    pointer("pointerdown", { pointerType: "touch", pointerId: 2, isPrimary: false });
    vi.advanceTimersByTime(200);

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("ignores a second finger moving or lifting", () => {
    const onLongPress = vi.fn();
    renderHook(() => {
      useLongPress(refTo(element), onLongPress, { delayMs: 500 });
    });

    pointer("pointerdown", { pointerId: 1, clientX: 0, clientY: 0 });
    pointer("pointerdown", { pointerId: 2, isPrimary: false, clientX: 200, clientY: 0 });
    pointer("pointermove", { pointerId: 2, isPrimary: false, clientX: 300, clientY: 0 });
    pointer("pointerup", { pointerId: 2, isPrimary: false });
    vi.advanceTimersByTime(500);

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("cancels the click that follows a long press, but not a short press's click", () => {
    const onClick = vi.fn();
    element.addEventListener("click", onClick);
    renderHook(() => {
      useLongPress(refTo(element), () => undefined, { delayMs: 500 });
    });

    pointer("pointerdown");
    vi.advanceTimersByTime(500);
    pointer("pointerup");
    element.click();
    expect(onClick).not.toHaveBeenCalled();

    pointer("pointerdown");
    pointer("pointerup");
    element.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("lets the next interaction's click through when a long press produced no click", () => {
    const onClick = vi.fn();
    const other = document.createElement("button");
    document.body.append(other);
    other.addEventListener("click", onClick);
    renderHook(() => {
      useLongPress(refTo(element), () => undefined, { delayMs: 500 });
    });

    pointer("pointerdown");
    vi.advanceTimersByTime(500);
    pointer("pointerleave"); // released elsewhere, so no click follows

    pointer("pointerdown", {}, other);
    other.click();

    expect(onClick).toHaveBeenCalledTimes(1);
    other.remove();
  });

  it("calls the handler from the latest render", () => {
    const calls: string[] = [];
    const { rerender } = renderHook(
      ({ label }) => {
        useLongPress(refTo(element), () => {
          calls.push(label);
        });
      },
      { initialProps: { label: "first" } },
    );

    pointer("pointerdown");
    rerender({ label: "second" });
    vi.advanceTimersByTime(500);

    expect(calls).toEqual(["second"]);
  });

  it("does nothing while enabled is false, and disabling cancels a press", () => {
    const onLongPress = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => {
        useLongPress(refTo(element), onLongPress, { enabled });
      },
      { initialProps: { enabled: false } },
    );
    pointer("pointerdown");
    vi.advanceTimersByTime(1000);
    expect(onLongPress).not.toHaveBeenCalled();

    rerender({ enabled: true });
    pointer("pointerdown");
    rerender({ enabled: false });
    vi.advanceTimersByTime(1000);

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "with delayMs of %s, never fires",
    (delayMs) => {
      const onLongPress = vi.fn();
      renderHook(() => {
        useLongPress(refTo(element), onLongPress, { delayMs });
      });

      pointer("pointerdown");
      vi.advanceTimersByTime(60_000);

      expect(onLongPress).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it("leaves no timer behind when it unmounts mid-press", () => {
    const onLongPress = vi.fn();
    const { unmount } = renderHook(() => {
      useLongPress(refTo(element), onLongPress);
    });
    pointer("pointerdown");

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops blocking the next click when it unmounts after a long press", () => {
    const onClick = vi.fn();
    element.addEventListener("click", onClick);
    const { unmount } = renderHook(() => {
      useLongPress(refTo(element), () => undefined);
    });
    pointer("pointerdown");
    vi.advanceTimersByTime(500);

    unmount();
    element.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders on the server without touching the DOM", () => {
    function Probe() {
      useLongPress(refTo(null), () => undefined);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
  });
});
