import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useSet } from "./useSet";

describe("useSet", () => {
  it("starts from the initial values, and add, remove and toggle change membership", () => {
    const { result } = renderHook(() => useSet(["a"]));
    expect([...result.current[0]]).toEqual(["a"]);

    act(() => {
      result.current[1].add("b");
    });
    act(() => {
      result.current[1].remove("a");
    });
    expect([...result.current[0]]).toEqual(["b"]);

    act(() => {
      result.current[1].toggle("b");
      result.current[1].toggle("c");
    });
    expect([...result.current[0]]).toEqual(["c"]);
  });

  it("clears, and resets to the first render's values even when given new ones", () => {
    function* letters() {
      yield "a";
      yield "b";
    }
    const { result, rerender } = renderHook(({ initial }) => useSet(initial), {
      initialProps: { initial: letters() as Iterable<string> },
    });

    rerender({ initial: ["z"] });
    act(() => {
      result.current[1].clear();
    });
    expect(result.current[0].size).toBe(0);

    act(() => {
      result.current[1].reset();
    });
    expect([...result.current[0]]).toEqual(["a", "b"]);
  });

  it("keeps the same set, without re-rendering, when an action changes nothing", () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useSet<number>([1, Number.NaN]);
    });
    const first = result.current[0];
    const rendersBefore = renders;

    act(() => {
      result.current[1].add(1);
      result.current[1].add(Number.NaN);
      result.current[1].remove(2);
    });
    expect(result.current[0]).toBe(first);
    expect(renders).toBe(rendersBefore);

    act(() => {
      result.current[1].clear();
    });
    const cleared = result.current[0];
    expect(cleared).not.toBe(first);
    expect([...first]).toEqual([1, Number.NaN]);

    act(() => {
      result.current[1].clear();
    });
    expect(result.current[0]).toBe(cleared);
  });

  it("starts empty with no values, and keeps the same actions object across renders", () => {
    const { result, rerender } = renderHook(() => useSet<string>());
    const actions = result.current[1];
    expect(result.current[0].size).toBe(0);

    act(() => {
      actions.add("a");
    });
    rerender();
    expect(result.current[1]).toBe(actions);
  });

  it("renders on the server, where window and document don't exist, with the initial values", () => {
    function Probe() {
      const [set] = useSet(["a", "b"]);
      return [...set].join(",");
    }

    expect(renderOnServer(createElement(Probe))).toBe("a,b");
  });
});
