import { type DependencyList, type EffectCallback, useEffect, useState } from "react";

/** Whether `value` is an array or a plain object (made by `{}` or `Object.create(null)`). */
function isPlain(value: object): boolean {
  if (Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

/**
 * Whether `a` and `b` hold the same data: primitives by `Object.is`; arrays and plain objects
 * by their own enumerable keys, deeply; dates by time; regular expressions by source and flags;
 * maps by keys (by identity) and values (deeply); sets by members (by identity). Any other
 * objects only when they are the same object.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (a instanceof Date && b instanceof Date) return Object.is(a.getTime(), b.getTime());
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }
  if (a instanceof Map && b instanceof Map) {
    return (
      a.size === b.size &&
      [...a].every(([key, value]) => b.has(key) && deepEqual(value, b.get(key)))
    );
  }
  if (a instanceof Set && b instanceof Set) {
    return a.size === b.size && [...a].every((member) => b.has(member));
  }
  if (!isPlain(a) || !isPlain(b) || Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  return (
    aKeys.length === Object.keys(b).length &&
    aKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    )
  );
}

/**
 * `useEffect` that compares `deps` by their contents rather than by identity, so a new object or
 * array with the same data (such as one created during render) doesn't re-run the effect.
 * Primitives are compared with `Object.is`; arrays and plain objects key by key, deeply; dates by
 * time; regular expressions by source and flags; maps by keys and (deeply) values; sets by
 * members. Other objects, such as class instances, must be the same object. The cleanup runs
 * before each re-run and on unmount, as with `useEffect`. Comparing walks the whole of `deps`
 * on every render, so keep them to plain, modest data without cycles.
 */
export function useDeepCompareEffect(effect: EffectCallback, deps: DependencyList): void {
  // Only replaced when the contents change, so its identity is what the effect depends on.
  // Setting state during render is React's pattern for deriving it from props.
  const [stableDeps, setStableDeps] = useState(deps);
  if (!deepEqual(stableDeps, deps)) setStableDeps(deps);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs when deps change deeply.
  useEffect(effect, [stableDeps]);
}
