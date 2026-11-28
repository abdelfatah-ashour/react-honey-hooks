import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useAsyncEffect } from "./useAsyncEffect";

/** Collects errors reported to the window, as `reportError` does, until `stop` is called. */
function catchReportedErrors() {
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => {
    event.preventDefault();
    errors.push(event.error);
  };
  window.addEventListener("error", onError);
  return {
    errors,
    stop: () => {
      window.removeEventListener("error", onError);
    },
  };
}

describe("useAsyncEffect", () => {
  it("runs after mount and on dependency changes, aborting the previous run's signal", () => {
    const signals: AbortSignal[] = [];
    const runs: number[] = [];
    const { rerender, unmount } = renderHook(
      ({ id }) => {
        useAsyncEffect(
          async (signal) => {
            signals.push(signal);
            runs.push(id);
            await Promise.resolve();
          },
          [id],
        );
      },
      { initialProps: { id: 1 } },
    );
    expect(runs).toEqual([1]);
    expect(signals[0]?.aborted).toBe(false);

    rerender({ id: 1 });
    rerender({ id: 2 });
    expect(runs).toEqual([1, 2]);
    expect(signals.map((signal) => signal.aborted)).toEqual([true, false]);

    unmount();
    expect(signals[1]?.aborted).toBe(true);
  });

  it("reports an error the effect fails with, rather than swallowing it", async () => {
    const reported = catchReportedErrors();
    const failure = new Error("could not load");
    renderHook(() => {
      useAsyncEffect(async () => {
        await Promise.resolve();
        throw failure;
      }, []);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    reported.stop();
    expect(reported.errors).toEqual([failure]);
  });

  it("ignores the abort error of a run that was cancelled", async () => {
    const reported = catchReportedErrors();
    const { unmount } = renderHook(() => {
      useAsyncEffect(
        (signal) =>
          new Promise((_, reject) => {
            signal.addEventListener("abort", () => {
              reject(signal.reason as Error);
            });
          }),
        [],
      );
    });

    unmount();
    await new Promise((resolve) => setTimeout(resolve, 0));
    reported.stop();
    expect(reported.errors).toEqual([]);
  });

  it("reports an effect that throws before returning a promise, without breaking the component", async () => {
    const reported = catchReportedErrors();
    const failure = new Error("bad input");
    const { result } = renderHook(() => {
      useAsyncEffect(() => {
        throw failure;
      }, []);
      return "still rendered";
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    reported.stop();
    expect(result.current).toBe("still rendered");
    expect(reported.errors).toEqual([failure]);
  });

  it("does nothing on the server, where window and document don't exist", () => {
    const effect = vi.fn(() => Promise.resolve());
    function Probe() {
      useAsyncEffect(effect, []);
      return "ok";
    }

    expect(renderOnServer(createElement(Probe))).toBe("ok");
    expect(effect).not.toHaveBeenCalled();
  });
});
