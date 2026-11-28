import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useResetState } from "./useResetState";

describe("useResetState", () => {
  it("works like useState, and reset goes back to the initial value", () => {
    const { result } = renderHook(() => useResetState("draft"));
    expect(result.current[0]).toBe("draft");

    act(() => {
      result.current[1]("edited");
    });
    act(() => {
      result.current[1]((current) => `${current}!`);
    });
    expect(result.current[0]).toBe("edited!");

    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe("draft");
  });

  it("computes a lazy initial value once, and reset reuses it without calling the function again", () => {
    let calls = 0;
    const { result } = renderHook(() =>
      useResetState(() => {
        calls += 1;
        return { id: calls };
      }),
    );
    const initial = result.current[0];

    act(() => {
      result.current[1]({ id: 99 });
    });
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe(initial);
    expect(calls).toBe(1);
  });

  it("resets to the first render's value, even when given a different initial value later", () => {
    const { result, rerender } = renderHook(({ initial }) => useResetState(initial), {
      initialProps: { initial: 1 },
    });

    rerender({ initial: 2 });
    act(() => {
      result.current[1](5);
    });
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe(1);
  });

  it("resets to a function value without calling it", () => {
    const greet = () => "hi";
    const other = () => "bye";
    const { result } = renderHook(() => useResetState(() => greet));

    act(() => {
      result.current[1](() => other);
    });
    expect(result.current[0]).toBe(other);
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe(greet);
  });

  it("keeps the same setState and reset across renders", () => {
    const { result, rerender } = renderHook(() => useResetState(0));
    const [, setState, reset] = result.current;

    act(() => {
      setState(1);
    });
    rerender();
    expect(result.current[1]).toBe(setState);
    expect(result.current[2]).toBe(reset);
  });

  it("renders on the server, where window and document don't exist, with the initial value", () => {
    function Probe() {
      const [value] = useResetState("draft");
      return value;
    }

    expect(renderOnServer(createElement(Probe))).toBe("draft");
  });
});
