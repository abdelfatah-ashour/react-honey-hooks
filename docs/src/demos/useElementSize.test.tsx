import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useElementSize";

describe("useElementSize demo", () => {
  it("shows the box's size as it grows to its widest and shrinks back", async () => {
    const screen = await render(<Demo />);
    const size = screen.getByRole("status");
    const grow = screen.getByRole("button", { name: "Wider" });
    await expect.element(size).toHaveTextContent("240 × 96 px");

    await userEvent.click(grow);
    await expect.element(size).toHaveTextContent("360 × 96 px");
    await expect.element(grow).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Narrower" }));
    await expect.element(size).toHaveTextContent("240 × 96 px");
    await expect.element(grow).toBeEnabled();
  });
});
