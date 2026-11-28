import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useWebSocket } from "./useWebSocket";

/**
 * A stand-in for the browser's WebSocket, which jsdom would connect for real. Tests drive the
 * server side: `open`, `receive`, and `drop` (the connection closing without the page asking).
 */
class FakeWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static all: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  readonly sent: unknown[] = [];

  constructor(
    readonly url: string,
    readonly protocols?: string | string[],
  ) {
    super();
    FakeWebSocket.all.push(this);
  }

  send(data: unknown) {
    if (this.readyState !== FakeWebSocket.OPEN) throw new Error("not open");
    this.sent.push(data);
  }

  close() {
    if (this.readyState >= FakeWebSocket.CLOSING) return;
    this.readyState = FakeWebSocket.CLOSING;
    // The browser finishes closing a moment later.
    queueMicrotask(() => {
      this.finishClose(1000);
    });
  }

  open() {
    act(() => {
      this.readyState = FakeWebSocket.OPEN;
      this.dispatchEvent(new Event("open"));
    });
  }

  receive(data: string) {
    act(() => {
      this.dispatchEvent(new MessageEvent("message", { data }));
    });
  }

  drop() {
    act(() => {
      this.finishClose(1006);
    });
  }

  private finishClose(code: number) {
    if (this.readyState === FakeWebSocket.CLOSED) return;
    this.readyState = FakeWebSocket.CLOSED;
    this.dispatchEvent(new CloseEvent("close", { code }));
  }
}

/** The newest socket the hook created. */
function latest(): FakeWebSocket {
  const socket = FakeWebSocket.all.at(-1);
  if (!socket) throw new Error("no socket was created");
  return socket;
}

beforeEach(() => {
  FakeWebSocket.all = [];
  vi.stubGlobal("WebSocket", FakeWebSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useWebSocket", () => {
  it("connects on mount, reports when it opens, and passes on each message", () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket("wss://example.com/live", { protocols: "chat", onMessage }),
    );
    expect(latest()).toMatchObject({ url: "wss://example.com/live", protocols: "chat" });
    expect(result.current.readyState).toBe("connecting");

    latest().open();
    expect(result.current.readyState).toBe("open");

    latest().receive("hello");
    expect(result.current.lastMessage?.data).toBe("hello");
    expect(onMessage).toHaveBeenCalledOnce();
    expect(onMessage.mock.calls[0]?.[0]).toBeInstanceOf(MessageEvent);
  });

  it("sends only while open, returning whether it sent", () => {
    const { result } = renderHook(() => useWebSocket("wss://example.com"));
    expect(result.current.send("too early")).toBe(false);

    latest().open();
    expect(result.current.send("hi")).toBe(true);
    expect(latest().sent).toEqual(["hi"]);
  });

  it("calls onOpen, onError and onClose with their events", () => {
    const onOpen = vi.fn();
    const onError = vi.fn();
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket("wss://example.com", { onOpen, onError, onClose, reconnect: false }),
    );

    latest().open();
    expect(onOpen).toHaveBeenCalledOnce();

    act(() => {
      latest().dispatchEvent(new Event("error"));
    });
    expect(onError).toHaveBeenCalledOnce();

    latest().drop();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onClose.mock.calls[0]?.[0]).toMatchObject({ code: 1006 });
    expect(result.current.readyState).toBe("closed");
  });

  it("reconnects after an unexpected close, up to attempts times, intervalMs apart", () => {
    const { result } = renderHook(() =>
      useWebSocket("wss://example.com", { reconnect: { attempts: 2, intervalMs: 1000 } }),
    );
    latest().drop();
    expect(FakeWebSocket.all).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(FakeWebSocket.all).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(FakeWebSocket.all).toHaveLength(2);
    expect(result.current.readyState).toBe("connecting");

    latest().drop();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    latest().drop();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(FakeWebSocket.all).toHaveLength(3);
    expect(result.current.readyState).toBe("closed");
  });

  it("starts counting attempts again after a reconnect opens, and uses 3 attempts 3 s apart by default", () => {
    renderHook(() => useWebSocket("wss://example.com"));

    for (let round = 0; round < 3; round++) {
      latest().drop();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      latest().open();
    }
    expect(FakeWebSocket.all).toHaveLength(4);

    for (let attempt = 0; attempt < 5; attempt++) {
      latest().drop();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
    }
    expect(FakeWebSocket.all).toHaveLength(7);
  });

  it("doesn't reconnect when reconnect is false", () => {
    renderHook(() => useWebSocket("wss://example.com", { reconnect: false }));

    latest().drop();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(FakeWebSocket.all).toHaveLength(1);
  });

  it("disconnect closes without reconnecting, and connect opens a new connection", async () => {
    const { result } = renderHook(() => useWebSocket("wss://example.com"));
    latest().open();

    act(() => {
      result.current.disconnect();
    });
    expect(result.current.readyState).toBe("closing");
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.readyState).toBe("closed");
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(FakeWebSocket.all).toHaveLength(1);

    act(() => {
      result.current.connect();
      result.current.connect();
    });
    expect(FakeWebSocket.all).toHaveLength(2);
    expect(result.current.readyState).toBe("connecting");
  });

  it("makes no connection while url is null, and switches connection when url changes", () => {
    const initialProps: { url: string | null } = { url: null };
    const { result, rerender } = renderHook(({ url }) => useWebSocket(url), { initialProps });
    expect(FakeWebSocket.all).toHaveLength(0);
    expect(result.current.readyState).toBe("closed");
    act(() => {
      result.current.connect();
    });
    expect(FakeWebSocket.all).toHaveLength(0);

    rerender({ url: "wss://example.com/a" });
    const first = latest();
    first.open();
    rerender({ url: "wss://example.com/b" });
    expect(first.readyState).toBe(FakeWebSocket.CLOSING);
    expect(latest().url).toBe("wss://example.com/b");
    expect(result.current.readyState).toBe("connecting");

    rerender({ url: null });
    expect(latest().readyState).toBe(FakeWebSocket.CLOSING);
    expect(result.current.readyState).toBe("closed");
  });

  it("closes the connection and cancels a pending reconnect on unmount", () => {
    const { unmount } = renderHook(() => useWebSocket("wss://example.com"));
    latest().drop();

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(FakeWebSocket.all).toHaveLength(1);

    const second = renderHook(() => useWebSocket("wss://example.com"));
    latest().open();
    second.unmount();
    expect(latest().readyState).toBe(FakeWebSocket.CLOSING);
  });

  it("calls the latest callbacks without reconnecting, and keeps its functions across renders", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ onMessage }) => useWebSocket("wss://example.com", { onMessage }),
      { initialProps: { onMessage: first } },
    );
    const { send, connect, disconnect } = result.current;
    latest().open();

    rerender({ onMessage: second });
    latest().receive("hi");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expect(FakeWebSocket.all).toHaveLength(1);
    expect(result.current).toMatchObject({ send, connect, disconnect });
  });

  it("is closed with no message on the server, where window and document don't exist", () => {
    function Probe() {
      const { readyState, lastMessage, send } = useWebSocket("wss://example.com");
      return `${readyState}:${lastMessage === null ? "none" : "some"}:${String(send("x"))}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("closed:none:false");
    expect(FakeWebSocket.all).toHaveLength(0);
  });
});
