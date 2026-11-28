import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useGetState } from "./useGetState";

describe("useGetState", () => {
  it("works like useState, and getState reads the latest value even before the re-render", () => {
    const { result } = renderHook(() => useGetState(1));
    const [, setState, getState] = result.current;
    expect(getState()).toBe(1);

    const seen: number[] = [];
    act(() => {
      setState(2);
      seen.push(getState());
      setState((current) => current * 10);
      seen.push(getState());
    });
    expect(seen).toEqual([2, 20]);
    expect(result.current[0]).toBe(20);
    expect(getState()).toBe(20);
  });

  it("computes a lazy initial value once, and stores function values as they are", () => {
    let calls = 0;
    const first = () => "first";
    const second = () => "second";
    const { result } = renderHook(() =>
      useGetState(() => {
        calls += 1;
        return first;
      }),
    );
    expect(result.current[2]()).toBe(first);

    act(() => {
      result.current[1](() => second);
    });
    expect(result.current[0]).toBe(second);
    expect(result.current[2]()).toBe(second);
    expect(calls).toBe(1);
  });

  it("gives a callback created on the first render the latest value, with no stale closure", () => {
    const { result } = renderHook(() => {
      const [count, setCount, getCount] = useGetState(0);
      return { count, setCount, readLater: () => getCount() };
    });
    const readOnFirstRender = result.current.readLater;

    act(() => {
      result.current.setCount(1);
    });
    act(() => {
      result.current.setCount((current) => current + 1);
    });
    expect(readOnFirstRender()).toBe(2);
  });

  it("keeps the same setState and getState across renders", () => {
    const { result, rerender } = renderHook(() => useGetState(0));
    const [, setState, getState] = result.current;

    act(() => {
      setState(1);
    });
    rerender();
    expect(result.current[1]).toBe(setState);
    expect(result.current[2]).toBe(getState);
  });

  it("renders on the server, where window and document don't exist, with the initial value", () => {
    function Probe() {
      const [value, , getValue] = useGetState("ready");
      return `${value}:${getValue()}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("ready:ready");
  });
});
