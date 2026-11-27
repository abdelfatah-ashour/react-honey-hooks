import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useThrottledCallback } from "./useThrottledCallback";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useThrottledCallback", () => {
  it("runs the first call at once, and calls during the wait once at its end with the last arguments", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, 1000));

    result.current("a");
    expect(save.mock.calls).toEqual([["a"]]);

    result.current("b");
    result.current("c");
    vi.advanceTimersByTime(999);
    expect(save.mock.calls).toEqual([["a"]]);

    vi.advanceTimersByTime(1);
    expect(save.mock.calls).toEqual([["a"], ["c"]]);
  });

  it("starts a new wait after the trailing call, so calls never run closer than ms apart", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, 1000));
    result.current("a");
    result.current("b");
    vi.advanceTimersByTime(1000); // "b" runs at 1000

    vi.advanceTimersByTime(10);
    result.current("c");
    expect(save.mock.calls).toEqual([["a"], ["b"]]);

    vi.advanceTimersByTime(990); // 1000 ms after "b"
    expect(save.mock.calls).toEqual([["a"], ["b"], ["c"]]);
  });

  it("runs a call at once again after a wait with no calls", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, 1000));
    result.current("a");
    vi.advanceTimersByTime(1000);

    result.current("b");

    expect(save.mock.calls).toEqual([["a"], ["b"]]);
  });

  it("with leading: false, runs the first call at the end of the wait instead", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, 1000, { leading: false }));

    result.current("a");
    expect(save).not.toHaveBeenCalled();
    result.current("b");
    vi.advanceTimersByTime(1000);

    expect(save.mock.calls).toEqual([["b"]]);
  });

  it("with trailing: false, drops calls made during the wait", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, 1000, { trailing: false }));

    result.current("a");
    result.current("b");
    vi.advanceTimersByTime(1000);
    expect(save.mock.calls).toEqual([["a"]]);

    result.current("c");
    expect(save.mock.calls).toEqual([["a"], ["c"]]);
  });

  it("with leading and trailing both false, never runs", () => {
    const save = vi.fn();
    const { result } = renderHook(() =>
      useThrottledCallback(save, 1000, { leading: false, trailing: false }),
    );

    result.current("a");
    vi.advanceTimersByTime(5000);

    expect(save).not.toHaveBeenCalled();
  });

  it("cancel drops the pending call and ends the wait", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, 1000));
    result.current("a");
    result.current("b");

    result.current.cancel();
    vi.advanceTimersByTime(5000);
    expect(save.mock.calls).toEqual([["a"]]);

    result.current("c");
    expect(save.mock.calls).toEqual([["a"], ["c"]]);
  });

  it("flush runs the pending call now and ends the wait", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, 1000));
    result.current("a");
    result.current("b");

    result.current.flush();
    expect(save.mock.calls).toEqual([["a"], ["b"]]);
    vi.advanceTimersByTime(5000);
    expect(save.mock.calls).toEqual([["a"], ["b"]]);

    result.current.flush();
    expect(save.mock.calls).toEqual([["a"], ["b"]]);
  });

  it("with trailing: false, flush has nothing to run", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, 1000, { trailing: false }));
    result.current("a");
    result.current("b");

    result.current.flush();

    expect(save.mock.calls).toEqual([["a"]]);
  });

  it.each([0, -100, Number.NaN])("with ms of %s, runs every call at once", (ms) => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, ms));

    result.current("a");
    result.current("b");

    expect(save.mock.calls).toEqual([["a"], ["b"]]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("with ms of Infinity, runs the first call and keeps the last one for flush", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useThrottledCallback(save, Number.POSITIVE_INFINITY));

    result.current("a");
    result.current("b");
    vi.advanceTimersByTime(1_000_000);
    expect(save.mock.calls).toEqual([["a"]]);
    expect(vi.getTimerCount()).toBe(0);

    result.current.flush();
    expect(save.mock.calls).toEqual([["a"], ["b"]]);
  });

  it("keeps its identity across renders, and calls the latest fn", () => {
    const calls: string[] = [];
    const { result, rerender } = renderHook(
      ({ label }) =>
        useThrottledCallback(() => {
          calls.push(label);
        }, 1000),
      { initialProps: { label: "first" } },
    );
    const throttled = result.current;
    throttled();
    throttled();

    rerender({ label: "second" });
    vi.advanceTimersByTime(1000);

    expect(result.current).toBe(throttled);
    expect(calls).toEqual(["first", "second"]);
  });

  it("drops a pending call and leaves no timer when it unmounts", () => {
    const save = vi.fn();
    const { result, unmount } = renderHook(() => useThrottledCallback(save, 1000));
    result.current("a");
    result.current("b");

    unmount();
    vi.advanceTimersByTime(5000);

    expect(save.mock.calls).toEqual([["a"]]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("renders on the server, where window and document don't exist", () => {
    const save = vi.fn();
    function Probe() {
      useThrottledCallback(save, 100);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(save).not.toHaveBeenCalled();
  });
});
