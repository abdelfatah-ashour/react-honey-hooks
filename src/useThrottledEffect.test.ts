import { act, renderHook } from "@testing-library/react";
import { createElement, type EffectCallback } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useThrottledEffect } from "./useThrottledEffect";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Renders the hook with `y` as its one dependency; `effect` gets the `y` it ran for. */
function setup(effect: (y: number) => ReturnType<EffectCallback>, ms = 100) {
  return renderHook(
    ({ y }) => {
      useThrottledEffect(() => effect(y), [y], ms);
    },
    { initialProps: { y: 0 } },
  );
}

describe("useThrottledEffect", () => {
  it("skips the mount, runs the first change at once, then once per ms with the latest values", () => {
    const effect = vi.fn();
    const { rerender } = setup(effect);
    expect(effect).not.toHaveBeenCalled();

    rerender({ y: 1 });
    expect(effect.mock.calls).toEqual([[1]]);

    rerender({ y: 2 });
    rerender({ y: 3 });
    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(effect.mock.calls).toEqual([[1]]);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(effect.mock.calls).toEqual([[1], [3]]);

    rerender({ y: 4 });
    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(effect.mock.calls).toEqual([[1], [3]]);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(effect.mock.calls).toEqual([[1], [3], [4]]);
  });

  it("runs the last run's cleanup before the next run and on unmount", () => {
    const log: string[] = [];
    const { rerender, unmount } = setup((y) => {
      log.push(`run ${String(y)}`);
      return () => {
        log.push(`clean ${String(y)}`);
      };
    });

    rerender({ y: 1 });
    rerender({ y: 2 });
    expect(log).toEqual(["run 1"]);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(log).toEqual(["run 1", "clean 1", "run 2"]);

    unmount();
    expect(log).toEqual(["run 1", "clean 1", "run 2", "clean 2"]);
  });

  it("drops a pending run on unmount, leaving no timer behind", () => {
    const effect = vi.fn();
    const { rerender, unmount } = setup(effect);
    rerender({ y: 1 });
    rerender({ y: 2 });

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(effect.mock.calls).toEqual([[1]]);
  });

  it("runs on every change with no delay when ms is 0, negative or NaN", () => {
    for (const ms of [0, -1, Number.NaN]) {
      const effect = vi.fn();
      const { rerender } = setup(effect, ms);

      rerender({ y: 1 });
      rerender({ y: 2 });
      expect(effect.mock.calls).toEqual([[1], [2]]);
      expect(vi.getTimerCount()).toBe(0);
    }
  });

  it("does nothing on the server, where window and document don't exist", () => {
    const effect = vi.fn();
    function Probe() {
      useThrottledEffect(effect, [], 100);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(effect).not.toHaveBeenCalled();
  });
});
