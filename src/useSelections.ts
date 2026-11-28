import { useEffect, useRef, useState } from "react";

export interface SelectionsOptions<T> {
  /** The items selected at first. */
  defaultSelected?: readonly T[];
  /**
   * What identifies an item, such as `(row) => row.id`. Defaults to the item itself, so object
   * items must then be the same objects.
   */
  getKey?: (item: T) => unknown;
}

export interface Selections<T> {
  /** The selected items, in the order of `items`. */
  readonly selected: T[];
  readonly isSelected: (item: T) => boolean;
  readonly select: (item: T) => void;
  readonly unselect: (item: T) => void;
  readonly toggle: (item: T) => void;
  /** Selects every item in `items`. */
  readonly selectAll: () => void;
  /** Clears the selection. */
  readonly unselectAll: () => void;
  /** Clears the selection if every item is selected, and selects every item if not. */
  readonly toggleAll: () => void;
  /** Replaces the selection with `items`. */
  readonly setSelected: (items: readonly T[]) => void;
  /** Whether every item is selected; `false` when there are no items. */
  readonly allSelected: boolean;
  readonly noneSelected: boolean;
  /** Whether some, but not all, items are selected: a select-all checkbox's indeterminate state. */
  readonly partiallySelected: boolean;
}

const identity = (item: unknown) => item;

/**
 * Tracks which of `items` are selected, as for a list with checkboxes and a select-all box.
 * Returns `{ selected, isSelected, select, unselect, toggle, selectAll, unselectAll, toggleAll,
 * setSelected, allSelected, noneSelected, partiallySelected }`. Items are matched by `getKey`,
 * so a selection survives new objects for the same items (after a refetch, say). `selected`
 * lists only items currently in `items`, in their order; a selected item that leaves the list
 * is selected again if it comes back. The flags are worked out from `items`, so with no items
 * `allSelected` is `false`. The actions never change and always use the latest `items` and
 * `getKey`.
 */
export function useSelections<T>(
  items: readonly T[],
  { defaultSelected = [], getKey = identity }: SelectionsOptions<T> = {},
): Selections<T> {
  const [keys, setKeys] = useState<ReadonlySet<unknown>>(
    () => new Set(defaultSelected.map(getKey)),
  );
  const latest = useRef({ items, getKey });
  useEffect(() => {
    latest.current = { items, getKey };
  });

  const [actions] = useState(() => {
    const keyOf = (item: T) => latest.current.getKey(item);
    const everySelected = (current: ReadonlySet<unknown>) =>
      latest.current.items.length > 0 &&
      latest.current.items.every((item) => current.has(keyOf(item)));
    const withAll = (current: ReadonlySet<unknown>) =>
      new Set([...current, ...latest.current.items.map(keyOf)]);
    return {
      select: (item: T) => {
        setKeys((current) => new Set(current).add(keyOf(item)));
      },
      unselect: (item: T) => {
        setKeys((current) => {
          const next = new Set(current);
          next.delete(keyOf(item));
          return next;
        });
      },
      toggle: (item: T) => {
        setKeys((current) => {
          const next = new Set(current);
          if (!next.delete(keyOf(item))) next.add(keyOf(item));
          return next;
        });
      },
      selectAll: () => {
        setKeys(withAll);
      },
      unselectAll: () => {
        setKeys(new Set());
      },
      setSelected: (selected: readonly T[]) => {
        setKeys(new Set(selected.map(keyOf)));
      },
      toggleAll: () => {
        setKeys((current) => (everySelected(current) ? new Set() : withAll(current)));
      },
    };
  });

  const isSelected = (item: T) => keys.has(getKey(item));
  const selected = items.filter(isSelected);
  const allSelected = items.length > 0 && selected.length === items.length;
  return {
    selected,
    isSelected,
    ...actions,
    allSelected,
    noneSelected: selected.length === 0,
    partiallySelected: selected.length > 0 && !allSelected,
  };
}
