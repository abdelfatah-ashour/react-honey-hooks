import { useEffect, useRef, useState } from "react";
import { useLatest } from "./useLatest";

export type WebSocketReadyState = "connecting" | "open" | "closing" | "closed";

export interface ReconnectOptions {
  /** How many times to try in a row before giving up. Defaults to 3. */
  attempts?: number;
  /** How long to wait before each try, in milliseconds. Defaults to 3000. */
  intervalMs?: number;
}

export interface WebSocketOptions {
  /** The subprotocols to ask the server for. */
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  /** How to reconnect after the connection closes unexpectedly, or `false` not to. */
  reconnect?: ReconnectOptions | false;
}

/** What a WebSocket can send. */
export type WebSocketData = Parameters<WebSocket["send"]>[0];

export interface WebSocketConnection {
  readonly readyState: WebSocketReadyState;
  /** The last message received, or `null` before the first. */
  readonly lastMessage: MessageEvent | null;
  /** Sends `data` if the connection is open; returns whether it did. */
  readonly send: (data: WebSocketData) => boolean;
  /** Opens a new connection if there is none open or opening. */
  readonly connect: () => void;
  /** Closes the connection, without reconnecting. */
  readonly disconnect: () => void;
}

/** `WebSocket.OPEN`, without reading the global, which may not exist on the server. */
const OPEN = 1;

interface Controls {
  connect: () => void;
  disconnect: () => void;
}

const NO_CONTROLS: Controls = {
  connect: () => undefined,
  disconnect: () => undefined,
};

/**
 * Connects to a WebSocket server at `url` while the component is mounted. Returns `{
 * readyState, lastMessage, send, connect, disconnect }`. `send` sends only while the connection
 * is open and returns whether it did. If the connection closes without the page asking (the
 * server goes away, the network drops), it reconnects up to `reconnect.attempts` times in a row,
 * `reconnect.intervalMs` apart, counting again from zero once a connection opens; pass
 * `reconnect: false` to stop that. `disconnect` closes without reconnecting, and `connect` opens
 * a new connection. A `null` url means no connection, and changing `url` closes the old
 * connection and opens one to the new url. Unmounting closes the connection and cancels any
 * pending reconnect. The latest callbacks are always called, without reconnecting, and the
 * functions keep their identity. On the server it is closed and sends nothing.
 */
export function useWebSocket(
  url: string | null,
  options: WebSocketOptions = {},
): WebSocketConnection {
  const [readyState, setReadyState] = useState<WebSocketReadyState>("closed");
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const latest = useLatest(options);
  const socketRef = useRef<WebSocket | null>(null);
  const controls = useRef<Controls>(NO_CONTROLS);

  useEffect(() => {
    if (url === null) return;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let closedByUs = false;

    const open = () => {
      timer = undefined;
      const current = new WebSocket(url, latest.current.protocols);
      socket = current;
      socketRef.current = current;
      setReadyState("connecting");
      current.addEventListener("open", (event) => {
        if (socket !== current) return;
        attempts = 0;
        setReadyState("open");
        latest.current.onOpen?.(event);
      });
      current.addEventListener("message", (event) => {
        if (socket !== current) return;
        setLastMessage(event);
        latest.current.onMessage?.(event);
      });
      current.addEventListener("error", (event) => {
        if (socket !== current) return;
        latest.current.onError?.(event);
      });
      current.addEventListener("close", (event) => {
        if (socket !== current) return;
        setReadyState("closed");
        latest.current.onClose?.(event);
        const { reconnect } = latest.current;
        if (closedByUs || reconnect === false) return;
        const { attempts: max = 3, intervalMs = 3000 } = reconnect ?? {};
        if (attempts >= max) return;
        attempts++;
        timer = setTimeout(open, intervalMs);
      });
    };

    controls.current = {
      connect: () => {
        if (socket && socket.readyState <= OPEN) return;
        closedByUs = false;
        attempts = 0;
        clearTimeout(timer);
        open();
      },
      disconnect: () => {
        closedByUs = true;
        clearTimeout(timer);
        timer = undefined;
        if (!socket || socket.readyState > OPEN) return;
        socket.close();
        setReadyState("closing");
      },
    };

    open();
    return () => {
      controls.current = NO_CONTROLS;
      closedByUs = true;
      clearTimeout(timer);
      const closing = socket;
      socket = null;
      socketRef.current = null;
      closing?.close();
    };
  }, [latest, url]);

  const [send] = useState(() => (data: WebSocketData) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== OPEN) return false;
    socket.send(data);
    return true;
  });

  const [actions] = useState(() => ({
    connect: () => {
      controls.current.connect();
    },
    disconnect: () => {
      controls.current.disconnect();
    },
  }));

  // With no url there is no connection, whatever the last one did.
  return { readyState: url === null ? "closed" : readyState, lastMessage, send, ...actions };
}
