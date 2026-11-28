import { useState } from "react";

/** What `useSetState`'s setter takes: the keys to change, or a function computing them. */
export type StatePatch<T> = Partial<T> | ((current: T) => Partial<T>);

/** The setter `useSetState` returns. */
export type SetMergedState<T> = (patch: StatePatch<T>) => void;

/** Whether merging `patch` into `current` would change any key, by `Object.is`. */
function changes<T extends object>(current: T, patch: Partial<T>): boolean {
  return Object.keys(patch).some(
    (key) =>
      !(key in current) ||
      !Object.is(current[key as keyof T], (patch as Record<string, unknown>)[key]),
  );
}

/**
 * Object state that merges updates, like a class component's `setState`. Returns `[state,
 * setState]`: `setState(patch)` shallowly merges `patch` into the state, and
 * `setState(current => patch)` computes the patch from the current state, so several updates in
 * one event all apply. A patch that changes nothing (empty, `null` or `undefined`, or only
 * values the state already has, by `Object.is`) keeps the same state object and doesn't
 * re-render. `initial` can be a function, called once. `setState` never changes.
 */
export function useSetState<T extends object>(
  initial: T | (() => T),
): readonly [T, SetMergedState<T>] {
  const [state, setState] = useState(initial);
  const [merge] = useState<SetMergedState<T>>(() => (patch: StatePatch<T>) => {
    setState((current) => {
      // `null` and `undefined` aren't allowed by the types but are easy to return by mistake.
      const resolved = (typeof patch === "function" ? patch(current) : patch) as
        Partial<T> | null | undefined;
      if (resolved == null || !changes(current, resolved)) return current;
      return { ...current, ...resolved };
    });
  });
  return [state, merge] as const;
}
