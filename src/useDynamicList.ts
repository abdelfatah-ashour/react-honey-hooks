import { useMemo, useState } from "react";

export interface DynamicList<T> {
  /** The items. */
  readonly list: readonly T[];
  /** The key of the item at `index`, for React's `key`; `undefined` outside the list. */
  readonly getKey: (index: number) => number | undefined;
  /** Inserts `item` before `index`; an index equal to the list's length adds it at the end. */
  readonly insert: (index: number, item: T) => void;
  readonly push: (item: T) => void;
  readonly unshift: (item: T) => void;
  readonly remove: (index: number) => void;
  /** Replaces the item at `index`, keeping its key. */
  readonly replace: (index: number, item: T) => void;
  /** Moves the item at `from` so it ends up at `to`. */
  readonly move: (from: number, to: number) => void;
  /** Removes the last item. */
  readonly pop: () => void;
  /** Removes the first item. */
  readonly shift: () => void;
  /** Replaces the list with `list`, or the first render's list, giving every item a new key. */
  readonly reset: (list?: readonly T[]) => void;
}

interface Entry<T> {
  readonly key: number;
  readonly item: T;
}

/** Whether `index` is a whole number from 0 up to, but not including, `length`. */
function isIndex(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length;
}

/**
 * A list for forms where rows are added, removed and reordered, with a stable key for each
 * item. Returns `{ list, getKey, insert, push, unshift, remove, replace, move, pop, shift, reset
 * }`. `getKey(index)` gives the item's key, which follows the item when others are added,
 * removed or moved, so React keeps each row's DOM and state with it. An index that isn't a
 * whole number within the list is ignored, as are `pop` and `shift` on an empty list; the list
 * then stays the same array. Updates in one event apply in turn. The functions other than
 * `getKey` never change.
 */
export function useDynamicList<T>(initial: readonly T[] = []): DynamicList<T> {
  const [entries, setEntries] = useState<readonly Entry<T>[]>(() =>
    initial.map((item, key) => ({ key, item })),
  );
  const [actions] = useState(() => {
    // Copied, so `reset` is unaffected if the caller later changes the array.
    const first = [...initial];
    let nextKey = initial.length;
    const entry = (item: T): Entry<T> => ({ key: nextKey++, item });
    /**
     * Applies `change` to a copy of the entries when `ok` holds for the current entries, and
     * keeps the same entries otherwise.
     */
    const edit = (
      ok: (current: readonly Entry<T>[]) => boolean,
      change: (copy: Entry<T>[]) => void,
    ) => {
      setEntries((current) => {
        if (!ok(current)) return current;
        const copy = [...current];
        change(copy);
        return copy;
      });
    };
    const always = () => true;
    const notEmpty = (current: readonly Entry<T>[]) => current.length > 0;
    return {
      insert: (index: number, item: T) => {
        edit(
          (current) => isIndex(index, current.length + 1),
          (copy) => copy.splice(index, 0, entry(item)),
        );
      },
      push: (item: T) => {
        edit(always, (copy) => copy.push(entry(item)));
      },
      unshift: (item: T) => {
        edit(always, (copy) => copy.unshift(entry(item)));
      },
      remove: (index: number) => {
        edit(
          (current) => isIndex(index, current.length),
          (copy) => copy.splice(index, 1),
        );
      },
      replace: (index: number, item: T) => {
        edit(
          (current) => isIndex(index, current.length),
          (copy) => {
            const { key } = copy[index] as Entry<T>;
            copy[index] = { key, item };
          },
        );
      },
      move: (from: number, to: number) => {
        edit(
          (current) => from !== to && isIndex(from, current.length) && isIndex(to, current.length),
          (copy) => {
            const [moved] = copy.splice(from, 1) as [Entry<T>];
            copy.splice(to, 0, moved);
          },
        );
      },
      pop: () => {
        edit(notEmpty, (copy) => copy.pop());
      },
      shift: () => {
        edit(notEmpty, (copy) => copy.shift());
      },
      reset: (list: readonly T[] = first) => {
        setEntries(list.map(entry));
      },
    };
  });
  const list = useMemo(() => entries.map(({ item }) => item), [entries]);
  const getKey = (index: number) => entries[index]?.key;
  return { list, getKey, ...actions };
}
