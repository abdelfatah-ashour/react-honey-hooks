import { useRef, useState } from "react";
import { useLongPress } from "react-honey-hooks";
import { describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

function Message() {
  const ref = useRef<HTMLButtonElement>(null);
  const [clicks, setClicks] = useState(0);
  const [longPresses, setLongPresses] = useState(0);
  useLongPress(
    ref,
    () => {
      setLongPresses((count) => count + 1);
    },
    { delayMs: 300 },
  );

  return (
    <>
      <button
        ref={ref}
        type="button"
        onClick={() => {
          setClicks((count) => count + 1);
        }}
      >
        Message
      </button>
      <p>
        Clicks: {clicks}, long presses: {longPresses}
      </p>
      <p style={{ marginTop: 200 }}>Elsewhere</p>
    </>
  );
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("useLongPress in a real browser", () => {
  it("holding the mouse down long presses, and the release doesn't also click", async () => {
    const screen = await render(<Message />);
    await userEvent.hover(screen.getByRole("button", { name: "Message" }));

    await commands.mouseDown();
    await expect.element(screen.getByText("Clicks: 0, long presses: 1")).toBeVisible();
    await commands.mouseUp();

    await pause(100);
    await expect.element(screen.getByText("Clicks: 0, long presses: 1")).toBeVisible();
  });

  it("a normal click clicks and doesn't long press", async () => {
    const screen = await render(<Message />);

    await userEvent.click(screen.getByRole("button", { name: "Message" }));
    await pause(400);

    await expect.element(screen.getByText("Clicks: 1, long presses: 0")).toBeVisible();
  });

  it("dragging away before the delay cancels the long press", async () => {
    const screen = await render(<Message />);
    await userEvent.hover(screen.getByRole("button", { name: "Message" }));

    await commands.mouseDown();
    await userEvent.hover(screen.getByText("Elsewhere"));
    await pause(400);
    await commands.mouseUp();

    await expect.element(screen.getByText("Clicks: 0, long presses: 0")).toBeVisible();
  });
});
