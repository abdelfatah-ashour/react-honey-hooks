import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useInterval } from "./useInterval";

interface DelayProps {
  delay: number | null;
}

/** Widens the initial props so later renders can switch between a delay and `null`. */
function delayProps(delay: number | null): DelayProps {
  return { delay };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useInterval", () => {
  it("calls the callback every delayMs", () => {
    const tick = vi.fn();
    renderHook(() => {
      useInterval(tick, 1000);
    });

    vi.advanceTimersByTime(999);
    expect(tick).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2001);
    expect(tick).toHaveBeenCalledTimes(3);
  });

  it("calls the latest callback without restarting the interval on re-render", () => {
    const calls: number[] = [];
    const { rerender } = renderHook(
      ({ n }) => {
        useInterval(() => {
          calls.push(n);
        }, 1000);
      },
      { initialProps: { n: 1 } },
    );

    vi.advanceTimersByTime(600);
    rerender({ n: 2 });
    vi.advanceTimersByTime(400);

    expect(calls).toEqual([2]);
  });

  it("pauses while delayMs is null and starts counting from zero when it resumes", () => {
    const tick = vi.fn();
    const { rerender } = renderHook(
      ({ delay }: DelayProps) => {
        useInterval(tick, delay);
      },
      { initialProps: delayProps(null) },
    );

    vi.advanceTimersByTime(5000);
    expect(tick).not.toHaveBeenCalled();

    rerender({ delay: 1000 });
    vi.advanceTimersByTime(1000);
    expect(tick).toHaveBeenCalledTimes(1);

    rerender({ delay: null });
    vi.advanceTimersByTime(5000);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it("restarts with the new delay when delayMs changes", () => {
    const tick = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => {
        useInterval(tick, delay);
      },
      { initialProps: delayProps(1000) },
    );

    vi.advanceTimersByTime(900);
    rerender({ delay: 300 });
    vi.advanceTimersByTime(299);
    expect(tick).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it("leaves no timer running after it unmounts", () => {
    const { unmount } = renderHook(() => {
      useInterval(() => undefined, 1000);
    });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([0, -100, Number.NaN, Number.POSITIVE_INFINITY])(
    "treats a delay of %s like null and schedules nothing",
    (delay) => {
      const tick = vi.fn();
      renderHook(() => {
        useInterval(tick, delay);
      });

      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(10_000);
      expect(tick).not.toHaveBeenCalled();
    },
  );

  it("renders on the server, where window and document don't exist, without starting", () => {
    const tick = vi.fn();
    function Probe() {
      useInterval(tick, 100);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(vi.getTimerCount()).toBe(0);
  });
});
