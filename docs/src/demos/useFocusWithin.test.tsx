import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import Demo from "./useFocusWithin";

describe("useFocusWithin demo", () => {
  it("shows the password rules while focus is in either password field, and hides them after", async () => {
    const screen = await render(<Demo />);
    const rules = screen.getByRole("list", { name: "Password rules" });
    await expect.element(rules).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText("Password", { exact: true }));
    await expect.element(rules).toBeVisible();

    // Moving between the two fields stays inside the group, so the rules stay.
    await userEvent.tab();
    await expect.element(screen.getByLabelText("Confirm password")).toHaveFocus();
    await expect.element(rules).toBeVisible();

    await userEvent.click(screen.getByLabelText("Email"));
    await expect.element(rules).not.toBeInTheDocument();
  });
});
