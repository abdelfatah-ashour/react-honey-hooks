import { act, renderHook } from "@testing-library/react";
import { createElement, type EffectCallback } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useDebouncedEffect } from "./useDebouncedEffect";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Renders the hook with `query` as its one dependency; `effect` gets the query it ran for. */
function setup(effect: (query: string) => ReturnType<EffectCallback>, ms = 300) {
  return renderHook(
    ({ query }) => {
      useDebouncedEffect(() => effect(query), [query], ms);
    },
    { initialProps: { query: "" } },
  );
}

describe("useDebouncedEffect", () => {
  it("doesn't run on mount, and runs once deps stop changing for ms, with the latest values", () => {
    const effect = vi.fn();
    const { rerender } = setup(effect);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(effect).not.toHaveBeenCalled();

    rerender({ query: "h" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ query: "ho" });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(effect).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(effect.mock.calls).toEqual([["ho"]]);
  });

  it("runs the last run's cleanup before the next run and on unmount, not when a change is pending", () => {
    const log: string[] = [];
    const { rerender, unmount } = setup((query) => {
      log.push(`run ${query}`);
      return () => {
        log.push(`clean ${query}`);
      };
    });

    rerender({ query: "a" });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    rerender({ query: "b" });
    expect(log).toEqual(["run a"]);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(log).toEqual(["run a", "clean a", "run b"]);

    unmount();
    expect(log).toEqual(["run a", "clean a", "run b", "clean b"]);
  });

  it("drops a pending run on unmount, leaving no timer behind", () => {
    const effect = vi.fn();
    const { rerender, unmount } = setup(effect);
    rerender({ query: "a" });

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(effect).not.toHaveBeenCalled();
  });

  it("runs on every change with no delay when ms is 0, negative or NaN", () => {
    for (const ms of [0, -1, Number.NaN]) {
      const effect = vi.fn();
      const { rerender } = setup(effect, ms);

      rerender({ query: "a" });
      rerender({ query: "b" });
      expect(effect.mock.calls).toEqual([["a"], ["b"]]);
    }
  });

  it("does nothing on the server, where window and document don't exist", () => {
    const effect = vi.fn();
    function Probe() {
      useDebouncedEffect(effect, [], 100);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(effect).not.toHaveBeenCalled();
  });
});
