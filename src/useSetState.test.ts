import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useSetState } from "./useSetState";

interface Filters {
  query: string;
  page: number;
  tags?: string[] | undefined;
}

describe("useSetState", () => {
  it("merges a partial object into the state, keeping the other keys", () => {
    const { result } = renderHook(() => useSetState<Filters>({ query: "", page: 1 }));

    act(() => {
      result.current[1]({ query: "shoes" });
    });
    expect(result.current[0]).toEqual({ query: "shoes", page: 1 });

    act(() => {
      result.current[1]({ page: 3 });
    });
    expect(result.current[0]).toEqual({ query: "shoes", page: 3 });
  });

  it("computes the patch from the current state, so several updates in one batch all apply", () => {
    const { result } = renderHook(() => useSetState<Filters>({ query: "", page: 1 }));

    act(() => {
      result.current[1]((current) => ({ page: current.page + 1 }));
      result.current[1]((current) => ({ page: current.page + 1 }));
    });
    expect(result.current[0]).toEqual({ query: "", page: 3 });
  });

  it("takes a function to compute the initial state once", () => {
    let calls = 0;
    const { result, rerender } = renderHook(() =>
      useSetState<Filters>(() => {
        calls += 1;
        return { query: "hats", page: 2 };
      }),
    );
    rerender();
    expect(result.current[0]).toEqual({ query: "hats", page: 2 });
    expect(calls).toBe(1);
  });

  it("keeps the same state object, without re-rendering, when a patch changes nothing", () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useSetState<Filters>({ query: "", page: Number.NaN });
    });
    const first = result.current[0];
    const rendersBefore = renders;

    act(() => {
      result.current[1]({});
      result.current[1]({ query: "", page: Number.NaN });
      result.current[1](() => null as unknown as Partial<Filters>);
      result.current[1](undefined as unknown as Partial<Filters>);
    });
    expect(result.current[0]).toBe(first);
    expect(renders).toBe(rendersBefore);

    act(() => {
      result.current[1]({ query: "a" });
    });
    expect(result.current[0]).not.toBe(first);
    expect(first).toEqual({ query: "", page: Number.NaN });
  });

  it("adds a key that wasn't there, even when its value is undefined", () => {
    const { result } = renderHook(() => useSetState<Filters>({ query: "", page: 1 }));

    act(() => {
      result.current[1]({ tags: undefined });
    });
    expect("tags" in result.current[0]).toBe(true);
  });

  it("keeps the same setter across renders", () => {
    const { result, rerender } = renderHook(() => useSetState<Filters>({ query: "", page: 1 }));
    const setter = result.current[1];

    act(() => {
      setter({ page: 2 });
    });
    rerender();
    expect(result.current[1]).toBe(setter);
  });

  it("renders on the server, where window and document don't exist, with the initial state", () => {
    function Probe() {
      const [state] = useSetState<Filters>({ query: "hats", page: 2 });
      return `${state.query}:${String(state.page)}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("hats:2");
  });
});
