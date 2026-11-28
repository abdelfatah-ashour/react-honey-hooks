import { render, renderHook } from "@testing-library/react";
import { createElement, type RefObject, useEffect } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useLatest } from "./useLatest";

describe("useLatest", () => {
  it("returns the same ref on every render, holding the latest value", () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: 1 },
    });
    const ref = result.current;
    expect(ref.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current).toBe(ref);
    expect(ref.current).toBe(2);
  });

  it("is already up to date when a child's effects run", () => {
    const seen: number[] = [];
    function Child({ latest }: { latest: RefObject<number> }) {
      useEffect(() => {
        seen.push(latest.current);
      });
      return null;
    }
    function Parent({ value }: { value: number }) {
      const latest = useLatest(value);
      return createElement(Child, { latest });
    }

    const { rerender } = render(createElement(Parent, { value: 1 }));
    rerender(createElement(Parent, { value: 2 }));
    expect(seen).toEqual([1, 2]);
  });

  it("holds the initial value when rendered on the server, where window and document don't exist", () => {
    function Probe() {
      return useLatest("first").current;
    }

    expect(renderOnServer(createElement(Probe))).toBe("first");
  });
});
