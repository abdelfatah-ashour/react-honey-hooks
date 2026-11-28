import { afterEach, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useEventListener";

afterEach(() => {
  window.scrollTo(0, 0);
});

describe("useEventListener demo", () => {
  it("enables Accept only once the terms are scrolled to the end", async () => {
    const screen = await render(<Demo />);
    const terms = screen.getByRole("region", { name: "Terms of service" });
    const accept = screen.getByRole("button", { name: "Accept" });
    await expect.element(accept).toBeDisabled();

    // Part of the way down isn't enough.
    await userEvent.hover(terms);
    await commands.wheel(40);
    await expect.poll(() => terms.element().scrollTop).toBeGreaterThan(0);
    await expect.element(accept).toBeDisabled();

    await commands.wheel(2000);
    await expect.element(accept).toBeEnabled();
  });
});
