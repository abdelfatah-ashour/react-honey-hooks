import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useEventEmitter } from "./useEventEmitter";

describe("useEventEmitter", () => {
  it("sends each emitted value to every subscriber until it unsubscribes", () => {
    const { result } = renderHook(() => useEventEmitter<number>());
    const first = vi.fn();
    const second = vi.fn();
    const stopFirst = result.current.subscribe(first);
    result.current.subscribe(second);

    result.current.emit(1);
    stopFirst();
    result.current.emit(2);
    expect(first.mock.calls).toEqual([[1]]);
    expect(second.mock.calls).toEqual([[1], [2]]);
  });

  it("isn't affected during an emit by listeners that subscribe or unsubscribe in it", () => {
    const { result } = renderHook(() => useEventEmitter<string>());
    const emitter = result.current;
    const late = vi.fn();
    const removed = vi.fn();
    let stopRemoved = () => {};
    emitter.subscribe(() => {
      emitter.subscribe(late);
      stopRemoved();
    });
    stopRemoved = emitter.subscribe(removed);

    emitter.emit("first");
    expect(late).not.toHaveBeenCalled();
    expect(removed).toHaveBeenCalledOnce();

    emitter.emit("second");
    expect(late).toHaveBeenCalledWith("second");
    expect(removed).toHaveBeenCalledOnce();
  });

  it("calls a function subscribed twice once per subscription, and each unsubscribe removes one", () => {
    const { result } = renderHook(() => useEventEmitter<number>());
    const listener = vi.fn();
    const stop = result.current.subscribe(listener);
    result.current.subscribe(listener);

    result.current.emit(1);
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    stop();
    result.current.emit(2);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("useSubscription listens while its component is mounted, calling the latest listener", () => {
    const { result: emitterResult } = renderHook(() => useEventEmitter<string>());
    const emitter = emitterResult.current;
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ listener }) => {
        emitter.useSubscription(listener);
      },
      { initialProps: { listener: first } },
    );

    rerender({ listener: second });
    emitter.emit("hello");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledExactlyOnceWith("hello");

    unmount();
    emitter.emit("gone");
    expect(second).toHaveBeenCalledOnce();
  });

  it("keeps the same emitter across renders", () => {
    const { result, rerender } = renderHook(() => useEventEmitter());
    const emitter = result.current;

    rerender();
    expect(result.current).toBe(emitter);
  });

  it("renders on the server, where window and document don't exist", () => {
    function Probe() {
      const emitter = useEventEmitter<number>();
      emitter.useSubscription(() => undefined);
      return typeof emitter.emit;
    }

    expect(renderOnServer(createElement(Probe))).toBe("function");
  });
});
