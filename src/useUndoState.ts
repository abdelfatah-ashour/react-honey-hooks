import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

/** Sets a new value, or the result of calling it with the current value. */
export type SetUndoState<T> = (value: T | ((previous: T) => T)) => void;

export interface UndoStateOptions {
  /** How many steps can be undone; the oldest are dropped beyond it. Defaults to 100. */
  limit?: number;
}

export interface UndoControls {
  readonly undo: () => void;
  readonly redo: () => void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** Forgets every step to undo and redo, keeping the current value. */
  readonly clearHistory: () => void;
}

interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

type Action<T> =
  | { type: "set"; next: T | ((previous: T) => T); limit: number }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "clear" };

/** The last `limit` entries; a limit that isn't a number of 0 or more keeps none. */
function keepLast<T>(entries: T[], limit: number): T[] {
  const max = limit >= 0 ? Math.floor(limit) : 0;
  return entries.length > max ? entries.slice(entries.length - max) : entries;
}

function reducer<T>(history: History<T>, action: Action<T>): History<T> {
  const { past, present, future } = history;
  switch (action.type) {
    case "set": {
      const next = action.next instanceof Function ? action.next(present) : action.next;
      if (Object.is(next, present)) return history;
      return { past: keepLast([...past, present], action.limit), present: next, future: [] };
    }
    case "undo": {
      if (past.length === 0) return history;
      const previous = past[past.length - 1] as T;
      return { past: past.slice(0, -1), present: previous, future: [present, ...future] };
    }
    case "clear":
      return { past: [], present, future: [] };
    case "redo": {
      if (future.length === 0) return history;
      const [next, ...rest] = future;
      return { past: [...past, present], present: next as T, future: rest };
    }
  }
}

/**
 * Like `useState`, with history: returns `[value, set, { undo, redo, canUndo, canRedo,
 * clearHistory }]`. Each `set` that changes the value adds a step to undo; setting a new value
 * after undoing clears the steps to redo. Up to `limit` (100 by default) steps are kept, the
 * oldest dropped first; a limit of 0 keeps none. `initial` and `set` work as in `useState`,
 * including updater and initializer functions. `set`, `undo`, `redo` and `clearHistory` keep
 * their identity for the component's lifetime.
 */
export function useUndoState<T>(
  initial: T | (() => T),
  { limit = 100 }: UndoStateOptions = {},
): readonly [T, SetUndoState<T>, UndoControls] {
  const [history, dispatch] = useReducer(reducer<T>, initial, (value) => ({
    past: [],
    present: value instanceof Function ? value() : value,
    future: [],
  }));
  const latestLimit = useRef(limit);
  useEffect(() => {
    latestLimit.current = limit;
  });

  const set = useCallback<SetUndoState<T>>((next) => {
    dispatch({ type: "set", next, limit: latestLimit.current });
  }, []);
  const undo = useCallback(() => {
    dispatch({ type: "undo" });
  }, []);
  const redo = useCallback(() => {
    dispatch({ type: "redo" });
  }, []);
  const clearHistory = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const controls = useMemo(
    () => ({ undo, redo, canUndo, canRedo, clearHistory }),
    [undo, redo, canUndo, canRedo, clearHistory],
  );

  return [history.present, set, controls];
}
