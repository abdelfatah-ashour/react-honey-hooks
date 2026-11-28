import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useSelections } from "./useSelections";

const letters = ["a", "b", "c"];

describe("useSelections", () => {
  it("selects, unselects and toggles items, listing them in the items' order", () => {
    const { result } = renderHook(() => useSelections(letters));
    expect(result.current.selected).toEqual([]);

    act(() => {
      result.current.select("c");
      result.current.select("a");
    });
    expect(result.current.selected).toEqual(["a", "c"]);
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.isSelected("b")).toBe(false);

    act(() => {
      result.current.unselect("a");
      result.current.toggle("b");
      result.current.toggle("c");
    });
    expect(result.current.selected).toEqual(["b"]);
  });

  it("selects and unselects every item, and says whether all, none or some are selected", () => {
    const { result } = renderHook(() => useSelections(letters));
    expect(result.current).toMatchObject({
      allSelected: false,
      noneSelected: true,
      partiallySelected: false,
    });

    act(() => {
      result.current.select("b");
    });
    expect(result.current).toMatchObject({
      allSelected: false,
      noneSelected: false,
      partiallySelected: true,
    });

    act(() => {
      result.current.toggleAll();
    });
    expect(result.current.selected).toEqual(letters);
    expect(result.current).toMatchObject({
      allSelected: true,
      noneSelected: false,
      partiallySelected: false,
    });

    act(() => {
      result.current.toggleAll();
    });
    expect(result.current.selected).toEqual([]);

    act(() => {
      result.current.selectAll();
    });
    act(() => {
      result.current.unselectAll();
    });
    expect(result.current.noneSelected).toBe(true);
  });

  it("with no items, counts as none selected and not all selected", () => {
    const { result } = renderHook(() => useSelections<string>([]));

    act(() => {
      result.current.selectAll();
    });
    expect(result.current).toMatchObject({
      selected: [],
      allSelected: false,
      noneSelected: true,
      partiallySelected: false,
    });
  });

  it("matches items by getKey, so selection survives new objects for the same items", () => {
    interface Row {
      id: number;
      name: string;
    }
    const fetchRows = (): Row[] => [
      { id: 1, name: "Ada" },
      { id: 2, name: "Grace" },
    ];
    const { result, rerender } = renderHook(
      ({ rows }) => useSelections(rows, { getKey: (row) => row.id }),
      { initialProps: { rows: fetchRows() } },
    );

    act(() => {
      result.current.select({ id: 2, name: "Grace" });
    });
    const refetched = fetchRows();
    rerender({ rows: refetched });
    expect(result.current.selected).toEqual([refetched[1]]);
    expect(result.current.selected[0]).toBe(refetched[1]);
    expect(result.current.isSelected({ id: 2, name: "renamed" })).toBe(true);

    act(() => {
      result.current.toggleAll();
    });
    expect(result.current.allSelected).toBe(true);
  });

  it("leaves out selected items that are no longer in the list, and works out the flags from the list", () => {
    const { result, rerender } = renderHook(({ items }) => useSelections(items), {
      initialProps: { items: letters },
    });
    act(() => {
      result.current.select("a");
      result.current.select("c");
    });

    rerender({ items: ["a", "b"] });
    expect(result.current.selected).toEqual(["a"]);
    expect(result.current.partiallySelected).toBe(true);

    rerender({ items: ["a"] });
    expect(result.current.allSelected).toBe(true);
  });

  it("starts with defaultSelected, and setSelected replaces the whole selection", () => {
    const { result } = renderHook(() => useSelections(letters, { defaultSelected: ["b"] }));
    expect(result.current.selected).toEqual(["b"]);

    act(() => {
      result.current.setSelected(["c", "a"]);
    });
    expect(result.current.selected).toEqual(["a", "c"]);
  });

  it("keeps the same actions across renders, using the latest items and getKey", () => {
    const { result, rerender } = renderHook(
      ({ items, getKey }) => useSelections(items, { getKey }),
      { initialProps: { items: ["a"], getKey: (item: string) => item } },
    );
    const { select, toggleAll } = result.current;

    rerender({ items: ["A", "B"], getKey: (item: string) => item.toLowerCase() });
    expect(result.current.select).toBe(select);
    expect(result.current.toggleAll).toBe(toggleAll);

    act(() => {
      select("b");
    });
    expect(result.current.isSelected("B")).toBe(true);
    act(() => {
      toggleAll();
    });
    expect(result.current.selected).toEqual(["A", "B"]);
  });

  it("renders on the server, where window and document don't exist, with defaultSelected", () => {
    function Probe() {
      const { selected, partiallySelected } = useSelections(letters, { defaultSelected: ["a"] });
      return `${selected.join(",")}:${String(partiallySelected)}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("a:true");
  });
});
