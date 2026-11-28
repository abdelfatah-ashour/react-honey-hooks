import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useThrottledValue } from "./useThrottledValue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useThrottledValue", () => {
  it("returns the first value at once, the first change at once, then at most one update per ms", () => {
    const { result, rerender } = renderHook(({ value }) => useThrottledValue(value, 100), {
      initialProps: { value: 0 },
    });
    expect(result.current).toBe(0);

    rerender({ value: 1 });
    expect(result.current).toBe(1);

    rerender({ value: 2 });
    rerender({ value: 3 });
    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(3);
  });

  it("follows the value straight away when ms is 0, negative or NaN", () => {
    for (const ms of [0, -5, Number.NaN]) {
      const { result, rerender } = renderHook(({ value }) => useThrottledValue(value, ms), {
        initialProps: { value: "a" },
      });
      rerender({ value: "b" });
      rerender({ value: "c" });
      expect(result.current).toBe("c");
    }
  });

  it("keeps a function value as it is", () => {
    const first = () => "first";
    const second = () => "second";
    const { result, rerender } = renderHook(({ value }) => useThrottledValue(value, 100), {
      initialProps: { value: first },
    });

    rerender({ value: second });
    expect(result.current).toBe(second);
  });

  it("drops a pending update on unmount, leaving no timer behind", () => {
    const { rerender, unmount } = renderHook(({ value }) => useThrottledValue(value, 100), {
      initialProps: { value: 0 },
    });
    rerender({ value: 1 });
    rerender({ value: 2 });

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("returns the value on the server, where window and document don't exist", () => {
    function Probe() {
      return useThrottledValue("honey", 100);
    }

    expect(renderOnServer(createElement(Probe))).toBe("honey");
  });
});
