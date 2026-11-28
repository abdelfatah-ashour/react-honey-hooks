import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useRafTimeout } from "./useRafTimeout";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Advances fake time, which also runs animation frames (one every 16 ms). */
function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("useRafTimeout", () => {
  it("calls the callback once, on the first frame at least ms after mounting", () => {
    const callback = vi.fn();
    renderHook(() => {
      useRafTimeout(callback, 100);
    });

    wait(100);
    expect(callback).not.toHaveBeenCalled();
    wait(12);
    expect(callback).toHaveBeenCalledOnce();

    wait(1000);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("cancels while ms is null, and starts the full wait again from now when ms changes", () => {
    const callback = vi.fn();
    const initialProps: { ms: number | null } = { ms: 100 };
    const { rerender } = renderHook(
      ({ ms }) => {
        useRafTimeout(callback, ms);
      },
      { initialProps },
    );

    wait(80);
    rerender({ ms: null });
    wait(500);
    expect(callback).not.toHaveBeenCalled();

    rerender({ ms: 50 });
    wait(40);
    expect(callback).not.toHaveBeenCalled();
    wait(30);
    expect(callback).toHaveBeenCalledOnce();
  });

  it("treats a negative, NaN or infinite ms like null, and 0 as the next frame", () => {
    const never = vi.fn();
    for (const ms of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      renderHook(() => {
        useRafTimeout(never, ms);
      });
    }
    const soon = vi.fn();
    renderHook(() => {
      useRafTimeout(soon, 0);
    });

    wait(16);
    expect(soon).toHaveBeenCalledOnce();
    wait(10_000);
    expect(never).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("calls the callback from the latest render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ callback }) => {
        useRafTimeout(callback, 50);
      },
      { initialProps: { callback: first } },
    );

    rerender({ callback: second });
    wait(64);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("leaves no frame waiting after it unmounts", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => {
      useRafTimeout(callback, 100);
    });

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    wait(200);
    expect(callback).not.toHaveBeenCalled();
  });

  it("renders on the server, where window and document don't exist, without starting", () => {
    const callback = vi.fn();
    function Probe() {
      useRafTimeout(callback, 0);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(callback).not.toHaveBeenCalled();
  });
});
