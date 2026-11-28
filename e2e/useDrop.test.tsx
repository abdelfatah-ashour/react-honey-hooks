import { useRef, useState } from "react";
import { useDrop } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

function Board() {
  const zone = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState("Drop something here");
  const { isOver } = useDrop(zone, {
    onUri: (uri) => {
      setNote(`Link: ${uri}`);
    },
    onText: (text) => {
      setNote(`Text: ${text}`);
    },
  });
  return (
    <div ref={zone} data-testid="zone" data-over={isOver} style={{ width: 200, height: 100 }}>
      {note}
    </div>
  );
}

/**
 * Fires a drag event at `target` carrying a real DataTransfer, as dragging from another page
 * would. Playwright can't drag between pages, so the events are built here.
 */
function drag(type: string, target: Element, data: Record<string, string>): DragEvent {
  const dataTransfer = new DataTransfer();
  for (const [format, value] of Object.entries(data)) dataTransfer.setData(format, value);
  const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer });
  target.dispatchEvent(event);
  return event;
}

describe("useDrop in a real browser", () => {
  it("highlights while text or a link is dragged over, and shows what was dropped", async () => {
    const screen = await render(<Board />);
    const zone = screen.getByTestId("zone");
    const text = { "text/plain": "Buy honey" };

    drag("dragenter", zone.element(), text);
    await expect.element(zone).toHaveAttribute("data-over", "true");
    expect(drag("dragover", zone.element(), text).defaultPrevented).toBe(true);
    expect(drag("drop", zone.element(), text).defaultPrevented).toBe(true);
    await expect.element(zone).toHaveTextContent("Text: Buy honey");
    await expect.element(zone).toHaveAttribute("data-over", "false");

    const link = { "text/uri-list": "https://example.com/", "text/plain": "https://example.com/" };
    drag("drop", zone.element(), link);
    await expect.element(zone).toHaveTextContent("Link: https://example.com/");
  });
});
