import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useUndoState";

describe("useUndoState demo", () => {
  it("undoes typing back to the start of history, then redoes it", async () => {
    const screen = await render(<Demo />);
    const title = screen.getByRole("textbox", { name: "Title" });
    const undo = screen.getByRole("button", { name: "Undo" });
    const redo = screen.getByRole("button", { name: "Redo" });
    await expect.element(title).toHaveValue("Draft");
    await expect.element(undo).toBeDisabled();
    await expect.element(redo).toBeDisabled();

    await userEvent.type(title, " 1");
    await expect.element(title).toHaveValue("Draft 1");

    await userEvent.click(undo);
    await expect.element(title).toHaveValue("Draft ");
    await userEvent.click(undo);
    await expect.element(title).toHaveValue("Draft");
    await expect.element(undo).toBeDisabled();

    await userEvent.click(redo);
    await expect.element(title).toHaveValue("Draft ");
    await expect.element(undo).toBeEnabled();
  });
});
