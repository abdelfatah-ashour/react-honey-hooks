import { act, renderHook } from "@testing-library/react";
import { useUndoState } from "./useUndoState";

describe("useUndoState", () => {
  it("starts at the initial value, then holds the value set", () => {
    const { result } = renderHook(() => useUndoState("draft"));
    expect(result.current[0]).toBe("draft");

    act(() => {
      result.current[1]("final");
    });

    expect(result.current[0]).toBe("final");
  });

  it("undo and redo step back and forward through the values set", () => {
    const { result } = renderHook(() => useUndoState(1));
    expect(result.current[2]).toMatchObject({ canUndo: false, canRedo: false });
    act(() => {
      result.current[1](2);
    });
    act(() => {
      result.current[1](3);
    });

    act(() => {
      result.current[2].undo();
    });
    expect(result.current[0]).toBe(2);
    act(() => {
      result.current[2].undo();
    });
    expect(result.current[0]).toBe(1);
    expect(result.current[2]).toMatchObject({ canUndo: false, canRedo: true });

    act(() => {
      result.current[2].redo();
    });
    expect(result.current[0]).toBe(2);
    expect(result.current[2]).toMatchObject({ canUndo: true, canRedo: true });
  });

  it("adds no history entry when set to the value it already has", () => {
    const { result } = renderHook(() => useUndoState("a"));
    act(() => {
      result.current[1]("b");
    });

    act(() => {
      result.current[1]("b");
      result.current[1]((value) => value);
    });
    act(() => {
      result.current[2].undo();
    });

    expect(result.current[0]).toBe("a");
  });

  it("keeps at most limit steps to undo, dropping the oldest", () => {
    const { result } = renderHook(() => useUndoState(0, { limit: 2 }));
    for (const value of [1, 2, 3]) {
      act(() => {
        result.current[1](value);
      });
    }

    act(() => {
      result.current[2].undo();
    });
    act(() => {
      result.current[2].undo();
    });
    act(() => {
      result.current[2].undo();
    });

    expect(result.current[0]).toBe(1);
    expect(result.current[2].canUndo).toBe(false);
  });

  it.each([0, -1, Number.NaN])("with a limit of %s, keeps no history", (limit) => {
    const { result } = renderHook(() => useUndoState("a", { limit }));

    act(() => {
      result.current[1]("b");
    });

    expect(result.current[2].canUndo).toBe(false);
  });

  it("clearHistory keeps the value but forgets the steps to undo and redo", () => {
    const { result } = renderHook(() => useUndoState(1));
    act(() => {
      result.current[1](2);
    });
    act(() => {
      result.current[1](3);
    });
    act(() => {
      result.current[2].undo();
    });

    act(() => {
      result.current[2].clearHistory();
    });

    expect(result.current[0]).toBe(2);
    expect(result.current[2]).toMatchObject({ canUndo: false, canRedo: false });
  });

  it("calls an initializer function once, like useState", () => {
    const createInitial = vi.fn(() => ["a"]);
    const { result, rerender } = renderHook(() => useUndoState(createInitial));

    rerender();

    expect(result.current[0]).toEqual(["a"]);
    expect(createInitial).toHaveBeenCalledTimes(1);
  });

  it("setting a new value after undoing clears the steps to redo", () => {
    const { result } = renderHook(() => useUndoState("a"));
    act(() => {
      result.current[1]("b");
    });
    act(() => {
      result.current[2].undo();
    });

    act(() => {
      result.current[1]("c");
    });

    expect(result.current[2].canRedo).toBe(false);
    act(() => {
      result.current[2].undo();
    });
    expect(result.current[0]).toBe("a");
  });

  it("passes the latest value to an updater, even for several updates in a row", () => {
    const { result } = renderHook(() => useUndoState(0));

    act(() => {
      result.current[1]((count) => count + 1);
      result.current[1]((count) => count + 1);
    });
    expect(result.current[0]).toBe(2);

    act(() => {
      result.current[2].undo();
    });
    expect(result.current[0]).toBe(1);
  });

  it("undo and redo do nothing when there is nothing to undo or redo", () => {
    const { result } = renderHook(() => useUndoState({ name: "a" }));
    const value = result.current[0];

    act(() => {
      result.current[2].undo();
      result.current[2].redo();
    });

    expect(result.current[0]).toBe(value);
  });

  it("keeps set, undo, redo and clearHistory the same across renders and changes", () => {
    const { result, rerender } = renderHook(() => useUndoState(0));
    const [, set, { undo, redo, clearHistory }] = result.current;

    act(() => {
      set(1);
    });
    rerender();

    expect(result.current[1]).toBe(set);
    expect(result.current[2].undo).toBe(undo);
    expect(result.current[2].redo).toBe(redo);
    expect(result.current[2].clearHistory).toBe(clearHistory);
  });
});
