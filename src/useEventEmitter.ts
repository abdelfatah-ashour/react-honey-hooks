import { useEffect, useState } from "react";
import { useLatest } from "./useLatest";

/** An event channel between components: one emits values, any number listen. */
export interface EventEmitter<T> {
  /** Calls every current subscriber with `value`. */
  emit: (value: T) => void;
  /** Adds a listener; returns the function that removes it. */
  subscribe: (listener: (value: T) => void) => () => void;
  /** Listens while the calling component is mounted, always calling its latest `listener`. */
  useSubscription: (listener: (value: T) => void) => void;
}

/**
 * Creates an event channel that keeps its identity for the component's lifetime: pass it to
 * other components (by props or context) so they can talk without lifting state, such as a
 * "refresh" signal. `emit(value)` calls every subscriber; `subscribe(listener)` returns an
 * unsubscribe function; `useSubscription(listener)`, called inside a component, listens while
 * that component is mounted and always calls its latest `listener`, so it need not be memoised.
 * Each emit reaches the subscribers there were when it started: one added during it waits for
 * the next emit, and one removed during it still gets this one. Subscribing a function twice
 * calls it twice, and each unsubscribe removes one subscription.
 */
export function useEventEmitter<T = void>(): EventEmitter<T> {
  const [emitter] = useState<EventEmitter<T>>(() => {
    /** One object per subscription, so the same function can subscribe more than once. */
    const subscriptions = new Set<{ listener: (value: T) => void }>();
    const subscribe = (listener: (value: T) => void) => {
      const subscription = { listener };
      subscriptions.add(subscription);
      return () => {
        subscriptions.delete(subscription);
      };
    };
    return {
      emit: (value) => {
        for (const { listener } of [...subscriptions]) listener(value);
      },
      subscribe,
      useSubscription: function useSubscription(listener) {
        const latest = useLatest(listener);
        useEffect(
          () =>
            subscribe((value) => {
              latest.current(value);
            }),
          [latest],
        );
      },
    };
  });
  return emitter;
}
