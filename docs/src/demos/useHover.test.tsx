import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useHover";

describe("useHover demo", () => {
  it("shows the tooltip while the pointer is over the badge and hides it when it leaves", async () => {
    const screen = await render(<Demo />);
    const tooltip = screen.getByRole("tooltip");
    // The real mouse may already rest where the demo renders, so start from a known place.
    await userEvent.hover(screen.getByText("Orders over $50 ship free."));
    await expect.element(tooltip).not.toBeInTheDocument();

    await userEvent.hover(screen.getByText("Free shipping"));
    await expect.element(tooltip).toHaveTextContent("Arrives in 3–5 business days.");

    await userEvent.hover(screen.getByText("Orders over $50 ship free."));
    await expect.element(tooltip).not.toBeInTheDocument();
  });
});
