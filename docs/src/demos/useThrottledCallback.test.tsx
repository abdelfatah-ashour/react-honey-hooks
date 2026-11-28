import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useThrottledCallback";

describe("useThrottledCallback demo", () => {
  it("saves the first keystroke at once and the latest text when the wait ends", async () => {
    const screen = await render(<Demo />);
    const draft = screen.getByRole("textbox", { name: "Draft" });
    const saved = screen.getByRole("status");
    await expect.element(saved).toHaveTextContent("Nothing saved yet");

    await userEvent.type(draft, "H");
    expect(saved.element().textContent).toBe("H");

    await userEvent.type(draft, "ello");
    await expect.element(saved, { timeout: 3000 }).toHaveTextContent("Hello");
  });
});
