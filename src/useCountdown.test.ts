import { act, renderHook } from "@testing-library/react";
import { useCountdown } from "./useCountdown";

const NOW = new Date("2026-01-01T00:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCountdown", () => {
  it("breaks the remaining time into days, hours, minutes and seconds", () => {
    const target = new Date("2026-01-03T04:05:06.000Z");

    const { result } = renderHook(() => useCountdown(target));

    expect(result.current).toMatchObject({ days: 2, hours: 4, minutes: 5, seconds: 6 });
  });

  it("ticks down every second", () => {
    const target = new Date("2026-01-01T00:01:00.000Z");
    const { result } = renderHook(() => useCountdown(target));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toMatchObject({ minutes: 0, seconds: 59 });

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current).toMatchObject({ minutes: 0, seconds: 29 });
  });

  it("stops at zero and reports expiry once the target has passed", () => {
    const target = new Date("2026-01-01T00:00:02.000Z");
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current.isExpired).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMilliseconds: 0,
      isExpired: true,
    });
  });

  it("follows a new target immediately when the target changes", () => {
    const { result, rerender } = renderHook(({ target }) => useCountdown(target), {
      initialProps: { target: new Date("2026-01-01T00:00:10.000Z") },
    });

    rerender({ target: new Date("2026-01-01T01:00:00.000Z") });

    expect(result.current).toMatchObject({ hours: 1, minutes: 0, seconds: 0, isExpired: false });
  });

  it("restarts ticking when an expired countdown gets a future target", () => {
    const { result, rerender } = renderHook(({ target }) => useCountdown(target), {
      initialProps: { target: new Date("2025-12-31T00:00:00.000Z") },
    });

    rerender({ target: new Date("2026-01-01T00:00:05.000Z") });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toMatchObject({ seconds: 3, isExpired: false });
  });

  it("accepts a timestamp or a date string as the target", () => {
    const fromNumber = renderHook(() => useCountdown(NOW.getTime() + 90_000));
    const fromString = renderHook(() => useCountdown("2026-01-01T00:01:30.000Z"));

    expect(fromNumber.result.current).toMatchObject({ minutes: 1, seconds: 30 });
    expect(fromString.result.current).toMatchObject({ minutes: 1, seconds: 30 });
  });

  it("treats an invalid date as already expired", () => {
    const { result } = renderHook(() => useCountdown("not a date"));

    expect(result.current).toMatchObject({
      days: 0,
      seconds: 0,
      totalMilliseconds: 0,
      isExpired: true,
    });
  });

  it("stops its timer when unmounted", () => {
    const { unmount } = renderHook(() => useCountdown(new Date("2026-02-01T00:00:00.000Z")));
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("is already expired when given a date in the past", () => {
    const { result } = renderHook(() => useCountdown(new Date("2025-12-31T00:00:00.000Z")));

    expect(result.current).toMatchObject({ days: 0, seconds: 0, isExpired: true });
  });
});
