import { renderHook } from "@testing-library/react";
import { useDebouncedCallback } from "./useDebouncedCallback";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedCallback", () => {
  it("calls the function once, with the last arguments, after delayMs without calls", () => {
    const search = vi.fn<(query: string) => void>();
    const { result } = renderHook(() => useDebouncedCallback(search, 300));

    result.current("h");
    vi.advanceTimersByTime(200);
    result.current("ho");
    vi.advanceTimersByTime(200);
    result.current("hon");
    vi.advanceTimersByTime(299);
    expect(search).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith("hon");
  });

  it("calls the latest function and keeps its identity when given a new inline function", () => {
    const calls: string[] = [];
    const { result, rerender } = renderHook(
      ({ label }) =>
        useDebouncedCallback(() => {
          calls.push(label);
        }, 300),
      { initialProps: { label: "first" } },
    );
    const debounced = result.current;

    debounced();
    rerender({ label: "second" });
    vi.advanceTimersByTime(300);

    expect(calls).toEqual(["second"]);
    expect(result.current).toBe(debounced);
  });

  it("drops a pending call when cancel is called", () => {
    const save = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(save, 300));

    result.current();
    result.current.cancel();
    vi.advanceTimersByTime(300);

    expect(save).not.toHaveBeenCalled();
  });

  it("runs a pending call straight away on flush, and does nothing when none is pending", () => {
    const save = vi.fn<(draft: string) => void>();
    const { result } = renderHook(() => useDebouncedCallback(save, 300));

    result.current.flush();
    expect(save).not.toHaveBeenCalled();

    result.current("draft");
    result.current.flush();
    expect(save).toHaveBeenCalledExactlyOnceWith("draft");

    vi.advanceTimersByTime(300);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("drops a pending call when the component unmounts", () => {
    const save = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(save, 300));

    result.current();
    unmount();
    vi.advanceTimersByTime(300);

    expect(save).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("with a delay of 0, still waits for the current task so a burst becomes one call", () => {
    const save = vi.fn<(n: number) => void>();
    const { result } = renderHook(() => useDebouncedCallback(save, 0));

    result.current(1);
    result.current(2);
    expect(save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(save).toHaveBeenCalledExactlyOnceWith(2);
  });

  it("keeps a pending call's delay when delayMs changes, and uses the new delay for the next call", () => {
    const save = vi.fn();
    const { result, rerender } = renderHook(({ delay }) => useDebouncedCallback(save, delay), {
      initialProps: { delay: 300 },
    });

    result.current();
    rerender({ delay: 1000 });
    vi.advanceTimersByTime(300);
    expect(save).toHaveBeenCalledTimes(1);

    result.current();
    vi.advanceTimersByTime(999);
    expect(save).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(2);
  });
});
