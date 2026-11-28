import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useRafInterval";

describe("useRafInterval demo", () => {
  it("advances the slideshow only while playing", async () => {
    const screen = await render(<Demo />);
    const position = screen.getByRole("status");
    // It waits for Play rather than starting on its own.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(position.element().textContent).toBe("Slide 1 of 4");

    await userEvent.click(screen.getByRole("button", { name: "Play" }));
    await expect.element(position, { timeout: 4000 }).toHaveTextContent("Slide 3 of 4");

    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    const pausedAt = position.element().textContent;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(position.element().textContent).toBe(pausedAt);
  });
});
