import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useDynamicList } from "./useDynamicList";

describe("useDynamicList", () => {
  it("starts from the initial list, and adds items at the end, the start or an index", () => {
    const { result } = renderHook(() => useDynamicList(["b"]));
    expect(result.current.list).toEqual(["b"]);

    act(() => {
      result.current.push("d");
      result.current.unshift("a");
      result.current.insert(2, "c");
    });
    expect(result.current.list).toEqual(["a", "b", "c", "d"]);
  });

  it("removes, replaces and moves items, and drops them from either end", () => {
    const { result } = renderHook(() => useDynamicList(["a", "b", "c", "d", "e"]));

    act(() => {
      result.current.remove(1);
      result.current.replace(0, "A");
    });
    expect(result.current.list).toEqual(["A", "c", "d", "e"]);

    act(() => {
      result.current.move(0, 3);
    });
    expect(result.current.list).toEqual(["c", "d", "e", "A"]);

    act(() => {
      result.current.move(2, 0);
    });
    expect(result.current.list).toEqual(["e", "c", "d", "A"]);

    act(() => {
      result.current.pop();
      result.current.shift();
    });
    expect(result.current.list).toEqual(["c", "d"]);
  });

  it("gives each item a key that follows it through inserts, removals and moves", () => {
    const { result } = renderHook(() => useDynamicList(["a", "b", "c"]));
    const keyOf = (item: string) => result.current.getKey(result.current.list.indexOf(item));
    const before = { a: keyOf("a"), b: keyOf("b"), c: keyOf("c") };
    expect(new Set(Object.values(before)).size).toBe(3);

    act(() => {
      result.current.unshift("z");
      result.current.remove(2);
      result.current.move(0, 2);
      result.current.replace(0, "A");
    });
    expect(result.current.list).toEqual(["A", "c", "z"]);
    expect(keyOf("c")).toBe(before.c);
    expect(keyOf("A")).toBe(before.a);
    expect([before.a, before.b, before.c]).not.toContain(keyOf("z"));

    act(() => {
      result.current.push("b");
    });
    expect(keyOf("b")).not.toBe(before.b);
  });

  it("has no key for an index outside the list", () => {
    const { result } = renderHook(() => useDynamicList(["a"]));

    expect(result.current.getKey(1)).toBeUndefined();
    expect(result.current.getKey(-1)).toBeUndefined();
  });

  it("ignores indexes outside the list, negative, fractional or NaN, keeping the same list", () => {
    const { result } = renderHook(() => useDynamicList(["a", "b"]));
    const before = result.current.list;

    act(() => {
      for (const index of [-1, 2, 0.5, Number.NaN]) {
        result.current.remove(index);
        result.current.replace(index, "x");
        result.current.move(index, 0);
        result.current.move(0, index);
      }
      result.current.insert(3, "x");
      result.current.insert(-1, "x");
      result.current.insert(Number.NaN, "x");
    });
    expect(result.current.list).toBe(before);
  });

  it("inserts at the very end when the index is the list's length", () => {
    const { result } = renderHook(() => useDynamicList(["a"]));

    act(() => {
      result.current.insert(1, "b");
    });
    expect(result.current.list).toEqual(["a", "b"]);
  });

  it("keeps the same list when popping or shifting an empty list, or moving an item onto itself", () => {
    const { result } = renderHook(() => useDynamicList<string>());
    const empty = result.current.list;

    act(() => {
      result.current.pop();
      result.current.shift();
    });
    expect(result.current.list).toBe(empty);

    act(() => {
      result.current.push("a");
    });
    const one = result.current.list;
    act(() => {
      result.current.move(0, 0);
    });
    expect(result.current.list).toBe(one);
  });

  it("resets to the first render's list, or replaces the list, giving every item a new key", () => {
    const { result, rerender } = renderHook(({ initial }) => useDynamicList(initial), {
      initialProps: { initial: ["a", "b"] },
    });
    const oldKeys = [result.current.getKey(0), result.current.getKey(1)];

    rerender({ initial: ["z"] });
    act(() => {
      result.current.push("c");
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.list).toEqual(["a", "b"]);
    expect(oldKeys).not.toContain(result.current.getKey(0));

    act(() => {
      result.current.reset(["x", "y", "z"]);
    });
    expect(result.current.list).toEqual(["x", "y", "z"]);
    const keys = [0, 1, 2].map((index) => result.current.getKey(index));
    expect(new Set(keys).size).toBe(3);
  });

  it("keeps the same actions and list across renders that change nothing", () => {
    const { result, rerender } = renderHook(() => useDynamicList(["a"]));
    const { list, push, move, reset } = result.current;

    rerender();
    expect(result.current.list).toBe(list);
    act(() => {
      push("b");
    });
    expect(result.current.push).toBe(push);
    expect(result.current.move).toBe(move);
    expect(result.current.reset).toBe(reset);
  });

  it("renders on the server, where window and document don't exist, with the same keys", () => {
    function Probe() {
      const { list, getKey } = useDynamicList(["a", "b"]);
      return list.map((item, index) => `${item}${String(getKey(index))}`).join(",");
    }

    const onServer = renderOnServer(createElement(Probe));
    const { result } = renderHook(() => useDynamicList(["a", "b"]));
    expect(onServer).toBe(
      result.current.list
        .map((item, index) => `${item}${String(result.current.getKey(index))}`)
        .join(","),
    );
  });
});
