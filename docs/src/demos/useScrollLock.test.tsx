import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useScrollLock";

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(() => {
  window.scrollTo(0, 0);
});

/** The demo on a page tall enough to scroll, as on the docs site. */
async function renderOnLongPage() {
  return render(
    <>
      <Demo />
      <div style={{ height: "300vh" }} />
    </>,
  );
}

/** Hovering first matters: in WebKit, a wheel right after a click doesn't scroll anything. */
async function wheelOver(target: Locator, deltaY: number) {
  await userEvent.hover(target);
  await commands.wheel(deltaY);
}

describe("useScrollLock demo", () => {
  it("stops the page scrolling behind the open dialog", async () => {
    const screen = await renderOnLongPage();

    await userEvent.click(screen.getByRole("button", { name: "Open cart" }));
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await wheelOver(screen.getByRole("dialog"), 600);

    await pause(300);
    expect(window.scrollY).toBe(0);
  });

  it("lets the page scroll again once the dialog is closed", async () => {
    const screen = await renderOnLongPage();
    await userEvent.click(screen.getByRole("button", { name: "Open cart" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();

    await wheelOver(screen.getByRole("button", { name: "Open cart" }), 600);

    await expect.poll(() => window.scrollY).toBeGreaterThan(0);
  });
});
