import { useEffect, useRef, useState } from "react";

/** The props of a component whose value can be controlled by its parent or kept inside it. */
export interface ControllableValueProps<T> {
  /** The value, when the parent controls it. `undefined` means uncontrolled; `null` doesn't. */
  value?: T | undefined;
  /** The starting value when uncontrolled. */
  defaultValue?: T | undefined;
  /** Called with every value the component sets. */
  onChange?: ((value: T) => void) | undefined;
}

/** Sets the value, or computes it from the current value. */
export type SetControllableValue<T, Current = T> = (next: T | ((current: Current) => T)) => void;

/**
 * The value of a component that can be either controlled, like `<input value onChange>`, or
 * uncontrolled, like `<input defaultValue>`. Returns `[value, setValue]`. When `value` is not
 * `undefined` the component is controlled: it shows `value`, and `setValue` only calls
 * `onChange` for the parent to apply. Otherwise it keeps its own value, starting at
 * `defaultValue`, and `setValue` updates it and calls `onChange`. `setValue` takes a value or a
 * function of the current value; uncontrolled updates in one event apply in turn. `onChange` is
 * called on every `setValue`, even with the same value. If the parent stops controlling the
 * value, it stays at the last controlled value. The latest `onChange` is always used, and
 * `setValue` never changes.
 */
export function useControllableValue<T>(
  props: ControllableValueProps<T> & ({ value: T } | { defaultValue: T }),
): readonly [T, SetControllableValue<T>];
export function useControllableValue<T>(
  props?: ControllableValueProps<T>,
): readonly [T | undefined, SetControllableValue<T, T | undefined>];
export function useControllableValue<T>({
  value,
  defaultValue,
  onChange,
}: ControllableValueProps<T> = {}): readonly [
  T | undefined,
  SetControllableValue<T, T | undefined>,
] {
  const [internal, setInternal] = useState(defaultValue);
  const controlled = value !== undefined;
  // While controlled, the own value follows the prop, so if the prop is taken away the value
  // stays where it was. Setting state during render is React's pattern for deriving it from props.
  if (controlled && !Object.is(internal, value)) setInternal(() => value);
  const current = controlled ? value : internal;

  const latest = useRef({ controlled, current, onChange });
  useEffect(() => {
    latest.current = { controlled, current, onChange };
  });

  const [set] = useState(() => (next: T | ((current: T | undefined) => T)) => {
    const resolved =
      typeof next === "function"
        ? (next as (current: T | undefined) => T)(latest.current.current)
        : next;
    if (!latest.current.controlled) {
      // Seen by the next update in the same batch, before the re-render.
      latest.current = { ...latest.current, current: resolved };
      setInternal(() => resolved);
    }
    latest.current.onChange?.(resolved);
  });
  return [current, set] as const;
}
