import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useAsync } from "./useAsync";

/** A promise the test settles when it chooses. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useAsync", () => {
  it("is idle until run, pending while running, then holds the result", async () => {
    const request = deferred<string>();
    const { result } = renderHook(() => useAsync(() => request.promise));
    expect(result.current).toMatchObject({ status: "idle", data: undefined, error: undefined });

    let returned: Promise<string | undefined> | undefined;
    act(() => {
      returned = result.current.run();
    });
    expect(result.current.status).toBe("pending");

    await act(async () => {
      request.resolve("Ada");
      await returned;
    });

    expect(result.current).toMatchObject({ status: "success", data: "Ada", error: undefined });
    await expect(returned).resolves.toBe("Ada");
  });

  it("reports a rejection as an error, keeps the last data, and resolves run to undefined", async () => {
    let fail = false;
    const { result } = renderHook(() =>
      useAsync(async () => {
        await Promise.resolve();
        if (fail) throw new Error("Network down");
        return "first";
      }),
    );
    await act(() => result.current.run());

    fail = true;
    let returned: string | undefined = "not set";
    await act(async () => {
      returned = await result.current.run();
    });

    expect(returned).toBeUndefined();
    expect(result.current.status).toBe("error");
    expect(result.current.error).toEqual(new Error("Network down"));
    expect(result.current.data).toBe("first");
  });

  it("wraps a thrown value that isn't an Error, even when fn throws instead of rejecting", async () => {
    const { result } = renderHook(() =>
      useAsync((): Promise<string> => {
        // Deliberately not an Error, as some libraries throw strings.
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "plain string";
      }),
    );

    await act(() => result.current.run());

    expect(result.current.status).toBe("error");
    expect(result.current.error).toEqual(new Error("plain string"));
  });

  it("aborts an older call when a newer one starts, and ignores its late result", async () => {
    const requests = new Map<string, ReturnType<typeof deferred<string>>>();
    const signals = new Map<string, AbortSignal>();
    const { result } = renderHook(() =>
      useAsync((signal: AbortSignal, query: string) => {
        const request = deferred<string>();
        requests.set(query, request);
        signals.set(query, signal);
        return request.promise;
      }),
    );

    let first: Promise<string | undefined> | undefined;
    let second: Promise<string | undefined> | undefined;
    act(() => {
      first = result.current.run("ho");
    });
    act(() => {
      second = result.current.run("honey");
    });
    expect(signals.get("ho")?.aborted).toBe(true);
    expect(signals.get("honey")?.aborted).toBe(false);

    await act(async () => {
      requests.get("honey")?.resolve("results for honey");
      requests.get("ho")?.resolve("results for ho");
      await Promise.all([first, second]);
    });

    expect(result.current.data).toBe("results for honey");
    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBe("results for honey");
  });

  it("cancel aborts the call in progress and goes back to the status before it", async () => {
    let signal: AbortSignal | undefined;
    let call = 0;
    const { result } = renderHook(() =>
      useAsync((received: AbortSignal) => {
        signal = received;
        call++;
        return call === 1 ? Promise.resolve("first") : new Promise<string>(() => undefined);
      }),
    );
    await act(() => result.current.run());
    act(() => {
      void result.current.run();
    });
    expect(result.current.status).toBe("pending");

    act(() => {
      result.current.cancel();
    });

    expect(signal?.aborted).toBe(true);
    expect(result.current).toMatchObject({ status: "success", data: "first" });
  });

  it("aborts the call in progress when it unmounts", () => {
    let signal: AbortSignal | undefined;
    const { result, unmount } = renderHook(() =>
      useAsync((received: AbortSignal) => {
        signal = received;
        return new Promise<string>(() => undefined);
      }),
    );
    act(() => {
      void result.current.run();
    });

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("keeps run and cancel the same across renders, and calls the latest fn", async () => {
    const { result, rerender } = renderHook(
      ({ suffix }) => useAsync(() => Promise.resolve(`v${suffix}`)),
      {
        initialProps: { suffix: "1" },
      },
    );
    const { run, cancel } = result.current;

    rerender({ suffix: "2" });
    await act(() => result.current.run());

    expect(result.current.run).toBe(run);
    expect(result.current.cancel).toBe(cancel);
    expect(result.current.data).toBe("v2");
  });

  it("clears the error once a later call succeeds", async () => {
    let fail = true;
    const { result } = renderHook(() =>
      useAsync(() => (fail ? Promise.reject(new Error("Offline")) : Promise.resolve("ok"))),
    );
    await act(() => result.current.run());

    fail = false;
    await act(() => result.current.run());

    expect(result.current).toMatchObject({ status: "success", data: "ok", error: undefined });
  });

  it("renders on the server as idle", () => {
    function Probe() {
      return useAsync(() => Promise.resolve(1)).status;
    }

    expect(renderOnServer(createElement(Probe))).toBe("idle");
  });
});

describe("useAsync with retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Fails `failures` times, then resolves to the attempt number. */
  function flaky(failures: number) {
    let attempts = 0;
    return vi.fn(() => {
      attempts++;
      return attempts <= failures
        ? Promise.reject(new Error(`failure ${String(attempts)}`))
        : Promise.resolve(attempts);
    });
  }

  it("retries a failed call after delayMs, doubling the wait each time, staying pending", async () => {
    const fn = flaky(2);
    const { result } = renderHook(() => useAsync(fn, { retry: { count: 3, delayMs: 100 } }));

    let returned: Promise<number | undefined> | undefined;
    await act(async () => {
      returned = result.current.run();
      await vi.advanceTimersByTimeAsync(99);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("pending");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fn).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(199);
    });
    expect(fn).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fn).toHaveBeenCalledTimes(3);
    expect(result.current).toMatchObject({ status: "success", data: 3 });
    await expect(returned).resolves.toBe(3);
  });

  it("reports the last error once count retries have failed, and retries 3 times 1 s apart by default", async () => {
    const fn = flaky(10);
    const { result } = renderHook(() => useAsync(fn, { retry: {} }));

    await act(async () => {
      void result.current.run();
      await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000);
    });
    expect(fn).toHaveBeenCalledTimes(4);
    expect(result.current.status).toBe("error");
    expect(result.current.error?.message).toBe("failure 4");
  });

  it("stops retrying when shouldRetry says no, passing it the error and the retry number", async () => {
    const fn = flaky(10);
    const shouldRetry = vi.fn((_error: Error, attempt: number) => attempt < 1);
    const { result } = renderHook(() =>
      useAsync(fn, { retry: { count: 5, delayMs: 10, shouldRetry } }),
    );

    await act(async () => {
      void result.current.run();
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(shouldRetry.mock.calls.map(([error, attempt]) => [error.message, attempt])).toEqual([
      ["failure 1", 0],
      ["failure 2", 1],
    ]);
    expect(result.current.status).toBe("error");
  });

  it("cancel and unmount stop a retry that is waiting", async () => {
    const fn = flaky(10);
    const { result, unmount } = renderHook(() => useAsync(fn, { retry: { delayMs: 100 } }));

    await act(async () => {
      void result.current.run();
      await vi.advanceTimersByTimeAsync(50);
    });
    act(() => {
      result.current.cancel();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("idle");

    await act(async () => {
      void result.current.run();
      await vi.advanceTimersByTimeAsync(50);
    });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("useAsync with polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Resolves to how many times it was called, with the arguments it got. */
  function counter() {
    let calls = 0;
    return vi.fn((_signal: AbortSignal, room: string) => {
      calls++;
      return Promise.resolve(`${room} #${String(calls)}`);
    });
  }

  it("runs again with the last arguments pollMs after each call settles, until cancelled", async () => {
    const fn = counter();
    const { result } = renderHook(() => useAsync(fn, { pollMs: 1000 }));

    await act(async () => {
      void result.current.run("lobby");
      await vi.advanceTimersByTimeAsync(999);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(expect.any(AbortSignal), "lobby");
    expect(result.current.data).toBe("lobby #2");

    act(() => {
      result.current.cancel();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  /** Hides or shows the tab, as switching tabs does. */
  function setHidden(hidden: boolean) {
    vi.spyOn(document, "hidden", "get").mockReturnValue(hidden);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue(hidden ? "hidden" : "visible");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
  }

  it("waits while the tab is hidden, and polls as soon as it is shown again", async () => {
    const fn = counter();
    const { result } = renderHook(() => useAsync(fn, { pollMs: 1000 }));
    await act(async () => {
      void result.current.run("lobby");
      await vi.advanceTimersByTimeAsync(0);
    });

    setHidden(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fn).toHaveBeenCalledTimes(1);

    setHidden(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("keeps polling while hidden with pollWhenHidden, and after a call fails", async () => {
    let calls = 0;
    const fn = vi.fn(() => {
      calls++;
      return calls === 1 ? Promise.reject(new Error("blip")) : Promise.resolve(calls);
    });
    const { result } = renderHook(() => useAsync(fn, { pollMs: 1000, pollWhenHidden: true }));
    setHidden(true);

    await act(async () => {
      void result.current.run();
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.status).toBe("error");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(fn).toHaveBeenCalledTimes(3);
    expect(result.current).toMatchObject({ status: "success", data: 3 });
  });

  it("stops polling on unmount, and a new run restarts the wait with its own arguments", async () => {
    const fn = counter();
    const { result, unmount } = renderHook(() => useAsync(fn, { pollMs: 1000 }));
    await act(async () => {
      void result.current.run("a");
      await vi.advanceTimersByTimeAsync(500);
      void result.current.run("b");
      await vi.advanceTimersByTimeAsync(999);
    });
    expect(fn.mock.calls.map(([, room]) => room)).toEqual(["a", "b"]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(fn.mock.calls.map(([, room]) => room)).toEqual(["a", "b", "b"]);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
