import { useState } from "react";
import { useLatest } from "./useLatest";

/** What a form field holds: a checkbox's `checked` state, or any other field's `value`. */
export type FieldValue = string | boolean;

/** The functions `useEventTarget` returns alongside the value. */
export interface EventTargetActions {
  /** Pass to a field's `onChange`: reads its value (a checkbox's `checked` state). */
  onChange: (event: { target: EventTarget | null }) => void;
  /** Goes back to the initial value. */
  reset: () => void;
}

export interface EventTargetOptions<T> {
  /** The value before any change, and after `reset`. */
  initialValue: T;
  /** Maps each new field value to the value to keep, such as text to a number. */
  transform?: (value: FieldValue) => T;
}

/** The field's value: `checked` for a checkbox, `value` for anything else that has one. */
function readField(target: EventTarget | null): FieldValue | undefined {
  if (target instanceof HTMLInputElement && target.type === "checkbox") return target.checked;
  if (target !== null && "value" in target && typeof target.value === "string") return target.value;
  return undefined;
}

/**
 * State bound to a form field. Returns `[value, { onChange, reset }]`: pass `value` and
 * `onChange` to an `<input>`, `<textarea>` or `<select>`. `onChange` reads the field's `value`,
 * or a checkbox's `checked` state, and `transform` (if given) maps it to the value to keep, such
 * as text to a number. `reset` goes back to `initialValue`. Events from elements with no value
 * are ignored. `onChange` and `reset` never change, and the latest `transform` is always used.
 */
export function useEventTarget<T>(
  options: EventTargetOptions<T> & { transform: (value: FieldValue) => T },
): readonly [T, EventTargetActions];
export function useEventTarget(options: {
  initialValue: string;
}): readonly [string, EventTargetActions];
export function useEventTarget(options: {
  initialValue: boolean;
}): readonly [boolean, EventTargetActions];
export function useEventTarget<T>({
  initialValue,
  transform,
}: EventTargetOptions<T>): readonly [T, EventTargetActions] {
  const [value, setValue] = useState(initialValue);
  const latestTransform = useLatest(transform);
  const [actions] = useState<EventTargetActions>(() => ({
    onChange: (event) => {
      const raw = readField(event.target);
      if (raw === undefined) return;
      const next = latestTransform.current ? latestTransform.current(raw) : (raw as T);
      // Wrapped so a function value is stored as is rather than called as an updater.
      setValue(() => next);
    },
    reset: () => {
      setValue(() => initialValue);
    },
  }));
  return [value, actions] as const;
}
