import { act, renderHook } from "@testing-library/react";
import { createElement, type RefObject } from "react";
import { renderOnServer } from "./testing/renderOnServer";
import { useTextSelection } from "./useTextSelection";

/** Selects `node`'s text from `start` to `end`, as dragging over it would. */
function select(node: Node, start: number, end: number) {
  act(() => {
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  });
}

function clearSelection() {
  act(() => {
    window.getSelection()?.removeAllRanges();
    document.dispatchEvent(new Event("selectionchange"));
  });
}

afterEach(() => {
  window.getSelection()?.removeAllRanges();
  document.body.innerHTML = "";
});

describe("useTextSelection", () => {
  it("returns the selected text, and empty text once the selection is cleared", () => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "Honey is sweet";
    document.body.append(paragraph);
    const { result } = renderHook(() => useTextSelection());
    expect(result.current.text).toBe("");

    select(paragraph.firstChild as Node, 0, 5);
    expect(result.current.text).toBe("Honey");

    clearSelection();
    expect(result.current).toEqual({ text: "", rect: null });
  });

  it("with a ref, only counts the part of the selection inside the element", () => {
    document.body.innerHTML = "<article><p>Inside text</p></article><p>Outside text</p>";
    const [article, outside] = [
      document.querySelector("article") as HTMLElement,
      document.querySelectorAll("p")[1] as HTMLElement,
    ];
    const ref: RefObject<HTMLElement | null> = { current: article };
    const { result } = renderHook(() => useTextSelection(ref));

    select(article.querySelector("p")?.firstChild as Node, 0, 6);
    expect(result.current.text).toBe("Inside");

    select(outside.firstChild as Node, 0, 7);
    expect(result.current).toEqual({ text: "", rect: null });

    // Starting inside and ending in the next block, as a triple-click on a paragraph does.
    act(() => {
      const range = document.createRange();
      range.setStart(article.querySelector("p")?.firstChild as Node, 7);
      range.setEnd(outside.firstChild as Node, 7);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
    expect(result.current.text).toBe("text");
  });

  it("gives the selection's bounding box, and reads a selection made before mounting", () => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "Honey";
    document.body.append(paragraph);
    const box = new DOMRect(10, 20, 30, 40);
    // jsdom doesn't lay out text, so ranges have no box of their own there.
    const own = Object.getOwnPropertyDescriptor(Range.prototype, "getBoundingClientRect");
    Range.prototype.getBoundingClientRect = () => box;
    try {
      select(paragraph.firstChild as Node, 0, 3);
      const { result } = renderHook(() => useTextSelection());

      expect(result.current).toEqual({ text: "Hon", rect: box });
    } finally {
      if (own) Object.defineProperty(Range.prototype, "getBoundingClientRect", own);
      else Reflect.deleteProperty(Range.prototype, "getBoundingClientRect");
    }
  });

  it("stops listening on unmount", () => {
    const removed = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => useTextSelection());

    unmount();
    expect(removed.mock.calls.map(([type]) => type)).toContain("selectionchange");
  });

  it("is empty on the server, where window and document don't exist", () => {
    function Probe() {
      const { text, rect } = useTextSelection();
      return `[${text}]${rect === null ? "null" : "rect"}`;
    }

    expect(renderOnServer(createElement(Probe))).toBe("[]null");
  });
});
