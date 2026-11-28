import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useDeepCompareEffect } from "./useDeepCompareEffect";

/** Renders the hook with `deps` as props and returns how often the effect ran. */
function track(initial: unknown[]) {
  const effect = vi.fn();
  const hook = renderHook(
    ({ deps }) => {
      useDeepCompareEffect(effect, deps);
    },
    { initialProps: { deps: initial } },
  );
  return {
    effect,
    rerender: (deps: unknown[]) => {
      hook.rerender({ deps });
    },
    unmount: hook.unmount,
  };
}

describe("useDeepCompareEffect", () => {
  it("runs on mount, skips new but equal objects, and runs when a value inside changes", () => {
    const { effect, rerender } = track([{ page: 1, tags: ["a"] }]);
    expect(effect).toHaveBeenCalledTimes(1);

    rerender([{ page: 1, tags: ["a"] }]);
    expect(effect).toHaveBeenCalledTimes(1);

    rerender([{ page: 1, tags: ["a", "b"] }]);
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it("compares dates, maps, sets and regular expressions by what they hold", () => {
    const deps = () => [
      new Date(2026, 0, 1),
      new Map([["a", { n: 1 }]]),
      new Set(["x", "y"]),
      /honey/gi,
      Number.NaN,
    ];
    const { effect, rerender } = track(deps());

    rerender(deps());
    expect(effect).toHaveBeenCalledTimes(1);

    for (const changed of [
      [new Date(2026, 0, 2), ...deps().slice(1)],
      [deps()[0], new Map([["a", { n: 2 }]]), ...deps().slice(2)],
      [...deps().slice(0, 2), new Set(["x", "z"]), ...deps().slice(3)],
      [...deps().slice(0, 3), /honey/g, Number.NaN],
    ]) {
      const before = effect.mock.calls.length;
      rerender(changed);
      expect(effect).toHaveBeenCalledTimes(before + 1);
      rerender(deps());
    }
  });

  it("compares other objects, such as class instances, by identity", () => {
    class Point {
      constructor(readonly x: number) {}
    }
    const point = new Point(1);
    const { effect, rerender } = track([point]);

    rerender([point]);
    expect(effect).toHaveBeenCalledTimes(1);
    rerender([new Point(1)]);
    expect(effect).toHaveBeenCalledTimes(2);
  });

  it("tells apart arrays and objects, extra keys, and dependency lists of different lengths", () => {
    const { effect, rerender } = track([[1, 2]]);

    rerender([{ 0: 1, 1: 2 }]);
    rerender([{ 0: 1, 1: 2, 2: undefined }]);
    rerender([{ 0: 1, 1: 2, 2: undefined }, "extra"]);
    expect(effect).toHaveBeenCalledTimes(4);
  });

  it("cleans up before each re-run and on unmount, and not when deps are only equal", () => {
    const log: string[] = [];
    const { rerender, unmount } = renderHook(
      ({ filters }) => {
        useDeepCompareEffect(() => {
          log.push(`run ${filters.q}`);
          return () => {
            log.push(`clean ${filters.q}`);
          };
        }, [filters]);
      },
      { initialProps: { filters: { q: "a" } } },
    );

    rerender({ filters: { q: "a" } });
    rerender({ filters: { q: "b" } });
    unmount();
    expect(log).toEqual(["run a", "clean a", "run b", "clean b"]);
  });

  it("does nothing on the server, where window and document don't exist", () => {
    const effect = vi.fn();
    function Probe() {
      useDeepCompareEffect(effect, [{ a: 1 }]);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(effect).not.toHaveBeenCalled();
  });
});
