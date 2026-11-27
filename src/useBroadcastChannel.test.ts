import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useBroadcastChannel } from "./useBroadcastChannel";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useBroadcastChannel", () => {
  it("delivers a posted message to other listeners on the same channel", async () => {
    const onMessage = vi.fn();
    renderHook(() => useBroadcastChannel("cart", onMessage));
    const { result: sender } = renderHook(() => useBroadcastChannel<{ items: number }>("cart"));

    sender.current({ items: 3 });

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledExactlyOnceWith({ items: 3 });
    });
  });

  it("moves to the new channel when the name changes, keeping the same post function", async () => {
    const onA = vi.fn();
    const onB = vi.fn();
    renderHook(() => useBroadcastChannel("a", onA));
    renderHook(() => useBroadcastChannel("b", onB));
    const switcher = renderHook(({ name }) => useBroadcastChannel(name, vi.fn()), {
      initialProps: { name: "a" },
    });
    const post = switcher.result.current;

    switcher.rerender({ name: "b" });
    expect(switcher.result.current).toBe(post);
    post("hello");

    await waitFor(() => {
      expect(onB).toHaveBeenCalledExactlyOnceWith("hello");
    });
    expect(onA).not.toHaveBeenCalled();
  });

  it("stops receiving on the old channel after the name changes", async () => {
    const onMessage = vi.fn();
    const switcher = renderHook(({ name }) => useBroadcastChannel(name, onMessage), {
      initialProps: { name: "a" },
    });
    const { result: senderA } = renderHook(() => useBroadcastChannel("a"));
    const { result: senderB } = renderHook(() => useBroadcastChannel("b"));

    switcher.rerender({ name: "b" });
    senderA.current("old");
    senderB.current("new");

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith("new");
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onMessage).toHaveBeenCalledExactlyOnceWith("new");
  });

  it("calls the latest onMessage without reopening the channel", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const listener = renderHook(({ onMessage }) => useBroadcastChannel("cart", onMessage), {
      initialProps: { onMessage: first },
    });
    const { result: sender } = renderHook(() => useBroadcastChannel("cart"));

    listener.rerender({ onMessage: second });
    sender.current("ping");

    await waitFor(() => {
      expect(second).toHaveBeenCalledExactlyOnceWith("ping");
    });
    expect(first).not.toHaveBeenCalled();
  });

  it("doesn't deliver a message back to the hook that posted it", async () => {
    const own = vi.fn();
    const other = vi.fn();
    const { result } = renderHook(() => useBroadcastChannel("cart", own));
    renderHook(() => useBroadcastChannel("cart", other));

    result.current("hi");

    await waitFor(() => {
      expect(other).toHaveBeenCalledOnce();
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(own).not.toHaveBeenCalled();
  });

  it("renders on the server, where posting does nothing", () => {
    function CartBadge() {
      const post = useBroadcastChannel<string>("cart", vi.fn());
      post("from the server");
      return createElement("span", null, "cart");
    }

    expect(renderToString(createElement(CartBadge))).toBe("<span>cart</span>");
  });

  it("does nothing in browsers without BroadcastChannel", () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    const { result, unmount } = renderHook(() => useBroadcastChannel("cart", vi.fn()));

    expect(() => {
      result.current("ignored");
    }).not.toThrow();
    unmount();
  });

  it("closes the channel on unmount, after which posting does nothing", async () => {
    const onMessage = vi.fn();
    const listener = renderHook(() => useBroadcastChannel("cart", onMessage));
    const sender = renderHook(() => useBroadcastChannel("cart"));
    const post = sender.result.current;

    sender.unmount();
    expect(() => {
      post("after unmount");
    }).not.toThrow();

    listener.unmount();
    const { result: other } = renderHook(() => useBroadcastChannel("cart"));
    other.current("to nobody");

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onMessage).not.toHaveBeenCalled();
  });
});
