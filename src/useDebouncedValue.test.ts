import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useDebouncedValue } from "./useDebouncedValue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("returns the first value straight away", () => {
    const { result } = renderHook(() => useDebouncedValue("honey", 300));

    expect(result.current).toBe("honey");
  });

  it("follows the value only after it has stopped changing for delayMs", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "h" },
    });

    rerender({ value: "ho" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "hon" });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("h");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("hon");
  });

  it("restarts the wait with the new delay when delayMs changes", () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
      initialProps: { value: 1, delay: 300 },
    });

    rerender({ value: 2, delay: 300 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 2, delay: 1000 });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(2);
  });

  it("stores a function value as a value rather than calling it", () => {
    const first = () => "first";
    const second = () => "second";
    const { result, rerender } = renderHook(({ fn }) => useDebouncedValue(fn, 0), {
      initialProps: { fn: first },
    });

    rerender({ fn: second });
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe(second);
  });

  it("leaves no timer running after it unmounts", () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });
    rerender({ value: "b" });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("renders on the server, where window and document don't exist, with the value", () => {
    function Probe() {
      return useDebouncedValue("query", 300);
    }

    expect(renderOnServer(createElement(Probe))).toBe("query");
  });
});
