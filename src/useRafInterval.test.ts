import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useRafInterval } from "./useRafInterval";

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

describe("useRafInterval", () => {
  it("calls the callback on the first frame each time ms has passed since the last call", () => {
    const callback = vi.fn();
    renderHook(() => {
      useRafInterval(callback, 100);
    });

    wait(100);
    expect(callback).toHaveBeenCalledTimes(0);
    wait(12);
    expect(callback).toHaveBeenCalledTimes(1);
    wait(100);
    expect(callback).toHaveBeenCalledTimes(1);
    wait(12);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("pauses while ms is null, and starts counting from zero when it resumes or ms changes", () => {
    const callback = vi.fn();
    const initialProps: { ms: number | null } = { ms: 100 };
    const { rerender } = renderHook(
      ({ ms }) => {
        useRafInterval(callback, ms);
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

  it("treats 0, a negative, NaN or infinite ms like null", () => {
    const callback = vi.fn();
    for (const ms of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      renderHook(() => {
        useRafInterval(callback, ms);
      });
    }

    wait(10_000);
    expect(callback).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("calls the latest callback without restarting on re-render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ callback }) => {
        useRafInterval(callback, 100);
      },
      { initialProps: { callback: first } },
    );

    wait(80);
    rerender({ callback: second });
    wait(32);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("leaves no frame waiting after it unmounts", () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => {
      useRafInterval(callback, 100);
    });

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    wait(500);
    expect(callback).not.toHaveBeenCalled();
  });

  it("renders on the server, where window and document don't exist, without starting", () => {
    const callback = vi.fn();
    function Probe() {
      useRafInterval(callback, 16);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(callback).not.toHaveBeenCalled();
  });
});
