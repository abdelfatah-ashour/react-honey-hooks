import { useState } from "react";
import { useThrottledCallback } from "./useThrottledCallback";
import { useUpdateEffect } from "./useUpdateEffect";

/**
 * Returns `value`, updated at most once every `ms`: for values that change very often, such as a
 * scroll position or pointer coordinates, when a little lag is fine but waiting for them to stop
 * (as `useDebouncedValue` does) is not. The first value is returned at once, and so is the first
 * change; changes during the wait that follows collapse into one update with the latest value
 * when it ends. With `ms` of 0 or less (or `NaN`) it follows `value` straight away. A pending
 * update is dropped when the component unmounts.
 */
export function useThrottledValue<T>(value: T, ms: number): T {
  const [throttled, setThrottled] = useState(value);
  const update = useThrottledCallback((next: T) => {
    setThrottled(() => next);
  }, ms);
  // The first value is already shown, so only later changes go through the throttle.
  useUpdateEffect(() => {
    update(value);
  }, [update, value]);
  return throttled;
}
