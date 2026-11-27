import { useState } from "react";
import { useScrollLock } from "react-honey-hooks";
import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";

function Page() {
  const [open, setOpen] = useState(false);
  useScrollLock(open);
  return (
    <div data-testid="content">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        {open ? "Close dialog" : "Open dialog"}
      </button>
      <div style={{ height: "300vh" }} />
    </div>
  );
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
  window.scrollTo(0, 0);
});

/**
 * Scrolls the real mouse wheel over `target`. Hovering first matters: in WebKit, a wheel right
 * after a click doesn't scroll anything, even with no lock.
 */
async function wheelOver(target: Locator, deltaY: number) {
  await userEvent.hover(target);
  await commands.wheel(deltaY);
}

describe("useScrollLock in a real browser", () => {
  it("stops the wheel scrolling the page while locked, without shifting the content", async () => {
    const screen = await render(<Page />);
    const content = screen.getByTestId("content").element();
    const widthBefore = content.getBoundingClientRect().width;

    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    const close = screen.getByRole("button", { name: "Close dialog" });
    await expect.element(close).toBeVisible();
    expect(content.getBoundingClientRect().width).toBe(widthBefore);

    await wheelOver(close, 600);
    await pause(300);
    expect(window.scrollY).toBe(0);
  });

  it("lets the wheel scroll the page again once unlocked", async () => {
    const screen = await render(<Page />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));

    await wheelOver(screen.getByRole("button", { name: "Open dialog" }), 600);

    await expect.poll(() => window.scrollY).toBeGreaterThan(0);
  });
});
