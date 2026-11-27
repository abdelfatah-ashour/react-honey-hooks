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
