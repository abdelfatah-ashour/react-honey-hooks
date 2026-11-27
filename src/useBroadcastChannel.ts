import { useEffect, useRef, useState } from "react";

/**
 * Sends and receives messages on the `BroadcastChannel` called `name`, which links every tab,
 * window and iframe of the same origin. Returns a `post` function that keeps its identity for
 * the component's life; the latest `onMessage` receives messages from everyone else on the
 * channel, but not the hook's own. Changing `name` moves to that channel, and unmounting closes
 * it. Messages are copied with the structured clone algorithm and are not type-checked: `T` is
 * what you expect other tabs to send. On the server, before mount, after unmount, and in
 * browsers without `BroadcastChannel`, `post` does nothing.
 */
export function useBroadcastChannel<T>(
  name: string,
  onMessage?: (message: T) => void,
): (message: T) => void {
  const latest = useRef(onMessage);
  const channel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    latest.current = onMessage;
  });

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const opened = new BroadcastChannel(name);
    opened.onmessage = (event: MessageEvent<T>) => {
      latest.current?.(event.data);
    };
    channel.current = opened;
    return () => {
      opened.close();
      if (channel.current === opened) channel.current = null;
    };
  }, [name]);

  const [post] = useState(() => (message: T) => {
    channel.current?.postMessage(message);
  });
  return post;
}
