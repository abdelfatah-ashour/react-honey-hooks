import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useResetState";

describe("useResetState demo", () => {
  it("discards edits back to the saved note", async () => {
    const screen = await render(<Demo />);
    const note = screen.getByRole("textbox", { name: "Note" });
    const discard = screen.getByRole("button", { name: "Discard changes" });
    await expect.element(note).toHaveValue("Buy milk");
    await expect.element(discard).toBeDisabled();

    await userEvent.clear(note);
    await userEvent.type(note, "Buy bread");
    await expect.element(note).toHaveValue("Buy bread");
    await expect.element(discard).toBeEnabled();

    await userEvent.click(discard);
    await expect.element(note).toHaveValue("Buy milk");
    await expect.element(discard).toBeDisabled();
  });
});
