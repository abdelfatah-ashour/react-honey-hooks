import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useFocusTrap";

describe("useFocusTrap demo", () => {
  it("keeps Tab inside the open dialog, wrapping at both ends, then returns focus", async () => {
    const screen = await render(<Demo />);
    const opener = screen.getByRole("button", { name: "Rename file" });

    // Opened from the keyboard: Safari doesn't focus a clicked button, so a click would leave
    // no earlier focus to return to.
    opener.element().focus();
    await userEvent.keyboard("{Enter}");
    const name = screen.getByRole("textbox", { name: "File name" });
    await expect.element(name).toHaveFocus();

    await userEvent.tab();
    await userEvent.tab();
    const save = screen.getByRole("button", { name: "Save" });
    await expect.element(save).toHaveFocus();
    await userEvent.tab();
    await expect.element(name).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect.element(save).toHaveFocus();

    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(opener).toHaveFocus();
  });
});
