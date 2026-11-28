import { render, renderHook } from "@testing-library/react";
import { createElement, useEffect } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useStableCallback } from "./useStableCallback";

describe("useStableCallback", () => {
  it("keeps one function for the component's life that calls the latest fn", () => {
    const { result, rerender } = renderHook(({ fn }) => useStableCallback(fn), {
      initialProps: { fn: (n: number) => n + 1 },
    });
    const stable = result.current;
    expect(stable(1)).toBe(2);

    rerender({ fn: (n: number) => n * 10 });
    expect(result.current).toBe(stable);
    expect(stable(2)).toBe(20);
  });

  it("passes this through, so it works as a method", () => {
    const { result } = renderHook(() =>
      useStableCallback(function (this: { name: string }) {
        return this.name;
      }),
    );
    const owner = { name: "owner", greet: result.current };

    expect(owner.greet()).toBe("owner");
  });

  it("calls the latest fn from a child's effect in the same commit", () => {
    const calls: string[] = [];
    function Child({ onRender }: { onRender: () => void }) {
      useEffect(() => {
        onRender();
      });
      return null;
    }
    function Parent({ label }: { label: string }) {
      const onRender = useStableCallback(() => {
        calls.push(label);
      });
      return createElement(Child, { onRender });
    }

    const { rerender } = render(createElement(Parent, { label: "first" }));
    rerender(createElement(Parent, { label: "second" }));
    expect(calls).toEqual(["first", "second"]);
  });

  it("renders on the server, where window and document don't exist", () => {
    function Probe() {
      const stable = useStableCallback(() => "ok");
      return typeof stable;
    }

    expect(renderOnServer(createElement(Probe))).toBe("function");
  });
});
