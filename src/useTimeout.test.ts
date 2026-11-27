import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useTimeout } from "./useTimeout";

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

describe("useTimeout", () => {
  it("calls the callback once, delayMs after mounting", () => {
    const done = vi.fn();
    const { rerender } = renderHook(() => {
      useTimeout(done, 1000);
    });

    vi.advanceTimersByTime(999);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);

    rerender();
    vi.advanceTimersByTime(5000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("calls the callback from the latest render", () => {
    const calls: string[] = [];
    const { rerender } = renderHook(
      ({ label }) => {
        useTimeout(() => {
          calls.push(label);
        }, 1000);
      },
      { initialProps: { label: "first" } },
    );

    rerender({ label: "second" });
    vi.advanceTimersByTime(1000);

    expect(calls).toEqual(["second"]);
  });

  it("waits while delayMs is null, and starts the full wait when it gets a delay", () => {
    const done = vi.fn();
    const { rerender } = renderHook(
      ({ delay }: DelayProps) => {
        useTimeout(done, delay);
      },
      { initialProps: delayProps(null) },
    );

    vi.advanceTimersByTime(5000);
    expect(done).not.toHaveBeenCalled();

    rerender({ delay: 1000 });
    vi.advanceTimersByTime(1000);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending call when delayMs becomes null", () => {
    const done = vi.fn();
    const { rerender } = renderHook(
      ({ delay }: DelayProps) => {
        useTimeout(done, delay);
      },
      { initialProps: delayProps(1000) },
    );

    rerender({ delay: null });
    vi.advanceTimersByTime(5000);

    expect(done).not.toHaveBeenCalled();
  });

  it("starts the wait again from now when delayMs changes", () => {
    const done = vi.fn();
    const { rerender } = renderHook(
      ({ delay }) => {
        useTimeout(done, delay);
      },
      { initialProps: delayProps(1000) },
    );

    vi.advanceTimersByTime(900);
    rerender({ delay: 500 });
    vi.advanceTimersByTime(499);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("with a delay of 0, calls the callback after the current task", () => {
    const done = vi.fn();
    renderHook(() => {
      useTimeout(done, 0);
    });
    expect(done).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);

    expect(done).toHaveBeenCalledTimes(1);
  });

  it.each([-100, Number.NaN, Number.POSITIVE_INFINITY])(
    "treats a delay of %s like null and schedules nothing",
    (delay) => {
      const done = vi.fn();
      renderHook(() => {
        useTimeout(done, delay);
      });

      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(10_000);
      expect(done).not.toHaveBeenCalled();
    },
  );

  it("leaves no timer running after it unmounts", () => {
    const { unmount } = renderHook(() => {
      useTimeout(() => undefined, 1000);
    });

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("renders on the server, where window and document don't exist, without starting", () => {
    const done = vi.fn();
    function Probe() {
      useTimeout(done, 100);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(vi.getTimerCount()).toBe(0);
  });
});
