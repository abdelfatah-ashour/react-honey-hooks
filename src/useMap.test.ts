import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useMap } from "./useMap";

describe("useMap", () => {
  it("starts from the initial entries, and set adds or replaces an entry", () => {
    const { result } = renderHook(() => useMap([["a", 1]]));
    expect([...result.current[0]]).toEqual([["a", 1]]);

    act(() => {
      result.current[1].set("b", 2);
    });
    act(() => {
      result.current[1].set("a", 10);
    });
    expect([...result.current[0]]).toEqual([
      ["a", 10],
      ["b", 2],
    ]);
  });

  it("removes one entry, replaces all entries, clears, and resets to the initial entries", () => {
    const { result } = renderHook(() =>
      useMap([
        ["a", 1],
        ["b", 2],
      ]),
    );

    act(() => {
      result.current[1].remove("a");
    });
    expect([...result.current[0]]).toEqual([["b", 2]]);

    act(() => {
      result.current[1].setAll([["c", 3]]);
    });
    expect([...result.current[0]]).toEqual([["c", 3]]);

    act(() => {
      result.current[1].clear();
    });
    expect(result.current[0].size).toBe(0);

    act(() => {
      result.current[1].reset();
    });
    expect([...result.current[0]]).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("gives a new map on every change, and keeps the same map when nothing changes", () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useMap([["a", 1]]);
    });
    const first = result.current[0];
    const rendersBefore = renders;

    act(() => {
      result.current[1].set("a", 1);
      result.current[1].remove("missing");
    });
    expect(result.current[0]).toBe(first);
    expect(renders).toBe(rendersBefore);

    act(() => {
      result.current[1].set("a", 2);
    });
    expect(result.current[0]).not.toBe(first);
    expect(first.get("a")).toBe(1);

    const changed = result.current[0];
    act(() => {
      result.current[1].clear();
    });
    act(() => {
      result.current[1].clear();
    });
    expect(result.current[0]).not.toBe(changed);
    const cleared = result.current[0];
    act(() => {
      result.current[1].clear();
    });
    expect(result.current[0]).toBe(cleared);
  });

  it("treats NaN as one key and uses Object.is to decide whether a value changed", () => {
    const { result } = renderHook(() => useMap<number, number>());

    act(() => {
      result.current[1].set(Number.NaN, Number.NaN);
    });
    const withNaN = result.current[0];
    act(() => {
      result.current[1].set(Number.NaN, Number.NaN);
    });
    expect(result.current[0]).toBe(withNaN);
    expect(result.current[0].size).toBe(1);
  });

  it("resets to the first render's entries, even when given new entries or a one-shot iterator", () => {
    function* entries(): Generator<[string, number]> {
      yield ["a", 1];
    }
    const { result, rerender } = renderHook(({ initial }) => useMap(initial), {
      initialProps: { initial: entries() as Iterable<readonly [string, number]> },
    });

    rerender({ initial: [["z", 26]] });
    expect([...result.current[0]]).toEqual([["a", 1]]);

    act(() => {
      result.current[1].clear();
    });
    act(() => {
      result.current[1].reset();
    });
    expect([...result.current[0]]).toEqual([["a", 1]]);
  });

  it("starts empty with no entries, and keeps the same actions object across renders", () => {
    const { result, rerender } = renderHook(() => useMap<string, number>());
    const actions = result.current[1];
    expect(result.current[0].size).toBe(0);

    act(() => {
      actions.set("a", 1);
    });
    rerender();
    expect(result.current[1]).toBe(actions);
  });

  it("renders on the server, where window and document don't exist, with the initial entries", () => {
    function Probe() {
      const [map] = useMap([["a", 1]]);
      return String(map.get("a"));
    }

    expect(renderOnServer(createElement(Probe))).toBe("1");
  });
});
