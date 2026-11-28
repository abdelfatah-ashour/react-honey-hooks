import { useRef, useState } from "react";
import { useFileDrop } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

function Uploader() {
  const ref = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("Nothing dropped");
  const { isOver } = useFileDrop(
    ref,
    (accepted, rejected) => {
      setMessage(
        `Accepted: ${accepted.map((file) => file.name).join(", ")}; rejected: ${rejected
          .map((file) => file.name)
          .join(", ")}`,
      );
    },
    { accept: "image/*" },
  );
  return (
    <>
      <div ref={ref} data-testid="zone" style={{ padding: 40 }}>
        <span>{isOver ? "Release to upload" : "Drop images here"}</span>
      </div>
      <p>{message}</p>
    </>
  );
}

/**
 * Playwright can't drag files from the desktop, so this fires the browser's own drag events
 * carrying a real DataTransfer with files, as a drag from the desktop would.
 */
function drag(type: string, target: Element, files: File[]) {
  const dataTransfer = new DataTransfer();
  for (const file of files) dataTransfer.items.add(file);
  const event = new DragEvent(type, { dataTransfer, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe("useFileDrop in a real browser", () => {
  it("highlights while files are dragged over, and splits the dropped files by type", async () => {
    const screen = await render(<Uploader />);
    const zone = screen.getByTestId("zone").element();
    const files = [
      new File(["png"], "photo.png", { type: "image/png" }),
      new File(["%PDF"], "notes.pdf", { type: "application/pdf" }),
    ];

    drag("dragenter", zone, files);
    expect(drag("dragover", zone, files).defaultPrevented).toBe(true);
    await expect.element(screen.getByText("Release to upload")).toBeVisible();

    expect(drag("drop", zone, files).defaultPrevented).toBe(true);

    await expect
      .element(screen.getByText("Accepted: photo.png; rejected: notes.pdf"))
      .toBeVisible();
    await expect.element(screen.getByText("Drop images here")).toBeVisible();
  });
});
